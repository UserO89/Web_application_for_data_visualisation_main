<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Chart;
use App\Models\Project;
use Illuminate\Http\Request;

class ProjectChartController extends Controller
{
    public function index(Project $project)
    {
        $this->authorize('view', $project);

        $charts = $project->charts()
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['charts' => $charts]);
    }

    public function store(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'type' => ['required', 'string', 'max:64'],
            'title' => ['nullable', 'string', 'max:255'],
            'config' => ['required', 'array'],
        ]);

        $title = trim((string) ($validated['title'] ?? ''));
        if ($title === '') {
            $title = __('api.charts.default_title', [
                'type' => ucfirst((string) $validated['type']),
            ]);
        }

        $chart = $project->charts()->create([
            'type' => $validated['type'],
            'title' => $title,
            'config' => $validated['config'],
        ]);

        return response()->json(['chart' => $chart], 201);
    }

    public function destroy(Project $project, Chart $chart)
    {
        $this->authorize('update', $project);

        if ((int) $chart->project_id !== (int) $project->id) {
            return response()->json(['message' => __('api.charts.not_found')], 404);
        }

        $chart->delete();

        return response()->json(['ok' => true]);
    }

    public function update(Request $request, Project $project, Chart $chart)
    {
        $this->authorize('update', $project);

        if ((int) $chart->project_id !== (int) $project->id) {
            return response()->json(['message' => __('api.charts.not_found')], 404);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
        ]);

        $title = trim((string) $validated['title']);
        if ($title === '') {
            return response()->json([
                'message' => __('api.common.validation_failed'),
                'errors' => [
                    'title' => [__('api.charts.title_required')],
                ],
            ], 422);
        }

        $chart->update([
            'title' => $title,
        ]);

        return response()->json(['chart' => $chart->fresh()]);
    }
}
