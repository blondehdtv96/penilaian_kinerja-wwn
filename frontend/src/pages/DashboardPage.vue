<!--
  DashboardPage.vue — PT Bridgestone Merit-Misconduct System
  ==========================================================
  Wiring notes (real repo, not the reference's guesses):
  - Sidebar: the collapsible rail lives in App.vue (shared via useSidebar). This page
    renders NO sidebar of its own — the topbar toggle drives App.vue's rail.
  - Scroll: ion-content is :scroll-y="false"; <main class="db-main"> is the real scroller
    (sticky glass header, scrollbar in the gutter, corner-reveal). Do NOT revert to
    ion-content's native scroll.
  - Tokens: scoped --db-* CSS vars (ink/grey + Bridgestone red). Intentionally NOT
    --ion-color-* — same documented exception as App.vue's hardcoded brand (CLAUDE.md).
  - Data: real dashboardService.getKPI() + getPerformanceChart(). No mock/placeholder
    cards — every figure traces to the API. Green/red are used only for the semantic
    merit/misconduct (and up/down) cases the palette rule permits.
-->
<template>
  <ion-page>
    <ion-content :scroll-y="false" :style="{ '--background': dark ? '#0b0f17' : '#ffffff' }">
      <div class="db-shell" :class="{ dark }">
        <!-- .db-main is the paper that scrolls (NOT ion-content). -->
        <main class="db-main">
          <div class="db-panel">

            <!-- ===== glass header, sticky to top of .db-main ===== -->
            <header class="db-topbar">
              <button
                class="toggle"
                @click="toggle"
                :aria-label="(isMobile ? !mobileOpen : collapsed) ? 'Perluas sidebar' : 'Ciutkan sidebar'"
              >
                <ion-icon :icon="(isMobile ? !mobileOpen : collapsed) ? chevronForwardOutline : chevronBackOutline" />
              </button>

              <div class="search" @click="focusSearch">
                <ion-icon :icon="searchOutline" />
                <input ref="searchEl" v-model="query" placeholder="Cari operator atau event…" />
                <span class="kbd">⌘K</span>
              </div>

              <div class="top-actions">
                <button class="ic" @click="toggleDark" :aria-label="dark ? 'Mode terang' : 'Mode gelap'">
                  <ion-icon :icon="dark ? sunnyOutline : moonOutline" />
                </button>
                <button class="ava-sm" @click="goProfile" aria-label="Profil saya">{{ userInitial }}</button>
              </div>
            </header>

            <div class="db-content">
              <!-- ===== page head ===== -->
              <div class="page-head">
                <div>
                  <h1>{{ isOperatorView ? 'Dashboard Kinerja Saya' : 'Dashboard KPI' }}</h1>
                  <p>Selamat datang, {{ authStore.user?.fullName }}</p>
                </div>
                <div class="head-right">
                  <div class="daterange"><ion-icon :icon="calendarOutline" /> {{ currentDate }}</div>
                  <button
                    v-if="can(['Staff Produksi', 'Super Admin'])"
                    class="icon-btn"
                    @click="go('/reports')"
                    aria-label="Export laporan"
                  >
                    <ion-icon :icon="downloadOutline" />
                  </button>
                </div>
              </div>

              <!-- ===== loading ===== -->
              <div v-if="loading" class="loading-wrap">
                <div class="spinner"></div>
                <p>Memuat dashboard…</p>
              </div>

              <template v-else>
                <!-- ================= OPERATOR VIEW ================= -->
                <template v-if="isOperatorView">
                  <div v-if="!dashboard?.operator" class="card empty-card">
                    <span class="kpi-ico lg"><ion-icon :icon="personOutline" /></span>
                    <h3>Profil Operator Belum Terdaftar</h3>
                    <p class="muted">Hubungi administrator untuk mendaftarkan data operator Anda.</p>
                  </div>

                  <template v-else>
                    <!-- identity -->
                    <div class="card identity">
                      <div class="id-ava">{{ getInitial(authStore.user?.fullName) }}</div>
                      <div class="id-main">
                        <h2>{{ authStore.user?.fullName }}</h2>
                        <p class="muted">{{ dashboard.operator.department?.name }} · {{ dashboard.operator.shift?.name }}</p>
                        <p class="muted xs">ID: {{ dashboard.operator.employeeId }} · {{ dashboard.operator.position }}</p>
                      </div>
                      <div class="id-rank">
                        <div class="val sm">#{{ sum.ranking ?? 0 }}</div>
                        <div class="muted xs">Peringkat</div>
                      </div>
                    </div>

                    <!-- personal stats -->
                    <div class="grid g4">
                      <div class="card" v-for="st in operatorStats" :key="st.label">
                        <div class="kpi-top"><span class="kpi-ico"><ion-icon :icon="st.icon" /></span> {{ st.label }}</div>
                        <div class="val">{{ st.value }}</div>
                        <div class="sub-note">{{ st.hint }}</div>
                      </div>
                    </div>

                    <!-- personal activity -->
                    <div class="card">
                      <div class="card-head"><h3>Aktivitas Terbaru</h3></div>
                      <div v-if="!filteredActivity.length" class="empty">{{ query ? 'Tidak ada hasil' : 'Belum ada aktivitas tercatat' }}</div>
                      <table v-else>
                        <thead><tr><th>Aktivitas</th><th>Tanggal</th><th>Tipe</th><th class="amt">Poin</th></tr></thead>
                        <tbody>
                          <tr v-for="e in filteredActivity" :key="e.id">
                            <td><div class="who"><div class="t-ava">{{ getInitial(e.name) }}</div> <span>{{ e.name }}</span></div></td>
                            <td class="muted">{{ formatDate(e.createdAt) }}</td>
                            <td><span class="tag" :class="e.kind === 'Merit' ? 'merit' : 'mis'">{{ e.kind === 'Merit' ? 'Merit' : 'Misconduct' }}</span></td>
                            <td class="amt" :class="e.kind === 'Merit' ? 'pos' : 'neg'">{{ e.kind === 'Merit' ? '+' : '−' }}{{ Math.abs(e.points) }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </template>
                </template>

                <!-- ================= MANAGEMENT VIEW ================= -->
                <template v-else>
                  <!-- KPI ROW -->
                  <div class="grid g4">
                    <div class="card">
                      <div class="kpi-top"><span class="kpi-ico"><ion-icon :icon="peopleOutline" /></span> Total Operator</div>
                      <div class="val">{{ fmt(sum.totalOperators) }}</div>
                      <div class="sub-note">operator terdaftar</div>
                    </div>
                    <div class="card">
                      <div class="kpi-top"><span class="kpi-ico"><ion-icon :icon="trophyOutline" /></span> Total Merit</div>
                      <div class="val">{{ fmt(sum.totalMerits) }}</div>
                      <div class="sub-note">penghargaan tercatat</div>
                    </div>
                    <div class="card">
                      <div class="kpi-top"><span class="kpi-ico"><ion-icon :icon="alertCircleOutline" /></span> Total Misconduct</div>
                      <div class="val">{{ fmt(sum.totalMisconducts) }}</div>
                      <div class="sub-note">pelanggaran tercatat</div>
                    </div>
                    <div class="card">
                      <div class="kpi-top spread">
                        <span class="lbl"><span class="kpi-ico"><ion-icon :icon="cubeOutline" /></span> Blok Blockchain</span>
                        <span class="badge">live</span>
                      </div>
                      <div class="val">{{ fmt(sum.totalBlocks) }}</div>
                      <div class="sub-note">jejak audit terverifikasi</div>
                    </div>
                  </div>

                  <!-- MID ROW -->
                  <div class="grid g3">
                    <!-- Pending Approvals (real) -->
                    <div class="card">
                      <div class="card-head">
                        <h3>Menunggu Persetujuan</h3>
                        <span class="kpi-ico sm"><ion-icon :icon="timeOutline" /></span>
                      </div>
                      <div class="muted">Item menunggu tinjauan</div>
                      <div class="val sm">{{ fmt(pending.total) }}</div>
                      <template v-if="pending.total">
                        <div class="seg">
                          <span v-for="(g, i) in pending.segs" :key="i" :style="{ width: g.w + '%', background: g.color }"></span>
                        </div>
                        <div class="src-list">
                          <div class="src-row"><span class="d" style="background: var(--db-green)"></span> Merit <b>{{ pending.pm }}</b></div>
                          <div class="src-row"><span class="d" style="background: var(--db-red)"></span> Misconduct <b>{{ pending.px }}</b></div>
                        </div>
                      </template>
                      <div v-else class="empty">Tidak ada persetujuan tertunda</div>
                    </div>

                    <!-- Performance trend (real bars + real delta) -->
                    <div class="card">
                      <div class="card-head">
                        <h3>Tren Kinerja</h3>
                        <button class="pill" @click="cycleRange">{{ trendRange }} <ion-icon :icon="chevronDownOutline" /></button>
                      </div>
                      <div class="muted">Total event per periode</div>
                      <div v-if="bars.length" class="bars">
                        <div class="bar-col" v-for="(b, i) in bars" :key="i">
                          <div class="bar" :style="{ height: b.h + '%' }"></div><span class="b-lbl">{{ b.m }}</span>
                        </div>
                      </div>
                      <div v-else class="empty">Belum ada data tren</div>
                      <div v-if="trendDelta" class="trend">
                        {{ trendDelta.up ? 'Naik' : 'Turun' }} {{ trendDelta.pct }}% vs periode lalu
                        <span :class="trendDelta.up ? 'up' : 'down'"><ion-icon :icon="trendDelta.up ? trendingUpOutline : trendingDownOutline" /></span>
                      </div>
                    </div>

                    <!-- Merit vs Misconduct donut (real) -->
                    <div class="card">
                      <div class="card-head"><h3>Merit vs Misconduct</h3></div>
                      <div class="muted">Distribusi seluruh event</div>
                      <div class="donut-wrap">
                        <svg width="172" height="172" viewBox="0 0 42 42">
                          <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="var(--db-track)" stroke-width="6" />
                          <circle
                            v-for="(c, i) in donut.arcs"
                            :key="i"
                            cx="21" cy="21" r="15.9" fill="transparent"
                            :stroke="c.color" stroke-width="6"
                            :stroke-dasharray="c.dash" :stroke-dashoffset="c.off"
                          />
                        </svg>
                        <div class="donut-center"><div class="n">{{ fmt(donut.center) }}</div><div class="muted xs">events</div></div>
                      </div>
                      <div class="cat-grid">
                        <div class="cat" v-for="c in donut.legend" :key="c.name">
                          <span class="d" :style="{ background: c.color }"></span> {{ c.name }} <b>{{ c.pct }}%</b>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- BOTTOM ROW -->
                  <div class="grid g-bottom">
                    <!-- activity -->
                    <div class="card">
                      <div class="card-head">
                        <h3>Aktivitas Terbaru</h3>
                        <button v-if="can(['Super Admin', 'Staff Produksi'])" class="pill" @click="go('/operators')">Lihat Semua</button>
                      </div>
                      <div v-if="!filteredActivity.length" class="empty">{{ query ? 'Tidak ada hasil' : 'Belum ada aktivitas tercatat' }}</div>
                      <table v-else>
                        <thead><tr><th>Operator</th><th>Tanggal</th><th>Tipe</th><th class="amt">Poin</th></tr></thead>
                        <tbody>
                          <tr v-for="e in filteredActivity" :key="e.id">
                            <td><div class="who"><div class="t-ava">{{ getInitial(e.name) }}</div> <span>{{ e.name }}</span></div></td>
                            <td class="muted">{{ formatDate(e.createdAt) }}</td>
                            <td><span class="tag" :class="e.kind === 'Merit' ? 'merit' : 'mis'">{{ e.kind === 'Merit' ? 'Merit' : 'Misconduct' }}</span></td>
                            <td class="amt" :class="e.kind === 'Merit' ? 'pos' : 'neg'">{{ e.kind === 'Merit' ? '+' : '−' }}{{ Math.abs(e.points) }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <!-- top performers -->
                    <div class="card">
                      <div class="card-head">
                        <h3>5 Operator Terbaik</h3>
                        <button v-if="can(['Operator', 'Super Admin', 'Staff Produksi'])" class="pill" @click="go('/ranking')">Lihat Semua</button>
                      </div>
                      <div v-if="!topPerformers.length" class="empty">Belum ada data operator</div>
                      <div v-else class="rank-list">
                        <div class="rank-row" v-for="(r, i) in topPerformers" :key="r.id">
                          <span class="rank-no">{{ i + 1 }}</span>
                          <div class="r-ava">{{ getInitial(r.user?.fullName) }}</div>
                          <div class="r-meta">
                            <span class="r-name">{{ r.user?.fullName }}</span>
                            <span class="muted xs">{{ r.department?.name }}<template v-if="r.productionLine?.name"> · {{ r.productionLine.name }}</template></span>
                          </div>
                          <b class="r-pts">{{ r.performanceScore }}</b>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </template>
            </div>
          </div>
        </main>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, IonIcon } from '@ionic/vue';
import {
  chevronBackOutline, chevronForwardOutline, chevronDownOutline,
  searchOutline, moonOutline, sunnyOutline, calendarOutline, downloadOutline,
  peopleOutline, trophyOutline, alertCircleOutline, cubeOutline, timeOutline,
  trendingUpOutline, trendingDownOutline, starOutline, ribbonOutline, personOutline,
} from 'ionicons/icons';
import { dashboardService } from '@/services/dashboard.service';
import { useAuthStore } from '@/stores/auth';
import { useSidebar } from '@/composables/useSidebar';

const router = useRouter();
const authStore = useAuthStore();

// Topbar toggle shares App.vue's rail state (no second sidebar here).
const { collapsed, mobileOpen, isMobile, toggle } = useSidebar();

const go = (path: string) => router.push(path);
const goProfile = () => router.push('/profile');
const can = (roles: string[]) => authStore.hasAnyRole(roles);

// ---- topbar UI state ----
const dark = ref(localStorage.getItem('db-dark') === 'true');
const toggleDark = () => {
  dark.value = !dark.value;
  localStorage.setItem('db-dark', String(dark.value));
};
const query = ref('');
const searchEl = ref<HTMLInputElement | null>(null);
const focusSearch = () => searchEl.value?.focus();
const onKeydown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    focusSearch();
  } else if (e.key === 'Escape' && document.activeElement === searchEl.value) {
    searchEl.value?.blur();
  }
};

