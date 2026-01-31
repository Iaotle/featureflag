<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\FlagController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\Admin\FlagController as AdminFlagController;
use Illuminate\Support\Facades\Route;

// Authentication Routes
Route::post('login', [AuthController::class, 'login']);


Route::apiResource('flags', FlagController::class);

// Protected Auth Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('user', [AuthController::class, 'user']);
});

// Public Feature Flag Checking (anonymous users)
Route::post('flags/check', [FlagController::class, 'check']);

// Admin Routes (Protected)
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::apiResource('flags', AdminFlagController::class);
});

// Damage Reports API (Public)
Route::apiResource('reports', ReportController::class);
Route::post('reports/bulk-delete', [ReportController::class, 'bulkDelete']);
