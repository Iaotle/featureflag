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
            'damage_location' => 'required|string|max:255',
            'priority' => 'required|in:low,medium,high',
            'status' => 'string',
            'photos' => 'nullable|array',
            'user_identifier' => 'required|string',
        ]);

        // Validate flag for photo upload if photos are provided
        if (!empty($validated['photos'])) {
            if (!FeatureFlag::checkFlag('damage_photo_upload', $validated['user_identifier'])) {
                return response()->json([
                    'message' => 'Photo upload feature is not available for your account.'
                ], 403);
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
        if (isset($validated['photos']) && !empty($validated['photos'])) {
            $userId = $validated['user_identifier'] ?? $report->user_identifier;
            if (!FeatureFlag::checkFlag('damage_photo_upload', $userId)) {
                return response()->json([
                    'message' => 'Photo upload feature is not available for your account.'
                ], 403);
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
}
