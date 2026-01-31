Claude’s Plan
Feature Flag Service Implementation Plan
Overview
Build a simple, performant feature flag service with:

Backend: Latest Laravel with Sail + PostgreSQL + Redis
Frontend: Latest Next.js (TypeScript) for Car Damage Reports app
Infrastructure: Laravel Sail for easy deployment
Key Feature: User group rollout (A/B/C/D/E/F/G/H)
Philosophy: KISS principle - plain PHP/Next.js, no unnecessary complexity
Best Practices References
Laravel Best Practices (from docs):

Use Eloquent ORM for database operations (avoid raw queries)
Cache facade for Redis operations
Artisan commands for scheduled tasks
API Resource Controllers for RESTful endpoints
Environment-based configuration
Migrations for schema changes
Seeders for default data
Next.js Best Practices (from docs):

App Router for file-based routing
Server Components by default (use 'use client' only when needed)
Server Actions for form submissions (optional, can use API routes)
TypeScript for type safety
Image component for optimized images
Metadata API for SEO
Environment variables with NEXT_PUBLIC_ prefix for client-side
Performance Optimizations:

Laravel: Use caching, eager loading, database indexing
Next.js: Use React Server Components, lazy loading, code splitting
Redis: Short TTLs, simple cache keys, batch operations
Architecture Summary
Database Schema (PostgreSQL)
feature_flags table:

id, name, key (unique), description
is_active (boolean master switch)
rollout_type (enum: 'boolean', 'user_groups')
enabled_groups (JSON array: ['A','B','C'], nullable)
scheduled_start_at, scheduled_end_at (nullable timestamps)
timestamps
damage_reports table:

id, title, description, damage_location
priority (enum: low/medium/high), status
photos (JSON array, nullable)
user_identifier
timestamps
Caching Strategy (Redis)
Simple two-tier cache:

Flag Config Cache: flag:{key} → entire flag object (TTL: 300s)
User Decision Cache: flag:{key}:{user_id} → boolean (TTL: 60s)
Invalidation: Clear cache on flag update (simple Cache::forget())

User Group Assignment Algorithm

// In FeatureFlag model
public static function getUserGroup(string $userId): string {
    $groups = ['A','B','C','D','E','F','G','H'];
    $hash = crc32($userId);
    return $groups[abs($hash) % 8];
}

public static function checkFlag(string $key, string $userId): bool {
    $cacheKey = "flag:{$key}:{$userId}";

    return Cache::remember($cacheKey, 60, function() use ($key, $userId) {
        $flag = Cache::remember("flag:{$key}", 300, fn() => self::where('key', $key)->first());

        if (!$flag || !$flag->is_active) return false;

        if ($flag->scheduled_start_at && now()->lt($flag->scheduled_start_at)) return false;
        if ($flag->scheduled_end_at && now()->gt($flag->scheduled_end_at)) return false;

        if ($flag->rollout_type === 'boolean') return true;

        $userGroup = self::getUserGroup($userId);
        $enabledGroups = $flag->enabled_groups ?? [];
        return in_array($userGroup, $enabledGroups);
    });
}

protected static function boot() {
    parent::boot();

    static::saved(function($flag) {
        Cache::flush(); // Simple: clear all cache on flag change
    });
}
Simple: All logic in one model, use Laravel Cache facade, clear all cache on updates.

Scheduled Flags Implementation
Laravel Scheduler: Run php artisan schedule:work (Sail handles this)
Command: ProcessScheduledFlags runs every minute
Logic: Simple - activate/deactivate based on timestamps, clear cache
Feature Flags for Car Damage Reports
3 Conditionally Rendered Components:

damage_photo_upload - PhotoUpload component (groups: A,B,C,D)
ai_damage_detection - AIDamageDetection component (boolean: true)
priority_indicators - PriorityBadge component (groups: A,B)
2 Conditionally Available Features:
4. pdf_export - Export PDF button (scheduled start in 1 hour)
5. bulk_actions - Bulk operations toolbar (groups: A)

Edge Case Handling (Flag Disabled During Interaction)
Simple Strategy:

