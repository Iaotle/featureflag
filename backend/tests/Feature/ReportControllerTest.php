<?php

namespace Tests\Feature;

use App\Models\DamageReport;
use App\Models\FeatureFlag;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_reports(): void
    {
        DamageReport::create([
            'title' => 'Report 1',
            'description' => 'Description 1',
            'damage_location' => 'Front',
            'priority' => 'high',
            'status' => 'pending',
            'user_identifier' => 'user1',
        ]);

        DamageReport::create([
            'title' => 'Report 2',
            'description' => 'Description 2',
            'damage_location' => 'Rear',
            'priority' => 'low',
            'status' => 'completed',
            'user_identifier' => 'user2',
        ]);

        $response = $this->getJson('/api/reports');

        $response->assertStatus(200)
            ->assertJsonCount(2);
    }

    public function test_can_filter_reports_by_user(): void
    {
        DamageReport::create([
            'title' => 'User1 Report',
            'description' => 'Description',
            'damage_location' => 'Front',
            'priority' => 'medium',
            'user_identifier' => 'user1',
        ]);

        DamageReport::create([
            'title' => 'User2 Report',
            'description' => 'Description',
            'damage_location' => 'Rear',
            'priority' => 'medium',
            'user_identifier' => 'user2',
        ]);

        $response = $this->getJson('/api/reports?user_identifier=user1');

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonFragment(['title' => 'User1 Report']);
    }

    public function test_can_create_report_without_photos(): void
    {
        $data = [
            'title' => 'New Report',
            'description' => 'Damage description',
            'damage_location' => 'Front bumper',
            'priority' => 'high',
            'status' => 'pending',
            'user_identifier' => 'test-user',
        ];

        $response = $this->postJson('/api/reports', $data);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'title' => 'New Report',
            ]);

        $this->assertDatabaseHas('damage_reports', [
            'title' => 'New Report',
        ]);
    }

    public function test_cannot_create_report_with_photos_if_flag_disabled(): void
    {
        FeatureFlag::create([
            'name' => 'Photo Upload',
            'key' => 'damage_photo_upload',
            'is_active' => true,
            'rollout_type' => 'user_groups',
            'enabled_groups' => ['A'], // Only group A
        ]);

        // Find a user not in group A
        $userId = 'test-user';
        $group = FeatureFlag::getUserGroup($userId);

        // If by chance this user is in group A, try another
        $attempts = 0;
        while ($group === 'A' && $attempts < 10) {
            $userId = 'test-user-' . $attempts;
            $group = FeatureFlag::getUserGroup($userId);
            $attempts++;
        }

        if ($group !== 'A') {
            $response = $this->postJson('/api/reports', [
                'title' => 'Report with Photos',
                'description' => 'Description',
                'damage_location' => 'Front',
                'priority' => 'medium',
                'photos' => ['photo1.jpg'],
                'user_identifier' => $userId,
            ]);

            $response->assertStatus(403)
                ->assertJsonFragment([
                    'message' => 'Photo upload feature is not available for your account.',
                ]);
        } else {
            $this->markTestSkipped('Could not find user outside group A');
        }
    }

    public function test_can_create_report_with_photos_if_flag_enabled(): void
    {
        FeatureFlag::create([
            'name' => 'Photo Upload',
            'key' => 'damage_photo_upload',
            'is_active' => true,
            'rollout_type' => 'boolean', // Enabled for all
        ]);

        $response = $this->postJson('/api/reports', [
            'title' => 'Report with Photos',
            'description' => 'Description',
            'damage_location' => 'Front',
            'priority' => 'medium',
            'photos' => ['photo1.jpg', 'photo2.jpg'],
            'user_identifier' => 'test-user',
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'photos' => ['photo1.jpg', 'photo2.jpg'],
            ]);
    }

    public function test_can_get_single_report(): void
    {
        $report = DamageReport::create([
            'title' => 'Test Report',
            'description' => 'Description',
            'damage_location' => 'Side',
            'priority' => 'low',
            'user_identifier' => 'user1',
        ]);

        $response = $this->getJson("/api/reports/{$report->id}");

        $response->assertStatus(200)
            ->assertJsonFragment([
                'title' => 'Test Report',
            ]);
    }

    public function test_can_update_report(): void
    {
        $report = DamageReport::create([
            'title' => 'Original Title',
            'description' => 'Description',
            'damage_location' => 'Front',
            'priority' => 'low',
            'user_identifier' => 'user1',
        ]);

        $response = $this->putJson("/api/reports/{$report->id}", [
            'title' => 'Updated Title',
            'priority' => 'high',
        ]);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'title' => 'Updated Title',
                'priority' => 'high',
            ]);
    }

    public function test_can_delete_report(): void
    {
        $report = DamageReport::create([
            'title' => 'To Delete',
            'description' => 'Description',
            'damage_location' => 'Front',
            'priority' => 'medium',
            'user_identifier' => 'user1',
        ]);

        $response = $this->deleteJson("/api/reports/{$report->id}");

        $response->assertStatus(204);

        $this->assertDatabaseMissing('damage_reports', [
            'id' => $report->id,
        ]);
    }

    public function test_create_report_validates_required_fields(): void
    {
        $response = $this->postJson('/api/reports', [
            'title' => 'Missing Fields',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['description', 'damage_location', 'priority', 'user_identifier']);
    }

    public function test_priority_must_be_valid_value(): void
    {
        $response = $this->postJson('/api/reports', [
            'title' => 'Test',
            'description' => 'Description',
            'damage_location' => 'Front',
            'priority' => 'invalid',
            'user_identifier' => 'user1',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['priority']);
    }
}
