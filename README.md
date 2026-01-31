# Feature Flag Service

A simple, performant feature flag service with Laravel backend and Next.js frontend for managing car damage reports with conditional feature rollouts.

## Overview

This project implements a feature flag system with:
- **Backend**: Laravel 12 with Sail (PostgreSQL + Redis)
- **Frontend**: Next.js 15 (TypeScript + Tailwind CSS)
- **Key Feature**: User group rollout (A-H groups based on CRC32 hash)
- **Demo App**: Car Damage Reports with conditional features

## Architecture

### Backend (Laravel)
- **Feature Flags**: CRUD API with user group rollout logic
- **Caching**: Two-tier Redis caching (flag config + user decisions)
- **Scheduled Flags**: Auto-activate/deactivate based on timestamps
- **Database**: PostgreSQL for data persistence

### Frontend (Next.js)
- **Server Components**: Default rendering strategy for performance
- **Client Components**: Used only where needed (forms, interactions)
- **Feature Flags**: Simple hook-based implementation (`useFlags`)
- **Conditional Rendering**: 3 components + 2 features behind flags

## Prerequisites

- **Docker** (for Laravel Sail)
- **Node.js** 18+ and npm
- **Git**

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd featureflag
```

### 2. Backend Setup (Laravel)

```bash
# Navigate to backend directory
cd backend

# Start Laravel Sail services
./vendor/bin/sail up -d

# Run migrations and seed database
./vendor/bin/sail artisan migrate --seed

# Verify backend is running
curl http://localhost:8000/api/flags/check \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"flags":["ai_damage_detection"],"user_id":"test123"}'
```

The backend API will be available at `http://localhost:8000`

### 3. Frontend Setup (Next.js)

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Usage

### Accessing the Application

1. Open your browser to `http://localhost:3000`
2. You'll be redirected to the damage reports page
3. Create a new damage report to see features in action

### Testing Feature Flags

The system includes 5 pre-configured feature flags:

| Flag Key | Type | Enabled For | Description |
|----------|------|-------------|-------------|
| `damage_photo_upload` | User Groups | A, B, C, D | Photo upload capability |
| `ai_damage_detection` | Boolean | All users | AI analysis of damage |
| `priority_indicators` | User Groups | A, B | Visual priority badges |
| `pdf_export` | Scheduled | None (starts in 1 hour) | Export reports as PDF |
| `bulk_actions` | User Groups | A only | Bulk operations toolbar |

**User Group Assignment**: Each user is automatically assigned to a group (A-H) based on a CRC32 hash of their user ID. The assignment is deterministic and persistent.

To test different groups:
1. Open browser DevTools
2. Go to Application > Local Storage
3. Delete the `feature_flag_user_id` key
4. Refresh the page (new user ID = different group)

### API Endpoints

#### Feature Flags

```bash
# List all flags
GET http://localhost:8000/api/flags

# Create a flag
POST http://localhost:8000/api/flags
{
  "name": "New Feature",
  "key": "new_feature",
  "description": "Description",
  "is_active": true,
  "rollout_type": "user_groups",
  "enabled_groups": ["A", "B"]
}

# Update a flag
PUT http://localhost:8000/api/flags/{id}

# Delete a flag
DELETE http://localhost:8000/api/flags/{id}

# Check flags for a user
POST http://localhost:8000/api/flags/check
{
  "flags": ["damage_photo_upload", "ai_damage_detection"],
  "user_id": "unique-user-id"
}
```

#### Damage Reports

```bash
# List reports
GET http://localhost:8000/api/reports?user_identifier={userId}

# Create report
POST http://localhost:8000/api/reports
{
  "title": "Front bumper damage",
  "description": "Dent on front left bumper",
  "damage_location": "Front left",
  "priority": "high",
  "status": "pending",
  "photos": ["photo1.jpg"],
  "user_identifier": "unique-user-id"
}

# Get single report
GET http://localhost:8000/api/reports/{id}

# Update report
PUT http://localhost:8000/api/reports/{id}

# Delete report
DELETE http://localhost:8000/api/reports/{id}
```

## Feature Flag System Details

### User Group Assignment

```php
// In FeatureFlag model
public static function getUserGroup(string $userId): string {
    $groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    $hash = crc32($userId);
    return $groups[abs($hash) % 8];
}
```

### Caching Strategy

- **Flag Config Cache**: `flag:{key}` → entire flag object (TTL: 300s)
- **User Decision Cache**: `flag:{key}:{user_id}` → boolean (TTL: 60s)
- **Invalidation**: Automatic cache flush on flag update

### Scheduled Flags

Flags can be scheduled to activate/deactivate automatically:

```bash
# The scheduler runs every minute
./vendor/bin/sail artisan flags:process
```

Sail automatically runs the scheduler in the background.

### Edge Case Handling

**Scenario**: User sees a feature, flag gets disabled, user tries to interact.

**Solution**:
- Backend validates flag before processing requests
- Returns 403 if flag is disabled
- Frontend catches 403 and shows error message
- Cache TTL of 60s means max 1-minute delay

