<?php

use App\Http\Controllers\Admin\FlagController as AdminFlagController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\FlagController;
use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

// Public API
Route::apiResource('flags', FlagController::class);
Route::post('flags/check', [FlagController::class, 'check']);
Route::apiResource('reports', ReportController::class);
Route::post('reports/bulk-delete', [ReportController::class, 'bulkDelete']);

// Auth:
Route::post('login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('user', [AuthController::class, 'user']);
});

// Admin
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::apiResource('flags', AdminFlagController::class);
});
