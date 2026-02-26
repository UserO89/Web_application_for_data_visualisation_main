<?php

namespace App\Services;

use Carbon\Carbon;

class ColumnTypeInferenceService
{
    public function infer(array $rows, bool $hasHeader = true): array
    {
        if (empty($rows)) {
            return [];
        }

        $firstRow = $rows[0];
        $columnCount = count($firstRow);
        $columns = [];

        // Get header or generate column names
        if ($hasHeader) {
            $headers = $firstRow;
            $dataRows = array_slice($rows, 1);
        } else {
            $headers = array_map(fn($i) => "Column " . ($i + 1), range(0, $columnCount - 1));
            $dataRows = $rows;
        }

        // Analyze each column
        for ($i = 0; $i < $columnCount; $i++) {
            $values = array_column($dataRows, $i);
            $type = $this->detectType($values);

            $columns[] = [
                'name' => $headers[$i] ?? "Column " . ($i + 1),
                'type' => $type,
            ];
        }

        return $columns;
    }

    private function detectType(array $values): string
    {
        $nonEmpty = array_filter($values, fn($v) => $v !== null && $v !== '');

        if (empty($nonEmpty)) {
            return 'string';
        }

        // Check for dates
        $dateCount = 0;
        foreach ($nonEmpty as $value) {
            try {
                Carbon::parse($value);
                $dateCount++;
            } catch (\Exception $e) {
                // Not a date
            }
        }
        if ($dateCount / count($nonEmpty) > 0.7) {
            return 'date';
        }

        // Check for numbers
        $numericCount = 0;
        foreach ($nonEmpty as $value) {
            if (is_numeric($value)) {
                $numericCount++;
            }
        }
        if ($numericCount / count($nonEmpty) > 0.7) {
            // Check if integer or float
            $isInteger = true;
            foreach ($nonEmpty as $value) {
                if (is_numeric($value) && strpos($value, '.') !== false) {
                    $isInteger = false;
                    break;
                }
            }
            return $isInteger ? 'integer' : 'float';
        }

        return 'string';
    }
}
