# Booking Service (booking-service)

This document describes what the **Booking Service** does in the hotel-booking microservices system, how to run/test it, and what to learn from it.

## 1) Role / Responsibilities (MVP)

The Booking Service is responsible for:

- **Create bookings** for a room for a date range.
- **Check availability** (detect date overlap conflicts).
- **Fetch booking details** by booking id.
- **Fetch user booking history** by userId (basic list).
- **Cancel bookings** (sets status to `CANCELLED`).
- **Reservation number generation** (human-readable reference like `RSV-YYYYMMDD-XXXXXX`).

It does **not** implement authentication/JWT itself (that belongs to Auth service / Gateway). For hackathon MVP, this service accepts IDs as numbers.

## 2) Data Model

### Booking

- `id: Long` (DB-generated)
- `userId: Long`
- `hotelId: Long`
- `roomId: Long`
- `checkInDate: LocalDate`
- `checkOutDate: LocalDate`
- `totalPrice: Double`
- `status: CONFIRMED | CANCELLED`
- `reservationNumber: String` (unique)

### Availability rule

A room is **not available** if there exists a `CONFIRMED` booking overlapping the requested date range:

- overlap condition: `(checkIn < existing.checkOut) AND (checkOut > existing.checkIn)`

## 3) REST API Endpoints

Base URL (local): `http://localhost:8083`

### Create booking

`POST /bookings`

**Headers**
- `Content-Type: application/json`

**Body (raw JSON)**
```json
{
  "userId": 1,
  "hotelId": 10,
  "roomId": 55,
  "checkInDate": "2026-04-01",
  "checkOutDate": "2026-04-05",
  "totalPrice": 499.99
}
```

**Responses**
- `201 Created` → booking JSON
- `409 Conflict` → if room already booked for those dates
- `400 Bad Request` → invalid dates / missing fields

### Get booking

`GET /bookings/{id}`

### Get bookings for user (history)

`GET /bookings/user/{userId}`

### Cancel booking

`PUT /bookings/cancel/{id}`

(No request body)

### Check availability

`GET /availability?roomId=55&checkIn=2026-04-01&checkOut=2026-04-05`

Returns:
```json
{
  "roomId": 55,
  "checkIn": "2026-04-01",
  "checkOut": "2026-04-05",
  "available": true
}
```

## 4) Service Discovery (Eureka)

This service is configured as a **Eureka Client**.

Expected Eureka URL:
- `http://localhost:8761/eureka`

When Eureka is running and the service is started, it should register as:
- `booking-service`

## 5) Feign Clients (for later integration)

Feign is enabled and minimal clients are added for future cross-service calls:

- `HotelServiceClient` (calls `hotel-service`)
- `PaymentServiceClient` (calls `payment-service`)

Right now booking creation does **not** call them yet (MVP kept simple). Later you can:

- validate room/hotel exists via hotel-service
- trigger payment-service after booking creation

## 6) How to Run

### Option A (quick dev): run with MySQL (current main config)

Your main `application.properties` currently points to MySQL. To run successfully:

1. Start MySQL
2. Create DB (example): `bookings_db`
3. Ensure the username/password match your properties
4. Start Eureka (optional but recommended)
5. Run booking-service

Run command:
- Windows PowerShell:
  - `cd booking-service`
  - `./mvnw spring-boot:run`

### Option B (recommended for hackathon): run with H2

If you prefer to run without MySQL, switch `spring.datasource.url` to H2 (in-memory). (Tests already use H2 automatically.)

## 7) How to Test

### A) Maven test

From `booking-service/`:
- `./mvnw test`

Tests should pass without needing MySQL because test config uses H2 and disables Eureka.

### B) Postman quick checks

1) Create booking → `POST /bookings`
2) Check availability for same room+dates → should be `available=false`
3) Cancel booking → `PUT /bookings/cancel/{id}`
4) Check availability again → should be `available=true`

## 8) What to Learn (Interview / Hackathon Talking Points)

- **Microservice boundaries**: Booking service owns booking rules; other services own user/hotel/payment concerns.
- **REST API design**: clear resources (`/bookings`) and action endpoints (`/bookings/cancel/{id}`) for MVP.
- **Validation**: request validation (`@Valid`) + date rules (check-out must be after check-in).
- **Conflict handling**: using `409 Conflict` for availability collisions (real-world pattern).
- **JPA + overlap query**: implementing the overlap condition at DB query level.
- **Eureka discovery**: service registers and can be routed via gateway later.
- **Feign**: ready for service-to-service calls using service names (`hotel-service`, `payment-service`).

## 9) Next Steps (Optional)

- Add an integration step: on `createBooking`, call Hotel service to confirm room exists and fetch price.
- Add a Payment call: after booking created, call Payment service and confirm booking.
- Add JWT enforcement at API Gateway (recommended) instead of inside booking-service.
