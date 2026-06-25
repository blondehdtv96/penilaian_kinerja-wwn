<template>
  <page-shell title="Dashboard KPI" :subtitle="`Selamat datang, ${auth.user?.fullName ?? ''}`">
    <template #actions>
      <div class="daterange"><ion-icon :icon="calendarOutline" /> 12 bulan terakhir</div>
      <button class="icon-btn" @click="downloadExcel" :disabled="exporting" aria-label="Export Excel">
        <ion-icon :icon="downloadOutline" />
      </button>
    </template>

    <div v-if="loading" class="loading">
      <ion-spinner name="crescent" /> Memuat data dashboard…
    </div>

    <div v-else-if="error" class="card">
      <div class="empty">
        <ion-icon :icon="alertCircleOutline" style="font-size:30px;color:var(--db-red)" />
        <p>{{ error }}</p>
        <button class="btn-ghost" @click="load">Coba lagi</button>
      </div>
    </div>

    <template v-else-if="summary && trends">
      <!-- KPI ROW -->
      <div class="grid g4">
        <div class="card">
          <div class="kpi-top"><span class="kpi-ico"><ion-icon :icon="peopleOutline" /></span> Total Operator</div>
          <div class="val">{{ fmt(summary.totalOperators) }}</div>
          <div class="sub-note">operator terdaftar</div>
          <div class="btn-row">
            <button class="btn dark-btn" @click="go('/ranking')"><ion-icon :icon="trophyOutline" /> Ranking</button>
            <button class="btn" @click="go('/operators')"><ion-icon :icon="eyeOutline" /> Monitor</button>
          </div>
        </div>

        <div class="card">
          <div class="kpi-top"><span class="kpi-ico"><ion-icon :icon="bulbOutline" /></span> VoO / Ide Kaizen</div>
          <div class="val">
            {{ fmt(summary.totalVoo) }}
            <span v-if="vooDelta !== null" class="delta" :class="vooDelta >= 0 ? 'up' : 'down'">
              <ion-icon :icon="vooDelta >= 0 ? trendingUpOutline : trendingDownOutline" /> {{ Math.abs(vooDelta) }}%
            </span>
          </div>
          <div class="sub-note">{{ fmt(summary.approvedVoo) }} disetujui · {{ fmt(summary.pendingVoo) }} menunggu</div>
        </div>

        <div class="card">
          <div class="kpi-top"><span class="kpi-ico"><ion-icon :icon="alertCircleOutline" /></span> Total Pelanggaran</div>
          <div class="val">{{ fmt(summary.totalMisconduct) }}</div>
          <div class="sub-note">pelanggaran (misconduct) tercatat</div>
        </div>

        <div class="card">
          <div class="kpi-top spread">
            <span class="lbl"><span class="kpi-ico"><ion-icon :icon="statsChartOutline" /></span> Skor Rata-rata</span>
            <span class="badge-muted">0–100</span>
          </div>
          <div class="val">{{ summary.avgPerformance }}</div>
          <div class="spark"><span v-for="(h, i) in spark" :key="i" :style="{ height: h + '%' }"></span></div>
          <div class="sub-note">aktivitas VoO 12 bulan</div>
        </div>
      </div>

      <!-- MID ROW -->
      <div class="grid g3">
        <!-- Rekap catatan pembinaan -->
        <div class="card">
          <div class="card-head"><h3>Rekap Catatan Pembinaan</h3><ion-icon class="muted" :icon="arrowForwardOutline" /></div>
          <div class="muted">Total catatan tercatat</div>
          <div class="val sm">{{ fmt(recordsTotal) }}</div>
          <div class="seg">
            <span v-for="(r, i) in records" :key="i" :style="{ width: r.pct + '%', background: r.color }"></span>
          </div>
          <div class="src-list">
            <div class="src-row" v-for="r in records" :key="r.name">
              <span class="d" :style="{ background: r.color }"></span> {{ r.name }} <b>{{ fmt(r.count) }}</b>
            </div>
          </div>
          <div class="footnote"><ion-icon :icon="lockClosedOutline" /> Semua event ter-hash on-chain — audit trail tidak bisa diubah.</div>
        </div>

        <!-- Status VoO (donut) -->
        <div class="card">
          <div class="card-head"><h3>Status VoO</h3><ion-icon class="muted" :icon="chevronForwardOutline" /></div>
          <div class="muted">Distribusi seluruh pengajuan</div>
          <div class="donut-wrap">
            <svg width="172" height="172" viewBox="0 0 42 42">
              <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="var(--db-track)" stroke-width="6" />
              <circle
                v-for="(d, i) in donut" :key="i" cx="21" cy="21" r="15.9" fill="transparent"
                :stroke="d.color" stroke-width="6" :stroke-dasharray="d.dash" :stroke-dashoffset="d.off"
              />
            </svg>
            <div class="donut-center"><div class="n">{{ fmt(summary.totalVoo) }}</div><div class="muted xs">VoO</div></div>
          </div>
          <div class="cat-grid">
            <div class="cat" v-for="s in vooStatus" :key="s.name">
              <span class="d" :style="{ background: s.color }"></span> {{ s.name }} <b>{{ pct(s.count) }}%</b>
            </div>
          </div>
        </div>

        <!-- Target persetujuan -->
        <div class="card">
          <div class="card-head"><h3>Target Persetujuan VoO</h3><button class="pill" @click="go('/reports')">Laporan</button></div>
          <div class="muted">{{ approvalPct }}% disetujui final</div>
          <div class="goal-val">{{ fmt(summary.approvedVoo) }} <small>dari {{ fmt(summary.totalVoo) }} pengajuan</small></div>
          <div class="progress"><span :style="{ width: approvalPct + '%' }"></span></div>
          <div class="rank-list" style="margin-top:18px">
            <div class="rank-row"><span class="r-name">Menunggu persetujuan</span><b class="r-pts" style="color:var(--db-amber-ink)">{{ fmt(summary.pendingVoo) }}</b></div>
            <div class="rank-row"><span class="r-name">Konseling</span><b class="r-pts" style="color:var(--db-ink-2)">{{ fmt(summary.totalCounseling) }}</b></div>
            <div class="rank-row"><span class="r-name">Kartu Kuning</span><b class="r-pts" style="color:var(--db-ink-2)">{{ fmt(summary.totalKartuKuning) }}</b></div>
            <div class="rank-row"><span class="r-name">Surat Peringatan</span><b class="r-pts" style="color:var(--db-red-ink)">{{ fmt(summary.totalSuratPeringatan) }}</b></div>
          </div>
        </div>
      </div>

      <!-- BOTTOM: tren 12 bulan -->
      <div class="card">
        <div class="card-head">
          <h3>Tren VoO vs Pelanggaran — 12 Bulan</h3>
          <div class="legend">
            <span><i class="dot green"></i> VoO</span>
            <span><i class="dot red"></i> Pelanggaran</span>
          </div>
        </div>
        <div class="bars">
          <div class="bar-col" v-for="b in monthsBars" :key="b.label">
            <div class="pair">
              <div class="bar green" :style="{ height: b.vooH + '%' }" :title="`VoO: ${b.voo}`"></div>
              <div class="bar red" :style="{ height: b.misH + '%' }" :title="`Pelanggaran: ${b.mis}`"></div>
            </div>
            <span class="b-lbl">{{ b.label }}</span>
          </div>
        </div>
      </div>
    </template>
  </page-shell>
