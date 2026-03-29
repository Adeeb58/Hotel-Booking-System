package com.bookingservice.bookingservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "PAYMENT-SERVICE")
public interface NotificationClient {

    @PostMapping("/notifications")
    void sendNotification(@RequestParam("userId") String userId, @RequestParam("email") String email, @RequestParam("message") String message);
}
