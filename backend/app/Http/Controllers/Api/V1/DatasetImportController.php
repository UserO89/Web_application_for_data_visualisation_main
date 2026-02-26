<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ImportDatasetRequest;
use App\Models\Project;
use App\Services\CsvImportService;
use App\Services\ColumnTypeInferenceService;
use App\Services\DatasetValidationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DatasetImportController extends Controller
{
    public function __construct(
        private CsvImportService $csvImportService,
        private ColumnTypeInferenceService $typeInferenceService,
        private DatasetValidationService $validationService
    ) {}

    public function import(ImportDatasetRequest $request, Project $project)
    {
        if ($project->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $file = $request->file('file');
        $delimiter = $request->input('delimiter', ',');
        $hasHeader = $request->input('has_header', true);

        // Parse CSV
        $parsed = $this->csvImportService->parse($file, $delimiter, $hasHeader);

        // Store file
        $path = $file->store('datasets', 'local');

        // Create dataset
        $dataset = $project->dataset()->create([
            'file_path' => $path,
            'delimiter' => $delimiter,
            'has_header' => $hasHeader,
        ]);

        // Infer column types and create columns
        $columns = $this->typeInferenceService->infer($parsed['rows'], $hasHeader);

        foreach ($columns as $index => $column) {
            $dataset->columns()->create([
                'name' => $column['name'],
                'type' => $column['type'],
                'position' => $index,
            ]);
        }

        // Import rows
        $rows = $hasHeader ? array_slice($parsed['rows'], 1) : $parsed['rows'];
        foreach ($rows as $rowIndex => $row) {
            $dataset->rows()->create([
                'row_index' => $rowIndex,
                'values' => json_encode($row),
            ]);
        }

        return response()->json([
            'dataset' => $dataset->load('columns'),
            'rows_count' => count($rows),
        ], 201);
    }
}
