<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('feature_flags', function (Blueprint $table) {
            $table->uuid('uuid')->nullable()->after('id');
        });

        // Generate UUIDs for existing rows
        DB::table('feature_flags')->whereNull('uuid')->get()->each(function ($flag) {
            DB::table('feature_flags')
                ->where('id', $flag->id)
                ->update(['uuid' => (string) Str::uuid()]);
        });

        // Make UUID column unique
        Schema::table('feature_flags', function (Blueprint $table) {
            $table->uuid('uuid')->nullable(false)->unique()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('feature_flags', function (Blueprint $table) {
            $table->dropColumn('uuid');
        });
    }
};
