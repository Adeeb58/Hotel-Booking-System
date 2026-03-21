package org.example.paymentservice.service;

import org.example.paymentservice.entity.Notification;
import org.example.paymentservice.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public void sendNotification(String userId, String message) {

        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setMessage(message);
        notification.setType("EMAIL");

        notificationRepository.save(notification);

        System.out.println("================================");
        System.out.println("[EMAIL DISPATCHED] To User ID: " + userId);
        System.out.println("[SUBJECT] Hotel Booking Confirmation");
        System.out.println("[BODY] " + message);
        System.out.println("================================\n");
    }

    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }

    public List<Notification> getNotificationsByUserId(String userId) {
        return notificationRepository.findAll()
                .stream()
                .filter(notification -> userId.equals(notification.getUserId()))
                .toList();
    }
}