<?php

namespace App\Services;

use App\Models\Dataset;
use Carbon\Carbon;

class StatisticsService
{
    public function calculate(Dataset $dataset): array
    {
        $columns = $dataset->columns;
        $rows = $dataset->rows;
        $statistics = [];

        foreach ($columns as $column) {
            $values = $this->extractColumnValues($rows, $column->position);
            $stats = $this->calculateColumnStats($values, $column->type);

            $statistics[] = [
                'column' => $column->name,
                'type' => $column->type,
                'statistics' => $stats,
            ];
        }

        return $statistics;
    }

    private function extractColumnValues($rows, int $position): array
    {
        $values = [];
        foreach ($rows as $row) {
            $rowData = json_decode($row->values, true);
            if (isset($rowData[$position])) {
                $values[] = $rowData[$position];
            }
        }
        return $values;
    }

    private function calculateColumnStats(array $values, string $type): array
    {
        $nonEmpty = array_filter($values, fn($v) => $v !== null && $v !== '');

        $stats = [
            'count' => count($values),
            'non_null_count' => count($nonEmpty),
            'null_count' => count($values) - count($nonEmpty),
        ];

        if ($type === 'integer' || $type === 'float') {
            $numeric = array_filter($nonEmpty, 'is_numeric');
            if (!empty($numeric)) {
                $stats['min'] = min($numeric);
                $stats['max'] = max($numeric);
                $stats['mean'] = array_sum($numeric) / count($numeric);
            }
        }

        if ($type === 'date') {
            $dates = [];
            foreach ($nonEmpty as $value) {
                try {
                    $dates[] = Carbon::parse($value);
                } catch (\Exception $e) {
                    // Skip invalid dates
                }
            }
            if (!empty($dates)) {
                $stats['earliest'] = min($dates)->toDateString();
                $stats['latest'] = max($dates)->toDateString();
            }
        }

        return $stats;
    }
}
