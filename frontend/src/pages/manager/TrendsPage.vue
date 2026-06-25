<template>
  <page-shell title="Analisis Tren" subtitle="Tren VoO / Ide Kaizen vs Pelanggaran — 12 bulan terakhir">
    <div v-if="loading" class="loading"><ion-spinner name="crescent" /> Memuat…</div>
    <div v-else-if="error" class="card"><div class="empty">{{ error }}</div></div>

    <template v-else-if="t">
      <div class="grid g4">
        <div class="card"><div class="muted">Total VoO (12 bln)</div><div class="val">{{ fmtNum(sum(t.vooTrend)) }}</div></div>
        <div class="card"><div class="muted">Total Pelanggaran (12 bln)</div><div class="val">{{ fmtNum(sum(t.misconductTrend)) }}</div></div>
        <div class="card">
          <div class="muted">VoO Bulan Ini</div>
          <div class="val">
            {{ fmtNum(last(t.vooTrend)) }}
            <span v-if="delta !== null" class="delta" :class="delta >= 0 ? 'up' : 'down'">
              <ion-icon :icon="delta >= 0 ? trendingUpOutline : trendingDownOutline" /> {{ Math.abs(delta) }}%
            </span>
          </div>
        </div>
        <div class="card"><div class="muted">Rata-rata VoO / bln</div><div class="val">{{ avg(t.vooTrend) }}</div></div>
      </div>

      <div class="card">
        <div class="card-head">
          <h3>Tren 12 Bulan</h3>
          <div class="legend"><span><i class="dot green"></i> VoO</span><span><i class="dot red"></i> Pelanggaran</span></div>
        </div>
        <div class="bars">
          <div class="bar-col" v-for="b in bars" :key="b.label">
            <div class="pair">
              <div class="bar green" :style="{ height: b.vooH + '%' }" :title="`VoO: ${b.voo}`"></div>
              <div class="bar red" :style="{ height: b.misH + '%' }" :title="`Pelanggaran: ${b.mis}`"></div>
            </div>
            <span class="b-lbl">{{ b.label }}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Rincian Bulanan</h3></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Bulan</th><th class="amt">VoO</th><th class="amt">Pelanggaran</th><th class="amt">Selisih</th></tr></thead>
            <tbody>
              <tr v-for="b in bars" :key="b.label">
                <td>{{ b.label }}</td>
                <td class="amt pos">{{ b.voo }}</td>
                <td class="amt neg">{{ b.mis }}</td>
                <td class="amt" :class="b.voo - b.mis >= 0 ? 'pos' : 'neg'">{{ b.voo - b.mis >= 0 ? '+' : '' }}{{ b.voo - b.mis }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </page-shell>
</template>

<script setup lang="ts">
import { IonIcon, IonSpinner } from '@ionic/vue';
import { computed, onMounted, ref } from 'vue';
import { trendingUpOutline, trendingDownOutline } from 'ionicons/icons';
import PageShell from '@/components/PageShell.vue';
import { dashboardService } from '@/services/dashboard.service';
import { useRealtime } from '@/composables/useRealtime';
import { fmtNum, monthShort } from '@/utils/format';
import type { DashboardKPI } from '@/types';

const t = ref<DashboardKPI['trends'] | null>(null);
const loading = ref(true);
const error = ref('');

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
const last = (arr: number[]) => arr[arr.length - 1] ?? 0;
const avg = (arr: number[]) => (arr.length ? Math.round((sum(arr) / arr.length) * 10) / 10 : 0);

const delta = computed<number | null>(() => {
  const a = t.value?.vooTrend ?? [];
  if (a.length < 2) return null;
  const cur = a[a.length - 1];
  const prev = a[a.length - 2];
  if (!prev) return null;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
});

const bars = computed(() => {
  if (!t.value) return [];
  const max = Math.max(1, ...t.value.vooTrend, ...t.value.misconductTrend);
  return t.value.months.map((m, i) => ({
    label: monthShort(m),
    voo: t.value!.vooTrend[i] ?? 0,
    mis: t.value!.misconductTrend[i] ?? 0,
    vooH: Math.max(2, Math.round(((t.value!.vooTrend[i] ?? 0) / max) * 100)),
    misH: Math.max(2, Math.round(((t.value!.misconductTrend[i] ?? 0) / max) * 100)),
  }));
});

const load = async () => {
  try {
    const { data } = await dashboardService.kpi();
    if (data?.success) t.value = data.data.trends;
    else error.value = 'Gagal memuat tren.';
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal memuat tren.';
  } finally {
    loading.value = false;
  }
};

onMounted(load);
useRealtime(['voo:changed', 'record:changed'], load, { throttleMs: 800 });
</script>
