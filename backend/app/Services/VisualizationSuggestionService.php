<?php

namespace App\Services;

use App\Models\Dataset;

class VisualizationSuggestionService
{
    public function suggest(Dataset $dataset): array
    {
        $columns = $dataset->columns;
        $suggestions = [];

        // Simple rule-based suggestions
        $numericColumns = $columns->whereIn('type', ['integer', 'float']);
        $dateColumns = $columns->where('type', 'date');
        $stringColumns = $columns->where('type', 'string');

        // Line chart: date + numeric
        if ($dateColumns->count() > 0 && $numericColumns->count() > 0) {
            $suggestions[] = [
                'type' => 'line',
                'title' => 'Time Series',
                'description' => 'Line chart showing numeric values over time',
                'x_axis' => $dateColumns->first()->name,
                'y_axis' => $numericColumns->first()->name,
            ];
        }

        // Bar chart: string + numeric
        if ($stringColumns->count() > 0 && $numericColumns->count() > 0) {
            $suggestions[] = [
                'type' => 'bar',
                'title' => 'Category Comparison',
                'description' => 'Bar chart comparing categories',
                'x_axis' => $stringColumns->first()->name,
                'y_axis' => $numericColumns->first()->name,
            ];
        }

        // Pie chart: string + numeric
        if ($stringColumns->count() > 0 && $numericColumns->count() > 0) {
            $suggestions[] = [
                'type' => 'pie',
                'title' => 'Distribution',
                'description' => 'Pie chart showing distribution',
                'category' => $stringColumns->first()->name,
                'value' => $numericColumns->first()->name,
            ];
        }

        return $suggestions;
    }
}
