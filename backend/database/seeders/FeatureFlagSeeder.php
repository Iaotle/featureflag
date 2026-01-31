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
                'uuid' => '7788b584-b6f6-4b5c-a263-943ef9a1cbc7'
            ],
            [
                'name' => 'AI Damage Detection',
                'key' => 'ai_damage_detection',
                'description' => 'Enable AI-powered damage detection analysis',
                'is_active' => true,
                'rollout_type' => 'boolean',
                'enabled_groups' => null,
                'uuid' => '866f5ef6-f4c2-44b2-bf1e-327ca015a904'
            ],
            [
                'name' => 'Priority Indicators',
                'key' => 'priority_indicators',
                'description' => 'Show priority badges on damage reports',
                'is_active' => true,
                'rollout_type' => 'user_groups',
                'enabled_groups' => ['A', 'B'],
                'uuid' => '92280ac4-5f64-4b67-bf8e-e7a70d8758c8'
            ],
            [
                'name' => 'PDF Export',
                'key' => 'pdf_export',
                'description' => 'Export damage reports as PDF',
                'is_active' => false,
                'rollout_type' => 'boolean',
                'enabled_groups' => null,
                'scheduled_start_at' => now()->addMinutes(5),
                'scheduled_end_at' => now()->addMinutes(10),
                'uuid' => '042615e1-0138-4836-9427-3f68481fe333'
            ],
            [
                'name' => 'Bulk Actions',
                'key' => 'bulk_actions',
                'description' => 'Perform bulk operations on damage reports',
                'is_active' => true,
                'rollout_type' => 'user_groups',
                'enabled_groups' => ['A'],
                'uuid' => 'c8fcc8c1-623b-4f02-bd3a-87456331d2cd'
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
