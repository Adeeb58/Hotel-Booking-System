# StayEase Frontend (React + Vite)

This is the frontend for the Hotel Booking platform.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in this folder:

```env
VITE_API_BASE_URL=http://localhost:8085
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

3. Start development server:

```bash
npm run dev
```

## Backend Mapping

- API base URL is read from `VITE_API_BASE_URL`.
- JWT is sent as `Authorization: Bearer <token>`.
- User context is mapped automatically from JWT claims:
	- `X-User-Id`
	- `X-User-Role`

These headers are required by backend endpoints such as:

- `/bookings/my`
- `/hotels` (admin create)
- `/rooms` (admin create)

## Build

```bash
npm run build
```
