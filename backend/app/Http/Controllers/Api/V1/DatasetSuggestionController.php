<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Services\VisualizationSuggestionService;
use Illuminate\Http\Request;

class DatasetSuggestionController extends Controller
{
    public function __construct(
        private VisualizationSuggestionService $suggestionService
    ) {}

    public function index(Request $request, Project $project)
    {
        if ($project->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $dataset = $project->dataset;
        if (!$dataset) {
            return response()->json(['message' => 'No dataset found'], 404);
        }

        $suggestions = $this->suggestionService->suggest($dataset);

        return response()->json(['suggestions' => $suggestions]);
    }
}
