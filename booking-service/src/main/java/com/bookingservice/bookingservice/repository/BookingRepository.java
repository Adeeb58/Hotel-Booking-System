package com.bookingservice.bookingservice.repository;

import com.bookingservice.bookingservice.entity.Booking;
import com.bookingservice.bookingservice.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserIdOrderByCheckInDateDesc(Long userId);

    Optional<Booking> findByReservationNumber(String reservationNumber);

    @Query("""
        select count(b) > 0
        from Booking b
        where b.roomId = :roomId
          and b.status = :status
          and :checkIn < b.checkOutDate
          and :checkOut > b.checkInDate
    """)
    boolean existsOverlappingBooking(
            @Param("roomId") Long roomId,
            @Param("status") BookingStatus status,
            @Param("checkIn") LocalDate checkIn,
            @Param("checkOut") LocalDate checkOut
    );
}
