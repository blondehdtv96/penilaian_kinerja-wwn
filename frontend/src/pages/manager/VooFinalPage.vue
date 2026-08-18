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
            <div class="appr-by">
              <div class="t-ava"><UserAvatar /></div>
              <span>{{ v.operator?.user?.fullName }}</span>
              <span class="muted" v-if="v.sumberVoo">· Sumber {{ v.sumberVoo }}</span>
              <span class="muted" v-if="v.kategori4m">· 4M {{ v.kategori4m }}</span>
              <span class="muted" v-if="photosOf(v).length">· {{ photosOf(v).length }} foto</span>
              <span class="muted">· sudah disetujui Foreman</span>
            </div>
          </div>

          <div class="appr-actions">
            <button class="btn-ghost btn-sm" :disabled="busy" @click="openDetail(v)">
              <ion-icon :icon="eyeOutline" /> Detail
            </button>
            <button class="btn-success btn-sm" :disabled="busy" @click="openDetail(v)">
              <ion-icon :icon="checkmarkOutline" /> Setujui
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Popup detail, penetapan poin & konfirmasi persetujuan final -->
    <div class="vd-overlay" v-if="detail" @click.self="closeDetail">
      <div class="vd-modal">
        <div class="vd-head">
          <div class="vd-head-l">
            <span class="status foreman">{{ vooTypeLabel(detail.type) }}</span>
            <span class="muted">{{ fmtDate(detail.createdAt) }}</span>
          </div>
          <button class="vd-close" type="button" @click="closeDetail" aria-label="Tutup">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <div class="vd-body">
          <h2 class="vd-title">{{ detail.title }}</h2>

          <div class="vd-operator">
            <div class="t-ava lg"><UserAvatar /></div>
            <div>
              <div class="vd-op-name">{{ detail.operator?.user?.fullName || '-' }}</div>
              <div class="muted vd-op-sub">Diajukan oleh {{ detail.submittedBy?.fullName || '-' }} · sudah disetujui Foreman</div>
            </div>
          </div>

          <div class="vd-grid">
            <div class="vd-cell">
              <span class="vd-k">Group / Shift</span>
              <span class="vd-v">{{ detail.groupShift || '-' }}</span>
            </div>
            <div class="vd-cell">
              <span class="vd-k">Sumber VoO</span>
              <span class="vd-v">{{ detail.sumberVoo || '-' }}</span>
            </div>
            <div class="vd-cell">
              <span class="vd-k">Kategori 4M</span>
              <span class="vd-v">{{ detail.kategori4m || '-' }}</span>
            </div>
            <div class="vd-cell">
              <span class="vd-k">Klasifikasi</span>
              <span class="vd-v">
                <span v-if="detailClassification.length" class="vd-tags">
                  <span class="vd-tag" v-for="c in detailClassification" :key="c">{{ c }}</span>
                </span>
                <span v-else>-</span>
              </span>
            </div>
          </div>

          <div class="vd-section">
            <span class="vd-k">Deskripsi</span>
            <p class="vd-desc">{{ detail.description }}</p>
          </div>

          <div class="vd-section" v-if="detailPhotos.length">
            <span class="vd-k">Foto Pendukung ({{ detailPhotos.length }})</span>
            <div class="vd-photos">
              <button
                type="button"
                class="vd-photo"
                v-for="(p, i) in detailPhotos"
                :key="i"
                @click="openViewer(p)"
                :aria-label="`Lihat foto ${i + 1}`"
              >
                <img :src="p" alt="foto pendukung" />
              </button>
            </div>
          </div>

          <div class="vd-section" v-if="!rejecting">
            <span class="vd-k">Penetapan Poin</span>
            <div class="pts-presets">
              <button type="button" class="preset" :class="{ on: pointsFor[detail.id] === 5 }" @click="pointsFor[detail.id] = 5">Biasa <b>5</b></button>
              <button type="button" class="preset" :class="{ on: pointsFor[detail.id] === 10 }" @click="pointsFor[detail.id] = 10">Cukup <b>10</b></button>
              <button type="button" class="preset" :class="{ on: pointsFor[detail.id] === 20 }" @click="pointsFor[detail.id] = 20">Bagus <b>20</b></button>
              <div class="pts">
                <label>Poin</label>
                <input type="number" min="0" v-model.number="pointsFor[detail.id]" />
              </div>
            </div>
          </div>

          <div class="alert err vd-alert" v-if="error"><ion-icon :icon="closeOutline" /> {{ error }}</div>

          <div class="vd-reject" v-if="rejecting">
            <label>Alasan penolakan</label>
            <textarea v-model.trim="reason" rows="3" placeholder="Jelaskan alasan penolakan…"></textarea>
          </div>
        </div>

        <div class="vd-actions">
          <template v-if="!rejecting">
            <button class="btn-ghost" type="button" :disabled="busy" @click="rejecting = true">
              <ion-icon :icon="closeOutline" /> Tolak
            </button>
            <button class="btn-success" type="button" :disabled="busy" @click="approve(detail)">
              <ion-icon :icon="checkmarkOutline" /> {{ busy ? 'Memproses…' : `Setujui · +${pointsFor[detail.id] ?? 10} poin` }}
            </button>
          </template>
          <template v-else>
            <button class="btn-ghost" type="button" :disabled="busy" @click="rejecting = false; reason = ''">
              Kembali
            </button>
            <button class="btn-danger" type="button" :disabled="busy || !reason" @click="reject(detail.id)">
              {{ busy ? 'Memproses…' : 'Konfirmasi Penolakan' }}
            </button>
          </template>
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
import { IonIcon, IonSpinner, onIonViewWillEnter } from '@ionic/vue';
import { computed, ref } from 'vue';
import { checkmarkOutline, closeOutline, eyeOutline } from 'ionicons/icons';
import PageShell from '@/components/PageShell.vue';
import { vooService } from '@/services/voo.service';
import { useRealtime } from '@/composables/useRealtime';
import { fmtDate, vooTypeLabel, parsePhotos, parseClassification } from '@/utils/format';
import UserAvatar from '@/components/UserAvatar.vue';
import type { VooSubmission } from '@/types';

