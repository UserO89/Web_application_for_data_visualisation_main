<?php

namespace Tests\Unit;

use App\Services\DatasetValidationService;
use PHPUnit\Framework\TestCase;

class DatasetValidationServiceTest extends TestCase
{
    public function test_date_values_are_normalized_to_day_month_year_format(): void
    {
        $service = new DatasetValidationService();

        $result = $service->sanitizeImportedRows(
            [
                ['2025-01-05'],
                ['05.01.2025'],
                ['15/02/2025'],
                ['2025/03/07'],
                ['March 9 2025'],
            ],
            [
                ['name' => 'Date', 'type' => 'date'],
            ]
        );

        $this->assertSame(
            [
                ['05.01.2025'],
                ['05.01.2025'],
                ['15.02.2025'],
                ['07.03.2025'],
                ['09.03.2025'],
            ],
            $result['rows']
        );
        $this->assertSame(4, $result['summary']['fixed_cells']);
        $this->assertSame('Normalized date format to DD.MM.YYYY.', $result['issues'][0]['message']);
    }

    public function test_invalid_date_is_replaced_with_null(): void
    {
        $service = new DatasetValidationService();

        $result = $service->sanitizeImportedRows(
            [
                ['31/31/2025'],
            ],
            [
                ['name' => 'Date', 'type' => 'date'],
            ]
        );

        $this->assertSame([[null]], $result['rows']);
        $this->assertSame('invalid_date', $result['issues'][0]['type']);
        $this->assertSame(1, $result['summary']['nullified_cells']);
    }
}
