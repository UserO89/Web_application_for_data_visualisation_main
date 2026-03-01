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
        $nonEmpty = array_values(array_filter(
            array_map(fn($v) => is_string($v) ? trim($v) : $v, $values),
            fn($v) => $v !== null && $v !== ''
        ));

        if (empty($nonEmpty)) {
            return 'string';
        }

        // Check for numbers first to avoid misclassifying numeric data as date.
        $numericCount = 0;
        $floatCount = 0;
        foreach ($nonEmpty as $value) {
            $numeric = $this->toNumeric($value);
            if ($numeric !== null) {
                $numericCount++;
                if (floor($numeric) !== $numeric) {
                    $floatCount++;
                }
            }
        }
        if ($numericCount / count($nonEmpty) >= 0.7) {
            return $floatCount > 0 ? 'float' : 'integer';
        }

        // Check for dates only if value looks date-like.
        $dateCount = 0;
        foreach ($nonEmpty as $value) {
            if (!$this->looksDateLike((string) $value)) {
                continue;
            }
            try {
                Carbon::parse((string) $value);
                $dateCount++;
            } catch (\Throwable $e) {
                // not parseable date
            }
        }
        if ($dateCount / count($nonEmpty) >= 0.7) {
            return 'date';
        }

        return 'string';
    }

    private function looksDateLike(string $value): bool
    {
        $trimmed = trim($value);

        // 2025, 2026 etc. should not be treated as dates by default.
        if (preg_match('/^\d{4}$/', $trimmed) === 1) {
            return false;
        }

        return preg_match('/[-\/.:T]/', $trimmed) === 1 || preg_match('/[a-zA-Z]{3,}/', $trimmed) === 1;
    }

    private function toNumeric(mixed $value): ?float
    {
        $normalized = trim((string) $value);
        $normalized = str_replace(["\u{00A0}", ' '], '', $normalized);
        $normalized = preg_replace('/[$€£¥%]/u', '', $normalized);
        $normalized = str_replace("'", '', $normalized);
        if ($normalized === null || $normalized === '') {
            return null;
        }

        $multiplier = 1.0;
        if (preg_match('/([kmb])$/i', $normalized, $suffixMatch) === 1) {
            $suffix = strtolower($suffixMatch[1]);
            $multiplier = match ($suffix) {
                'k' => 1_000.0,
                'm' => 1_000_000.0,
                'b' => 1_000_000_000.0,
                default => 1.0,
            };
            $normalized = substr($normalized, 0, -1);
            if ($normalized === '') {
                return null;
            }
        }

        $hasComma = str_contains($normalized, ',');
        $hasDot = str_contains($normalized, '.');

        if ($hasComma && $hasDot) {
            if (strrpos($normalized, ',') > strrpos($normalized, '.')) {
                $normalized = str_replace('.', '', $normalized);
                $normalized = str_replace(',', '.', $normalized);
            } else {
                $normalized = str_replace(',', '', $normalized);
            }
        } elseif ($hasComma) {
            if (preg_match('/,\d{1,2}$/', $normalized) === 1) {
                $normalized = str_replace(',', '.', $normalized);
            } else {
                $normalized = str_replace(',', '', $normalized);
            }
        }

        if (preg_match('/^-?\d+(\.\d+)?$/', $normalized) !== 1) {
            return null;
        }

        return (float) $normalized * $multiplier;
    }
}
