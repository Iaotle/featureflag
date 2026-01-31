<?php

namespace Tests\Feature;

use App\Models\FeatureFlag;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FlagControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_all_flags(): void
    {
        FeatureFlag::create([
            'name' => 'Flag 1',
            'key' => 'flag_1',
            'is_active' => true,
            'rollout_type' => 'boolean',
        ]);

        FeatureFlag::create([
            'name' => 'Flag 2',
            'key' => 'flag_2',
            'is_active' => false,
            'rollout_type' => 'user_groups',
            'enabled_groups' => ['A', 'B'],
        ]);

        $response = $this->getJson('/api/flags');

        $response->assertStatus(200)
            ->assertJsonCount(2)
            ->assertJsonStructure([
                '*' => [
                    'id',
                    'name',
                    'key',
                    'description',
                    'is_active',
                    'rollout_type',
                    'enabled_groups',
                    'scheduled_start_at',
                    'scheduled_end_at',
                    'created_at',
                    'updated_at',
                ],
            ]);
    }

    public function test_can_create_boolean_flag(): void
    {
        $data = [
            'name' => 'New Feature',
            'key' => 'new_feature',
            'description' => 'A new feature',
            'is_active' => true,
            'rollout_type' => 'boolean',
        ];

        $response = $this->postJson('/api/flags', $data);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'name' => 'New Feature',
                'key' => 'new_feature',
            ]);

        $this->assertDatabaseHas('feature_flags', [
            'key' => 'new_feature',
        ]);
    }

    public function test_can_create_user_groups_flag(): void
    {
        $data = [
            'name' => 'Group Feature',
            'key' => 'group_feature',
            'is_active' => true,
            'rollout_type' => 'user_groups',
            'enabled_groups' => ['A', 'B', 'C'],
        ];

        $response = $this->postJson('/api/flags', $data);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'key' => 'group_feature',
                'enabled_groups' => ['A', 'B', 'C'],
            ]);
    }

    public function test_flag_key_must_be_unique(): void
    {
        FeatureFlag::create([
            'name' => 'Existing',
            'key' => 'existing_key',
            'rollout_type' => 'boolean',
        ]);

        $response = $this->postJson('/api/flags', [
            'name' => 'Duplicate',
            'key' => 'existing_key',
            'rollout_type' => 'boolean',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['key']);
    }

    public function test_can_update_flag(): void
    {
        $flag = FeatureFlag::create([
            'name' => 'Old Name',
            'key' => 'test_flag',
            'is_active' => true,
            'rollout_type' => 'boolean',
        ]);

        $response = $this->putJson("/api/flags/{$flag->id}", [
            'name' => 'Updated Name',
            'is_active' => false,
        ]);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'name' => 'Updated Name',
                'is_active' => false,
            ]);

        $this->assertDatabaseHas('feature_flags', [
            'id' => $flag->id,
            'name' => 'Updated Name',
            'is_active' => false,
        ]);
    }

    public function test_can_delete_flag(): void
    {
        $flag = FeatureFlag::create([
            'name' => 'To Delete',
            'key' => 'to_delete',
            'rollout_type' => 'boolean',
        ]);

        $response = $this->deleteJson("/api/flags/{$flag->id}");

        $response->assertStatus(204);

        $this->assertDatabaseMissing('feature_flags', [
            'id' => $flag->id,
        ]);
    }

    public function test_can_check_multiple_flags(): void
    {
        FeatureFlag::create([
            'name' => 'Flag 1',
            'key' => 'flag_1',
            'is_active' => true,
            'rollout_type' => 'boolean',
        ]);

        FeatureFlag::create([
            'name' => 'Flag 2',
            'key' => 'flag_2',
            'is_active' => false,
            'rollout_type' => 'boolean',
        ]);

        $response = $this->postJson('/api/flags/check', [
            'flags' => ['flag_1', 'flag_2'],
            'user_id' => 'test-user',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'flag_1' => true,
                'flag_2' => false,
            ]);
    }

    public function test_check_endpoint_validates_required_fields(): void
    {
        $response = $this->postJson('/api/flags/check', [
            'flags' => ['test'],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['user_id']);
    }

    public function test_scheduled_end_must_be_after_start(): void
    {
        $response = $this->postJson('/api/flags', [
            'name' => 'Invalid Schedule',
            'key' => 'invalid_schedule',
            'rollout_type' => 'boolean',
            'scheduled_start_at' => now()->addHours(2)->toISOString(),
            'scheduled_end_at' => now()->addHour()->toISOString(),
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['scheduled_end_at']);
    }

    public function test_enabled_groups_must_be_valid(): void
    {
        $response = $this->postJson('/api/flags', [
            'name' => 'Invalid Groups',
            'key' => 'invalid_groups',
            'rollout_type' => 'user_groups',
            'enabled_groups' => ['A', 'Z'], // Z is not valid
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['enabled_groups.1']);
    }

    public function test_can_get_single_flag(): void
    {
        $flag = FeatureFlag::create([
            'name' => 'Test Flag',
            'key' => 'test_flag',
            'rollout_type' => 'boolean',
        ]);

        $response = $this->getJson("/api/flags/{$flag->id}");

        $response->assertStatus(200)
            ->assertJsonFragment([
                'id' => $flag->id,
                'key' => 'test_flag',
            ]);
    }
}
