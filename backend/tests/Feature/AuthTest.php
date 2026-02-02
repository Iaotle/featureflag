<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that users can authenticate.
     * Uses non-JSON request to trigger web middleware with session support.
     */
    public function test_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        // Use regular post with Accept header to get JSON response but with session support
        $response = $this->post('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password',
        ], ['Accept' => 'application/json']);

        $response->assertStatus(200)
            ->assertJsonStructure(['user' => ['id', 'email', 'name']]);
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        $response = $this->post('/api/login', [
            'email' => 'test@example.com',
            'password' => 'wrong-password',
        ], ['Accept' => 'application/json']);

        $response->assertStatus(401)
            ->assertJson(['message' => 'The provided credentials are incorrect.']);
    }

    public function test_logout_destroys_session(): void
    {
        $user = User::factory()->create();

        // Use regular post with Accept header for session support
        $response = $this->actingAs($user)
            ->post('/api/logout', [], ['Accept' => 'application/json']);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Logged out successfully']);
    }

    public function test_user_endpoint_requires_auth(): void
    {
        $response = $this->getJson('/api/user');

        $response->assertStatus(401);
    }

    public function test_user_endpoint_returns_authenticated_user(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
        ]);

        $response = $this->actingAs($user)->getJson('/api/user');

        $response->assertStatus(200)
            ->assertJson([
                'user' => [
                    'id' => $user->id,
                    'email' => 'test@example.com',
                ]
            ]);
    }

    public function test_login_validates_required_fields(): void
    {
        $response = $this->postJson('/api/login', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_login_validates_email_format(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'invalid-email',
            'password' => 'password',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }
}
