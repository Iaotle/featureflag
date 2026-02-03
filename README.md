# Feature Flag Service

A feature flag service with Laravel backend and Next.js frontend for managing car damage reports with conditional feature rollouts.

## Tech Stack

- **Backend**: Laravel 12 with Sail (PostgreSQL + Redis)
- **Frontend**: Next.js 15 (TypeScript + Tailwind CSS)
- **Key Feature**: User group rollout (A-H groups based on CRC32 hash)

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ and npm

## Quick Start

### Backend Setup

```bash
cd backend

# Start Laravel Sail (PostgreSQL + Redis + Scheduler)
./vendor/bin/sail up -d

# Run migrations and seed database
./vendor/bin/sail artisan migrate --seed
```

Backend API available at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local

# Start development server
npm run dev
```

Frontend available at `http://localhost:3000`

## Running Tests

### Backend Tests (PHPUnit)

```bash
cd backend
./vendor/bin/sail test
```

109 tests covering:
- Feature flag CRUD and validation
- User group assignment (CRC32 hash)
- Scheduled flag activation/deactivation
- Report creation with flag validation
- Admin authentication and flag management

### Frontend Tests (Jest)

```bash
cd frontend
npm test
```

32 tests covering:
- Component rendering (PhotoUpload, PriorityBadge)
- Flag fetching and error handling
- User ID generation

## Stopping Services

```bash
# Stop backend
cd backend && ./vendor/bin/sail down

# Frontend stops with Ctrl+C
```

## Feature Flags

| Flag Key | Type | Enabled For | Description |
|----------|------|-------------|-------------|
| `damage_photo_upload` | User Groups | A, B, C, D | Photo upload capability |
| `ai_damage_detection` | Boolean | All users | AI analysis of damage |
| `priority_indicators` | User Groups | A, B | Visual priority badges |
| `pdf_export` | Scheduled | Time-based | Export reports as PDF |
| `bulk_actions` | User Groups | A only | Bulk operations toolbar |

## API Endpoints

### Check Flags

```bash
curl -X POST http://localhost:8000/api/flags/check \
  -H "Content-Type: application/json" \
  -d '{"flags":["damage_photo_upload","ai_damage_detection"],"user_id":"test123"}'
```

### Admin Endpoints (require authentication)

- `GET /api/admin/flags` - List all flags
- `POST /api/admin/flags` - Create flag
- `GET /api/admin/flags/{id}` - Get flag
- `PUT /api/admin/flags/{id}` - Update flag
- `DELETE /api/admin/flags/{id}` - Delete flag

### Reports

- `GET /api/reports?user_identifier={userId}` - List reports
- `POST /api/reports` - Create report
- `GET /api/reports/{id}` - Get report
- `PUT /api/reports/{id}` - Update report
- `DELETE /api/reports/{id}` - Delete report

## Development Commands

### Backend

```bash
# Run migrations
./vendor/bin/sail artisan migrate

# Seed database
./vendor/bin/sail artisan db:seed

# Process scheduled flags manually
./vendor/bin/sail artisan flags:process

# Clear cache
./vendor/bin/sail artisan cache:clear

# Laravel Tinker
./vendor/bin/sail artisan tinker
```

### Frontend

```bash
# Development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```
