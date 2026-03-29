package com.bookingservice.bookingservice.client.dto;

public record PaymentResponse(
        Long id,
        Long bookingId,
        Double amount,
        String status
) {
}
