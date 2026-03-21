package org.example.paymentservice.service;

import org.example.paymentservice.client.BookingClient;
import org.example.paymentservice.entity.Payment;
import org.example.paymentservice.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private BookingClient bookingClient;

    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService();
        org.springframework.test.util.ReflectionTestUtils.setField(paymentService, "paymentRepository", paymentRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(paymentService, "notificationService", notificationService);
        org.springframework.test.util.ReflectionTestUtils.setField(paymentService, "bookingClient", bookingClient);
    }

    @Test
    void processPayment_confirmsBookingForNumericBookingId() {
        Payment payment = new Payment();
        payment.setBookingId("42");
        payment.setAmount(999.0);
        payment.setPaymentMethod("Credit Card");

        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Payment result = paymentService.processPayment(payment);

        assertEquals("SUCCESS", result.getStatus());
        verify(bookingClient).confirmBooking("42");
        verify(notificationService).sendNotification("42", "Payment successful for booking: 42");
    }

    @Test
    void processPayment_skipsBookingConfirmForNonNumericBookingId() {
        Payment payment = new Payment();
        payment.setBookingId("RSV-ABC123");
        payment.setAmount(500.0);
        payment.setPaymentMethod("Debit Card");

        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Payment result = paymentService.processPayment(payment);

        assertEquals("SUCCESS", result.getStatus());
        verify(bookingClient, never()).confirmBooking(any());
        verify(notificationService).sendNotification("RSV-ABC123", "Payment successful for booking: RSV-ABC123");
    }

    @Test
    void processPayment_returnsSuccessfullyEvenIfNotificationFails() {
        Payment payment = new Payment();
        payment.setBookingId("11");
        payment.setAmount(100.0);
        payment.setPaymentMethod("Net Banking");

        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doThrow(new RuntimeException("notification error"))
                .when(notificationService).sendNotification(any(), contains("Payment successful"));

        Payment result = assertDoesNotThrow(() -> paymentService.processPayment(payment));

        assertEquals("SUCCESS", result.getStatus());
        verify(bookingClient).confirmBooking("11");
    }
}
