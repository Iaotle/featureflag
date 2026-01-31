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
}
