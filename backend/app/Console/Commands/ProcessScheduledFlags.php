<?php

namespace App\Console\Commands;

use App\Models\FeatureFlag;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class ProcessScheduledFlags extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'flags:process';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process scheduled feature flags (activate/deactivate based on schedule)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $now = now();
        $updated = 0;

        // Activate flags that should start now
        $flagsToActivate = FeatureFlag::where('is_active', false)
            ->whereNotNull('scheduled_start_at')
            ->where('scheduled_start_at', '<=', $now)
            ->where(function ($query) use ($now) {
                $query->whereNull('scheduled_end_at')
                    ->orWhere('scheduled_end_at', '>', $now);
            })
            ->get();

        foreach ($flagsToActivate as $flag) {
            $flag->update(['is_active' => true]);
            $this->info("Activated flag: {$flag->key}");
            $updated++;
        }

        // Deactivate flags that should end now
        $flagsToDeactivate = FeatureFlag::where('is_active', true)
            ->whereNotNull('scheduled_end_at')
            ->where('scheduled_end_at', '<=', $now)
            ->get();

        foreach ($flagsToDeactivate as $flag) {
            $flag->update(['is_active' => false]);
            $this->info("Deactivated flag: {$flag->key}");
            $updated++;
        }

        if ($updated > 0) {
            Cache::flush();
            $this->info("Processed {$updated} scheduled flag(s) and cleared cache.");
        } else {
            $this->info('No scheduled flags to process.');
        }

        return Command::SUCCESS;
    }
}
