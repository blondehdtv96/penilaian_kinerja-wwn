<template>
  <page-shell title="Monitor VoO / Ide Kaizen" subtitle="Pantau seluruh pengajuan VoO dan Ide Kaizen dari operator">
    <!-- Filter bar -->
    <div class="filter-bar">
      <div class="filter-group">
        <label>Status</label>
        <select v-model="filterStatus" @change="load()">
          <option value="">Semua Status</option>
          <option value="pending">Menunggu Foreman</option>
          <option value="approved_foreman">Diteruskan ke Manager</option>
          <option value="approved_final">Disetujui Final</option>
          <option value="rejected">Ditolak</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Jenis</label>
        <select v-model="filterType" @change="load()">
          <option value="">Semua Jenis</option>
          <option value="VoO">VoO</option>
          <option value="IdeKaizen">Ide Kaizen</option>
        </select>
      </div>
      <button class="btn-ghost btn-sm" :disabled="loading" @click="load(true)">
        <ion-icon :icon="refreshOutline" /> Muat Ulang
      </button>
    </div>

    <!-- Summary cards -->
    <div class="summary-row" v-if="!loading && items.length > 0">
      <div class="sumcard" v-for="s in summary" :key="s.label">
        <div class="sumcard-val" :class="s.cls">{{ s.count }}</div>
        <div class="sumcard-label">{{ s.label }}</div>
      </div>
    </div>

    <!-- Table -->
    <div class="card mt">
      <div class="card-head">
        <h3>Daftar Pengajuan</h3>
        <span class="muted">{{ filtered.length }} pengajuan</span>
      </div>

      <div v-if="loading" class="loading"><ion-spinner name="crescent" /> Memuat data…</div>
      <div v-else-if="error" class="empty err-text">{{ error }}</div>
      <div v-else-if="filtered.length === 0" class="empty">Tidak ada pengajuan yang cocok dengan filter.</div>

      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Operator</th>
              <th>Judul</th>
              <th>Jenis</th>
              <th>Status</th>
              <th>Poin</th>
              <th>Tanggal</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(v, idx) in filtered" :key="v.id">
              <tr>
                <td class="muted">{{ idx + 1 }}</td>
                <td>
                  <div class="who">
                    <div class="t-ava"><UserAvatar /></div>
                    <span>{{ v.operator?.user?.fullName ?? '-' }}</span>
                  </div>
                </td>
                <td class="ttl">{{ v.title }}</td>
                <td>
                  <span class="badge-type" :class="v.type === 'IdeKaizen' ? 'kaizen' : 'voo'">
                    {{ v.type === 'IdeKaizen' ? 'Ide Kaizen' : 'VoO' }}
                  </span>
                </td>
                <td>
                  <span class="status" :class="vooStatusMeta(v.status).cls">
                    {{ vooStatusMeta(v.status).label }}
                  </span>
                </td>
                <td>
                  <span v-if="v.points > 0" class="pts">+{{ v.points }}</span>
                  <span v-else class="muted">-</span>
                </td>
                <td class="muted">{{ fmtDateShort(v.createdAt) }}</td>
                <td>
                  <button class="btn-ghost btn-xs" @click="toggleExpand(v.id)">
                    <ion-icon :icon="expandId === v.id ? chevronUpOutline : chevronDownOutline" />
                  </button>
                </td>
              </tr>
              <!-- Expanded detail row -->
              <tr v-if="expandId === v.id" class="detail-row">
                <td colspan="8">
                  <div class="detail-box">
                    <div class="detail-section">
                      <div class="detail-label">Deskripsi</div>
                      <div class="detail-val">{{ v.description || '-' }}</div>
                    </div>
                    <div class="detail-section" v-if="v.submittedBy">
                      <div class="detail-label">Diajukan oleh</div>
                      <div class="detail-val">{{ v.submittedBy.fullName }}</div>
                    </div>
                    <div class="detail-section" v-if="v.sumberVoo">
                      <div class="detail-label">Sumber VoO</div>
                      <div class="detail-val">{{ v.sumberVoo }}</div>
                    </div>
                    <div class="detail-section" v-if="v.kategori4m">
                      <div class="detail-label">Kategori 4M</div>
                      <div class="detail-val">{{ v.kategori4m }}</div>
                    </div>
                    <div class="detail-section" v-if="v.rejectionReason">
                      <div class="detail-label">Alasan Penolakan</div>
                      <div class="detail-val err-text">{{ v.rejectionReason }}</div>
                    </div>
                    <div class="detail-section" v-if="photoCount(v) > 0">
                      <div class="detail-label">Foto ({{ photoCount(v) }})</div>
                      <div class="photo-row">
                        <img
                          v-for="(photo, pi) in parsePhotos(v.photos)"
                          :key="pi"
                          :src="photo"
                          class="thumb"
                          :alt="'Foto ' + (pi + 1)"
                          @click="openPhoto(photo)"
                        />
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Photo lightbox -->
    <div v-if="lightboxPhoto" class="lightbox" @click="lightboxPhoto = null">
      <img :src="lightboxPhoto" alt="Preview foto" @click.stop />
      <button class="lb-close" @click="lightboxPhoto = null" aria-label="Tutup">✕</button>
    </div>
  </page-shell>
</template>