</template>

<script setup lang="ts">
import { IonIcon, IonSpinner } from '@ionic/vue';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  calendarOutline, downloadOutline, peopleOutline, bulbOutline, alertCircleOutline,
  statsChartOutline, trophyOutline, eyeOutline, trendingUpOutline, trendingDownOutline,
  arrowForwardOutline, chevronForwardOutline, lockClosedOutline,
} from 'ionicons/icons';
import PageShell from '@/components/PageShell.vue';
import { useAuthStore } from '@/stores/auth';
import { dashboardService } from '@/services/dashboard.service';
import { useRealtime } from '@/composables/useRealtime';
import type { DashboardKPI } from '@/types';

const auth = useAuthStore();
const router = useRouter();
const go = (p: string) => router.push(p);

const kpi = ref<DashboardKPI | null>(null);
const loading = ref(true);
const error = ref('');
const exporting = ref(false);

const summary = computed(() => kpi.value?.summary);
const trends = computed(() => kpi.value?.trends);

const fmt = (n: number) => (n ?? 0).toLocaleString('id-ID');

const greys = ['var(--db-grey-1)', 'var(--db-grey-2)', 'var(--db-grey-3)', 'var(--db-grey-4)'];
const monthShort = (ym: string) => {
  const idx = parseInt((ym ?? '').split('-')[1] ?? '1', 10) - 1;
  return ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][idx] ?? ym;
};

