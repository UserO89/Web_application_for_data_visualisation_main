<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDatasetRowRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'values' => ['required', 'array'],
            // values can be validated further later (by column types)
        ];
    }
}