Server: Validate flag in API before processing (return 403 if disabled)
Client: Catch 403, show error message, refresh page
Cache TTL: 60s means max 1-minute delay for flag changes
Implementation Sequence
Phase 1: Laravel Setup with Sail
Install Laravel: curl -s https://laravel.build/backend | bash
Configure Sail: PostgreSQL + Redis services
Start Sail: cd backend && ./vendor/bin/sail up -d
Verify services running
Phase 2: Backend - Database
Create migrations:
create_feature_flags_table.php
create_damage_reports_table.php
Create models: FeatureFlag, DamageReport
Add cache invalidation to FeatureFlag model (boot method)
Create seeder: FeatureFlagSeeder with 5 flags
Phase 3: Backend - Feature Flag Logic (Plain PHP)
Add methods to FeatureFlag model:
static checkFlag(string $key, string $userId): bool
static getUserGroup(string $userId): string
isEnabledForGroup(string $group): bool
Use Laravel Cache facade directly (no wrapper services)
Keep it simple: all logic in model, no services/repositories
Phase 4: Backend - API Endpoints
Create FlagController (API resource controller):
index() - list all flags
store() - create flag
update() - update flag
destroy() - delete flag
check() - POST endpoint for client to check flags
Create ReportController (standard resource controller)
Add routes to routes/api.php
Enable CORS in config/cors.php
Phase 5: Backend - Scheduled Flags
Create ProcessScheduledFlags command
Register in Kernel.php: $schedule->command('flags:process')->everyMinute()
Sail runs scheduler automatically
Phase 6: Frontend - Next.js Setup
Create Next.js app: npx create-next-app@latest frontend
TypeScript: Yes
Tailwind: Yes
App Router: Yes
Configure API URL in .env.local
Phase 7: Frontend - Feature Flag Client (Plain Next.js)
Create lib/flags.ts:
getUserId() - get/create UUID from localStorage
fetchFlags(flagKeys) - fetch from API
Create hooks/useFlags.ts:
Simple hook that fetches on mount, returns flag map
No context, no complex state - just direct hook usage
Phase 8: Frontend - Car Damage Reports Pages
Create pages (App Router):
app/reports/page.tsx - list reports
app/reports/new/page.tsx - create report
app/reports/[id]/page.tsx - view report
app/reports/[id]/edit/page.tsx - edit report
Use Server Components where possible for performance
Client Components only where needed (forms, interactions)
Phase 9: Frontend - Flagged Features
In each component, call useFlags() and conditionally render:
PhotoUpload in ReportForm
AIDamageDetection in report view
PriorityBadge in report list
PDF export button
Bulk actions toolbar
No separate FeatureGate component - inline {flags.photo_upload && <PhotoUpload />}
Phase 10: Documentation
Write README.md:
Install with curl -s https://laravel.build/backend | bash
Start backend: cd backend && ./vendor/bin/sail up -d
Install frontend: cd frontend && npm install
Start frontend: npm run dev
Access apps, API endpoints
Document flag structure and user groups
Critical Files to Create
Backend (Laravel)
backend/app/Models/FeatureFlag.php - Model with all flag logic (checkFlag, getUserGroup, cache)
backend/database/migrations/2024_01_01_000001_create_feature_flags_table.php
backend/database/migrations/2024_01_01_000002_create_damage_reports_table.php
backend/app/Console/Commands/ProcessScheduledFlags.php
backend/app/Http/Controllers/FlagController.php - API for flag CRUD + check
backend/app/Http/Controllers/ReportController.php - Damage reports API
backend/routes/api.php - All API routes
backend/database/seeders/FeatureFlagSeeder.php
Frontend (Next.js)
frontend/lib/flags.ts - Simple flag fetching logic
frontend/hooks/useFlags.ts - Hook to fetch and return flags
frontend/app/reports/page.tsx - Report list
frontend/app/reports/new/page.tsx - Create report
frontend/app/reports/[id]/page.tsx - View report
frontend/app/reports/[id]/edit/page.tsx - Edit report
frontend/components/PhotoUpload.tsx - Photo upload component
frontend/components/AIDamageDetection.tsx - AI analysis component
frontend/components/PriorityBadge.tsx - Priority badge component
Root
README.md - Setup instructions
Environment Configuration
backend/.env (Sail generates this)

