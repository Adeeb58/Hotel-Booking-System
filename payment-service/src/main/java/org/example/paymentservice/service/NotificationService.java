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

    @Autowired
    private org.springframework.mail.javamail.JavaMailSender mailSender;

    public void sendNotification(String userId, String message) {

        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setMessage(message);
        notification.setType("EMAIL");

        notificationRepository.save(notification);

        try {
            org.springframework.mail.SimpleMailMessage email = new org.springframework.mail.SimpleMailMessage();
            email.setFrom("noreply@hotelbooking.com");
            email.setTo(userId); // Assuming userId is an email address
            email.setSubject("Hotel Booking Confirmation");
            email.setText(message);
            mailSender.send(email);
            System.out.println("[EMAIL DISPATCHED SUCESSFULLY] To User ID: " + userId);
        } catch (org.springframework.mail.MailException e) {
            System.out.println("================================");
            System.out.println("[EMAIL SIMULATION] To User ID: " + userId);
            System.out.println("[SUBJECT] Hotel Booking Confirmation");
            System.out.println("[BODY] " + message);
            System.out.println("[NOTE] SMTP Server not reachable. Logged instead.");
            System.out.println("================================\n");
        }
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