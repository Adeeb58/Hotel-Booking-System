package org.example.paymentservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(name = "booking-service")
public interface BookingClient {

    @PutMapping("/bookings/confirm/{id}")
    void confirmBooking(@PathVariable String id);
}