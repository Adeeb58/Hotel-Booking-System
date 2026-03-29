package com.bookingservice.bookingservice.client.dto;

public record PaymentRequest(
        Long bookingId,
        Double amount,
        String paymentMethod
) {
}
