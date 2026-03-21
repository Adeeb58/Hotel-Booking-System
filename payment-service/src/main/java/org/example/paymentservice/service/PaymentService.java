package org.example.paymentservice.service;

import org.example.paymentservice.client.BookingClient;
import org.example.paymentservice.entity.Payment;
import org.example.paymentservice.repository.PaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class PaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private BookingClient bookingClient;

    public Payment processPayment(Payment payment) {

        // Simulate payment success
        payment.setStatus("SUCCESS");

        Payment savedPayment = paymentRepository.save(payment);

        if (isNumericBookingId(payment.getBookingId())) {
            try {
                bookingClient.confirmBooking(payment.getBookingId());
            } catch (RuntimeException ex) {
                logger.warn("Booking confirmation failed for bookingId {}: {}", payment.getBookingId(), ex.getMessage());
            }
        } else {
            logger.info("Skipping booking confirmation for non-numeric bookingId {}", payment.getBookingId());
        }

        // Send notification
        notificationService.sendNotification(
                payment.getBookingId(),
                "Payment successful for booking: " + payment.getBookingId()
        );

        return savedPayment;
    }

    public Payment getPaymentById(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found: " + id));
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    private boolean isNumericBookingId(String bookingId) {
        return bookingId != null && bookingId.matches("\\d+");
    }
}