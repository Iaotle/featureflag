<?php

namespace App\Http\Controllers;

use App\Models\FeatureFlag;
use Illuminate\Http\Request;

class FlagController extends Controller
{
    /**
     * Display a listing of all feature flags.
     */
    public function index()
    {
        return response()->json(FeatureFlag::all());
    }

    /**
     * Store a newly created feature flag.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'key' => 'required|string|max:255|unique:feature_flags,key',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'rollout_type' => 'required|in:boolean,user_groups',
            'enabled_groups' => 'nullable|array',
            'enabled_groups.*' => 'in:A,B,C,D,E,F,G,H',
            'scheduled_start_at' => 'nullable|date',
            'scheduled_end_at' => 'nullable|date|after:scheduled_start_at',
        ]);

        $flag = FeatureFlag::create($validated);

        return response()->json($flag, 201);
    }

    /**
     * Display the specified feature flag.
     */
    public function show(string $id)
    {
        $flag = FeatureFlag::findOrFail($id);
        return response()->json($flag);
    }

    /**
     * Update the specified feature flag.
     */
    public function update(Request $request, string $id)
    {
        $flag = FeatureFlag::findOrFail($id);

        $validated = $request->validate([
            'name' => 'string|max:255',
            'key' => 'string|max:255|unique:feature_flags,key,' . $id,
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'rollout_type' => 'in:boolean,user_groups',
            'enabled_groups' => 'nullable|array',
            'enabled_groups.*' => 'in:A,B,C,D,E,F,G,H',
            'scheduled_start_at' => 'nullable|date',
            'scheduled_end_at' => 'nullable|date|after:scheduled_start_at',
        ]);

        $flag->update($validated);

        return response()->json($flag);
    }

    /**
     * Remove the specified feature flag.
     */
    public function destroy(string $id)
    {
        $flag = FeatureFlag::findOrFail($id);
        $flag->delete();

        return response()->json(null, 204);
    }

    /**
     * Check multiple feature flags for a specific user.
     */
    public function check(Request $request)
    {
        $validated = $request->validate([
            'flags' => 'required|array',
            'flags.*' => 'string',
            'user_id' => 'required|string',
        ]);

        $results = [];
        foreach ($validated['flags'] as $flagKey) {
            $results[$flagKey] = FeatureFlag::checkFlag($flagKey, $validated['user_id']);
        }

        return response()->json($results);
    }
}
