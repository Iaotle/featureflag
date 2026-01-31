<?php

use App\Http\Controllers\FlagController;
use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

// Feature Flags API
Route::apiResource('flags', FlagController::class);
Route::post('flags/check', [FlagController::class, 'check']);

// Damage Reports API
Route::apiResource('reports', ReportController::class);
