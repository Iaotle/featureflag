<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class FeatureFlag extends Model
{
    protected $fillable = [
        'name',
        'key',
        'description',
        'is_active',
        'rollout_type',
        'enabled_groups',
        'scheduled_start_at',
        'scheduled_end_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'enabled_groups' => 'array',
        'scheduled_start_at' => 'datetime',
        'scheduled_end_at' => 'datetime',
    ];

    /**
     * Get user group based on CRC32 hash modulo 8
     */
    public static function getUserGroup(string $userId): string
    {
        $groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        $hash = crc32($userId);
        return $groups[abs($hash) % 8];
    }

    /**
     * Check if flag is enabled for a specific user
     */
    public static function checkFlag(string $key, string $userId): bool
    {
        $cacheKey = "flag:{$key}:{$userId}";

        return Cache::remember($cacheKey, 60, function () use ($key, $userId) {
            $flag = Cache::remember("flag:{$key}", 300, fn () => self::where('key', $key)->first());

            if (!$flag || !$flag->is_active) {
                return false;
            }

            // Check scheduled start time
            if ($flag->scheduled_start_at && now()->lt($flag->scheduled_start_at)) {
                return false;
            }

            // Check scheduled end time
            if ($flag->scheduled_end_at && now()->gt($flag->scheduled_end_at)) {
                return false;
            }

            // Boolean rollout - enabled for all
            if ($flag->rollout_type === 'boolean') {
                return true;
            }

            // User groups rollout
            $userGroup = self::getUserGroup($userId);
            $enabledGroups = $flag->enabled_groups ?? [];
            return in_array($userGroup, $enabledGroups);
        });
    }

    /**
     * Boot method to clear cache on flag changes
     */
    protected static function boot()
    {
        parent::boot();

        static::saved(function ($flag) {
            Cache::flush();
        });

        static::deleted(function ($flag) {
            Cache::flush();
        });
    }
}
