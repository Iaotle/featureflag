<?php

namespace Database\Seeders;

use App\Models\FeatureFlag;
use Illuminate\Database\Seeder;

class FeatureFlagSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $flags = [
            [
                'name' => 'Damage Photo Upload',
                'key' => 'damage_photo_upload',
                'description' => 'Allow users to upload photos for damage reports',
                'is_active' => true,
                'rollout_type' => 'user_groups',
                'enabled_groups' => ['A', 'B', 'C', 'D'],
            ],
            [
                'name' => 'AI Damage Detection',
                'key' => 'ai_damage_detection',
                'description' => 'Enable AI-powered damage detection analysis',
                'is_active' => true,
                'rollout_type' => 'boolean',
                'enabled_groups' => null,
            ],
            [
                'name' => 'Priority Indicators',
                'key' => 'priority_indicators',
                'description' => 'Show priority badges on damage reports',
                'is_active' => true,
                'rollout_type' => 'user_groups',
                'enabled_groups' => ['A', 'B'],
            ],
            [
                'name' => 'PDF Export',
                'key' => 'pdf_export',
                'description' => 'Export damage reports as PDF',
                'is_active' => false,
                'rollout_type' => 'boolean',
                'enabled_groups' => null,
                'scheduled_start_at' => now()->addMinutes(5),
            ],
            [
                'name' => 'Bulk Actions',
                'key' => 'bulk_actions',
                'description' => 'Perform bulk operations on damage reports',
                'is_active' => true,
                'rollout_type' => 'user_groups',
                'enabled_groups' => ['A'],
            ],
        ];

        foreach ($flags as $flag) {
            FeatureFlag::updateOrCreate(
                ['key' => $flag['key']],
                $flag
            );
        }

        $this->command->info('Created 5 feature flags successfully!');
    }
}
