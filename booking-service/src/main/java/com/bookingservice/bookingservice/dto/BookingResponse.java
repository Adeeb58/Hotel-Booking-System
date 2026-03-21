package com.bookingservice.bookingservice.dto;

import com.bookingservice.bookingservice.entity.BookingStatus;

import java.time.LocalDate;

public record BookingResponse(
        Long id,
        String userId,
        Long hotelId,
        Long roomId,
        LocalDate checkInDate,
        LocalDate checkOutDate,
        Double totalPrice,
        BookingStatus status,
        String reservationNumber
) {
}
