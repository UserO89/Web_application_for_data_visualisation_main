<template>
  <div class="home-page">
    <AppHeader />

    <section class="hero panel">
      <div class="eyebrow">Data Analysis Platform</div>
      <h1>Understand your dataset in minutes, not hours.</h1>
      <p class="hero-lead">
        DataViz is a focused environment for importing tabular data, validating structure,
        editing records, and generating chart-ready insights. It was designed as a stable
        baseline for academic research and product-oriented analytics workflows.
      </p>

      <div class="hero-metrics">
        <div class="metric">
          <div class="metric-value">CSV/TXT</div>
          <div class="metric-label">Flexible import</div>
        </div>
        <div class="metric">
          <div class="metric-value">Live edits</div>
          <div class="metric-label">Table-first workflow</div>
        </div>
        <div class="metric">
          <div class="metric-value">Stats + hints</div>
          <div class="metric-label">Automatic diagnostics</div>
        </div>
        <div class="metric">
          <div class="metric-value">Fast output</div>
          <div class="metric-label">Line, bar, pie</div>
        </div>
      </div>

      <div class="primary-cta-wrap">
        <router-link :to="primaryAction.to" class="btn primary primary-cta">
          {{ primaryAction.label }}
        </router-link>
      </div>
    </section>

    <section class="panel value-strip">
      <div class="value-item">
        <div class="value-title">One place for the full flow</div>
        <div class="value-text">Import, clean, analyze, and visualize without switching tools.</div>
      </div>
      <div class="value-item">
        <div class="value-title">Readable outputs</div>
        <div class="value-text">Build clear chart stories for reports, demos, and thesis sections.</div>
      </div>
      <div class="value-item">
        <div class="value-title">Ready for extension</div>
        <div class="value-text">Solid core architecture for adding advanced features step by step.</div>
      </div>
    </section>

    <section class="panel section-grid">
      <div>
        <h2>What This Platform Solves</h2>
        <p>
          Students and analysts often spend more time preparing data than understanding it.
          DataViz solves that by combining import, cleaning, quick edits, summary statistics,
          and basic visualization in one interface.
        </p>
      </div>
      <div class="feature-list">
        <div class="feature-item">
          <div class="feature-title">Single workspace</div>
          <div class="feature-text">No context switching between scripts, spreadsheets, and chart tools.</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Reliable baseline</div>
          <div class="feature-text">Built to be stable first, so advanced features can be added safely later.</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Clear narrative</div>
          <div class="feature-text">Turn raw values into interpretable visual stories for reports and demos.</div>
        </div>
      </div>
    </section>

    <section class="panel">
      <h2>How It Works</h2>
      <div class="steps">
        <div class="step-card">
          <div class="step-index">01</div>
          <div class="step-title">Create a project</div>
          <div class="step-text">Start an isolated workspace for one dataset or research hypothesis.</div>
        </div>
        <div class="step-card">
          <div class="step-index">02</div>
          <div class="step-title">Import and inspect</div>
          <div class="step-text">Upload CSV, verify inferred column types, and validate row quality.</div>
        </div>
        <div class="step-card">
          <div class="step-index">03</div>
          <div class="step-title">Edit and analyze</div>
          <div class="step-text">Correct values directly in the table and use automatic statistical summaries.</div>
        </div>
        <div class="step-card">
          <div class="step-index">04</div>
          <div class="step-title">Visualize and decide</div>
          <div class="step-text">Build chart views and extract conclusions for your next action.</div>
        </div>
      </div>
    </section>

    <section class="panel split">
      <div>
        <h2>Project Vision</h2>
        <p>
          This application is a foundation for a larger analytics toolkit: richer visual layers,
          stronger data quality checks, user personalization, and collaboration features.
        </p>
        <p>
          The current release focuses on dependable core mechanics, so each next improvement can
          be integrated without breaking existing workflows.
        </p>
      </div>
      <div class="callout">
        <div class="callout-title">Ready to start?</div>
        <div class="callout-text">
          Begin with a clean project, import your first dataset, and build your first visual report today.
        </div>
        <router-link :to="primaryAction.to" class="btn primary small-cta">
          {{ primaryAction.label }}
        </router-link>
      </div>
    </section>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import AppHeader from '../components/AppHeader.vue'

export default {
  name: 'HomePage',
  components: { AppHeader },
  setup() {
    const authStore = useAuthStore()

    const primaryAction = computed(() => {
      return authStore.isAuthenticated
        ? { label: 'Open Dashboard', to: { name: 'projects' } }
        : { label: 'Get Started', to: { name: 'login' } }
    })

    return {
      primaryAction,
    }
  },
}
</script>

<style scoped>
.home-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hero {
  text-align: center;
}

.eyebrow {
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  margin-bottom: 10px;
}

h1 {
  margin: 0;
  font-size: clamp(34px, 5vw, 54px);
  line-height: 1.08;
}

.hero-lead {
  max-width: 850px;
  margin: 14px auto 0;
  color: var(--muted);
  line-height: 1.65;
}

.hero-metrics {
  margin-top: 22px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.metric {
  background: #1a1a1a;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
}

.metric-value {
  font-size: 18px;
  font-weight: 700;
}

.metric-label {
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
}

.primary-cta-wrap {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

.primary-cta {
  width: min(420px, 100%);
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  padding: 16px 24px;
  border-radius: 14px;
}

.value-strip {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.value-item {
  background: #1a1a1a;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
}

.value-title {
  font-size: 15px;
  font-weight: 700;
}

.value-text {
  margin-top: 6px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.55;
}

.section-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 18px;
}

h2 {
  margin: 0 0 12px;
  font-size: 28px;
  line-height: 1.2;
}

p {
  margin: 0;
  color: var(--muted);
  line-height: 1.65;
}

p + p {
  margin-top: 10px;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feature-item {
  background: #1a1a1a;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
}

.feature-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 4px;
}

.feature-text {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.55;
}

.steps {
  margin-top: 8px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.step-card {
  background: #1a1a1a;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
}

.step-index {
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 8px;
}

.step-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 6px;
}

.step-text {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.55;
}

.split {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 18px;
}

.callout {
  background: #1a1a1a;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px;
}

.callout-title {
  font-size: 18px;
  font-weight: 700;
}

.callout-text {
  margin-top: 8px;
  color: var(--muted);
  line-height: 1.6;
}

.small-cta {
  margin-top: 12px;
  width: 100%;
  text-align: center;
  padding: 11px 14px;
}

@media (max-width: 980px) {
  .home-page {
    padding: 12px;
  }

  .value-strip,
  .hero-metrics,
  .steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .section-grid,
  .split {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .value-strip,
  .hero-metrics,
  .steps {
    grid-template-columns: 1fr;
  }

  .primary-cta {
    font-size: 18px;
  }
}
</style>
