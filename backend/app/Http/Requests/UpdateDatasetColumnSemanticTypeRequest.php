<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDatasetColumnSemanticTypeRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'semantic_type' => [
                'required',
                'string',
                Rule::in(['metric', 'nominal', 'ordinal', 'temporal', 'identifier', 'binary', 'ignored']),
            ],
            'analytical_role' => [
                'nullable',
                'string',
                Rule::in(['dimension', 'measure', 'grouping', 'timeDimension', 'excluded']),
            ],
            'is_excluded_from_analysis' => ['nullable', 'boolean'],
        ];
    }
}