// Spark (kartu skor): vooTrend dinormalisasi
const spark = computed(() => {
  const t = trends.value?.vooTrend ?? [];
  const max = Math.max(1, ...t);
  return t.map((v) => Math.max(4, Math.round((v / max) * 100)));
});

// Delta VoO bulan ini vs bulan lalu
const vooDelta = computed<number | null>(() => {
  const t = trends.value?.vooTrend ?? [];
  if (t.length < 2) return null;
  const cur = t[t.length - 1];
  const prev = t[t.length - 2];
  if (!prev) return null;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
});

// Rekap pembinaan (segment + list)
const records = computed(() => {
  const s = summary.value;
  if (!s) return [];
  const items = [
    { name: 'Pelanggaran', count: s.totalMisconduct },
    { name: 'Konseling', count: s.totalCounseling },
    { name: 'Kartu Kuning', count: s.totalKartuKuning },
    { name: 'Surat Peringatan', count: s.totalSuratPeringatan },
  ];
  const total = items.reduce((a, b) => a + b.count, 0) || 1;
  return items.map((it, i) => ({ ...it, pct: Math.round((it.count / total) * 100), color: greys[i] }));
});
const recordsTotal = computed(() => records.value.reduce((a, b) => a + b.count, 0));

// Donut status VoO
const vooStatus = computed(() => {
  const s = summary.value;
  if (!s) return [];
  const lainnya = Math.max(0, s.totalVoo - s.approvedVoo - s.pendingVoo);
  return [
    { name: 'Disetujui', count: s.approvedVoo, color: '#10b981' },
    { name: 'Menunggu', count: s.pendingVoo, color: '#f59e0b' },
    { name: 'Proses/Ditolak', count: lainnya, color: '#9ca3af' },
  ];
});
const vooStatusTotal = computed(() => Math.max(1, vooStatus.value.reduce((a, b) => a + b.count, 0)));
const pct = (n: number) => Math.round((n / vooStatusTotal.value) * 100);
const donut = computed(() => {
  let cum = 0;
  return vooStatus.value.map((it) => {
    const p = (it.count / vooStatusTotal.value) * 100;
    const seg = { color: it.color, dash: `${p} ${100 - p}`, off: 25 - cum };
    cum += p;
    return seg;
  });
});

const approvalPct = computed(() => {
  const s = summary.value;
  if (!s || !s.totalVoo) return 0;
  return Math.round((s.approvedVoo / s.totalVoo) * 100);
});

// Bar 12 bulan (VoO + Pelanggaran)
const maxTrend = computed(() =>
  Math.max(1, ...(trends.value?.vooTrend ?? []), ...(trends.value?.misconductTrend ?? []))
);
const monthsBars = computed(() => {
  const t = trends.value;
  if (!t) return [];
  return t.months.map((m, i) => ({
    label: monthShort(m),
    voo: t.vooTrend[i] ?? 0,
    mis: t.misconductTrend[i] ?? 0,
    vooH: Math.max(2, Math.round(((t.vooTrend[i] ?? 0) / maxTrend.value) * 100)),
    misH: Math.max(2, Math.round(((t.misconductTrend[i] ?? 0) / maxTrend.value) * 100)),
  }));
});

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await dashboardService.kpi();
    if (data?.success) kpi.value = data.data;
    else error.value = 'Gagal memuat data dashboard.';
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal terhubung ke server.';
  } finally {
    loading.value = false;
  }
};

const downloadExcel = async () => {
  exporting.value = true;
  try {
    const res = await dashboardService.exportExcel();
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan_kinerja_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    /* notifikasi error ditangani di fase berikutnya */
  } finally {
    exporting.value = false;
  }
};

onMounted(load);
// Dashboard agregat: throttle lebih panjang agar tak refetch beruntun saat burst event.
useRealtime(['voo:changed', 'record:changed'], load, { throttleMs: 800 });
</script>

<style scoped>
.legend {
  display: flex;
  gap: 14px;
  font-size: 12px;
  color: var(--db-ink-2);
  font-weight: 500;
}
.legend span { display: inline-flex; align-items: center; gap: 6px; }
.legend .dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
.legend .dot.green { background: var(--db-green); }
.legend .dot.red { background: var(--db-red); }

/* Pasangan bar (VoO + Pelanggaran) per bulan */
.pair {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 3px;
  width: 100%;
  height: 100%;
}
.pair .bar { max-width: 12px; }
</style>