const userInitial = computed(() => authStore.user?.fullName?.charAt(0)?.toUpperCase() || '?');
const currentDate = computed(() =>
  new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
);

// ---- data ----
const dashboard = ref<any>(null);
const loading = ref(false);
const trend = ref<any>(null);
const trendRange = ref<'Harian' | 'Mingguan' | 'Bulanan'>('Harian');
const periodMap = { Harian: 'daily', Mingguan: 'weekly', Bulanan: 'monthly' } as const;

// Management dashboard for staff/management roles; everyone else gets the personal view.
const isOperatorView = computed(() => {
  const roles = authStore.user?.roles || [];
  return !roles.some(r => ['Super Admin', 'Manager', 'Staff Produksi'].includes(r));
});

const sum = computed<any>(() => dashboard.value?.summary || {});
const topPerformers = computed<any[]>(() => dashboard.value?.topPerformers || []);

const fmt = (n: any) => Number(n || 0).toLocaleString('id-ID');
const getInitial = (name?: string) => name?.charAt(0)?.toUpperCase() || '?';
const formatDate = (date: string) =>
  new Date(date).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });

const operatorStats = computed(() => [
  { label: 'Total Poin Merit', value: fmt(sum.value.totalMerit), hint: 'Akumulasi penghargaan', icon: trophyOutline },
  { label: 'Total Poin Misconduct', value: fmt(sum.value.totalMisconduct), hint: 'Akumulasi pelanggaran', icon: alertCircleOutline },
  { label: 'Skor Kinerja', value: Number(sum.value.performanceScore ?? 0).toFixed(1), hint: 'Skor periode berjalan', icon: starOutline },
  { label: 'Peringkat Anda', value: '#' + (sum.value.ranking ?? 0), hint: 'Posisi di antara operator', icon: ribbonOutline },
]);

