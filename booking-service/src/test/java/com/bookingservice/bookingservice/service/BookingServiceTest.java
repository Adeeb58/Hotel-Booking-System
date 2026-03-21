package com.bookingservice.bookingservice.service;

import com.bookingservice.bookingservice.client.HotelServiceClient;
import com.bookingservice.bookingservice.client.NotificationClient;
import com.bookingservice.bookingservice.client.PaymentServiceClient;
import com.bookingservice.bookingservice.client.dto.RoomSummary;
import com.bookingservice.bookingservice.dto.BookingResponse;
import com.bookingservice.bookingservice.dto.CreateBookingRequest;
import com.bookingservice.bookingservice.entity.Booking;
import com.bookingservice.bookingservice.entity.BookingStatus;
import com.bookingservice.bookingservice.exception.ConflictException;
import com.bookingservice.bookingservice.repository.BookingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private NotificationClient notificationClient;

    @Mock
    private HotelServiceClient hotelServiceClient;

    @Mock
    private PaymentServiceClient paymentServiceClient;

    private BookingService bookingService;

    @BeforeEach
    void setUp() {
        bookingService = new BookingService(bookingRepository, notificationClient, hotelServiceClient, paymentServiceClient);
    }

    @Test
    void createBooking_setsPendingPayment_whenRoomAvailable() {
        CreateBookingRequest request = new CreateBookingRequest(
                "user-1",
                10L,
                100L,
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(3),
                250.0
        );

        when(bookingRepository.countOverlappingBookings(eq(100L), eq(BookingStatus.CONFIRMED), any(), any())).thenReturn(0L);
        when(hotelServiceClient.getRoom(100L)).thenReturn(new RoomSummary(100L, 10L, "DELUXE", 125.0, 2, 5));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking booking = invocation.getArgument(0);
            booking.setId(1L);
            return booking;
        });
        when(bookingRepository.findByReservationNumber(any())).thenReturn(java.util.Optional.empty());

        BookingResponse response = bookingService.createBooking(request);

        assertEquals(1L, response.id());
        assertEquals(BookingStatus.PENDING_PAYMENT, response.status());
        assertEquals("user-1", response.userId());
        assertEquals(100L, response.roomId());
    }

    @Test
    void createBooking_throwsConflict_whenRoomIsUnavailable() {
        CreateBookingRequest request = new CreateBookingRequest(
                "user-1",
                10L,
                100L,
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(2),
                120.0
        );

        when(bookingRepository.countOverlappingBookings(eq(100L), eq(BookingStatus.CONFIRMED), any(), any())).thenReturn(2L);
        when(hotelServiceClient.getRoom(100L)).thenReturn(new RoomSummary(100L, 10L, "STANDARD", 120.0, 2, 2));

        assertThrows(ConflictException.class, () -> bookingService.createBooking(request));
    }

    @Test
    void getBookedCountsForRooms_returnsMapWithDefaultsAndActualCounts() {
        LocalDate checkIn = LocalDate.now().plusDays(2);
        LocalDate checkOut = LocalDate.now().plusDays(4);

        List<Object[]> mockedCounts = Arrays.asList(
                new Object[]{1L, 2L},
                new Object[]{3L, 1L}
        );

        when(bookingRepository.countBookedRoomsForIds(any(), eq(BookingStatus.CONFIRMED), eq(checkIn), eq(checkOut)))
                .thenReturn(mockedCounts);

        Map<Long, Long> counts = bookingService.getBookedCountsForRooms(List.of(1L, 2L, 3L, 2L), checkIn, checkOut);

        assertEquals(3, counts.size());
        assertEquals(2L, counts.get(1L));
        assertEquals(0L, counts.get(2L));
        assertEquals(1L, counts.get(3L));
    }

    @Test
    void getBookedCountsForRooms_throwsIllegalArgument_whenDatesInvalid() {
        LocalDate sameDay = LocalDate.now().plusDays(1);
        assertThrows(IllegalArgumentException.class,
                () -> bookingService.getBookedCountsForRooms(List.of(1L), sameDay, sameDay));
    }
}
