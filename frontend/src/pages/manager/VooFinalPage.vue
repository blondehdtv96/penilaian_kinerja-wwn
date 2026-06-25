<template>
  <page-shell title="Persetujuan Final" subtitle="Persetujuan akhir & penetapan poin VoO / Ide Kaizen">
    <div class="card">
      <div class="card-head">
        <h3>Menunggu Persetujuan Final</h3>
        <span class="muted">{{ items.length }} pengajuan</span>
      </div>

      <div v-if="loading" class="loading"><ion-spinner name="crescent" /> Memuat…</div>
      <div v-else-if="error" class="empty">{{ error }}</div>
      <div v-else-if="items.length === 0" class="empty">Tidak ada pengajuan menunggu persetujuan final.</div>

      <div v-else class="appr-list">
        <div class="appr" v-for="v in items" :key="v.id">
          <div class="appr-main">
            <div class="appr-top">
              <span class="status foreman">{{ vooTypeLabel(v.type) }}</span>
              <span class="muted">{{ fmtDate(v.createdAt) }}</span>
            </div>
            <div class="appr-ttl">{{ v.title }}</div>
            <div class="appr-desc">{{ v.description }}</div>

            <div class="photos" v-if="photosOf(v).length">
              <div class="photos-label">
                <ion-icon :icon="imagesOutline" /> Lampiran foto ({{ photosOf(v).length }})
              </div>
              <div class="thumbs">
                <button
                  type="button"
                  class="thumb"
                  v-for="(p, i) in photosOf(v)"
                  :key="i"
                  @click="openViewer(p)"
                  :aria-label="`Lihat foto ${i + 1}`"
                >
                  <img :src="p" alt="lampiran foto" />
                </button>
              </div>
            </div>

            <div class="appr-by">
              <div class="t-ava">{{ initials(v.operator?.user?.fullName) }}</div>
              <span>{{ v.operator?.user?.fullName }}</span>
              <span class="muted">· sudah disetujui Foreman</span>
            </div>
          </div>

          <div class="appr-actions">
            <template v-if="rejectId !== v.id">
              <div class="pts-presets">
                <button
                  type="button"
                  class="preset"
                  :class="{ on: pointsFor[v.id] === 5 }"
                  @click="pointsFor[v.id] = 5"
                >Biasa <b>5</b></button>
                <button
                  type="button"
                  class="preset"
                  :class="{ on: pointsFor[v.id] === 10 }"
                  @click="pointsFor[v.id] = 10"
                >Cukup <b>10</b></button>
                <button
                  type="button"
                  class="preset"
                  :class="{ on: pointsFor[v.id] === 20 }"
                  @click="pointsFor[v.id] = 20"
                >Bagus <b>20</b></button>
              </div>
              <div class="pts">
                <label>Poin</label>
                <input type="number" min="0" v-model.number="pointsFor[v.id]" />
              </div>
              <button class="btn-success btn-sm" :disabled="busy" @click="approve(v)">
                <ion-icon :icon="checkmarkOutline" /> Setujui
              </button>
              <button class="btn-ghost btn-sm" :disabled="busy" @click="rejectId = v.id">
                <ion-icon :icon="closeOutline" /> Tolak
              </button>
            </template>
            <template v-else>
              <input v-model.trim="reason" class="reason" placeholder="Alasan penolakan…" />
              <button class="btn-danger btn-sm" :disabled="busy || !reason" @click="reject(v.id)">Konfirmasi</button>
              <button class="btn-ghost btn-sm" :disabled="busy" @click="cancelReject">Batal</button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Lightbox foto -->
    <div class="viewer" v-if="viewerSrc" @click="closeViewer">
      <button class="viewer-close" @click="closeViewer" aria-label="Tutup">
        <ion-icon :icon="closeOutline" />
      </button>
      <img :src="viewerSrc" alt="lampiran foto" @click.stop />
    </div>
  </page-shell>
</template>

<script setup lang="ts">
import { IonIcon, IonSpinner } from '@ionic/vue';
import { onMounted, ref } from 'vue';
import { checkmarkOutline, closeOutline, imagesOutline } from 'ionicons/icons';
import PageShell from '@/components/PageShell.vue';
import { vooService } from '@/services/voo.service';
import { useRealtime } from '@/composables/useRealtime';
import { fmtDate, vooTypeLabel, initials, parsePhotos } from '@/utils/format';
import type { VooSubmission } from '@/types';

const items = ref<VooSubmission[]>([]);
const loading = ref(true);
const error = ref('');
const busy = ref(false);
const rejectId = ref<number | null>(null);
const reason = ref('');
const pointsFor = ref<Record<number, number>>({});
const viewerSrc = ref<string | null>(null);

