package org.hotelbooking.hotelservice.controller;


import lombok.RequiredArgsConstructor;
import org.hotelbooking.hotelservice.model.Room;
import org.hotelbooking.hotelservice.service.RoomService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @PostMapping
    public Room addRoom(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestBody Room room) {
        if (!"ADMIN".equals(role)) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Access Denied: Admins Only");
        }
        return roomService.addRoom(room);
    }

    @GetMapping("/{hotelId}")
    public List<Room> getRooms(@PathVariable Long hotelId) {
        return roomService.getRoomsByHotel(hotelId);
    }

    @PutMapping("/{roomId}/decrement")
    public void decrementRoomInventory(@PathVariable Long roomId) {
        roomService.decrementRoomCapacity(roomId);
    }

    @PutMapping("/{roomId}/increment")
    public void incrementRoomInventory(@PathVariable Long roomId) {
        roomService.incrementRoomCapacity(roomId);
    }
}