package com.bookingservice.bookingservice.controller;

import com.bookingservice.bookingservice.dto.BookingResponse;
import com.bookingservice.bookingservice.dto.CreateBookingRequest;
import com.bookingservice.bookingservice.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping("/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponse createBooking(
            @Valid @RequestBody CreateBookingRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String authenticatedUserId) {
        CreateBookingRequest effectiveRequest = request;
        if (authenticatedUserId != null && !authenticatedUserId.isBlank() && !authenticatedUserId.equals(request.userId())) {
            effectiveRequest = new CreateBookingRequest(
                    authenticatedUserId,
                    request.hotelId(),
                    request.roomId(),
                    request.checkInDate(),
                    request.checkOutDate(),
                    request.totalPrice()
            );
        }
        return bookingService.createBooking(effectiveRequest);
    }

    @GetMapping("/bookings/{id}")
    public BookingResponse getBooking(@PathVariable("id") Long id) {
        return bookingService.getBooking(id);
    }

    @GetMapping("/bookings/user/{userId}")
    public List<BookingResponse> getBookingsForUser(@PathVariable("userId") String userId) {
        return bookingService.getBookingsForUser(userId);
    }

    @GetMapping("/bookings/my")
    public List<BookingResponse> getMyBookings(
            @RequestHeader(value = "X-User-Id", required = false) String authenticatedUserId) {
        if (authenticatedUserId == null || authenticatedUserId.isBlank()) {
            throw new IllegalArgumentException("Authenticated user id is required");
        }
        return bookingService.getBookingsForUser(authenticatedUserId);
    }

    @PutMapping("/bookings/cancel/{id}")
    public BookingResponse cancelBooking(@PathVariable("id") Long id) {
        return bookingService.cancelBooking(id);
    }

    @PutMapping("/bookings/confirm/{id}")
    public BookingResponse confirmBooking(@PathVariable("id") Long id) {
        return bookingService.confirmBooking(id);
    }
}
