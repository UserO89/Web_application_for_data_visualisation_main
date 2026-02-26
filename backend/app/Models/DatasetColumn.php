<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DatasetColumn extends Model
{
    use HasFactory;

    protected $fillable = [
        'dataset_id',
        'name',
        'type',
        'position',
    ];

    public function dataset()
    {
        return $this->belongsTo(Dataset::class);
    }
}