// Unified merit + misconduct feed (present in both operator and management payloads).
const activityFeed = computed<any[]>(() => {
  const merits = (dashboard.value?.recentMerits || []).map((m: any) => ({
    id: 'merit-' + m.id, kind: 'Merit', name: m.operator?.user?.fullName || m.meritType,
    points: m.points, createdAt: m.createdAt,
  }));
  const misconducts = (dashboard.value?.recentMisconducts || []).map((m: any) => ({
    id: 'misc-' + m.id, kind: 'Misconduct', name: m.operator?.user?.fullName || m.misconductType,
    points: m.points, createdAt: m.createdAt,
  }));
  return [...merits, ...misconducts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
});

// Topbar search really filters the activity table (self-contained, no extra endpoint).
const filteredActivity = computed<any[]>(() => {
  const q = query.value.trim().toLowerCase();
  let rows = activityFeed.value;
  if (q) {
    rows = rows.filter(
      r => (r.name || '').toLowerCase().includes(q) || (r.kind === 'Merit' ? 'merit' : 'misconduct').includes(q)
    );
  }
  return rows.slice(0, 8);
});

const pending = computed(() => {
  const pm = Number(sum.value.pendingMerits || 0);
  const px = Number(sum.value.pendingMisconducts || 0);
  const total = pm + px;
  return {
    pm, px, total,
    segs: total
      ? [
          { w: (pm / total) * 100, color: 'var(--db-green)' },
          { w: (px / total) * 100, color: 'var(--db-red)' },
        ]
      : [],
  };
});

const round2 = (n: number) => Math.round(n * 100) / 100;
// SVG donut: r=15.9 → circumference ≈ 100, so dasharray reads as percentages.
const donut = computed(() => {
  const m = Number(sum.value.totalMerits || 0);
  const x = Number(sum.value.totalMisconducts || 0);
  const total = m + x;
  const legend = [
    { name: 'Merit', pct: total ? Math.round((m / total) * 100) : 0, color: 'var(--db-green)' },
    { name: 'Misconduct', pct: total ? Math.round((x / total) * 100) : 0, color: 'var(--db-red)' },
  ];
  if (!total) return { center: 0, arcs: [] as any[], legend };
  const pm = (m / total) * 100;
  const px = (x / total) * 100;
  const arc = (pct: number, before: number, color: string) => ({
    dash: `${round2(pct)} ${round2(100 - pct)}`,
    off: round2((((25 - before) % 100) + 100) % 100),
    color,
  });
  return { center: total, arcs: [arc(pm, 0, 'var(--db-green)'), arc(px, pm, 'var(--db-red)')], legend };
});

const bars = computed(() => {
  const t = trend.value;
  const labels: any[] = t?.labels || [];
  if (!labels.length) return [];
  const totals = labels.map((_: any, i: number) => Number(t.merits?.[i] || 0) + Number(t.misconducts?.[i] || 0));
  const max = Math.max(1, ...totals);
  return labels.map((lbl: any, i: number) => ({ m: String(lbl), h: Math.round((totals[i] / max) * 100) }));
});

const trendDelta = computed(() => {
  const t = trend.value;
  const labels: any[] = t?.labels || [];
  if (labels.length < 2) return null;
  const totals = labels.map((_: any, i: number) => Number(t.merits?.[i] || 0) + Number(t.misconducts?.[i] || 0));
  const last = totals[totals.length - 1];
  const prev = totals[totals.length - 2];
  if (!prev) return null;
  const pct = ((last - prev) / prev) * 100;
  return { up: pct >= 0, pct: Math.abs(pct).toFixed(1) };
});

const loadDashboard = async () => {
  loading.value = true;
  try {
    const res = await dashboardService.getKPI();
    dashboard.value = res.data;
  } catch (e) {
    console.error('Failed to load dashboard:', e);
  } finally {
    loading.value = false;
  }
  if (!isOperatorView.value) loadTrend();
};

const loadTrend = async () => {
  try {
    const res = await dashboardService.getPerformanceChart(periodMap[trendRange.value]);
    trend.value = res.data;
  } catch (e) {
    console.error('Failed to load trend:', e);
    trend.value = null;
  }
};

const cycleRange = () => {
  const o: Array<'Harian' | 'Mingguan' | 'Bulanan'> = ['Harian', 'Mingguan', 'Bulanan'];
  trendRange.value = o[(o.indexOf(trendRange.value) + 1) % o.length];
  loadTrend();
};

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
  loadDashboard();
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
/* ===== DESIGN TOKENS (scoped; intentionally NOT --ion-color-* — same exception as App.vue per CLAUDE.md) ===== */
.db-shell {
  --db-canvas: #ffffff;
  --db-card: #ffffff; --db-ink: #111827; --db-ink-2: #6b7280; --db-ink-3: #9ca3af;
  --db-line: #ececee; --db-line-2: #e5e7eb; --db-track: #eceef1;
  --db-icon-bg: #f4f5f7; --db-green: #10b981; --db-green-bg: #ecfdf5;
  --db-red: #ef4444; --db-red-bg: #fef2f2; --db-brand: #ef4444;
  --db-shadow: 0 1px 2px rgba(16, 24, 40, .04), 0 4px 16px rgba(16, 24, 40, .04);
  --radius: 22px;
  height: 100%; display: flex; background: var(--db-canvas);
  font-family: 'Inter', system-ui, sans-serif; color: var(--db-ink); font-size: 14px; line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
/* ===== DARK MODE (toggled by the moon/sun button; page-scoped, no global theme change) ===== */
.db-shell.dark {
  --db-canvas: #0b0f17; --db-card: #111827; --db-ink: #f9fafb; --db-ink-2: #9ca3af; --db-ink-3: #6b7280;
  --db-line: #1f2937; --db-line-2: #243041; --db-track: #1f2937; --db-icon-bg: #1f2937;
  --db-green-bg: rgba(16, 185, 129, .12); --db-red-bg: rgba(239, 68, 68, .12);
  --db-shadow: 0 1px 2px rgba(0, 0, 0, .3), 0 8px 24px rgba(0, 0, 0, .35);
}

/* ===== PAPER SCROLL: .db-main is the real scroller (NOT ion-content) ===== */
/* Sole scroller. No top padding → the sticky glass header pins flush to the scroll
   viewport (nothing peeks above it); side/bottom padding keeps the scrollbar in the
   gutter, outside .db-panel. */
.db-main { flex: 1; min-width: 0; height: 100%; overflow-y: auto; padding: 0 14px 12px; }
.db-panel {
  background: var(--db-card); border: 1px solid var(--db-line); border-radius: var(--radius);
  box-shadow: 0 1px 3px rgba(0, 0, 0, .05), 0 14px 44px rgba(16, 24, 40, .08); position: relative;
}
.db-topbar {
  position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 14px; padding: 13px 24px;
  background: color-mix(in srgb, var(--db-card) 72%, transparent);
  backdrop-filter: blur(16px) saturate(180%); -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid var(--db-line); border-radius: var(--radius) var(--radius) 0 0;
}
.toggle, .ic {
  width: 38px; height: 38px; border-radius: 10px; display: grid; place-items: center;
  color: var(--db-ink-2); cursor: pointer; border: none; background: transparent; font-size: 20px;
}
.toggle:hover, .ic:hover { background: var(--db-icon-bg); color: var(--db-ink); }
.search {
  flex: 1; max-width: 440px; display: flex; align-items: center; gap: 9px; background: var(--db-icon-bg);
  border: 1px solid var(--db-line); border-radius: 11px; padding: 0 13px; color: var(--db-ink-3); font-size: 13px; cursor: text;
}
.search ion-icon { font-size: 17px; }
.search input { flex: 1; border: none; background: transparent; outline: none; font: inherit; color: var(--db-ink); padding: 9px 0; }
.search .kbd { font-size: 11px; background: var(--db-card); border: 1px solid var(--db-line-2); border-radius: 6px; padding: 1px 6px; }
.top-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; }
.ava-sm {
  width: 32px; height: 32px; border-radius: 50%; background: var(--db-brand); color: #fff;
  display: grid; place-items: center; font-size: 12px; font-weight: 700; margin-left: 6px; border: none; cursor: pointer;
}

.db-content { padding: 22px 24px 36px; display: flex; flex-direction: column; gap: 18px; }
.page-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.page-head h1 { font-size: 25px; font-weight: 700; letter-spacing: -.01em; }
.page-head p { font-size: 13.5px; color: var(--db-ink-2); margin-top: 3px; }
.head-right { display: flex; align-items: center; gap: 10px; }
.daterange {
  display: flex; align-items: center; gap: 8px; background: var(--db-card); border: 1px solid var(--db-line-2);
  border-radius: 11px; padding: 9px 14px; font-size: 13px; font-weight: 500; color: var(--db-ink);
}
.daterange ion-icon { font-size: 16px; color: var(--db-ink-2); }
.icon-btn {
  width: 40px; height: 40px; border-radius: 11px; background: var(--db-ink); color: var(--db-card);
  display: grid; place-items: center; border: none; cursor: pointer; font-size: 18px;
}

.loading-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 80px 0; color: var(--db-ink-2); font-size: 13px; }
.spinner { width: 34px; height: 34px; border-radius: 50%; border: 3px solid var(--db-line-2); border-top-color: var(--db-brand); animation: db-spin .8s linear infinite; }
@keyframes db-spin { to { transform: rotate(360deg); } }
.empty { padding: 40px 0; text-align: center; color: var(--db-ink-2); font-size: 13px; }

