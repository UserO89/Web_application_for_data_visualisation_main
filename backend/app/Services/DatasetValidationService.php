<?php

namespace App\Services;

class DatasetValidationService
{
    private const MAX_ISSUES_IN_RESPONSE = 120;
    private const DATE_OUTPUT_FORMAT = 'd.m.Y';
    private const DATETIME_OUTPUT_FORMAT = 'Y-m-d H:i:s';

    public function __construct(
        private ValueParsingService $valueParsingService
    ) {}

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
                $normalized = $this->normalizeByType($original, (string) ($column['type'] ?? 'string'));

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
        $trimmed = $this->valueParsingService->normalizeNullableString($value);
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

        $normalizedType = mb_strtolower($type);
        if (in_array($normalizedType, ['integer', 'float', 'number'], true)) {
            $numeric = $this->valueParsingService->toNumeric($trimmed);
            if ($numeric === null) {
                return [
                    'value' => null,
                    'changed' => true,
                    'issue_type' => 'invalid_number',
                    'message' => "Invalid {$normalizedType} value replaced with null.",
                ];
            }

            if ($normalizedType === 'integer') {
                $intValue = (int) round($numeric, 0);
                return [
                    'value' => $intValue,
                    'changed' => (string) $intValue !== (string) $trimmed,
                    'issue_type' => 'number_normalized',
                    'message' => 'Normalized numeric value.',
                ];
            }

            $floatValue = (float) $numeric;
            return [
                'value' => $floatValue,
                'changed' => (string) $floatValue !== (string) $trimmed,
                'issue_type' => 'number_normalized',
                'message' => 'Normalized numeric value.',
            ];
        }

        if ($normalizedType === 'boolean') {
            $parsedBoolean = $this->valueParsingService->toBoolean($trimmed);
            if ($parsedBoolean === null) {
                return [
                    'value' => null,
                    'changed' => true,
                    'issue_type' => 'invalid_boolean',
                    'message' => 'Invalid boolean value replaced with null.',
                ];
            }

            $normalizedBoolean = $parsedBoolean ? 'true' : 'false';
            return [
                'value' => $parsedBoolean,
                'changed' => mb_strtolower($trimmed) !== $normalizedBoolean,
                'issue_type' => 'boolean_normalized',
                'message' => 'Normalized boolean value.',
            ];
        }

        if (in_array($normalizedType, ['date', 'datetime'], true)) {
            $parsedDate = $this->valueParsingService->parseTemporal($trimmed);
            if ($parsedDate === null) {
                return [
                    'value' => null,
                    'changed' => true,
                    'issue_type' => 'invalid_date',
                    'message' => 'Invalid date value replaced with null.',
                ];
            }

            $format = $normalizedType === 'datetime'
                ? self::DATETIME_OUTPUT_FORMAT
                : self::DATE_OUTPUT_FORMAT;
            $normalizedDate = $parsedDate->format($format);
            return [
                'value' => $normalizedDate,
                'changed' => $normalizedDate !== $trimmed,
                'issue_type' => 'date_normalized',
                'message' => $normalizedType === 'datetime'
                    ? 'Normalized datetime format to YYYY-MM-DD HH:mm:ss.'
                    : 'Normalized date format to DD.MM.YYYY.',
            ];
        }

        // string / mixed / unknown
        return [
            'value' => $trimmed,
            'changed' => $trimmed !== (string) ($value ?? ''),
            'issue_type' => 'string_trimmed',
            'message' => 'Trimmed extra whitespace.',
        ];
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