Example:
```typescript
// In report creation
if (response.status === 403) {
  const data = await response.json();
  setError(data.message); // "Photo upload feature is not available"
  return;
}
```

## Conditional Features

### 1. Photo Upload Component
**Flag**: `damage_photo_upload` (Groups: A, B, C, D)

Allows users to add photos to damage reports. Only visible if flag is enabled.

### 2. AI Damage Detection Component
**Flag**: `ai_damage_detection` (Boolean: true for all)

Provides AI-powered analysis of damage based on uploaded photos.

### 3. Priority Badge Component
**Flag**: `priority_indicators` (Groups: A, B)

Shows visual priority badges instead of plain text. Enhances UX with color-coded indicators.

### 4. PDF Export Feature
**Flag**: `pdf_export` (Scheduled to start in 1 hour)

Button to export reports as PDF. Demonstrates scheduled flag activation.

### 5. Bulk Actions Feature
**Flag**: `bulk_actions` (Group: A only)

Toolbar for bulk operations (delete multiple reports). Power user feature.

## Development

### Backend Commands

```bash
# Run migrations
./vendor/bin/sail artisan migrate

# Seed database
./vendor/bin/sail artisan db:seed

# Process scheduled flags manually
./vendor/bin/sail artisan flags:process

# Check Redis cache
./vendor/bin/sail redis redis-cli KEYS "flag:*"

# Laravel Tinker
./vendor/bin/sail artisan tinker
>>> FeatureFlag::all()
>>> FeatureFlag::checkFlag('damage_photo_upload', 'test123')
```

### Frontend Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

### Stopping Services

```bash
# Stop backend
cd backend && ./vendor/bin/sail down

# Frontend will stop when you Ctrl+C the dev server
```

## Testing

### Verify Caching

```bash
# Check flag API performance (should be <50ms with cache)
time curl -X POST http://localhost:8000/api/flags/check \
  -H "Content-Type: application/json" \
  -d '{"flags":["damage_photo_upload","ai_damage_detection","priority_indicators","pdf_export","bulk_actions"],"user_id":"test123"}'

# Check Redis keys
./vendor/bin/sail redis redis-cli KEYS "flag:*"
```

### Verify User Groups

```bash
# Test different users get different groups
curl -X POST http://localhost:8000/api/flags/check \
  -H "Content-Type: application/json" \
  -d '{"flags":["damage_photo_upload"],"user_id":"user1"}'

curl -X POST http://localhost:8000/api/flags/check \
  -H "Content-Type: application/json" \
  -d '{"flags":["damage_photo_upload"],"user_id":"user2"}'
```

### Verify Scheduled Flags

1. Create a flag with future activation:
```bash
curl -X POST http://localhost:8000/api/flags \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Scheduled",
    "key": "test_scheduled",
    "is_active": false,
    "rollout_type": "boolean",
    "scheduled_start_at": "2024-01-31T18:00:00Z"
  }'
```

2. Wait for time to pass (or modify the timestamp)
3. Check that the flag auto-activates

## Architecture Decisions

- **KISS Principle**: Plain PHP in models, no complex services/repositories
- **Performance**: Redis caching, Server Components, minimal JavaScript
- **Simplicity**: Direct hook usage, no context providers
- **Deployment**: Laravel Sail (zero-config Docker)
- **No Logging**: Kept simple per requirements
- **API Only**: No admin UI, use Postman/curl

## Database Schema

### feature_flags

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| name | string | Display name |
| key | string (unique) | Unique identifier |
| description | text | Description |
| is_active | boolean | Master switch |
| rollout_type | enum | 'boolean' or 'user_groups' |
| enabled_groups | json | Array of groups (A-H) |
| scheduled_start_at | timestamp | Auto-activation time |
| scheduled_end_at | timestamp | Auto-deactivation time |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update time |

### damage_reports

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| title | string | Report title |
| description | text | Damage description |
| damage_location | string | Location of damage |
| priority | enum | low/medium/high |
| status | string | Report status |
| photos | json | Array of photo URLs |
| user_identifier | string | User ID |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update time |

## Performance Metrics

- **Flag Check**: <50ms with cache hit
- **Page Load**: Optimized with Server Components
- **Cache TTL**: 60s for decisions, 300s for config
- **Batch Requests**: Check multiple flags in one API call

## Troubleshooting

### Port 80 Already in Use

The backend runs on port 8000 by default. If you see port conflicts, check `backend/.env` for `APP_PORT=8000`.

### Frontend Can't Connect to Backend

Verify `frontend/.env.local` has:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Cache Not Clearing

```bash
# Manual cache flush
./vendor/bin/sail artisan cache:clear
./vendor/bin/sail redis redis-cli FLUSHALL
```

### Scheduler Not Running

Check that Sail is running:
```bash
./vendor/bin/sail ps
```

The scheduler should run automatically. Manual test:
```bash
./vendor/bin/sail artisan flags:process
```

## License

This is a demo project for feature flag implementation.
