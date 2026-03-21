# Hotel Booking Website (Microservices)

A full-stack hotel booking platform built with Spring Boot microservices, Spring Cloud (Eureka + API Gateway), MySQL, and a React + Vite frontend.

The system supports hotel discovery, room availability checks, booking lifecycle management, payments, promotions/coupons, user authentication (email/password + Google), and booking history.

---

## 1) High-Level Architecture

### Components

- **Frontend** (`hotelbookingfrontend`)  
  React application for customer and admin workflows.
- **API Gateway** (`api-gateway`)  
  Single public entry point, JWT validation, role/user header propagation, and rate limiting.
- **Service Registry** (`eureka-server`)  
  Service discovery for microservices.
- **User Service** (`user-service`)  
  Registration, login, JWT issuance, Google OAuth token exchange.
- **Hotel Service** (`hotel-service`)  
  Hotel catalog and room inventory metadata.
- **Booking Service** (`booking-service`)  
  Booking creation/cancel/confirm, real-time availability aggregation, promotions validation.
- **Payment Service** (`payment-service`)  
  Payment processing simulation, booking confirmation callback, notifications.

### Architecture Flow

```text
React Frontend
    |
    v
API Gateway (8085)
    |-- /auth/** ----------------------> User Service (8081)
    |-- /hotels/**, /rooms/** ---------> Hotel Service (8082)
    |-- /bookings/**, /availability/**,
    |   /promotions/** ----------------> Booking Service (8083)
    |-- /payments/**, /notifications/** > Payment Service (8084)

All backend services register with Eureka Server (8761)
```

---

## 2) Core Business Workflow

## 2.1 User Authentication

1. User logs in via email/password (`/auth/login`) or Google login (`/auth/google`).
2. `user-service` returns JWT with user claims (`userId`, `role`).
3. Frontend stores JWT.
4. API Gateway validates JWT for protected routes and injects:
   - `X-User-Id`
   - `X-User-Role`

## 2.2 Hotel Search and Availability

1. Frontend fetches hotels and rooms (public routes).
2. On hotel detail page, frontend calls bulk availability:
   - `POST /availability/bulk?checkIn=...&checkOut=...`
3. `booking-service` calculates overlapping confirmed bookings per room.
4. UI shows rooms left / sold out in real time.

## 2.3 Booking Lifecycle

1. User selects room and dates.
2. Frontend submits booking request.
3. `booking-service` validates date range and room capacity for overlapping windows.
4. Booking is created in `PENDING_PAYMENT` state.
5. User completes payment.
6. `payment-service` marks payment success and calls booking confirmation endpoint.
7. `booking-service` updates booking to `CONFIRMED` and triggers notification.

## 2.4 Promotions/Coupons

- Frontend validates offer code via:
  - `GET /promotions/validate/{code}`
- Booking service returns promotion details (discount percentage, validity).
- Frontend applies discounted payable amount before payment submission.

## 2.5 My Bookings

- Frontend uses `GET /bookings/my` (authenticated route) to fetch bookings for currently logged-in user.
- This avoids userId mismatch and ensures bookings are scoped to JWT identity.

---

## 3) Security Model

- **Public routes** include:
  - `/auth/**`
  - `GET /hotels/**`, `GET /rooms/**`, `GET /promotions/**`
  - `/availability/**`
- **Protected routes** (JWT required):
  - `/bookings/**`
  - `/payments/**`
  - other non-public gateway routes
- API Gateway enforces auth and forwards identity context to downstream services.

---

## 4) Technical Stack

## Backend

- Java 17
- Spring Boot 3.x
- Spring Data JPA
- Spring Validation
- Spring Cloud Netflix Eureka
- Spring Cloud Gateway (Server MVC)
- OpenFeign (inter-service calls)
- MySQL
- JJWT (token generation/validation)
- Google API Client (Google ID token verification)

## Frontend

- React
- React Router
- Axios
- Vite
- Tailwind CSS
- Lucide React
- `@react-oauth/google`

---

## 5) Service Ports and Databases

| Service | Port | Database |
|---|---:|---|
| eureka-server | 8761 | N/A |
| api-gateway | 8085 | N/A |
| user-service | 8081 | `auth_db` |
| hotel-service | 8082 | `hoteldb` |
| booking-service | 8083 | `bookings_db` |
| payment-service | 8084 | `payment_db` |

---

## 6) Project Structure

```text
Hotel-Booking-website/
  api-gateway/
  eureka-server/
  user-service/
  hotel-service/
  booking-service/
  payment-service/
  hotelbookingfrontend/
```

---

## 7) Local Setup and Run

### Prerequisites

- Java 17+
- Maven (or use each service's `mvnw`)
- Node.js 18+
- MySQL 8+

### Environment Variables

For Google login:

- Frontend (`hotelbookingfrontend/.env`):

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

- Backend (`user-service`):

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

> Do not commit real credentials. Keep secrets in local env/runtime config only.

### Startup Order

1. Start **Eureka Server**
2. Start **User Service**
3. Start **Hotel Service**
4. Start **Booking Service**
5. Start **Payment Service**
6. Start **API Gateway**
7. Start **Frontend** (`npm run dev`)

### Frontend Commands

```bash
cd hotelbookingfrontend
npm install
npm run dev
```

### Backend Commands (per service)

```bash
./mvnw spring-boot:run
```

(Windows: `mvnw.cmd spring-boot:run`)

---

## 8) Key Functional Features

- User registration and login
- Google sign-in support
- JWT-based auth and role propagation through gateway
- Hotel browsing and room details
- Date-aware, real-time room availability
- Booking creation with overlap checks
- Payment simulation and booking confirmation
- Promotions/coupon application in payment flow
- Booking status lifecycle: `PENDING_PAYMENT`, `CONFIRMED`, `CANCELLED`
- User-specific booking history (`/bookings/my`)
- Notification persistence and simulated mail dispatch

---

## 9) Resilience and Reliability Notes

- Availability endpoint handles invalid/null room inputs defensively.
- Payment confirmation and notification side-effects are non-blocking to prevent hard failures.
- Gateway route-level separation keeps service boundaries explicit.
- Graceful shutdown and Eureka timeout tuning are configured in services.

---

## 10) Future Improvements

- Add centralized config management
- Add distributed tracing (OpenTelemetry)
- Add Redis caching for availability reads
- Add Flyway/Liquibase migrations for strict schema versioning
- Add CI/CD pipeline with service-level tests and container builds
- Add role-based admin APIs and dashboard hardening

---

## 11) Disclaimer

This project includes payment and email notification simulation for learning/demo purposes and is not production-grade payment processing.
