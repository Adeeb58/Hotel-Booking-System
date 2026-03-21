package com.bookingservice.bookingservice.controller;

import com.bookingservice.bookingservice.dto.AvailabilityResponse;
import com.bookingservice.bookingservice.service.BookingService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
public class AvailabilityController {

    private final BookingService bookingService;

    public AvailabilityController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping("/availability")
    public AvailabilityResponse availability(
            @RequestParam Long roomId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut
    ) {
        boolean available = bookingService.isRoomAvailable(roomId, checkIn, checkOut);
        return new AvailabilityResponse(roomId, checkIn, checkOut, available);
    }

    @org.springframework.web.bind.annotation.PostMapping("/availability/bulk")
    public java.util.List<Long> getAvailableRoomIds(
            @org.springframework.web.bind.annotation.RequestBody java.util.List<Long> roomIds,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut) {
        return bookingService.getAvailableRoomIds(roomIds, checkIn, checkOut);
    }
}
