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

    public void decrementRoomCapacity(Long roomId) {
        roomRepository.findById(roomId).ifPresent(room -> {
            if (room.getTotalRooms() != null && room.getTotalRooms() > 0) {
                room.setTotalRooms(room.getTotalRooms() - 1);
                roomRepository.save(room);
            }
        });
    }

    public void incrementRoomCapacity(Long roomId) {
        roomRepository.findById(roomId).ifPresent(room -> {
            if (room.getTotalRooms() != null) {
                room.setTotalRooms(room.getTotalRooms() + 1);
                roomRepository.save(room);
            }
        });
    }
}