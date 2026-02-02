<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\FeatureFlag;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminFlagControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_users_cannot_access_admin_flags(): void
    {
        $response = $this->getJson('/api/admin/flags');

        $response->assertStatus(401);
    }

    public function test_authenticated_users_can_list_flags(): void
    {
        $user = User::factory()->create();
        FeatureFlag::create([
            'name' => 'Test Flag',
            'key' => 'test_flag',
            'rollout_type' => 'boolean',
        ]);

        $response = $this->actingAs($user)->getJson('/api/admin/flags');

        $response->assertStatus(200)
            ->assertJsonCount(1);
    }

    public function test_authenticated_users_can_create_flag(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/admin/flags', [
            'name' => 'New Flag',
            'key' => 'new_flag',
            'description' => 'Test description',
            'is_active' => true,
            'rollout_type' => 'boolean',
        ]);

        $response->assertStatus(201)
            ->assertJson(['name' => 'New Flag']);

        $this->assertDatabaseHas('feature_flags', ['key' => 'new_flag']);
    }

    public function test_authenticated_users_can_update_flag(): void
    {
        $user = User::factory()->create();
        $flag = FeatureFlag::create([
            'name' => 'Old Name',
            'key' => 'old_flag',
            'rollout_type' => 'boolean',
        ]);

        $response = $this->actingAs($user)->putJson("/api/admin/flags/{$flag->id}", [
            'name' => 'Updated Name',
        ]);

        $response->assertStatus(200)
            ->assertJson(['name' => 'Updated Name']);
    }

    public function test_authenticated_users_can_delete_flag(): void
    {
        $user = User::factory()->create();
        $flag = FeatureFlag::create([
            'name' => 'Test Flag',
            'key' => 'test_flag',
            'rollout_type' => 'boolean',
        ]);

        $response = $this->actingAs($user)->deleteJson("/api/admin/flags/{$flag->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('feature_flags', ['id' => $flag->id]);
    }

    public function test_validation_errors_are_returned(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/admin/flags', [
            'name' => 'Test',
            // Missing required 'key' and 'rollout_type'
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['key', 'rollout_type']);
    }

    /**
     * Test complete flow: authenticated admin creates a flag
     */
    public function test_admin_can_create_flag_when_authenticated(): void
    {
        $user = User::factory()->create([
            'email' => 'admin@example.com',
        ]);

        // Create flag as authenticated user
        $flagResponse = $this->actingAs($user)->postJson('/api/admin/flags', [
            'name' => 'Admin Created Flag',
            'key' => 'admin_created_flag',
            'description' => 'Flag created by admin',
            'is_active' => true,
            'rollout_type' => 'boolean',
        ]);

        $flagResponse->assertStatus(201)
            ->assertJson([
                'name' => 'Admin Created Flag',
                'key' => 'admin_created_flag',
                'is_active' => true,
            ]);

        $this->assertDatabaseHas('feature_flags', [
            'key' => 'admin_created_flag',
            'is_active' => true,
        ]);
    }

    /**
     * Test complete flow: authenticated admin validates/activates a flag
     */
    public function test_admin_can_validate_and_activate_flag(): void
    {
        $user = User::factory()->create();

        // Create an inactive flag
        $flag = FeatureFlag::create([
            'name' => 'Pending Flag',
            'key' => 'pending_flag',
            'description' => 'Waiting for admin validation',
            'is_active' => false,
            'rollout_type' => 'boolean',
        ]);

        // Verify flag is initially disabled
        $this->assertFalse(FeatureFlag::checkFlag('pending_flag', 'any-user'));

        // Admin validates (activates) the flag
        $validateResponse = $this->actingAs($user)->putJson("/api/admin/flags/{$flag->id}", [
            'is_active' => true,
        ]);

        $validateResponse->assertStatus(200)
            ->assertJson([
                'is_active' => true,
            ]);

        // Verify flag is now active in database
        $this->assertDatabaseHas('feature_flags', [
            'id' => $flag->id,
            'is_active' => true,
        ]);

        // Verify the flag check now returns true
        $this->assertTrue(FeatureFlag::checkFlag('pending_flag', 'any-user'));
    }

    /**
     * Test admin can view flag details and toggle it
     */
    public function test_admin_can_view_and_toggle_flag(): void
    {
        $user = User::factory()->create();

        $flag = FeatureFlag::create([
            'name' => 'Toggle Test Flag',
            'key' => 'toggle_test',
            'is_active' => true,
            'rollout_type' => 'user_groups',
            'enabled_groups' => ['A', 'B'],
        ]);

        // View flag details
        $viewResponse = $this->actingAs($user)->getJson("/api/admin/flags/{$flag->id}");
        $viewResponse->assertStatus(200)
            ->assertJson([
                'name' => 'Toggle Test Flag',
                'key' => 'toggle_test',
                'is_active' => true,
                'rollout_type' => 'user_groups',
                'enabled_groups' => ['A', 'B'],
            ]);

        // Toggle flag off
        $toggleResponse = $this->actingAs($user)->putJson("/api/admin/flags/{$flag->id}", [
            'is_active' => false,
        ]);
        $toggleResponse->assertStatus(200)
            ->assertJson(['is_active' => false]);

        // Verify flag check returns false
        $this->assertFalse(FeatureFlag::checkFlag('toggle_test', 'user-3')); // user-3 is group A

        // Toggle flag back on
        $toggleBackResponse = $this->actingAs($user)->putJson("/api/admin/flags/{$flag->id}", [
            'is_active' => true,
        ]);
        $toggleBackResponse->assertStatus(200)
            ->assertJson(['is_active' => true]);

        // Verify flag check returns true for user in enabled group
        $this->assertTrue(FeatureFlag::checkFlag('toggle_test', 'user-3'));
    }

    /**
     * Test admin can update flag groups and verify changes
     */
    public function test_admin_can_update_flag_groups_and_verify(): void
    {
        $user = User::factory()->create();

        $flag = FeatureFlag::create([
            'name' => 'Group Test Flag',
            'key' => 'group_test',
            'is_active' => true,
            'rollout_type' => 'user_groups',
            'enabled_groups' => ['A'],
        ]);

        // Initially only group A is enabled
        $this->assertTrue(FeatureFlag::checkFlag('group_test', 'user-3')); // A
        $this->assertFalse(FeatureFlag::checkFlag('group_test', 'user-7')); // B

        // Admin adds group B
        $this->actingAs($user)->putJson("/api/admin/flags/{$flag->id}", [
            'enabled_groups' => ['A', 'B'],
        ])->assertStatus(200);

        // Now both groups should have access
        $this->assertTrue(FeatureFlag::checkFlag('group_test', 'user-3')); // A
        $this->assertTrue(FeatureFlag::checkFlag('group_test', 'user-7')); // B

        // Admin removes group A
        $this->actingAs($user)->putJson("/api/admin/flags/{$flag->id}", [
            'enabled_groups' => ['B'],
        ])->assertStatus(200);

        // Now only group B should have access
        $this->assertFalse(FeatureFlag::checkFlag('group_test', 'user-3')); // A
        $this->assertTrue(FeatureFlag::checkFlag('group_test', 'user-7')); // B
    }

    /**
     * Test admin can access flag by key (not just ID)
     */
    public function test_admin_can_access_flag_by_key(): void
    {
        $user = User::factory()->create();

        $flag = FeatureFlag::create([
            'name' => 'Key Access Test',
            'key' => 'key_access_test',
            'is_active' => true,
            'rollout_type' => 'boolean',
        ]);

        // Access by key
        $response = $this->actingAs($user)->getJson('/api/admin/flags/key_access_test');
        $response->assertStatus(200)
            ->assertJson(['key' => 'key_access_test']);

        // Update by key
        $updateResponse = $this->actingAs($user)->putJson('/api/admin/flags/key_access_test', [
            'description' => 'Updated via key',
        ]);
        $updateResponse->assertStatus(200)
            ->assertJson(['description' => 'Updated via key']);

        // Delete by key
        $deleteResponse = $this->actingAs($user)->deleteJson('/api/admin/flags/key_access_test');
        $deleteResponse->assertStatus(204);

        $this->assertDatabaseMissing('feature_flags', ['key' => 'key_access_test']);
    }

    /**
     * Test validation for enabled_groups
     */
    public function test_enabled_groups_validation(): void
    {
        $user = User::factory()->create();

        // Invalid group letter
        $response = $this->actingAs($user)->postJson('/api/admin/flags', [
            'name' => 'Invalid Groups',
            'key' => 'invalid_groups',
            'rollout_type' => 'user_groups',
            'enabled_groups' => ['A', 'Z'], // Z is invalid
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['enabled_groups.1']);
    }

    /**
     * Test validation for scheduled dates
     */
    public function test_scheduled_dates_validation(): void
    {
        $user = User::factory()->create();

        // End date before start date
        $response = $this->actingAs($user)->postJson('/api/admin/flags', [
            'name' => 'Invalid Schedule',
            'key' => 'invalid_schedule',
            'rollout_type' => 'boolean',
            'scheduled_start_at' => now()->addHours(2)->toISOString(),
            'scheduled_end_at' => now()->addHour()->toISOString(),
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['scheduled_end_at']);
    }

    /**
     * Test admin can create scheduled flag
     */
    public function test_admin_can_create_scheduled_flag(): void
    {
        $user = User::factory()->create();

        $startAt = now()->addHour();
        $endAt = now()->addHours(2);

        $response = $this->actingAs($user)->postJson('/api/admin/flags', [
            'name' => 'Scheduled Flag',
            'key' => 'scheduled_flag',
            'description' => 'A scheduled feature flag',
            'is_active' => false,
            'rollout_type' => 'boolean',
            'scheduled_start_at' => $startAt->toISOString(),
            'scheduled_end_at' => $endAt->toISOString(),
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'name' => 'Scheduled Flag',
                'key' => 'scheduled_flag',
                'is_active' => false,
            ]);

        $this->assertDatabaseHas('feature_flags', [
            'key' => 'scheduled_flag',
        ]);
    }
}
