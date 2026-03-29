package org.example.paymentservice.controller;

import org.example.paymentservice.entity.Notification;
import org.example.paymentservice.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(
            @RequestParam(value = "userId", required = false) String userId) {

        if (userId == null || userId.isBlank()) {
            return ResponseEntity.ok(notificationService.getAllNotifications());
        }

        return ResponseEntity.ok(notificationService.getNotificationsByUserId(userId));
    }

    @org.springframework.web.bind.annotation.PostMapping
    public ResponseEntity<String> createNotification(
            @RequestParam("userId") String userId,
            @RequestParam("email") String email,
            @RequestParam("message") String message) {
        notificationService.sendNotification(userId, email, message);
        return ResponseEntity.ok("Notification sent");
    }
}
