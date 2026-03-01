# Validation test dataset

Use this file to test import validation and auto-fix flow:

- `test-data/validation_test_dataset.csv`

What it contains on purpose:

- extra spaces in text values
- percentages and currency in numeric fields
- commas as decimal separators
- `N/A` and `-` empty markers
- one invalid date and one invalid number

After import, open the "Data Validation" panel on the project page to see detected issues and applied fixes.
