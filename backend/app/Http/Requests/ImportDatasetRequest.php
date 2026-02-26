<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImportDatasetRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
            'delimiter' => ['nullable', 'string', 'max:1'],
            'has_header' => ['nullable', 'boolean'],
        ];
    }
}
