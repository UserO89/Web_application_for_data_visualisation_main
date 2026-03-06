<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDatasetColumnOrdinalOrderRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'ordinal_order' => ['required', 'array', 'min:2'],
            'ordinal_order.*' => ['required', 'string', 'max:255'],
        ];
    }
}
