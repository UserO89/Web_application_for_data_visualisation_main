import { computed, nextTick, reactive, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useHomeMotion } from '../../../src/composables/home/useHomeMotion'

const observerInstances = []

class IntersectionObserverMock {
  constructor(callback) {
    this.callback = callback
    this.observe = vi.fn((target) => {
      this.callback([{ isIntersecting: true, target }])
    })
    this.unobserve = vi.fn()
    this.disconnect = vi.fn()
    observerInstances.push(this)
  }
}

describe('useHomeMotion', () => {
  beforeEach(() => {
    observerInstances.length = 0

    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
    vi.stubGlobal('requestAnimationFrame', (callback) => {
      callback(performance.now() + 5000)
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('animates stats from computed items when the stats section becomes visible', async () => {
    const displayedStats = reactive({
      steps: 0,
      actions: 0,
      inputs: 0,
      workspace: 0,
    })

    const statsItems = computed(() => ([
      { key: 'steps', target: 5 },
      { key: 'actions', target: 6 },
      { key: 'inputs', target: 2 },
      { key: 'workspace', target: 1 },
    ]))

    const Host = {
      template: `
        <div ref="pageRef">
          <section ref="heroRef" data-reveal></section>
          <section ref="chartRef" data-reveal></section>
          <section ref="statsRef" data-reveal></section>
        </div>
      `,
      setup() {
        const pageRef = ref(null)
        const heroRef = ref(null)
        const chartRef = ref(null)
        const statsRef = ref(null)
        const showDemoChart = ref(false)

        useHomeMotion({
          pageRef,
          heroSectionRef: heroRef,
          chartDemoRef: chartRef,
          statsSectionRef: statsRef,
          statsItems,
          displayedStats,
          showDemoChart,
        })

        return {
          pageRef,
          heroRef,
          chartRef,
          statsRef,
        }
      },
    }

    mount(Host)
    await nextTick()

    expect(displayedStats).toEqual({
      steps: 5,
      actions: 6,
      inputs: 2,
      workspace: 1,
    })
    expect(observerInstances).toHaveLength(2)
  })
})
