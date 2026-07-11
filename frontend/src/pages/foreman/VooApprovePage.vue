<template>
  <page-shell title="Persetujuan VoO" subtitle="Tinjau & setujui pengajuan VoO / Ide Kaizen (tahap Foreman)">
    <div class="card">
      <div class="card-head">
        <h3>Menunggu Persetujuan</h3>
        <div class="head-right">
          <span class="muted">{{ items.length }} pengajuan</span>
          <button class="btn-ghost btn-sm" :disabled="loading" @click="load(true)">
            <ion-icon :icon="refreshOutline" /> Muat Ulang
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading"><ion-spinner name="crescent" /> Memuat…</div>
      <div v-else-if="error" class="empty">{{ error }}</div>
      <div v-else-if="items.length === 0" class="empty">Semua pengajuan sudah ditinjau. Tidak ada antrean.</div>

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
              <span class="muted" v-if="v.groupShift">· Group/Shift {{ v.groupShift }}</span>
              <span class="muted" v-if="v.sumberVoo">· Sumber {{ v.sumberVoo }}</span>
              <span class="muted" v-if="v.kategori4m">· 4M {{ v.kategori4m }}</span>
              <span class="muted">· diajukan {{ v.submittedBy?.fullName }}</span>
              <span class="muted" v-if="photoCount(v)">· {{ photoCount(v) }} foto</span>
            </div>
          </div>

          <div class="appr-actions">
            <template v-if="rejectId !== v.id">
              <button class="btn-success btn-sm" :disabled="busy" @click="approve(v.id)">
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
  </page-shell>
</template>

<script setup lang="ts">
import { IonIcon, IonSpinner } from '@ionic/vue';
import { onMounted, onUnmounted, ref } from 'vue';
import { checkmarkOutline, closeOutline, refreshOutline } from 'ionicons/icons';
import PageShell from '@/components/PageShell.vue';
import { vooService } from '@/services/voo.service';
import { useRealtime } from '@/composables/useRealtime';
import { fmtDate, vooTypeLabel, parsePhotos } from '@/utils/format';
import UserAvatar from '@/components/UserAvatar.vue';
import type { VooSubmission } from '@/types';

const items = ref<VooSubmission[]>([]);
const loading = ref(true);
const error = ref('');
const busy = ref(false);
const rejectId = ref<number | null>(null);
const reason = ref('');

const photoCount = (v: VooSubmission) => parsePhotos(v.photos).length;

const load = async (showSpinner = true) => {
  if (showSpinner) loading.value = true;
  error.value = '';
  try {
    const { data } = await vooService.getAll({ status: 'pending' });
    if (data?.success) items.value = data.data;
    else error.value = 'Gagal memuat antrean.';
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal memuat antrean.';
  } finally {
    loading.value = false;
  }
};

// Auto-refresh real-time: server mendorong 'voo:changed' saat ada pengajuan/status
// baru, jadi tak perlu polling berkala lagi. Refresh saat tab kembali fokus tetap
// dipertahankan sebagai fallback bila socket sempat terputus.
const onFocus = () => load(false);
useRealtime('voo:changed', () => load(false));

const cancelReject = () => {
  rejectId.value = null;
  reason.value = '';
};

const approve = async (id: number) => {
  busy.value = true;
  try {
    await vooService.approveForeman(id, { action: 'approve' });
    await load(false);
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal menyetujui.';
  } finally {
    busy.value = false;
  }
};

const reject = async (id: number) => {
  busy.value = true;
  try {
    await vooService.approveForeman(id, { action: 'reject', rejectionReason: reason.value });
    cancelReject();
    await load(false);
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal menolak.';
  } finally {
    busy.value = false;
  }
};

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
.appr-list { display: flex; flex-direction: column; gap: 12px; }
.head-right { display: flex; align-items: center; gap: 12px; }
.appr {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid var(--db-line);
  border-radius: 14px;
  background: var(--db-card);
}
.appr-main { min-width: 0; }
.appr-top { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.appr-ttl { font-size: 15px; font-weight: 600; }
.appr-desc { font-size: 13px; color: var(--db-ink-2); margin: 4px 0 10px; line-height: 1.5; }
.appr-by { display: flex; align-items: center; gap: 8px; font-size: 12.5px; flex-wrap: wrap; }
.appr-by .t-ava { width: 26px; height: 26px; font-size: 10px; }
.appr-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; max-width: 320px; }
.reason {
  border: 1px solid var(--db-line-2); border-radius: 9px; padding: 8px 11px; font: inherit;
  font-size: 13px; background: var(--db-card); color: var(--db-ink); min-width: 160px;
}
.reason:focus { outline: none; border-color: var(--db-brand); }
@media (max-width: 720px) {
  .appr { flex-direction: column; }
  .appr-actions { max-width: none; justify-content: flex-start; }
}
</style>