.grid { display: grid; gap: 16px; }
.g4 { grid-template-columns: repeat(4, 1fr); }
.g3 { grid-template-columns: 1.05fr 1.2fr 1.1fr; }
.g-bottom { grid-template-columns: 1.55fr 1fr; }
.card { background: var(--db-card); border: 1px solid var(--db-line); border-radius: 16px; padding: 20px; box-shadow: var(--db-shadow); }
.kpi-top { display: flex; align-items: center; gap: 10px; color: var(--db-ink-2); font-size: 13px; font-weight: 500; margin-bottom: 14px; }
.kpi-top.spread { justify-content: space-between; }
.kpi-top .lbl { display: flex; align-items: center; gap: 10px; }
.kpi-ico { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; font-size: 18px; background: var(--db-icon-bg); color: var(--db-ink-2); flex-shrink: 0; }
.kpi-ico.sm { width: 30px; height: 30px; font-size: 16px; }
.kpi-ico.lg { width: 52px; height: 52px; font-size: 26px; margin: 0 auto; }
.val { font-size: 30px; font-weight: 700; letter-spacing: -.02em; }
.val.sm { font-size: 29px; margin-top: 4px; }
.sub-note { font-size: 12px; color: var(--db-ink-2); margin-top: 6px; }
.badge { background: var(--db-red); color: #fff; font-size: 10.5px; font-weight: 600; padding: 3px 8px; border-radius: 7px; }
.up { color: var(--db-green); }
.down { color: var(--db-red); }

.card-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 4px; }
.card-head h3 { font-size: 16.5px; font-weight: 600; }
.muted { color: var(--db-ink-2); font-size: 12.5px; }
.muted.xs { font-size: 11px; }
.pill { display: flex; align-items: center; gap: 6px; border: 1px solid var(--db-line-2); border-radius: 9px; padding: 6px 12px; font-size: 12.5px; font-weight: 600; cursor: pointer; background: var(--db-card); color: var(--db-ink); }
.pill:hover { background: var(--db-icon-bg); }