<script setup lang="ts">
import { IonIcon, IonSpinner } from '@ionic/vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import {
  refreshOutline, chevronDownOutline, chevronUpOutline,
} from 'ionicons/icons';
import PageShell from '@/components/PageShell.vue';
import { vooService } from '@/services/voo.service';
import { useRealtime } from '@/composables/useRealtime';
import { fmtDateShort, vooStatusMeta, parsePhotos } from '@/utils/format';
import UserAvatar from '@/components/UserAvatar.vue';
import type { VooSubmission } from '@/types';

const items = ref<VooSubmission[]>([]);
const loading = ref(true);
const error = ref('');
const filterStatus = ref('');
const filterType = ref('');
const expandId = ref<number | null>(null);
const lightboxPhoto = ref<string | null>(null);

const filtered = computed(() => {
  return items.value.filter((v) => {
    if (filterStatus.value && v.status !== filterStatus.value) return false;
    if (filterType.value && v.type !== filterType.value) return false;
    return true;
  });
});

const summary = computed(() => [
  { label: 'Total', count: items.value.length, cls: 'all' },
  { label: 'Pending', count: items.value.filter((v) => v.status === 'pending').length, cls: 'pending' },
  { label: 'Diteruskan', count: items.value.filter((v) => v.status === 'approved_foreman').length, cls: 'foreman' },
  { label: 'Disetujui', count: items.value.filter((v) => v.status === 'approved_final').length, cls: 'final' },
  { label: 'Ditolak', count: items.value.filter((v) => v.status === 'rejected').length, cls: 'rejected' },
]);

const photoCount = (v: VooSubmission) => parsePhotos(v.photos).length;

const load = async (showSpinner = true) => {
  if (showSpinner) loading.value = true;
  error.value = '';
  try {
    const params: Record<string, string> = {};
    const { data } = await vooService.getAll(params);
    if (data?.success) items.value = data.data;
    else error.value = 'Gagal memuat data pengajuan.';
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal memuat data.';
  } finally {
    loading.value = false;
  }
};

const toggleExpand = (id: number) => {
  expandId.value = expandId.value === id ? null : id;
};

const openPhoto = (src: string) => {
  lightboxPhoto.value = src;
};

// Realtime: server mendorong 'voo:changed' saat ada perubahan — menggantikan polling 30s.
// Refresh saat tab kembali fokus dipertahankan sebagai fallback bila socket sempat terputus.
const onFocus = () => load(false);
useRealtime('voo:changed', () => load(false));

onMounted(() => {
  load();
  window.addEventListener('focus', onFocus);
  document.addEventListener('visibilitychange', onFocus);
});
onUnmounted(() => {
  window.removeEventListener('focus', onFocus);
  document.removeEventListener('visibilitychange', onFocus);
});
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
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

/* Summary cards */
.summary-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.sumcard {
  flex: 1;
  min-width: 100px;
  background: var(--db-card);
  border-radius: 14px;
  box-shadow: var(--db-shadow);
  padding: 14px 18px;
  text-align: center;
}
.sumcard-val {
  font-size: 26px;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 4px;
}
.sumcard-val.all     { color: var(--db-ink); }
.sumcard-val.pending { color: #d97706; }
.sumcard-val.foreman { color: #3b82f6; }
.sumcard-val.final   { color: #10b981; }
.sumcard-val.rejected{ color: var(--db-brand); }
.sumcard-label { font-size: 11px; color: var(--db-ink-3); font-weight: 600; text-transform: uppercase; }

.mt { margin-top: 0; }

.ttl { font-weight: 600; max-width: 220px; }

.badge-type {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.badge-type.voo    { background: #ede9fe; color: #6d28d9; }
.badge-type.kaizen { background: #d1fae5; color: #065f46; }

.pts {
  font-weight: 700;
  color: #10b981;
}

.detail-row td { padding: 0 !important; background: var(--db-canvas); }
.detail-box {
  padding: 16px 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px 32px;
  border-top: 1px solid var(--db-line);
}
.detail-section { min-width: 180px; }
.detail-label { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--db-ink-3); margin-bottom: 4px; }
.detail-val { font-size: 13.5px; color: var(--db-ink); line-height: 1.5; }
.err-text { color: var(--db-brand); }

.photo-row { display: flex; gap: 8px; flex-wrap: wrap; }
.thumb {
  width: 72px; height: 72px; object-fit: cover; border-radius: 8px;
  border: 1px solid var(--db-line); cursor: pointer; transition: opacity 0.15s;
}
.thumb:hover { opacity: 0.85; }

/* Lightbox */
.lightbox {
  position: fixed; inset: 0; background: rgba(0,0,0,0.82);
  display: flex; align-items: center; justify-content: center; z-index: 200;
  cursor: zoom-out;
}
.lightbox img { max-width: 90vw; max-height: 90vh; border-radius: 12px; box-shadow: 0 16px 48px rgba(0,0,0,0.5); cursor: default; }
.lb-close {
  position: absolute; top: 20px; right: 24px;
  background: rgba(255,255,255,0.15); color: #fff; border: none;
  border-radius: 50%; width: 36px; height: 36px;
  font-size: 16px; cursor: pointer; display: grid; place-items: center;
}
.lb-close:hover { background: rgba(255,255,255,0.3); }

@media (max-width: 720px) {
  .filter-bar { gap: 10px; }
  .sumcard { min-width: 80px; padding: 10px 12px; }
  .sumcard-val { font-size: 20px; }
  .ttl { max-width: 120px; }
}
</style>
