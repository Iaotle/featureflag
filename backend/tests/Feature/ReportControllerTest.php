<?php

namespace Tests\Feature;

use App\Models\DamageReport;
use App\Models\FeatureFlag;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * User IDs that deterministically map to each group (A-H)
     * Based on CRC32 hash modulo 8
     */
    protected const USER_GROUPS = [
        'A' => 'user-3',
        'B' => 'user-7',
        'C' => 'user-0',
        'D' => 'user-4',
        'E' => 'user-1',
        'F' => 'user-5',
        'G' => 'user-2',
        'H' => 'user-6',
    ];

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

    public function test_can_create_basic_report(): void
    {
        $data = [
            'title' => 'New Report',
            'description' => 'Damage description',
            'damage_location' => 'Front bumper',
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
        ]);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'title' => 'Updated Title',
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
            ->assertJsonValidationErrors(['description', 'user_identifier']);
    }

    /**
     * Test that user in group A can submit report with photos when flag is enabled for group A
     */
    public function test_group_a_user_can_submit_report_with_photos_when_flag_enabled(): void
    {
        FeatureFlag::create([
            'name' => 'Photo Upload',
            'key' => 'damage_photo_upload',
            'is_active' => true,
            'rollout_type' => 'user_groups',
            'enabled_groups' => ['A'],
        ]);

        $userId = self::USER_GROUPS['A'];

        $response = $this->postJson('/api/reports', [
            'title' => 'Report with Photos',
            'description' => 'Test description',
            'damage_location' => 'Front',
            'photos' => ['photo1.jpg', 'photo2.jpg'],
            'user_identifier' => $userId,
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'photos' => ['photo1.jpg', 'photo2.jpg'],
            ]);
    }

    /**
     * Test that user in group B cannot submit report with photos when flag is only enabled for group A
     */
    public function test_group_b_user_cannot_submit_report_with_photos_when_flag_disabled(): void
    {
        FeatureFlag::create([
            'name' => 'Photo Upload',
            'key' => 'damage_photo_upload',
            'is_active' => true,
            'rollout_type' => 'user_groups',
            'enabled_groups' => ['A'],
        ]);

        $userId = self::USER_GROUPS['B'];

        $response = $this->postJson('/api/reports', [
            'title' => 'Report with Photos',
            'description' => 'Test description',
            'damage_location' => 'Front',
            'photos' => ['photo1.jpg'],
            'user_identifier' => $userId,
        ]);

        $response->assertStatus(403)
            ->assertJsonFragment([
                'message' => 'Photo upload feature is not available for your account.',
            ]);
    }

    /**
     * Test that user in group A can submit report with priority when flag is enabled
     */
    public function test_group_a_user_can_submit_report_with_priority_when_flag_enabled(): void
    {
        FeatureFlag::create([
            'name' => 'Priority Indicators',
            'key' => 'priority_indicators',
            'is_active' => true,
            'rollout_type' => 'user_groups',
            'enabled_groups' => ['A', 'B'],
        ]);

        $userId = self::USER_GROUPS['A'];

        $response = $this->postJson('/api/reports', [
            'title' => 'High Priority Report',
            'description' => 'Urgent damage',
            'damage_location' => 'Front',
            'priority' => 'high',
            'user_identifier' => $userId,
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'priority' => 'high',
            ]);
    }

    /**
     * Test that user in group C cannot submit report with priority when flag is only enabled for A and B
     */
    public function test_group_c_user_cannot_submit_report_with_priority_when_flag_disabled(): void
    {
        FeatureFlag::create([
            'name' => 'Priority Indicators',
            'key' => 'priority_indicators',
            'is_active' => true,
            'rollout_type' => 'user_groups',
            'enabled_groups' => ['A', 'B'],
        ]);

        $userId = self::USER_GROUPS['C'];

        $response = $this->postJson('/api/reports', [
            'title' => 'Priority Report',
            'description' => 'Test description',
            'damage_location' => 'Front',
            'priority' => 'high',
            'user_identifier' => $userId,
        ]);

        $response->assertStatus(403)
            ->assertJsonFragment([
                'message' => 'Priority feature is not available for your account.',
            ]);
    }

    /**
     * Test each user group can submit a basic report (no flagged features)
     * @dataProvider userGroupProvider
     */
    public function test_each_user_group_can_submit_basic_report(string $group, string $userId): void
    {
        $response = $this->postJson('/api/reports', [
            'title' => "Report from group {$group}",
            'description' => 'Basic report without flagged features',
            'damage_location' => 'Front',
            'user_identifier' => $userId,
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'title' => "Report from group {$group}",
            ]);

        $this->assertDatabaseHas('damage_reports', [
            'title' => "Report from group {$group}",
            'user_identifier' => $userId,
        ]);
    }

    /**
     * Test each user group can submit report with photos when flag is enabled for all groups
     * @dataProvider userGroupProvider
     */
    public function test_each_user_group_can_submit_report_with_photos_when_boolean_flag(string $group, string $userId): void
    {
        FeatureFlag::create([
            'name' => 'Photo Upload',
            'key' => 'damage_photo_upload',
            'is_active' => true,
            'rollout_type' => 'boolean',
        ]);

        $response = $this->postJson('/api/reports', [
            'title' => "Photo report from group {$group}",
            'description' => 'Report with photos',
            'damage_location' => 'Front',
            'photos' => ['photo.jpg'],
            'user_identifier' => $userId,
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'photos' => ['photo.jpg'],
            ]);
    }

    /**
     * Test each user group can submit report with priority when flag is enabled for all groups
     * @dataProvider userGroupProvider
     */
    public function test_each_user_group_can_submit_report_with_priority_when_boolean_flag(string $group, string $userId): void
    {
        FeatureFlag::create([
            'name' => 'Priority Indicators',
            'key' => 'priority_indicators',
            'is_active' => true,
            'rollout_type' => 'boolean',
        ]);

        $response = $this->postJson('/api/reports', [
            'title' => "Priority report from group {$group}",
            'description' => 'Report with priority',
            'damage_location' => 'Front',
            'priority' => 'high',
            'user_identifier' => $userId,
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'priority' => 'high',
            ]);
    }

    /**
     * Test each user group can submit complete report when all flags are enabled for their group
     * @dataProvider userGroupProvider
     */
    public function test_each_user_group_can_submit_complete_report_when_flags_enabled_for_group(string $group, string $userId): void
    {
        FeatureFlag::create([
            'name' => 'Photo Upload',
            'key' => 'damage_photo_upload',
            'is_active' => true,
            'rollout_type' => 'user_groups',
            'enabled_groups' => ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
        ]);

        FeatureFlag::create([
            'name' => 'Priority Indicators',
            'key' => 'priority_indicators',
            'is_active' => true,
            'rollout_type' => 'user_groups',
            'enabled_groups' => ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
        ]);

        $response = $this->postJson('/api/reports', [
            'title' => "Complete report from group {$group}",
            'description' => 'Full featured report',
            'damage_location' => 'Front bumper',
            'priority' => 'medium',
            'photos' => ['damage1.jpg', 'damage2.jpg'],
            'user_identifier' => $userId,
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'title' => "Complete report from group {$group}",
                'priority' => 'medium',
            ])
            ->assertJsonFragment([
                'photos' => ['damage1.jpg', 'damage2.jpg'],
            ]);
    }

    /**
     * Data provider for user groups
     */
    public static function userGroupProvider(): array
    {
        return [
            'Group A' => ['A', 'user-3'],
            'Group B' => ['B', 'user-7'],
            'Group C' => ['C', 'user-0'],
            'Group D' => ['D', 'user-4'],
            'Group E' => ['E', 'user-1'],
            'Group F' => ['F', 'user-5'],
            'Group G' => ['G', 'user-2'],
            'Group H' => ['H', 'user-6'],
        ];
    }

    /**
     * Test server-side validation: photos flag must exist and be enabled
     */
    public function test_server_validates_photo_flag_exists(): void
    {
        // No flag created - should reject photos
        $response = $this->postJson('/api/reports', [
            'title' => 'Report with Photos',
            'description' => 'Test description',
            'damage_location' => 'Front',
            'photos' => ['photo.jpg'],
            'user_identifier' => 'any-user',
        ]);

        $response->assertStatus(403)
            ->assertJsonFragment([
                'message' => 'Photo upload feature is not available for your account.',
            ]);
    }

    /**
     * Test server-side validation: priority flag must exist and be enabled
     */
    public function test_server_validates_priority_flag_exists(): void
    {
        // No flag created - should reject priority
        $response = $this->postJson('/api/reports', [
            'title' => 'Priority Report',
            'description' => 'Test description',
            'damage_location' => 'Front',
            'priority' => 'high',
            'user_identifier' => 'any-user',
        ]);

        $response->assertStatus(403)
            ->assertJsonFragment([
                'message' => 'Priority feature is not available for your account.',
            ]);
    }

    /**
     * Test server-side validation: inactive photo flag rejects photos
     */
    public function test_server_validates_inactive_photo_flag(): void
    {
        FeatureFlag::create([
            'name' => 'Photo Upload',
            'key' => 'damage_photo_upload',
            'is_active' => false,
            'rollout_type' => 'boolean',
        ]);

        $response = $this->postJson('/api/reports', [
            'title' => 'Report with Photos',
            'description' => 'Test description',
            'damage_location' => 'Front',
            'photos' => ['photo.jpg'],
            'user_identifier' => 'any-user',
        ]);

        $response->assertStatus(403)
            ->assertJsonFragment([
                'message' => 'Photo upload feature is not available for your account.',
            ]);
    }

    /**
     * Test server-side validation: inactive priority flag rejects priority
     */
    public function test_server_validates_inactive_priority_flag(): void
    {
        FeatureFlag::create([
            'name' => 'Priority Indicators',
            'key' => 'priority_indicators',
            'is_active' => false,
            'rollout_type' => 'boolean',
        ]);

        $response = $this->postJson('/api/reports', [
            'title' => 'Priority Report',
            'description' => 'Test description',
            'damage_location' => 'Front',
            'priority' => 'high',
            'user_identifier' => 'any-user',
        ]);

        $response->assertStatus(403)
            ->assertJsonFragment([
                'message' => 'Priority feature is not available for your account.',
            ]);
    }

    /**
     * Test server-side validation: user group must be in enabled_groups
     */
    public function test_server_validates_user_group_membership(): void
    {
        FeatureFlag::create([
            'name' => 'Photo Upload',
            'key' => 'damage_photo_upload',
            'is_active' => true,
            'rollout_type' => 'user_groups',
            'enabled_groups' => ['A', 'B'],
        ]);

        // User in group C (user-0) should be rejected
        $response = $this->postJson('/api/reports', [
            'title' => 'Report with Photos',
            'description' => 'Test description',
            'damage_location' => 'Front',
            'photos' => ['photo.jpg'],
            'user_identifier' => self::USER_GROUPS['C'],
        ]);

        $response->assertStatus(403);

        // User in group A (user-3) should be allowed
        $response = $this->postJson('/api/reports', [
            'title' => 'Report with Photos',
            'description' => 'Test description',
            'damage_location' => 'Front',
            'photos' => ['photo.jpg'],
            'user_identifier' => self::USER_GROUPS['A'],
        ]);

        $response->assertStatus(201);
    }

    /**
     * Test server-side validation: scheduled flag respects time window
     */
    public function test_server_validates_scheduled_flag_time_window(): void
    {
        // Flag not yet active (starts in the future)
        FeatureFlag::create([
            'name' => 'Photo Upload',
            'key' => 'damage_photo_upload',
            'is_active' => true,
            'rollout_type' => 'boolean',
            'scheduled_start_at' => now()->addHour(),
        ]);

        $response = $this->postJson('/api/reports', [
            'title' => 'Report with Photos',
            'description' => 'Test description',
            'damage_location' => 'Front',
            'photos' => ['photo.jpg'],
            'user_identifier' => 'any-user',
        ]);

        $response->assertStatus(403);
    }

    /**
     * Test server-side validation: expired scheduled flag is rejected
     */
    public function test_server_validates_expired_scheduled_flag(): void
    {
        // Flag has expired
        FeatureFlag::create([
            'name' => 'Photo Upload',
            'key' => 'damage_photo_upload',
            'is_active' => true,
            'rollout_type' => 'boolean',
            'scheduled_start_at' => now()->subHours(2),
            'scheduled_end_at' => now()->subHour(),
        ]);

        $response = $this->postJson('/api/reports', [
            'title' => 'Report with Photos',
            'description' => 'Test description',
            'damage_location' => 'Front',
            'photos' => ['photo.jpg'],
            'user_identifier' => 'any-user',
        ]);

        $response->assertStatus(403);
    }

    /**
     * Test bulk delete requires bulk_actions flag
     */
    public function test_bulk_delete_requires_flag(): void
    {
        $report1 = DamageReport::create([
            'title' => 'Report 1',
            'description' => 'Description',
            'damage_location' => 'Front',
            'user_identifier' => 'user1',
        ]);

        $report2 = DamageReport::create([
            'title' => 'Report 2',
            'description' => 'Description',
            'damage_location' => 'Rear',
            'user_identifier' => 'user1',
        ]);

        // No flag - should fail
        $response = $this->postJson('/api/reports/bulk-delete', [
            'ids' => [$report1->id, $report2->id],
            'user_identifier' => 'user1',
        ]);

        $response->assertStatus(403)
            ->assertJsonFragment([
                'message' => 'Bulk actions feature is not available for your account.',
            ]);

        // Reports should still exist
        $this->assertDatabaseHas('damage_reports', ['id' => $report1->id]);
        $this->assertDatabaseHas('damage_reports', ['id' => $report2->id]);
    }

    /**
     * Test bulk delete works when flag is enabled
     */
    public function test_bulk_delete_works_when_flag_enabled(): void
    {
        FeatureFlag::create([
            'name' => 'Bulk Actions',
            'key' => 'bulk_actions',
            'is_active' => true,
            'rollout_type' => 'boolean',
        ]);

        $report1 = DamageReport::create([
            'title' => 'Report 1',
            'description' => 'Description',
            'damage_location' => 'Front',
            'user_identifier' => 'user1',
        ]);

        $report2 = DamageReport::create([
            'title' => 'Report 2',
            'description' => 'Description',
            'damage_location' => 'Rear',
            'user_identifier' => 'user1',
        ]);

        $response = $this->postJson('/api/reports/bulk-delete', [
            'ids' => [$report1->id, $report2->id],
            'user_identifier' => 'user1',
        ]);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'deleted_count' => 2,
            ]);

        $this->assertDatabaseMissing('damage_reports', ['id' => $report1->id]);
        $this->assertDatabaseMissing('damage_reports', ['id' => $report2->id]);
    }

    /**
     * Test priority validation (must be low, medium, or high)
     */
    public function test_priority_must_be_valid_value(): void
    {
        FeatureFlag::create([
            'name' => 'Priority Indicators',
            'key' => 'priority_indicators',
            'is_active' => true,
            'rollout_type' => 'boolean',
        ]);

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

    /**
     * Test update validates photo flag
     */
    public function test_update_validates_photo_flag(): void
    {
        $report = DamageReport::create([
            'title' => 'Original Report',
            'description' => 'Description',
            'damage_location' => 'Front',
            'user_identifier' => 'user1',
        ]);

        // No flag - should fail when adding photos
        $response = $this->putJson("/api/reports/{$report->id}", [
            'photos' => ['new-photo.jpg'],
        ]);

        $response->assertStatus(403);
    }

    /**
     * Test update validates priority flag
     */
    public function test_update_validates_priority_flag(): void
    {
        $report = DamageReport::create([
            'title' => 'Original Report',
            'description' => 'Description',
            'damage_location' => 'Front',
            'user_identifier' => 'user1',
        ]);

        // No flag - should fail when adding priority
        $response = $this->putJson("/api/reports/{$report->id}", [
            'priority' => 'high',
        ]);

        $response->assertStatus(403);
    }
}
