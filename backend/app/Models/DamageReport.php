<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DamageReport extends Model
{
    protected $fillable = [
        'title',
        'description',
        'damage_location',
        'priority',
        'status',
        'photos',
        'user_identifier',
    ];

    protected $casts = [
        'photos' => 'array',
    ];
}