DB_CONNECTION=pgsql
DB_HOST=pgsql
DB_DATABASE=backend
CACHE_DRIVER=redis
REDIS_HOST=redis
frontend/.env.local

NEXT_PUBLIC_API_URL=http://localhost/api
Verification Strategy
Start Backend:


cd backend
./vendor/bin/sail up -d
./vendor/bin/sail artisan migrate --seed
Verify Backend:

Check seeded flags: sail artisan tinker → FeatureFlag::all()
Test flag API: curl http://localhost/api/flags/check -d '{"flags":["damage_photo_upload"],"user_id":"test123"}'
Test different user groups: change user_id, verify different groups get different flags
Start Frontend:


cd frontend
npm install
npm run dev
Verify Frontend:

Access http://localhost:3000
Create damage report
Clear localStorage and refresh to get new user group
Verify different groups see different features (PhotoUpload for groups A-D only)
Check AI Detection (all users), Priority badges (groups A-B only)
Verify Scheduled Flags:

Create flag with future start time via API
Wait for time to pass
Verify flag auto-activates
Verify Caching:

Make repeated flag checks
Check Redis: sail redis redis-cli KEYS "flag:*"
Update flag, verify cache cleared
Performance:

Batch check all 5 flags in one request
Should be <50ms with cache
Key Technical Decisions
User Groups: 8 groups (A-H) via CRC32 hash modulo 8
User ID: localStorage UUID, consistent across sessions
Cache: Simple two-tier (config + decision), Laravel Cache facade
Deployment: Laravel Sail (Docker under the hood, zero config)
Architecture: Plain PHP in models, no services/repositories
Frontend: Direct hook usage, no context/providers
No Logging: Keep it simple per KISS
API Only: No admin UI, use Postman/curl
Success Criteria
✅ sail up starts backend with PostgreSQL + Redis
✅ npm run dev starts Next.js frontend
✅ Feature flags CRUD via API
✅ Client checks flags via API
✅ User group assignment works (hash-based, groups A-H)
✅ Scheduled flags auto-activate/deactivate
✅ Cache provides <50ms flag checks
✅ Damage reports CRUD works
✅ 3 components conditionally render (PhotoUpload, AIDamageDetection, PriorityBadge)
✅ 2 features conditionally available (PDF export, bulk actions)
✅ Edge case handled (server validates flag, returns 403 if disabled)
✅ Clear README with simple setup steps
User approved the plan
Perfect! The plan has been approved. Let me start by creating the todo list to track our implementation progress.

Update Todos

Install Laravel with Sail (PostgreSQL + Redis)

Create database migrations (feature_flags, damage_reports)

Create models (FeatureFlag, DamageReport)

Implement flag checking logic in FeatureFlag model

Create FlagController with CRUD + check endpoint

Create ReportController for damage reports

Create ProcessScheduledFlags command

Create FeatureFlagSeeder with 5 default flags

Configure API routes and CORS

Run migrations and seeders

Install Next.js with TypeScript and Tailwind

Create flags utility and useFlags hook

Create damage report pages (list, new, view, edit)

Create flagged components (PhotoUpload, AIDamageDetection, PriorityBadge)

Write comprehensive README with setup instructions
Now let's start implementing! I'll begin by installing Laravel with Sail.

Update Todos

Install Laravel with Sail (PostgreSQL + Redis)

Create database migrations (feature_flags, damage_reports)

Create models (FeatureFlag, DamageReport)

Implement flag checking logic in FeatureFlag model

Create FlagController with CRUD + check endpoint

Create ReportController for damage reports

Create ProcessScheduledFlags command

Create FeatureFlagSeeder with 5 default flags

Configure API routes and CORS

Run migrations and seeders

Install Next.js with TypeScript and Tailwind

Create flags utility and useFlags hook

Create damage report pages (list, new, view, edit)

Create flagged components (PhotoUpload, AIDamageDetection, PriorityBadge)

Write comprehensive README with setup instructions