const photosOf = (v: VooSubmission) => parsePhotos(v.photos);
const openViewer = (src: string) => (viewerSrc.value = src);
const closeViewer = () => (viewerSrc.value = null);

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await vooService.getAll({ status: 'approved_foreman' });
    if (data?.success) {
      items.value = data.data;
      const map: Record<number, number> = {};
      (data.data as VooSubmission[]).forEach((v) => (map[v.id] = 10));
      pointsFor.value = map;
    } else error.value = 'Gagal memuat antrean.';
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal memuat antrean.';
  } finally {
    loading.value = false;
  }
};

const cancelReject = () => {
  rejectId.value = null;
  reason.value = '';
};

const approve = async (v: VooSubmission) => {
  busy.value = true;
  try {
    await vooService.approveManager(v.id, { action: 'approve', points: pointsFor.value[v.id] ?? 10 });
    await load();
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal menyetujui.';
  } finally {
    busy.value = false;
  }
};

const reject = async (id: number) => {
  busy.value = true;
  try {
    await vooService.approveManager(id, { action: 'reject', rejectionReason: reason.value });
    cancelReject();
    await load();
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal menolak.';
  } finally {
    busy.value = false;
  }
};

onMounted(load);
useRealtime('voo:changed', load);
</script>

<style scoped>
.appr-list { display: flex; flex-direction: column; gap: 12px; }
.appr {
  display: flex; gap: 16px; align-items: flex-start; justify-content: space-between;
  padding: 16px; border: 1px solid var(--db-line); border-radius: 14px; background: var(--db-card);
}
.appr-main { min-width: 0; }
.appr-top { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.appr-ttl { font-size: 15px; font-weight: 600; }
.appr-desc { font-size: 13px; color: var(--db-ink-2); margin: 4px 0 10px; line-height: 1.5; }
.appr-by { display: flex; align-items: center; gap: 8px; font-size: 12.5px; flex-wrap: wrap; }
.appr-by .t-ava { width: 26px; height: 26px; font-size: 10px; }
.appr-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; max-width: 360px; }
.pts { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--db-ink-2); }
.pts input { width: 64px; border: 1px solid var(--db-line-2); border-radius: 9px; padding: 7px 9px; font: inherit; font-size: 13px; background: var(--db-card); color: var(--db-ink); }

/* Preset poin */
.pts-presets { display: flex; gap: 6px; width: 100%; justify-content: flex-end; }
.preset {
  display: inline-flex; align-items: center; gap: 5px; padding: 6px 10px;
  border: 1px solid var(--db-line-2); border-radius: 999px; background: var(--db-card);
  color: var(--db-ink-2); font: inherit; font-size: 12px; cursor: pointer; transition: all .15s;
}
.preset b { font-size: 12.5px; color: var(--db-ink); }
.preset:hover { border-color: var(--db-brand); }
.preset.on { background: var(--db-brand); border-color: var(--db-brand); color: #fff; }
.preset.on b { color: #fff; }

/* Lampiran foto */
.photos { margin: 6px 0 12px; }
.photos-label { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--db-muted); margin-bottom: 8px; }
.photos-label ion-icon { font-size: 15px; }
.thumbs { display: flex; flex-wrap: wrap; gap: 8px; }
.thumb {
  width: 84px; height: 84px; border-radius: 10px; overflow: hidden; padding: 0;
  border: 1px solid var(--db-line); background: var(--db-icon-bg); cursor: pointer; transition: transform .12s;
}
.thumb:hover { transform: scale(1.04); border-color: var(--db-brand); }
.thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

/* Lightbox */
.viewer {
  position: fixed; inset: 0; z-index: 1000; background: rgba(0, 0, 0, 0.82);
  display: grid; place-items: center; padding: 24px; cursor: zoom-out;
}
.viewer img { max-width: 92vw; max-height: 86vh; border-radius: 10px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5); }
.viewer-close {
  position: absolute; top: 18px; right: 18px; width: 42px; height: 42px; border-radius: 50%;
  background: rgba(255, 255, 255, 0.15); color: #fff; display: grid; place-items: center;
  font-size: 22px; cursor: pointer; border: none;
}
.viewer-close:hover { background: rgba(255, 255, 255, 0.28); }
.reason { border: 1px solid var(--db-line-2); border-radius: 9px; padding: 8px 11px; font: inherit; font-size: 13px; background: var(--db-card); color: var(--db-ink); min-width: 160px; }
.reason:focus, .pts input:focus { outline: none; border-color: var(--db-brand); }
@media (max-width: 720px) { .appr { flex-direction: column; } .appr-actions { max-width: none; justify-content: flex-start; } }
</style>
