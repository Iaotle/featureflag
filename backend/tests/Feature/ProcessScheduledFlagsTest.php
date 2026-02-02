<?php

namespace Tests\Feature;

use App\Models\FeatureFlag;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class ProcessScheduledFlagsTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test scheduled flag activation with 30 second delay.
     * Creates a flag scheduled to activate in 30 seconds,
     * verifies it's inactive, then simulates time passing
     * and verifies the scheduled job activates it.
     */
    public function test_scheduled_flag_activates_after_30_seconds(): void
    {
        // Create a flag scheduled to activate in 30 seconds
        $flag = FeatureFlag::create([
            'name' => 'Scheduled Activation Test',
            'key' => 'scheduled_activation_test',
            'is_active' => false,
            'rollout_type' => 'boolean',
            'scheduled_start_at' => now()->addSeconds(30),
        ]);

        // Verify flag is initially inactive
        $this->assertFalse($flag->is_active);
        $this->assertFalse(FeatureFlag::checkFlag('scheduled_activation_test', 'any-user'));

        // Run the scheduled command - should not activate yet
        Artisan::call('flags:process');

        // Reload flag and verify still inactive
        $flag->refresh();
        $this->assertFalse($flag->is_active);

        // Travel forward 31 seconds
        $this->travel(31)->seconds();

        // Run the scheduled command again
        Artisan::call('flags:process');

        // Reload flag and verify it's now active
        $flag->refresh();
        $this->assertTrue($flag->is_active);

        // Verify flag check now returns true
        $this->assertTrue(FeatureFlag::checkFlag('scheduled_activation_test', 'any-user'));
    }

    /**
     * Test scheduled flag deactivation with 30 second delay.
     * Creates an active flag scheduled to deactivate in 30 seconds,
     * verifies it's active, then simulates time passing
     * and verifies the scheduled job deactivates it.
     */
    public function test_scheduled_flag_deactivates_after_30_seconds(): void
    {
        // Create an active flag scheduled to deactivate in 30 seconds
        $flag = FeatureFlag::create([
            'name' => 'Scheduled Deactivation Test',
            'key' => 'scheduled_deactivation_test',
            'is_active' => true,
            'rollout_type' => 'boolean',
            'scheduled_start_at' => now()->subHour(), // Started an hour ago
            'scheduled_end_at' => now()->addSeconds(30),
        ]);

        // Verify flag is initially active
        $this->assertTrue($flag->is_active);
        $this->assertTrue(FeatureFlag::checkFlag('scheduled_deactivation_test', 'any-user'));

        // Run the scheduled command - should not deactivate yet
        Artisan::call('flags:process');

        // Reload flag and verify still active
        $flag->refresh();
        $this->assertTrue($flag->is_active);

        // Travel forward 31 seconds
        $this->travel(31)->seconds();

        // Run the scheduled command again
        Artisan::call('flags:process');

        // Reload flag and verify it's now inactive
        $flag->refresh();
        $this->assertFalse($flag->is_active);

        // Verify flag check now returns false
        $this->assertFalse(FeatureFlag::checkFlag('scheduled_deactivation_test', 'any-user'));
    }

    /**
     * Test flag scheduled to activate but end time has passed
     * should not be activated.
     */
    public function test_scheduled_flag_not_activated_if_end_time_passed(): void
    {
        // Create a flag where the activation window has already passed
        $flag = FeatureFlag::create([
            'name' => 'Missed Window',
            'key' => 'missed_window',
            'is_active' => false,
            'rollout_type' => 'boolean',
            'scheduled_start_at' => now()->subHours(2),
            'scheduled_end_at' => now()->subHour(),
        ]);

        // Run the scheduled command
        Artisan::call('flags:process');

        // Flag should remain inactive since end time has passed
        $flag->refresh();
        $this->assertFalse($flag->is_active);
    }

    /**
     * Test that multiple flags can be processed in a single run.
     */
    public function test_multiple_flags_processed_together(): void
    {
        // Flag to activate
        $activateFlag = FeatureFlag::create([
            'name' => 'To Activate',
            'key' => 'to_activate',
            'is_active' => false,
            'rollout_type' => 'boolean',
            'scheduled_start_at' => now()->addSeconds(30),
        ]);

        // Flag to deactivate
        $deactivateFlag = FeatureFlag::create([
            'name' => 'To Deactivate',
            'key' => 'to_deactivate',
            'is_active' => true,
            'rollout_type' => 'boolean',
            'scheduled_start_at' => now()->subHour(),
            'scheduled_end_at' => now()->addSeconds(30),
        ]);

        // Flag that should not change (no schedule)
        $unchangedFlag = FeatureFlag::create([
            'name' => 'Unchanged',
            'key' => 'unchanged',
            'is_active' => true,
            'rollout_type' => 'boolean',
        ]);

        // Travel past the scheduled times
        $this->travel(31)->seconds();

        // Run the scheduled command
        Artisan::call('flags:process');

        // Verify correct states
        $activateFlag->refresh();
        $deactivateFlag->refresh();
        $unchangedFlag->refresh();

        $this->assertTrue($activateFlag->is_active, 'Flag should be activated');
        $this->assertFalse($deactivateFlag->is_active, 'Flag should be deactivated');
        $this->assertTrue($unchangedFlag->is_active, 'Flag should remain unchanged');
    }

    /**
     * Test scheduled activation with user groups rollout.
     */
    public function test_scheduled_user_groups_flag_activates(): void
    {
        $flag = FeatureFlag::create([
            'name' => 'Scheduled Groups',
            'key' => 'scheduled_groups',
            'is_active' => false,
            'rollout_type' => 'user_groups',
            'enabled_groups' => ['A', 'B'],
            'scheduled_start_at' => now()->addSeconds(30),
        ]);

        // User in group A should not have access yet
        $this->assertFalse(FeatureFlag::checkFlag('scheduled_groups', 'user-3'));

        // Travel and process
        $this->travel(31)->seconds();
        Artisan::call('flags:process');

        // Now user in group A should have access
        $flag->refresh();
        $this->assertTrue($flag->is_active);
        $this->assertTrue(FeatureFlag::checkFlag('scheduled_groups', 'user-3')); // Group A
        $this->assertFalse(FeatureFlag::checkFlag('scheduled_groups', 'user-0')); // Group C
    }

    /**
     * Test that the command output indicates flags were processed.
     */
    public function test_command_outputs_processed_flag_info(): void
    {
        FeatureFlag::create([
            'name' => 'To Activate',
            'key' => 'output_test',
            'is_active' => false,
            'rollout_type' => 'boolean',
            'scheduled_start_at' => now()->subSecond(), // Already past
        ]);

        $result = Artisan::call('flags:process');

        $this->assertEquals(0, $result);
        $this->assertStringContainsString('Activated flag: output_test', Artisan::output());
    }

    /**
     * Test no action when there are no scheduled flags to process.
     */
    public function test_no_action_when_no_scheduled_flags(): void
    {
        // Create a flag without schedule
        FeatureFlag::create([
            'name' => 'No Schedule',
            'key' => 'no_schedule',
            'is_active' => true,
            'rollout_type' => 'boolean',
        ]);

        $result = Artisan::call('flags:process');

        $this->assertEquals(0, $result);
        $this->assertStringContainsString('No scheduled flags to process', Artisan::output());
    }

    /**
     * Test flag with only end time (no start time) deactivates correctly.
     */
    public function test_flag_with_only_end_time_deactivates(): void
    {
        $flag = FeatureFlag::create([
            'name' => 'End Time Only',
            'key' => 'end_time_only',
            'is_active' => true,
            'rollout_type' => 'boolean',
            'scheduled_end_at' => now()->addSeconds(30),
        ]);

        $this->assertTrue(FeatureFlag::checkFlag('end_time_only', 'any-user'));

        $this->travel(31)->seconds();
        Artisan::call('flags:process');

        $flag->refresh();
        $this->assertFalse($flag->is_active);
        $this->assertFalse(FeatureFlag::checkFlag('end_time_only', 'any-user'));
    }

    /**
     * Test flag activation at exact boundary time.
     */
    public function test_flag_activates_at_exact_boundary(): void
    {
        $exactTime = now()->addSeconds(30);

        $flag = FeatureFlag::create([
            'name' => 'Boundary Test',
            'key' => 'boundary_test',
            'is_active' => false,
            'rollout_type' => 'boolean',
            'scheduled_start_at' => $exactTime,
        ]);

        // Travel to exact time
        $this->travel(30)->seconds();
        Artisan::call('flags:process');

        $flag->refresh();
        $this->assertTrue($flag->is_active, 'Flag should activate at exact boundary time');
    }

    /**
     * Test that already active flag with past start time is not reprocessed.
     */
    public function test_already_active_flag_not_reprocessed(): void
    {
        $flag = FeatureFlag::create([
            'name' => 'Already Active',
            'key' => 'already_active',
            'is_active' => true,
            'rollout_type' => 'boolean',
            'scheduled_start_at' => now()->subHour(),
        ]);

        // Should not be in the activate query
        $result = Artisan::call('flags:process');

        $this->assertStringContainsString('No scheduled flags to process', Artisan::output());
    }

    /**
     * Test complete lifecycle: inactive -> scheduled activation -> active -> scheduled deactivation -> inactive
     */
    public function test_complete_flag_lifecycle(): void
    {
        // Create flag that will activate in 30s and deactivate 30s later
        $flag = FeatureFlag::create([
            'name' => 'Lifecycle Test',
            'key' => 'lifecycle_test',
            'is_active' => false,
            'rollout_type' => 'boolean',
            'scheduled_start_at' => now()->addSeconds(30),
            'scheduled_end_at' => now()->addSeconds(60),
        ]);

        // Phase 1: Before activation
        $this->assertFalse(FeatureFlag::checkFlag('lifecycle_test', 'user1'));

        // Phase 2: After activation window opens
        $this->travel(31)->seconds();
        Artisan::call('flags:process');
        $flag->refresh();
        $this->assertTrue($flag->is_active);
        $this->assertTrue(FeatureFlag::checkFlag('lifecycle_test', 'user1'));

        // Phase 3: After deactivation window
        $this->travel(30)->seconds(); // Total 61 seconds from start
        Artisan::call('flags:process');
        $flag->refresh();
        $this->assertFalse($flag->is_active);
        $this->assertFalse(FeatureFlag::checkFlag('lifecycle_test', 'user1'));
    }
}
