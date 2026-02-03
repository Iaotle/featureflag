# Feature Flag Service

A feature flag service with Laravel backend and Next.js frontend for managing car damage reports with conditional feature rollouts.

There are probably a few edge cases here and there if you start messing with the flags while users are on report edit pages. I tried to test things but the tests are not exhaustive. The idea is that the server validates the flags when the user submits reports, and displays a descriptive error message.

User group rollout consists of groups A-H, based on CRC32 hash.

## Tech Stack

- **Backend**: Laravel 12 with Sail (PostgreSQL + Redis)
- **Frontend**: Next.js 16 (TypeScript + Tailwind CSS 4)

## Prerequisites

- Docker and Docker Compose
- Node.js 18+
- npm
- Composer
- PHP 8.2+

## Quick Start

### Backend Setup
Laravel Sail is used for local deployment. From a fresh clone:

```bash
cd backend

# Install PHP dependencies (required for Sail)
composer install

# Create environment file
cp .env.example .env

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

### Production Build

```bash
cd frontend
npm run build
npm run start
```

## Running Tests

### Backend Tests (PHPUnit)

```bash
cd backend
./vendor/bin/sail test
```

Tests cover:
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

Tests cover:
- Component rendering (PhotoUpload, PriorityBadge)
- Flag fetching and error handling
- User ID generation

### E2E Tests (Playwright)

```bash
cd frontend
npm run test:e2e
```

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
