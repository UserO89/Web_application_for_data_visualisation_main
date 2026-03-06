<?php

namespace App\Services;

use Carbon\Carbon;

class DatasetValidationService
{
    private const MAX_ISSUES_IN_RESPONSE = 120;
    private const DATE_OUTPUT_FORMAT = 'd.m.Y';

    public function sanitizeImportedRows(array $rows, array $columns): array
    {
        $expectedCount = count($columns);
        $issues = [];
        $cleanRows = [];
        $fixedCells = 0;
        $nullifiedCells = 0;
        $rowShapeFixes = 0;

        foreach ($rows as $rowIndex => $row) {
            $sourceRow = is_array($row) ? array_values($row) : [];

            if (count($sourceRow) !== $expectedCount) {
                $rowShapeFixes++;
                $this->pushIssue($issues, [
                    'row' => $rowIndex + 1,
                    'column' => null,
                    'type' => 'row_shape',
                    'original' => count($sourceRow),
                    'fixed' => $expectedCount,
                    'message' => "Row had " . count($sourceRow) . " cells, normalized to {$expectedCount}.",
                ]);
            }

            if (count($sourceRow) < $expectedCount) {
                $sourceRow = array_pad($sourceRow, $expectedCount, null);
            } elseif (count($sourceRow) > $expectedCount) {
                $sourceRow = array_slice($sourceRow, 0, $expectedCount);
            }

            $cleanRow = [];
            foreach ($columns as $position => $column) {
                $original = $sourceRow[$position] ?? null;
                $normalized = $this->normalizeByType($original, $column['type']);

                if ($normalized['changed']) {
                    $fixedCells++;
                    if ($normalized['value'] === null) {
                        $nullifiedCells++;
                    }

                    $this->pushIssue($issues, [
                        'row' => $rowIndex + 1,
                        'column' => $column['name'] ?? "Column " . ($position + 1),
                        'type' => $normalized['issue_type'],
                        'original' => $this->printable($original),
                        'fixed' => $this->printable($normalized['value']),
                        'message' => $normalized['message'],
                    ]);
                }

                $cleanRow[] = $normalized['value'];
            }

            $cleanRows[] = $cleanRow;
        }

        return [
            'rows' => $cleanRows,
            'issues' => $issues,
            'summary' => [
                'rows_checked' => count($rows),
                'fixed_cells' => $fixedCells,
                'nullified_cells' => $nullifiedCells,
                'row_shape_fixes' => $rowShapeFixes,
                'issue_count' => $fixedCells + $rowShapeFixes,
            ],
        ];
    }

    private function normalizeByType(mixed $value, string $type): array
    {
        $trimmed = $this->trimValue($value);

        if ($trimmed === null) {
            if ($value === null || $value === '') {
                return [
                    'value' => null,
                    'changed' => false,
                    'issue_type' => null,
                    'message' => '',
                ];
            }

            return [
                'value' => null,
                'changed' => true,
                'issue_type' => 'empty_normalized',
                'message' => 'Converted empty marker to null.',
            ];
        }

        if ($type === 'integer' || $type === 'float') {
            $numeric = $this->toNumeric($trimmed);
            if ($numeric === null) {
                return [
                    'value' => null,
                    'changed' => true,
                    'issue_type' => 'invalid_number',
                    'message' => "Invalid {$type} value replaced with null.",
                ];
            }

            if ($type === 'integer') {
                $intValue = (int) round($numeric, 0);
                $changed = (string) $intValue !== (string) $trimmed;
                return [
                    'value' => $intValue,
                    'changed' => $changed,
                    'issue_type' => 'number_normalized',
                    'message' => 'Normalized numeric value.',
                ];
            }

            $floatValue = (float) $numeric;
            $changed = (string) $floatValue !== (string) $trimmed;
            return [
                'value' => $floatValue,
                'changed' => $changed,
                'issue_type' => 'number_normalized',
                'message' => 'Normalized numeric value.',
            ];
        }

        if ($type === 'date') {
            $parsedDate = $this->parseDate($trimmed);
            if ($parsedDate === null) {
                return [
                    'value' => null,
                    'changed' => true,
                    'issue_type' => 'invalid_date',
                    'message' => 'Invalid date value replaced with null.',
                ];
            }

            $normalizedDate = $parsedDate->format(self::DATE_OUTPUT_FORMAT);
            $changed = $normalizedDate !== $trimmed;
            return [
                'value' => $normalizedDate,
                'changed' => $changed,
                'issue_type' => 'date_normalized',
                'message' => 'Normalized date format to DD.MM.YYYY.',
            ];
        }

        // string
        $changed = $trimmed !== (string) ($value ?? '');
        return [
            'value' => $trimmed,
            'changed' => $changed,
            'issue_type' => 'string_trimmed',
            'message' => 'Trimmed extra whitespace.',
        ];
    }

    private function trimValue(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $string = trim((string) $value);
        $string = preg_replace('/\s+/u', ' ', $string);
        if ($string === null) {
            return null;
        }

        $emptyMarkers = ['n/a', 'na', 'null', 'none', '-', '—', ''];
        if (in_array(mb_strtolower($string), $emptyMarkers, true)) {
            return null;
        }

        return $string;
    }

    private function toNumeric(string $value): ?float
    {
        $normalized = trim($value);
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
            // 1,234.56 or 1.234,56
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

    private function parseDate(string $value): ?Carbon
    {
        $trimmed = trim($value);

        if (preg_match('/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/', $trimmed, $matches) === 1) {
            return $this->buildDate((int) $matches[3], (int) $matches[2], (int) $matches[1]);
        }

        if (preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/', $trimmed, $matches) === 1) {
            // Prefer day-first for slash format in this app context.
            $dayFirst = $this->buildDate((int) $matches[3], (int) $matches[2], (int) $matches[1]);
            if ($dayFirst !== null) {
                return $dayFirst;
            }

            return $this->buildDate((int) $matches[3], (int) $matches[1], (int) $matches[2]);
        }

        if (preg_match('/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/', $trimmed, $matches) === 1) {
            return $this->buildDate((int) $matches[1], (int) $matches[2], (int) $matches[3]);
        }

        try {
            return Carbon::parse($trimmed);
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function buildDate(int $year, int $month, int $day): ?Carbon
    {
        if (!checkdate($month, $day, $year)) {
            return null;
        }

        return Carbon::create($year, $month, $day, 0, 0, 0);
    }

    private function printable(mixed $value): mixed
    {
        if ($value === null || $value === '') {
            return null;
        }

        return $value;
    }

    private function pushIssue(array &$issues, array $issue): void
    {
        if (count($issues) < self::MAX_ISSUES_IN_RESPONSE) {
            $issues[] = $issue;
        }
    }
}
