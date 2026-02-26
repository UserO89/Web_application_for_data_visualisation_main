<?php

namespace App\Services;

use League\Csv\Reader;
use Illuminate\Http\UploadedFile;

class CsvImportService
{
    public function parse(UploadedFile $file, string $delimiter = ',', bool $hasHeader = true): array
    {
        $csv = Reader::createFromPath($file->getRealPath(), 'r');
        $csv->setDelimiter($delimiter);

        $records = $csv->getRecords(); // iterable
        $rows = [];
        foreach ($records as $row) {
            $rows[] = $row;
        }

        return [
            'rows' => $rows,
            'hasHeader' => $hasHeader,
        ];
    }
}
