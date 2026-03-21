package org.hotelbooking.hotelservice.service;

import lombok.RequiredArgsConstructor;
import org.hotelbooking.hotelservice.model.Hotel;
import org.hotelbooking.hotelservice.repo.HotelRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HotelService {

    private final HotelRepository hotelRepository;

    public Hotel createHotel(Hotel hotel) {
        return hotelRepository.save(hotel);
    }

    public List<Hotel> getAllHotels() {
        return hotelRepository.findAll();
    }

    public Hotel getHotelById(Long id) {
        return hotelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hotel not found"));
    }

    private final org.hotelbooking.hotelservice.repo.RoomRepository roomRepository;
    private final org.hotelbooking.hotelservice.client.BookingClient bookingClient;

    public List<Hotel> searchByLocation(String location) {
        return hotelRepository.findByLocationContainingIgnoreCase(location);
    }

    public List<Hotel> searchHotels(String location, java.time.LocalDate checkIn, java.time.LocalDate checkOut, Double minPrice, Double maxPrice, List<String> amenities) {
        List<Hotel> hotels;
        if (location != null && !location.trim().isEmpty()) {
            hotels = hotelRepository.findByLocationContainingIgnoreCase(location);
        } else {
            hotels = hotelRepository.findAll();
        }

        // Filter by amenities
        if (amenities != null && !amenities.isEmpty()) {
            hotels = hotels.stream()
                .filter(h -> h.getAmenities() != null && h.getAmenities().containsAll(amenities))
                .toList();
        }

        if (hotels.isEmpty()) return hotels;

        // Filter by price and availability if dates/prices are given
        if (checkIn != null && checkOut != null || minPrice != null || maxPrice != null) {
            hotels = hotels.stream().filter(hotel -> {
                List<org.hotelbooking.hotelservice.model.Room> rooms = roomRepository.findByHotelId(hotel.getId());
                
                // Filter rooms by price
                if (minPrice != null) {
                    rooms = rooms.stream().filter(r -> r.getPrice() >= minPrice).toList();
                }
                if (maxPrice != null) {
                    rooms = rooms.stream().filter(r -> r.getPrice() <= maxPrice).toList();
                }
                
                if (rooms.isEmpty()) return false;
                
                // Check availability via booking-service
                if (checkIn != null && checkOut != null) {
                    List<Long> roomIds = rooms.stream().map(org.hotelbooking.hotelservice.model.Room::getId).toList();
                    try {
                        java.util.Map<Long, Long> bookedCounts = bookingClient.getAvailableRoomCounts(roomIds, checkIn, checkOut);
                        boolean hasAvailableRoom = rooms.stream().anyMatch(r -> {
                            Long booked = bookedCounts.getOrDefault(r.getId(), 0L);
                            return r.getTotalRooms() != null && (r.getTotalRooms() - booked > 0);
                        });
                        return hasAvailableRoom;
                    } catch (Exception e) {
                        // If booking-service is unavailable, do NOT crash — assume rooms available
                        System.err.println("[HotelService] BookingClient availability check failed: " + e.getMessage());
                        return true;
                    }
                }
                return true;
            }).toList();
        }

        return hotels;
    }
}
