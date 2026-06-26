<template>
  <page-shell title="Monitor Pelanggaran" subtitle="Pantau seluruh catatan pelanggaran, konseling, kartu kuning, dan surat peringatan">

    <!-- Tab navigation -->
    <div class="tab-bar">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="tab-btn"
        :class="{ active: activeTab === t.key }"
        @click="switchTab(t.key)"
      >
        <ion-icon :icon="t.icon" />
        {{ t.label }}
        <span class="tab-count" v-if="counts[t.key] > 0">{{ counts[t.key] }}</span>
      </button>
    </div>

    <!-- Summary bar -->
    <div class="summary-row" v-if="!loading">
      <div class="sumcard" v-for="s in activeSummary" :key="s.label">
        <div class="sumcard-val" :class="s.cls">{{ s.count }}</div>
        <div class="sumcard-label">{{ s.label }}</div>
      </div>
    </div>

    <!-- Filter -->
    <div class="filter-bar" v-if="activeTab === 'misconduct'">
      <div class="filter-group">
        <label>Keparahan</label>
        <select v-model="filterSeverity" @change="applyFilter">
          <option value="">Semua</option>
          <option value="low">Rendah</option>
          <option value="medium">Sedang</option>
          <option value="high">Tinggi</option>
          <option value="critical">Kritis</option>
        </select>
      </div>
      <button class="btn-ghost btn-sm" :disabled="loading" @click="loadAll(true)">
        <ion-icon :icon="refreshOutline" /> Muat Ulang
      </button>
    </div>
    <div class="filter-bar" v-else>
      <button class="btn-ghost btn-sm" :disabled="loading" @click="loadAll(true)">
        <ion-icon :icon="refreshOutline" /> Muat Ulang
      </button>
    </div>

    <!-- Content -->
    <div class="card">
      <div class="card-head">
        <h3>{{ activeTabMeta.label }}</h3>
        <span class="muted">{{ activeItems.length }} catatan</span>
      </div>

      <div v-if="loading" class="loading"><ion-spinner name="crescent" /> Memuat data…</div>
      <div v-else-if="error" class="empty err-text">{{ error }}</div>
      <div v-else-if="activeItems.length === 0" class="empty">Tidak ada catatan untuk ditampilkan.</div>

      <!-- Misconduct table -->
      <div v-else-if="activeTab === 'misconduct'" class="table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>Operator</th><th>Jenis</th><th>Keparahan</th><th>Poin Penalti</th><th>Dicatat Oleh</th><th>Tanggal</th><th>Detail</th></tr>
          </thead>
          <tbody>
            <template v-for="(m, idx) in activeItems" :key="m.id">
              <tr>
                <td class="muted">{{ idx + 1 }}</td>
                <td>
                  <div class="who">
                    <div class="t-ava">{{ initials(m.operator?.user?.fullName) }}</div>
                    <span>{{ m.operator?.user?.fullName ?? '-' }}</span>
                  </div>
                </td>
                <td>{{ m.type }}</td>
                <td>
                  <span class="status" :class="severityMeta(m.severity).cls">
                    {{ severityMeta(m.severity).label }}
                  </span>
                </td>
                <td>
                  <span v-if="m.points > 0" class="pts-bad">-{{ m.points }}</span>
                  <span v-else class="muted">-</span>
                </td>
                <td class="muted">{{ m.createdBy?.fullName ?? '-' }}</td>
                <td class="muted">{{ fmtDateShort(m.createdAt) }}</td>
                <td>
                  <button class="btn-ghost btn-xs" @click="toggleExpand(m.id)">
                    <ion-icon :icon="expandId === m.id ? chevronUpOutline : chevronDownOutline" />
                  </button>
                </td>
              </tr>
              <tr v-if="expandId === m.id" class="detail-row">
                <td colspan="8">
                  <div class="detail-box">
                    <div class="detail-section">
                      <div class="detail-label">Deskripsi</div>
                      <div class="detail-val">{{ m.description || '-' }}</div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Counseling table -->
      <div v-else-if="activeTab === 'counseling'" class="table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>Operator</th><th>Topik</th><th>Foreman</th><th>Tanggal</th><th>Detail</th></tr>
          </thead>
          <tbody>
            <template v-for="(c, idx) in activeItems" :key="c.id">
              <tr>
                <td class="muted">{{ idx + 1 }}</td>
                <td>
                  <div class="who">
                    <div class="t-ava">{{ initials(c.operator?.user?.fullName) }}</div>
                    <span>{{ c.operator?.user?.fullName ?? '-' }}</span>
                  </div>
                </td>
                <td>{{ c.topic }}</td>
                <td class="muted">{{ c.foreman?.fullName ?? '-' }}</td>
                <td class="muted">{{ fmtDateShort(c.createdAt) }}</td>
                <td>
                  <button class="btn-ghost btn-xs" @click="toggleExpand(c.id)">
                    <ion-icon :icon="expandId === c.id ? chevronUpOutline : chevronDownOutline" />
                  </button>
                </td>
              </tr>
              <tr v-if="expandId === c.id" class="detail-row">
                <td colspan="6">
                  <div class="detail-box">
                    <div class="detail-section">
                      <div class="detail-label">Catatan</div>
                      <div class="detail-val">{{ c.notes || '-' }}</div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Kartu Kuning table -->
      <div v-else-if="activeTab === 'kartu-kuning'" class="table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>Operator</th><th>Alasan</th><th>Diterbitkan Oleh</th><th>Tanggal Terbit</th></tr>
          </thead>
          <tbody>
            <tr v-for="(k, idx) in activeItems" :key="k.id">
              <td class="muted">{{ idx + 1 }}</td>
              <td>
                <div class="who">
                  <div class="t-ava">{{ initials(k.operator?.user?.fullName) }}</div>
                  <span>{{ k.operator?.user?.fullName ?? '-' }}</span>
                </div>
              </td>
              <td>{{ k.reason }}</td>
              <td class="muted">{{ k.issuedBy?.fullName ?? '-' }}</td>
              <td class="muted">{{ fmtDateShort(k.issuedAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Surat Peringatan table -->
      <div v-else-if="activeTab === 'surat-peringatan'" class="table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>Operator</th><th>Level SP</th><th>Alasan</th><th>Diterbitkan Oleh</th><th>Tanggal Terbit</th></tr>
          </thead>
          <tbody>
            <tr v-for="(s, idx) in activeItems" :key="s.id">
              <td class="muted">{{ idx + 1 }}</td>
              <td>
                <div class="who">
                  <div class="t-ava">{{ initials(s.operator?.user?.fullName) }}</div>
                  <span>{{ s.operator?.user?.fullName ?? '-' }}</span>
                </div>
              </td>
              <td>
                <span class="badge-sp" :class="'sp' + s.level">SP {{ s.level }}</span>
              </td>
              <td>{{ s.reason }}</td>
              <td class="muted">{{ s.issuedBy?.fullName ?? '-' }}</td>
              <td class="muted">{{ fmtDateShort(s.issuedAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </page-shell>
</template>

<script setup lang="ts">
import { IonIcon, IonSpinner } from '@ionic/vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import {
  refreshOutline, alertCircleOutline, chatbubblesOutline,
  cardOutline, documentAttachOutline, chevronDownOutline, chevronUpOutline,
} from 'ionicons/icons';
import PageShell from '@/components/PageShell.vue';
import { recordsService } from '@/services/records.service';
import { useRealtime } from '@/composables/useRealtime';
import { fmtDateShort, severityMeta, initials } from '@/utils/format';
import type { MisconductItem, CounselingItem, KartuKuningItem, SuratPeringatanItem } from '@/types';

type TabKey = 'misconduct' | 'counseling' | 'kartu-kuning' | 'surat-peringatan';

const tabs = [
  { key: 'misconduct' as TabKey, label: 'Pelanggaran', icon: alertCircleOutline },
  { key: 'counseling' as TabKey, label: 'Konseling', icon: chatbubblesOutline },
  { key: 'kartu-kuning' as TabKey, label: 'Kartu Kuning', icon: cardOutline },
  { key: 'surat-peringatan' as TabKey, label: 'Surat Peringatan', icon: documentAttachOutline },
];

const activeTab = ref<TabKey>('misconduct');
const loading = ref(true);
const error = ref('');
const filterSeverity = ref('');
const expandId = ref<number | null>(null);

const misconducts = ref<MisconductItem[]>([]);
const counselings = ref<CounselingItem[]>([]);
const kartuKunings = ref<KartuKuningItem[]>([]);
const suratPeringatan = ref<SuratPeringatanItem[]>([]);

const counts = computed<Record<TabKey, number>>(() => ({
  'misconduct': misconducts.value.length,
  'counseling': counselings.value.length,
  'kartu-kuning': kartuKunings.value.length,
  'surat-peringatan': suratPeringatan.value.length,
}));

const activeTabMeta = computed(() => tabs.find((t) => t.key === activeTab.value)!);

const activeItems = computed<any[]>(() => {
  switch (activeTab.value) {
    case 'misconduct':
      return filterSeverity.value
        ? misconducts.value.filter((m) => m.severity === filterSeverity.value)
        : misconducts.value;
    case 'counseling': return counselings.value;
    case 'kartu-kuning': return kartuKunings.value;
    case 'surat-peringatan': return suratPeringatan.value;
    default: return [];
  }
});

const activeSummary = computed(() => {
  if (activeTab.value === 'misconduct') {
    return [
      { label: 'Total', count: misconducts.value.length, cls: 'all' },
      { label: 'Rendah', count: misconducts.value.filter((m) => m.severity === 'low').length, cls: 'low' },
      { label: 'Sedang', count: misconducts.value.filter((m) => m.severity === 'medium').length, cls: 'medium' },
      { label: 'Tinggi', count: misconducts.value.filter((m) => m.severity === 'high').length, cls: 'high' },
      { label: 'Kritis', count: misconducts.value.filter((m) => m.severity === 'critical').length, cls: 'critical' },
    ];
  }
  if (activeTab.value === 'surat-peringatan') {
    return [
      { label: 'Total', count: suratPeringatan.value.length, cls: 'all' },
      { label: 'SP 1', count: suratPeringatan.value.filter((s) => s.level === 1).length, cls: 'sp1c' },
      { label: 'SP 2', count: suratPeringatan.value.filter((s) => s.level === 2).length, cls: 'sp2c' },
      { label: 'SP 3', count: suratPeringatan.value.filter((s) => s.level === 3).length, cls: 'sp3c' },
    ];
  }
  return [{ label: 'Total', count: activeItems.value.length, cls: 'all' }];
});

const loadAll = async (showSpinner = true) => {
  if (showSpinner) loading.value = true;
  error.value = '';
  try {
    const [r1, r2, r3, r4] = await Promise.all([
      recordsService.listMisconduct(),
      recordsService.listCounseling(),
      recordsService.listKartuKuning(),
      recordsService.listSuratPeringatan(),
    ]);
    if (r1.data?.success) misconducts.value = r1.data.data;
    if (r2.data?.success) counselings.value = r2.data.data;
    if (r3.data?.success) kartuKunings.value = r3.data.data;
    if (r4.data?.success) suratPeringatan.value = r4.data.data;
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal memuat data.';
  } finally {
    loading.value = false;
  }
};

const switchTab = (key: TabKey) => {
  activeTab.value = key;
  filterSeverity.value = '';
  expandId.value = null;
};

const applyFilter = () => {
  expandId.value = null;
};

const toggleExpand = (id: number) => {
  expandId.value = expandId.value === id ? null : id;
};

// Realtime: 'record:changed' mendorong refresh — menggantikan polling 30s.
const onFocus = () => loadAll(false);
useRealtime('record:changed', () => loadAll(false));

onMounted(() => {
  loadAll();
  window.addEventListener('focus', onFocus);
  document.addEventListener('visibilitychange', onFocus);
});
onUnmounted(() => {
  window.removeEventListener('focus', onFocus);
  document.removeEventListener('visibilitychange', onFocus);
});
</script>

<style scoped>
/* Tab bar */
.tab-bar {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.tab-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  border-radius: 11px;
  border: 1px solid var(--db-line);
  background: var(--db-card);
  color: var(--db-ink-2);
  font: inherit;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.14s, color 0.14s, box-shadow 0.14s;
}
.tab-btn ion-icon { font-size: 17px; }
.tab-btn:hover { background: var(--db-canvas); color: var(--db-ink); }
.tab-btn.active {
  background: var(--db-card);
  color: var(--db-ink);
  font-weight: 700;
  box-shadow: var(--db-shadow);
  border-color: var(--db-brand);
}
.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 10px;
  font-size: 10.5px;
  font-weight: 700;
  background: var(--db-brand);
  color: #fff;
}

/* Summary cards */
.summary-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.sumcard {
  flex: 1;
  min-width: 90px;
  background: var(--db-card);
  border-radius: 14px;
  box-shadow: var(--db-shadow);
  padding: 12px 16px;
  text-align: center;
}
.sumcard-val { font-size: 24px; font-weight: 800; line-height: 1; margin-bottom: 4px; }
.sumcard-val.all      { color: var(--db-ink); }
.sumcard-val.low      { color: #10b981; }
.sumcard-val.medium   { color: #f59e0b; }
.sumcard-val.high     { color: #f97316; }
.sumcard-val.critical { color: var(--db-brand); }
.sumcard-val.sp1c     { color: #f59e0b; }
.sumcard-val.sp2c     { color: #f97316; }
.sumcard-val.sp3c     { color: var(--db-brand); }
.sumcard-label { font-size: 10.5px; color: var(--db-ink-3); font-weight: 600; text-transform: uppercase; }

/* Filter bar */
.filter-bar {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.filter-group { display: flex; flex-direction: column; gap: 5px; }
.filter-group label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--db-ink-3);
}
.filter-group select {
  border: 1px solid var(--db-line-2);
  border-radius: 9px;
  padding: 8px 12px;
  font: inherit;
  font-size: 13px;
  background: var(--db-card);
  color: var(--db-ink);
  cursor: pointer;
}
.filter-group select:focus { outline: none; border-color: var(--db-brand); }

/* Points */
.pts-bad { font-weight: 700; color: var(--db-brand); }
.err-text { color: var(--db-brand); }

/* SP level badges */
.badge-sp {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.badge-sp.sp1 { background: #fef3c7; color: #92400e; }
.badge-sp.sp2 { background: #ffedd5; color: #9a3412; }
.badge-sp.sp3 { background: #fee2e2; color: #991b1b; }

/* Expanded detail row */
.detail-row td { padding: 0 !important; background: var(--db-canvas); }
.detail-box {
  padding: 14px 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px 32px;
  border-top: 1px solid var(--db-line);
}
.detail-section { min-width: 180px; }
.detail-label {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--db-ink-3);
  margin-bottom: 4px;
}
.detail-val { font-size: 13.5px; color: var(--db-ink); line-height: 1.5; }

@media (max-width: 720px) {
  .tab-btn { padding: 8px 12px; font-size: 12.5px; }
  .sumcard { min-width: 70px; padding: 10px 10px; }
  .sumcard-val { font-size: 20px; }
}
</style>
