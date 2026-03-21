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
    private final com.bookingservice.bookingservice.client.PaymentServiceClient paymentServiceClient;

    public BookingService(BookingRepository bookingRepository,
                          com.bookingservice.bookingservice.client.NotificationClient notificationClient,
                          com.bookingservice.bookingservice.client.HotelServiceClient hotelServiceClient,
                          com.bookingservice.bookingservice.client.PaymentServiceClient paymentServiceClient) {
        this.bookingRepository = bookingRepository;
        this.notificationClient = notificationClient;
        this.hotelServiceClient = hotelServiceClient;
        this.paymentServiceClient = paymentServiceClient;
    }

    @Transactional
    public BookingResponse createBooking(CreateBookingRequest request) {
        validateDates(request.checkInDate(), request.checkOutDate());

        long bookedCount = bookingRepository.countOverlappingBookings(
                request.roomId(),
                BookingStatus.CONFIRMED,
                request.checkInDate(),
                request.checkOutDate()
        );
        com.bookingservice.bookingservice.client.dto.RoomSummary room = hotelServiceClient.getRoom(request.roomId());

        int totalRooms = (room != null && room.totalRooms() != null) ? room.totalRooms() : 0;

        if (room == null || bookedCount >= totalRooms) {
            throw new ConflictException("Room is not available for the selected dates");
        }

        Booking booking = new Booking();
        booking.setUserId(request.userId());
        booking.setHotelId(request.hotelId());
        booking.setRoomId(request.roomId());
        booking.setCheckInDate(request.checkInDate());
        booking.setCheckOutDate(request.checkOutDate());
        booking.setTotalPrice(request.totalPrice());
        // Booking starts as PENDING_PAYMENT — payment-service will confirm it after successful payment
        booking.setStatus(BookingStatus.PENDING_PAYMENT);
        booking.setReservationNumber(generateReservationNumber());

        Booking saved = bookingRepository.save(booking);

        // We no longer physically decrement static inventory
        // try {
        //     hotelServiceClient.decrementRoomInventory(request.roomId());
        // } catch (Exception e) {
        //     System.err.println("Failed to decrement room inventory sync: " + e.getMessage());
        // }

        // NOTE: Notification is intentionally NOT sent here.
        // The payment-service calls /bookings/confirm/{id} after payment succeeds,
        // which triggers confirmBooking() below and sends the notification.

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
        
        // We no longer physically increment static inventory
        // try {
        //     hotelServiceClient.incrementRoomInventory(booking.getRoomId());
        // } catch (Exception e) {
        //     System.err.println("Failed to increment room inventory sync: " + e.getMessage());
        // }
        
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
        long bookedCount = bookingRepository.countOverlappingBookings(roomId, BookingStatus.CONFIRMED, checkIn, checkOut);
        try {
            com.bookingservice.bookingservice.client.dto.RoomSummary room = hotelServiceClient.getRoom(roomId);
            int totalRooms = (room != null && room.totalRooms() != null) ? room.totalRooms() : 0;
            return room != null && bookedCount < totalRooms;
        } catch (Exception e) {
            return false;
        }
    }

    @Transactional(readOnly = true)
    public java.util.Map<Long, Long> getBookedCountsForRooms(List<Long> roomIds, LocalDate checkIn, LocalDate checkOut) {
        validateDates(checkIn, checkOut);
        java.util.Map<Long, Long> counts = new java.util.HashMap<>();
        if (roomIds == null || roomIds.isEmpty()) return counts;

        List<Long> validRoomIds = roomIds.stream()
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();

        if (validRoomIds.isEmpty()) {
            return counts;
        }

        for (Long id : validRoomIds) {
            counts.put(id, 0L);
        }

        List<Object[]> results = bookingRepository.countBookedRoomsForIds(validRoomIds, BookingStatus.CONFIRMED, checkIn, checkOut);
        for (Object[] result : results) {
            if (result == null || result.length < 2 || result[0] == null || result[1] == null) {
                continue;
            }

            Long roomId = (result[0] instanceof Number number)
                    ? number.longValue()
                    : null;

            if (roomId == null || !counts.containsKey(roomId)) {
                continue;
            }

            counts.put(roomId, ((Number) result[1]).longValue());
        }
        return counts;
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
