<?php

namespace App\Services;

use RuntimeException;

class CsvImportLimitException extends RuntimeException
{
    public function __construct(
        private string $validationCode,
        string $message,
        private array $metadata = [],
        private array $summaryOverrides = []
    ) {
        parent::__construct($message);
    }

    public static function forTooManyRows(int $limit, int $detectedRows, int $columnsDetected): self
    {
        return new self(
            'file_too_many_rows',
            __('api.import.too_many_rows', [
                'limit' => $limit,
                'detected_rows' => $detectedRows,
            ]),
            [
                'limit' => $limit,
                'detected_rows' => $detectedRows,
                'columns_detected' => $columnsDetected,
            ],
            [
                'rows_total' => $detectedRows,
                'rows_checked' => $detectedRows,
                'columns_detected' => $columnsDetected,
            ]
        );
    }

    public static function forTooManyColumns(int $limit, int $detectedColumns, int $lineNumber, int $dataRowsChecked): self
    {
        return new self(
            'file_too_many_columns',
            __('api.import.too_many_columns', [
                'limit' => $limit,
                'detected_columns' => $detectedColumns,
                'line' => $lineNumber,
            ]),
            [
                'limit' => $limit,
                'detected_columns' => $detectedColumns,
                'line' => $lineNumber,
                'data_rows_checked' => $dataRowsChecked,
            ],
            [
                'rows_total' => $dataRowsChecked,
                'rows_checked' => $dataRowsChecked,
                'columns_detected' => $detectedColumns,
            ]
        );
    }

    public function validationCode(): string
    {
        return $this->validationCode;
    }

    public function metadata(): array
    {
        return $this->metadata;
    }

    public function summaryOverrides(): array
    {
        return $this->summaryOverrides;
    }
}
