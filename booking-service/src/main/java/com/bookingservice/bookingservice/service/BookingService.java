package com.bookingservice.bookingservice.service;

import com.bookingservice.bookingservice.dto.BookingResponse;
import com.bookingservice.bookingservice.dto.CreateBookingRequest;
import com.bookingservice.bookingservice.entity.Booking;
import com.bookingservice.bookingservice.entity.BookingStatus;
import com.bookingservice.bookingservice.exception.ConflictException;
import com.bookingservice.bookingservice.exception.NotFoundException;
import com.bookingservice.bookingservice.repository.BookingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final com.bookingservice.bookingservice.client.NotificationClient notificationClient;
    private final com.bookingservice.bookingservice.client.HotelServiceClient hotelServiceClient;

    public BookingService(BookingRepository bookingRepository, com.bookingservice.bookingservice.client.NotificationClient notificationClient, com.bookingservice.bookingservice.client.HotelServiceClient hotelServiceClient) {
        this.bookingRepository = bookingRepository;
        this.notificationClient = notificationClient;
        this.hotelServiceClient = hotelServiceClient;
    }

    @Transactional
    public BookingResponse createBooking(CreateBookingRequest request) {
        validateDates(request.checkInDate(), request.checkOutDate());

        boolean overlaps = bookingRepository.existsOverlappingBooking(
                request.roomId(),
                BookingStatus.CONFIRMED,
                request.checkInDate(),
                request.checkOutDate()
        );

        if (overlaps) {
            throw new ConflictException("Room is not available for the selected dates");
        }

        Booking booking = new Booking();
        booking.setUserId(request.userId());
        booking.setHotelId(request.hotelId());
        booking.setRoomId(request.roomId());
        booking.setCheckInDate(request.checkInDate());
        booking.setCheckOutDate(request.checkOutDate());
        booking.setTotalPrice(request.totalPrice());
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setReservationNumber(generateReservationNumber());

        Booking saved = bookingRepository.save(booking);

        try {
            hotelServiceClient.decrementRoomInventory(request.roomId());
        } catch (Exception e) {
            System.err.println("Failed to decrement room inventory sync: " + e.getMessage());
        }

        try {
            notificationClient.sendNotification(
                String.valueOf(saved.getUserId()), 
                String.format("Booking Confirmed! Reservation Number: %s | Check-In: %s | Check-Out: %s | Total Price: $%.2f",
                    saved.getReservationNumber(), saved.getCheckInDate(), saved.getCheckOutDate(), saved.getTotalPrice())
            );
        } catch (Exception e) {
            System.err.println("Failed to send notification: " + e.getMessage());
        }

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public BookingResponse getBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found: " + bookingId));
        return toResponse(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsForUser(String userId) {
        return bookingRepository.findByUserIdOrderByCheckInDateDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public BookingResponse cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found: " + bookingId));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            return toResponse(booking);
        }

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
        
        try {
            hotelServiceClient.incrementRoomInventory(booking.getRoomId());
        } catch (Exception e) {
            System.err.println("Failed to increment room inventory sync: " + e.getMessage());
        }
        
        return toResponse(booking);
    }

    @Transactional
    public BookingResponse confirmBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found: " + bookingId));

        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            return toResponse(booking);
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        try {
            notificationClient.sendNotification(
                String.valueOf(booking.getUserId()), 
                "Booking Confirmed! Reservation Number: " + booking.getReservationNumber()
            );
        } catch (Exception e) {
            System.err.println("Failed to send notification: " + e.getMessage());
        }

        return toResponse(booking);
    }

    @Transactional(readOnly = true)
    public boolean isRoomAvailable(Long roomId, LocalDate checkIn, LocalDate checkOut) {
        validateDates(checkIn, checkOut);
        return !bookingRepository.existsOverlappingBooking(roomId, BookingStatus.CONFIRMED, checkIn, checkOut);
    }

    @Transactional(readOnly = true)
    public List<Long> getAvailableRoomIds(List<Long> roomIds, LocalDate checkIn, LocalDate checkOut) {
        validateDates(checkIn, checkOut);
        List<Long> bookedRoomIds = bookingRepository.findBookedRoomIds(roomIds, BookingStatus.CONFIRMED, checkIn, checkOut);
        return roomIds.stream()
                .filter(id -> !bookedRoomIds.contains(id))
                .toList();
    }

    private void validateDates(LocalDate checkIn, LocalDate checkOut) {
        if (checkIn == null || checkOut == null) {
            throw new IllegalArgumentException("checkInDate and checkOutDate are required");
        }
        if (!checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException("checkOutDate must be after checkInDate");
        }
    }

    private BookingResponse toResponse(Booking booking) {
        return new BookingResponse(
                booking.getId(),
                booking.getUserId(),
                booking.getHotelId(),
                booking.getRoomId(),
                booking.getCheckInDate(),
                booking.getCheckOutDate(),
                booking.getTotalPrice(),
                booking.getStatus(),
                booking.getReservationNumber()
        );
    }

    private String generateReservationNumber() {
        // Interview-friendly & readable: RSV-YYYYMMDD-XXXXXX
        String datePart = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        for (int attempt = 0; attempt < 5; attempt++) {
            String randomPart = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
            String candidate = "RSV-" + datePart + "-" + randomPart;
            if (bookingRepository.findByReservationNumber(candidate).isEmpty()) {
                return candidate;
            }
        }
        // Extremely unlikely fallback
        return "RSV-" + datePart + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
    }
}
