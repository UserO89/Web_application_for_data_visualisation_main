import { mount } from '@vue/test-utils'
import ProjectValidationModal from '../../../src/components/project/ProjectValidationModal.vue'

const buildProps = (overrides = {}) => ({
  isOpen: true,
  importValidation: {
    summary: {
      rows_imported: 7,
      rows_skipped: 1,
      problematic_columns: 2,
      normalized_cells: 1,
      nullified_cells: 4,
    },
    problem_columns: [],
    issues: [
      { code: 'legacy_warning', message: 'Legacy warning dump entry' },
    ],
  },
  validationSummaryLine: '7 imported, 1 skipped, 2 problematic columns, 1 normalized, 4 nullified.',
  validationSummary: {
    rows_imported: 7,
    rows_skipped: 1,
    problematic_columns: 2,
    normalized_cells: 1,
    nullified_cells: 4,
  },
  validationProblemColumns: [
    {
      column_index: 2,
      column_name: 'Revenue',
      issue_count: 3,
      normalized_count: 1,
      nullified_count: 2,
      review_samples: [
        {
          row: 4,
          original_value: '12,5',
          action: 'normalized',
          new_value: 12.5,
          reason: 'Numeric format normalized',
        },
        {
          row: 6,
          original_value: 'abc',
          action: 'nullified',
          new_value: null,
          reason: 'Invalid numeric value',
        },
      ],
    },
    {
      column_index: 3,
      column_name: 'EventDate',
      issue_count: 2,
      normalized_count: 0,
      nullified_count: 2,
      review_samples: [
        {
          row: 5,
          original_value: '2024/13/44',
          action: 'nullified',
          new_value: null,
          reason: 'Invalid date or datetime value',
        },
      ],
    },
  ],
  formatIssueValue: (value) => (value === null || value === undefined || value === '' ? 'null' : String(value)),
  ...overrides,
})

describe('ProjectValidationModal', () => {
  it('renders compact validation summary', () => {
    const wrapper = mount(ProjectValidationModal, { props: buildProps() })

    expect(wrapper.text()).toContain('Import Review')
    expect(wrapper.text()).toContain('Rows imported')
    expect(wrapper.text()).toContain('Rows skipped')
    expect(wrapper.text()).toContain('Problematic columns')
    expect(wrapper.text()).toContain('Normalized values')
    expect(wrapper.text()).toContain('May become null')
    expect(wrapper.text()).toContain('7 imported, 1 skipped, 2 problematic columns')
  })

  it('renders problematic columns with normalized/nullified counters', () => {
    const wrapper = mount(ProjectValidationModal, { props: buildProps() })

    expect(wrapper.text()).toContain('Revenue')
    expect(wrapper.text()).toContain('3 problematic values')
    expect(wrapper.text()).toContain('Normalized: 1')
    expect(wrapper.text()).toContain('Nullified: 2')
    expect(wrapper.text()).toContain('EventDate')
    expect(wrapper.text()).toContain('2 problematic values')
  })

  it('renders review samples with row, original value, action, result and reason', () => {
    const wrapper = mount(ProjectValidationModal, { props: buildProps() })

    expect(wrapper.text()).toContain('Row')
    expect(wrapper.text()).toContain('Original value')
    expect(wrapper.text()).toContain('Action')
    expect(wrapper.text()).toContain('Result')
    expect(wrapper.text()).toContain('Reason')
    expect(wrapper.text()).toContain('12,5')
    expect(wrapper.text()).toContain('normalized')
    expect(wrapper.text()).toContain('12.5')
    expect(wrapper.text()).toContain('abc')
    expect(wrapper.text()).toContain('nullified')
    expect(wrapper.text()).toContain('null')
    expect(wrapper.text()).toContain('Invalid numeric value')
  })

  it('does not flood visible review samples with empty-marker entries', () => {
    const wrapper = mount(ProjectValidationModal, {
      props: buildProps({
        validationProblemColumns: [
          {
            column_index: 2,
            column_name: 'Revenue',
            issue_count: 3,
            normalized_count: 0,
            nullified_count: 3,
            review_samples: [
              {
                row: 4,
                original_value: null,
                action: 'nullified',
                new_value: null,
                reason: 'Empty marker converted to null',
              },
              {
                row: 5,
                original_value: 'abc',
                action: 'nullified',
                new_value: null,
                reason: 'Invalid numeric value',
              },
            ],
          },
        ],
      }),
    })

    expect(wrapper.text()).toContain('abc')
    expect(wrapper.text()).not.toContain('Empty marker converted to null')
  })

  it('does not render old severity-dump contract as main UI', () => {
    const wrapper = mount(ProjectValidationModal, { props: buildProps() })

    expect(wrapper.text()).not.toContain('ERRORS')
    expect(wrapper.text()).not.toContain('warnings:')
    expect(wrapper.text()).not.toContain('Column Quality Overview')
    expect(wrapper.text()).not.toContain('Legacy warning dump entry')
  })
})
