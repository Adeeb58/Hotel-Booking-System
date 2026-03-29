package com.bookingservice.bookingservice.client.dto;

public record RoomSummary(
        Long id,
        Long hotelId,
        String roomType,
        Double price,
        Integer capacity,
        Integer totalRooms
) {
}