.seg { display: flex; height: 9px; border-radius: 6px; overflow: hidden; margin: 14px 0 16px; gap: 2px; }
.src-list { display: flex; flex-direction: column; gap: 13px; }
.src-row { display: flex; align-items: center; gap: 10px; font-size: 13.5px; }
.src-row .d { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.src-row b { margin-left: auto; font-weight: 600; }

.bars { display: flex; align-items: flex-end; justify-content: space-between; gap: 13px; height: 190px; margin: 18px 4px 8px; }
.bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; height: 100%; justify-content: flex-end; }
.bar { width: 100%; max-width: 34px; background: var(--db-ink); border-radius: 7px; min-height: 2px; }
.b-lbl { font-size: 11.5px; color: var(--db-ink-2); }
.trend { font-size: 13px; font-weight: 600; margin-top: 4px; display: flex; align-items: center; gap: 6px; }
.trend ion-icon { font-size: 15px; }

.donut-wrap { display: flex; justify-content: center; margin: 6px 0 18px; position: relative; }
.donut-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
.donut-center .n { font-size: 23px; font-weight: 700; }
.cat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.cat { display: flex; align-items: center; gap: 8px; background: var(--db-icon-bg); border-radius: 10px; padding: 10px 12px; font-size: 12.5px; }
.cat .d { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.cat b { margin-left: auto; font-weight: 600; }

table { width: 100%; border-collapse: collapse; }
th { text-align: left; font-size: 11.5px; color: var(--db-ink-3); font-weight: 600; padding: 14px 8px 12px; }
th.amt { text-align: right; }
td { padding: 10px 8px; border-top: 1px solid var(--db-line); font-size: 13.5px; vertical-align: middle; }
.who { display: flex; align-items: center; gap: 11px; min-width: 0; }
.who span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.t-ava { width: 32px; height: 32px; flex-shrink: 0; border-radius: 50%; background: var(--db-icon-bg); color: var(--db-ink); display: grid; place-items: center; font-weight: 600; font-size: 11px; }
.tag { font-size: 11.5px; font-weight: 600; padding: 3px 11px; border-radius: 20px; white-space: nowrap; }
.tag.merit { background: var(--db-green-bg); color: #047857; }
.tag.mis { background: var(--db-red-bg); color: #b91c1c; }
.amt { text-align: right; font-weight: 600; }
.amt.pos { color: var(--db-green); }
.amt.neg { color: var(--db-red); }

.rank-list { display: flex; flex-direction: column; gap: 2px; margin-top: 6px; }
.rank-row { display: flex; align-items: center; gap: 11px; padding: 9px 4px; border-top: 1px solid var(--db-line); }
.rank-row:first-child { border-top: none; }
.rank-no { width: 20px; flex-shrink: 0; font-weight: 700; color: var(--db-ink-3); font-size: 13px; text-align: center; }
.r-ava { width: 30px; height: 30px; flex-shrink: 0; border-radius: 50%; background: var(--db-icon-bg); color: var(--db-ink); display: grid; place-items: center; font-weight: 600; font-size: 11px; }
.r-meta { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.r-name { font-size: 13.5px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.r-meta .muted { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.r-pts { margin-left: auto; font-weight: 700; color: var(--db-ink); }

/* ===== operator view ===== */
.empty-card { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 40px 20px; }
.empty-card h3 { font-size: 17px; font-weight: 600; margin-top: 6px; }
.identity { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.id-ava { width: 56px; height: 56px; flex-shrink: 0; border-radius: 50%; background: var(--db-icon-bg); color: var(--db-ink); display: grid; place-items: center; font-weight: 700; font-size: 22px; }
.id-main { flex: 1; min-width: 0; }
.id-main h2 { font-size: 18px; font-weight: 700; }
.id-rank { flex-shrink: 0; background: var(--db-icon-bg); border-radius: 12px; padding: 12px 18px; text-align: center; }

@media (max-width: 1180px) { .g4 { grid-template-columns: repeat(2, 1fr); } .g3, .g-bottom { grid-template-columns: 1fr; } }
@media (max-width: 560px) { .g4 { grid-template-columns: 1fr; } .search .kbd { display: none; } }
</style>
