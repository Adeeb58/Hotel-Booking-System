package com.bookingservice.bookingservice.client;

import com.bookingservice.bookingservice.client.dto.HotelSummary;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "hotel-service")
public interface HotelServiceClient {

    @GetMapping("/hotels/{id}")
    HotelSummary getHotelById(@PathVariable("id") Long id);

    @org.springframework.web.bind.annotation.PutMapping("/rooms/{roomId}/decrement")
    void decrementRoomInventory(@PathVariable("roomId") Long roomId);

    @org.springframework.web.bind.annotation.PutMapping("/rooms/{roomId}/increment")
    void incrementRoomInventory(@PathVariable("roomId") Long roomId);
}
