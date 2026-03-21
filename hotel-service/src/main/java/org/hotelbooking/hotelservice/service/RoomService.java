package org.hotelbooking.hotelservice.service;

import lombok.RequiredArgsConstructor;
import org.hotelbooking.hotelservice.model.Room;
import org.hotelbooking.hotelservice.repo.RoomRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;

    public Room addRoom(Room room) {
        return roomRepository.save(room);
    }

    public List<Room> getRoomsByHotel(Long hotelId) {
        return roomRepository.findByHotelId(hotelId);
    }

    public org.hotelbooking.hotelservice.model.Room getRoomById(Long roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found: " + roomId));
    }
}