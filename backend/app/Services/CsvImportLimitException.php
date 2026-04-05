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
            "Import blocked: this file contains {$detectedRows} data rows, but the current limit is {$limit}. Split the dataset into a smaller file before importing.",
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
            "Import blocked: line {$lineNumber} contains {$detectedColumns} columns, but the current limit is {$limit}. Remove extra columns or split the dataset before importing.",
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
