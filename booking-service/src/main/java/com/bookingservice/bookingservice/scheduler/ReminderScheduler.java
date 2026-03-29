package com.bookingservice.bookingservice.scheduler;

import com.bookingservice.bookingservice.client.HotelServiceClient;
import com.bookingservice.bookingservice.client.NotificationClient;
import com.bookingservice.bookingservice.client.UserServiceClient;
import com.bookingservice.bookingservice.entity.Booking;
import com.bookingservice.bookingservice.entity.BookingStatus;
import com.bookingservice.bookingservice.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReminderScheduler {

    private final BookingRepository bookingRepository;
    private final NotificationClient notificationClient;
    private final UserServiceClient userServiceClient;
    private final HotelServiceClient hotelServiceClient;

    @Scheduled(cron = "0 0 8 * * ?") // Runs daily at 8:00 AM
    @Transactional(readOnly = true)
    public void sendCheckInReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        List<Booking> bookings = bookingRepository.findByStatusAndCheckInDate(BookingStatus.CONFIRMED, tomorrow);
        
        log.info("Sending check-in reminders for {} bookings", bookings.size());
        
        for (Booking booking : bookings) {
            try {
                var user = userServiceClient.getUserById(booking.getUserId());
                var hotel = hotelServiceClient.getHotelById(booking.getHotelId());
                String hotelName = hotel != null ? hotel.name() : "Unknown Hotel";
                
                String message = String.format(
                    "Dear %s,\n\nThis is a gentle reminder that your check-in at %s is scheduled for tomorrow (%s).\n\nSafe travels!",
                    user.name(),
                    hotelName,
                    tomorrow.toString()
                );
                
                notificationClient.sendNotification(booking.getUserId(), user.email(), message);
            } catch (Exception e) {
                log.error("Failed to send check-in reminder for booking {}: {}", booking.getId(), e.getMessage());
            }
        }
    }

    @Scheduled(cron = "0 0 8 * * ?") // Runs daily at 8:00 AM
    @Transactional(readOnly = true)
    public void sendCheckOutReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        List<Booking> bookings = bookingRepository.findByStatusAndCheckOutDate(BookingStatus.CONFIRMED, tomorrow);
        
        log.info("Sending check-out reminders for {} bookings", bookings.size());
        
        for (Booking booking : bookings) {
            try {
                var user = userServiceClient.getUserById(booking.getUserId());
                var hotel = hotelServiceClient.getHotelById(booking.getHotelId());
                String hotelName = hotel != null ? hotel.name() : "Unknown Hotel";
                
                String message = String.format(
                    "Dear %s,\n\nThis is a reminder that your check-out from %s is scheduled for tomorrow (%s).\n\nWe hope you enjoyed your stay!",
                    user.name(),
                    hotelName,
                    tomorrow.toString()
                );
                
                notificationClient.sendNotification(booking.getUserId(), user.email(), message);
            } catch (Exception e) {
                log.error("Failed to send check-out reminder for booking {}: {}", booking.getId(), e.getMessage());
            }
        }
    }
}
