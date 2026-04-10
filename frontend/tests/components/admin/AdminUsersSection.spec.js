import { mount } from '@vue/test-utils'
import AdminUsersSection from '../../../src/components/admin/AdminUsersSection.vue'
import { withI18n } from '../../support/i18n'

const buildUsers = () => ([
  {
    id: 1,
    name: 'Alice Admin',
    email: 'alice@example.com',
    role: 'admin',
    created_at: '2025-01-10T00:00:00.000Z',
    projects: [{ id: 11, title: 'Alpha' }],
  },
  {
    id: 2,
    name: 'Bob User',
    email: 'bob@example.com',
    role: 'user',
    created_at: '2025-01-11T00:00:00.000Z',
    projects_count: 3,
    projects: [],
  },
])

const buildProps = (overrides = {}) => ({
  users: buildUsers(),
  search: '',
  loading: false,
  error: '',
  selectedUserId: 2,
  deletingUserId: null,
  currentUserId: 1,
  ...overrides,
})

describe('AdminUsersSection', () => {
  it('renders users and keeps current-user delete action disabled', () => {
    const wrapper = mount(AdminUsersSection, withI18n({
      props: buildProps(),
    }))

    expect(wrapper.text()).toContain('Users')
    expect(wrapper.text()).toContain('Alice Admin')
    expect(wrapper.text()).toContain('Bob User')
    expect(wrapper.text()).toContain('3 projects')
    expect(wrapper.findAll('.user-card')).toHaveLength(2)
    expect(wrapper.findAll('.user-card')[1].classes()).toContain('selected')

    const deleteButtons = wrapper.findAll('.btn.danger')
    expect(deleteButtons).toHaveLength(2)
    expect(deleteButtons[0].attributes('disabled')).toBeDefined()
    expect(deleteButtons[1].attributes('disabled')).toBeUndefined()
  })

  it('emits search, clear and row actions', async () => {
    const wrapper = mount(AdminUsersSection, withI18n({
      props: buildProps({ search: 'alice', selectedUserId: null, currentUserId: null }),
    }))

    await wrapper.find('.search-row').trigger('submit')
    expect(wrapper.emitted('search')).toHaveLength(1)

    await wrapper.find('input').setValue('bob')
    expect(wrapper.emitted('update:search')).toEqual([['bob']])

    const clearButton = wrapper.findAll('button').find((button) => button.text() === 'Clear')
    await clearButton.trigger('click')
    expect(wrapper.emitted('clear')).toHaveLength(1)

    const firstCardButtons = wrapper.findAll('.user-card')[0].findAll('button')
    await firstCardButtons[0].trigger('click')
    await firstCardButtons[1].trigger('click')
    await firstCardButtons[2].trigger('click')

    expect(wrapper.emitted('select-user')[0][0].id).toBe(1)
    expect(wrapper.emitted('edit-user')[0][0].id).toBe(1)
    expect(wrapper.emitted('delete-user')[0][0].id).toBe(1)
  })
})
