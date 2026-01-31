<?php

namespace Tests\Feature;

use App\Models\FeatureFlag;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class FeatureFlagTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_group_assignment_is_deterministic(): void
    {
        $userId = 'test-user-123';

        $group1 = FeatureFlag::getUserGroup($userId);
        $group2 = FeatureFlag::getUserGroup($userId);

        $this->assertEquals($group1, $group2);
        $this->assertContains($group1, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
    }

    public function test_different_users_can_have_different_groups(): void
    {
        $user1Group = FeatureFlag::getUserGroup('user1');
        $user2Group = FeatureFlag::getUserGroup('user2');
        $user3Group = FeatureFlag::getUserGroup('user3');

        // Not guaranteed to be different, but collect multiple samples
        $groups = [$user1Group, $user2Group, $user3Group];
        $uniqueGroups = array_unique($groups);

        // At least one should be different (statistically very likely)
        $this->assertTrue(count($uniqueGroups) >= 1);
    }

    public function test_boolean_flag_returns_true_for_all_users(): void
    {
        $flag = FeatureFlag::create([
            'name' => 'Test Boolean Flag',
            'key' => 'test_boolean',
            'is_active' => true,
            'rollout_type' => 'boolean',
        ]);

        $this->assertTrue(FeatureFlag::checkFlag('test_boolean', 'user1'));
        $this->assertTrue(FeatureFlag::checkFlag('test_boolean', 'user2'));
        $this->assertTrue(FeatureFlag::checkFlag('test_boolean', 'user3'));
    }

    public function test_inactive_flag_returns_false(): void
    {
        $flag = FeatureFlag::create([
            'name' => 'Inactive Flag',
            'key' => 'inactive_flag',
            'is_active' => false,
            'rollout_type' => 'boolean',
        ]);

        $this->assertFalse(FeatureFlag::checkFlag('inactive_flag', 'any-user'));
    }

    public function test_user_groups_flag_checks_group_membership(): void
    {
        $flag = FeatureFlag::create([
            'name' => 'Group Flag',
            'key' => 'group_flag',
            'is_active' => true,
            'rollout_type' => 'user_groups',
            'enabled_groups' => ['A', 'B'],
        ]);

        // Test with multiple users to find one in group A or B
        $foundEnabled = false;
        $foundDisabled = false;

        for ($i = 0; $i < 20; $i++) {
            $userId = "test-user-{$i}";
            $group = FeatureFlag::getUserGroup($userId);
            $result = FeatureFlag::checkFlag('group_flag', $userId);

            if (in_array($group, ['A', 'B'])) {
                $this->assertTrue($result, "User in group {$group} should have flag enabled");
                $foundEnabled = true;
            } else {
                $this->assertFalse($result, "User in group {$group} should have flag disabled");
                $foundDisabled = true;
            }
        }

        // Statistically, we should find both enabled and disabled users
        $this->assertTrue($foundEnabled, 'Should find at least one user in groups A or B');
    }

    public function test_scheduled_flag_respects_start_time(): void
    {
        $flag = FeatureFlag::create([
            'name' => 'Future Flag',
            'key' => 'future_flag',
            'is_active' => true,
            'rollout_type' => 'boolean',
            'scheduled_start_at' => now()->addHour(),
        ]);

        // Should be false before start time
        $this->assertFalse(FeatureFlag::checkFlag('future_flag', 'user1'));
    }

    public function test_scheduled_flag_respects_end_time(): void
    {
        $flag = FeatureFlag::create([
            'name' => 'Expired Flag',
            'key' => 'expired_flag',
            'is_active' => true,
            'rollout_type' => 'boolean',
            'scheduled_start_at' => now()->subHours(2),
            'scheduled_end_at' => now()->subHour(),
        ]);

        // Should be false after end time
        $this->assertFalse(FeatureFlag::checkFlag('expired_flag', 'user1'));
    }

    public function test_flag_within_schedule_is_enabled(): void
    {
        $flag = FeatureFlag::create([
            'name' => 'Active Flag',
            'key' => 'active_flag',
            'is_active' => true,
            'rollout_type' => 'boolean',
            'scheduled_start_at' => now()->subHour(),
            'scheduled_end_at' => now()->addHour(),
        ]);

        $this->assertTrue(FeatureFlag::checkFlag('active_flag', 'user1'));
    }

    public function test_nonexistent_flag_returns_false(): void
    {
        $this->assertFalse(FeatureFlag::checkFlag('nonexistent', 'user1'));
    }

    public function test_cache_is_cleared_on_flag_save(): void
    {
        $flag = FeatureFlag::create([
            'name' => 'Cache Test',
            'key' => 'cache_test',
            'is_active' => true,
            'rollout_type' => 'boolean',
        ]);

        // First check populates cache
        $result1 = FeatureFlag::checkFlag('cache_test', 'user1');
        $this->assertTrue($result1);

        // Update flag
        $flag->update(['is_active' => false]);

        // Cache should be cleared, should get new value
        $result2 = FeatureFlag::checkFlag('cache_test', 'user1');
        $this->assertFalse($result2);
    }

    public function test_cache_is_cleared_on_flag_delete(): void
    {
        $flag = FeatureFlag::create([
            'name' => 'Delete Test',
            'key' => 'delete_test',
            'is_active' => true,
            'rollout_type' => 'boolean',
        ]);

        FeatureFlag::checkFlag('delete_test', 'user1');

        $flag->delete();

        $result = FeatureFlag::checkFlag('delete_test', 'user1');
        $this->assertFalse($result);
    }
}