const items = ref<VooSubmission[]>([]);
const loading = ref(true);
const error = ref('');
const busy = ref(false);
const reason = ref('');
const pointsFor = ref<Record<number, number>>({});
const viewerSrc = ref<string | null>(null);

// Popup detail, penetapan poin & konfirmasi.
const detail = ref<VooSubmission | null>(null);
const rejecting = ref(false);
const detailPhotos = computed(() => parsePhotos(detail.value?.photos));
const detailClassification = computed(() => parseClassification(detail.value?.classification));

const openDetail = (v: VooSubmission) => {
  error.value = '';
  reason.value = '';
  rejecting.value = false;
  if (pointsFor.value[v.id] == null) pointsFor.value[v.id] = 10;
  detail.value = v;
};
const closeDetail = () => {
  if (busy.value) return;
  detail.value = null;
  rejecting.value = false;
  reason.value = '';
};

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

const approve = async (v: VooSubmission) => {
  busy.value = true;
  error.value = '';
  try {
    await vooService.approveManager(v.id, { action: 'approve', points: pointsFor.value[v.id] ?? 10 });
    busy.value = false;
    detail.value = null;
    await load();
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal menyetujui.';
    busy.value = false;
  }
};

const reject = async (id: number) => {
  busy.value = true;
  error.value = '';
  try {
    await vooService.approveManager(id, { action: 'reject', rejectionReason: reason.value });
    busy.value = false;
    detail.value = null;
    rejecting.value = false;
    reason.value = '';
    await load();
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal menolak.';
    busy.value = false;
  }
};

onIonViewWillEnter(load);
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
  position: fixed; inset: 0; z-index: 1100; background: rgba(0, 0, 0, 0.82);
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

/* Popup detail & konfirmasi final */
.vd-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, .55);
  display: grid; place-items: center; padding: 20px; z-index: 1000; overflow: auto;
}
.vd-modal {
  background: var(--db-card); border: 1px solid var(--db-line);
  border-radius: 16px; width: 100%; max-width: 560px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, .35);
  display: flex; flex-direction: column; max-height: calc(100vh - 40px);
}
.vd-head {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 14px 18px; border-bottom: 1px solid var(--db-line); flex-shrink: 0;
}
.vd-head-l { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.vd-close {
  width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center;
  background: transparent; color: var(--db-muted); border: 1px solid var(--db-line-2);
  cursor: pointer; font-size: 16px; flex-shrink: 0;
}
.vd-close:hover { color: var(--db-ink); border-color: var(--db-brand); }
.vd-body { padding: 18px; overflow-y: auto; }
.vd-title { font-size: 19px; font-weight: 700; color: var(--db-ink); margin: 0 0 14px; line-height: 1.3; }
.vd-operator { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.t-ava.lg { width: 42px; height: 42px; font-size: 15px; }
.vd-op-name { font-weight: 600; color: var(--db-ink); font-size: 14px; }
.vd-op-sub { font-size: 12px; }
.vd-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  padding: 14px; border: 1px solid var(--db-line); border-radius: 12px;
  background: var(--db-icon-bg); margin-bottom: 16px;
}
.vd-cell { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.vd-k { font-size: 11.5px; color: var(--db-muted); text-transform: uppercase; letter-spacing: .03em; }
.vd-v { font-size: 14px; color: var(--db-ink); font-weight: 500; word-break: break-word; }
.vd-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.vd-tag {
  font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 999px;
  background: var(--db-card); border: 1px solid var(--db-brand); color: var(--db-brand);
}
.vd-section { margin-bottom: 16px; display: flex; flex-direction: column; gap: 8px; }
.vd-desc {
  margin: 0; font-size: 14px; line-height: 1.6; color: var(--db-ink-2);
  white-space: pre-wrap; word-break: break-word;
}
.vd-photos { display: flex; flex-wrap: wrap; gap: 10px; }
.vd-photo {
  width: 92px; height: 92px; border-radius: 10px; overflow: hidden; padding: 0;
  border: 1px solid var(--db-line); background: var(--db-icon-bg); cursor: pointer;
  display: block; transition: transform .12s;
}
.vd-photo:hover { transform: scale(1.04); border-color: var(--db-brand); }
.vd-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.vd-alert { margin-bottom: 12px; }
.vd-reject { display: flex; flex-direction: column; gap: 6px; }
.vd-reject label { font-size: 13px; color: var(--db-muted); }
.vd-reject textarea {
  border: 1px solid var(--db-line-2); border-radius: 10px; padding: 10px 12px;
  font: inherit; font-size: 14px; background: var(--db-card); color: var(--db-ink); resize: vertical;
}
.vd-reject textarea:focus { outline: none; border-color: var(--db-brand); }
.vd-actions {
  display: flex; gap: 10px; justify-content: flex-end;
  padding: 14px 18px; border-top: 1px solid var(--db-line); flex-shrink: 0;
}
/* Preset poin di dalam popup: rata kiri & boleh membungkus */
.vd-section .pts-presets { width: 100%; justify-content: flex-start; flex-wrap: wrap; align-items: center; }
@media (max-width: 480px) {
  .vd-grid { grid-template-columns: 1fr; }
  .vd-actions { flex-direction: column-reverse; }
  .vd-actions button { width: 100%; }
}
</style>
