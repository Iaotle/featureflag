<?php

namespace App\Http\Controllers;

use App\Models\DamageReport;
use App\Models\FeatureFlag;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * Display a listing of damage reports.
     */
    public function index(Request $request)
    {
        $query = DamageReport::query();

        // Filter by user if provided
        if ($request->has('user_identifier')) {
            $query->where('user_identifier', $request->user_identifier);
        }

        $reports = $query->orderBy('created_at', 'desc')->get();

        return response()->json($reports);
    }

    /**
     * Store a newly created damage report.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'damage_location' => 'nullable|string|max:255',
            'priority' => 'nullable|in:low,medium,high',
            'status' => 'string',
            'photos' => 'nullable|array',
            'user_identifier' => 'required|string',
        ]);
        $userId = $validated['user_identifier'];

        // Validate feature flags
        if (! empty($validated['photos'])) {
            $resp = $this->assertFlagEnabledForUser('damage_photo_upload', $userId, 'Photo upload feature is not available for your account.');
            if ($resp) {
                return $resp;
            }
        }

        if (! empty($validated['priority'])) {
            $resp = $this->assertFlagEnabledForUser('priority_indicators', $userId, 'Priority feature is not available for your account.');
            if ($resp) {
                return $resp;
            }
        }

        $report = DamageReport::create($validated);

        return response()->json($report, 201);
    }

    /**
     * Display the specified damage report.
     */
    public function show(string $id)
    {
        $report = DamageReport::findOrFail($id);

        return response()->json($report);
    }

    /**
     * Update the specified damage report.
     */
    public function update(Request $request, string $id)
    {
        $report = DamageReport::findOrFail($id);

        $validated = $request->validate([
            'title' => 'string|max:255',
            'description' => 'string',
            'damage_location' => 'string|max:255',
            'priority' => 'in:low,medium,high',
            'status' => 'string',
            'photos' => 'nullable|array',
            'user_identifier' => 'string',
        ]);

        // Validate flag for photo upload if photos are being updated
        if (isset($validated['photos']) && ! empty($validated['photos'])) {
            $userId = $validated['user_identifier'] ?? $report->user_identifier;
            $resp = $this->assertFlagEnabledForUser('damage_photo_upload', $userId, 'Photo upload feature is not available for your account.');
            if ($resp) {
                return $resp;
            }
        }

        if (isset($validated['priority']) && ! empty($validated['priority'])) {
            $userId = $validated['user_identifier'] ?? $report->user_identifier;
            $resp = $this->assertFlagEnabledForUser('priority_indicators', $userId, 'Priority feature is not available for your account.');
            if ($resp) {
                return $resp;
            }
        }

        $report->update($validated);

        return response()->json($report);
    }

    /**
     * Remove the specified damage report.
     */
    public function destroy(string $id)
    {
        $report = DamageReport::findOrFail($id);
        $report->delete();

        return response()->json(null, 204);
    }

    /**
     * Bulk delete damage reports.
     */
    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:damage_reports,id',
        ]);

        $resp = $this->assertFlagEnabledForUser('bulk_actions', $request->input('user_identifier'), 'Bulk actions feature is not available for your account.');
        if ($resp) {
            return $resp;
        }

        $deletedCount = DamageReport::whereIn('id', $validated['ids'])->delete();

        return response()->json([
            'message' => "Successfully deleted {$deletedCount} report(s)",
            'deleted_count' => $deletedCount,
        ]);
    }

    private function assertFlagEnabledForUser(string $flagKey, ?string $userId, ?string $errorMessage = 'This feature is not available for your account.')
    {
        if (! FeatureFlag::checkFlag($flagKey, $userId)) {
            return response()->json([
                'message' => $errorMessage,
            ], 403);
        }

        return null;
    }
}
