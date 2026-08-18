<template>
  <page-shell title="Lokasi QR" subtitle="Kelola area kerja & QR code pemindaian">
    <template #actions>
      <button class="btn-primary btn-sm" @click="toggleForm"><ion-icon :icon="addOutline" /> Tambah Lokasi</button>
    </template>

    <div class="card" v-if="showForm">
      <div class="card-head"><h3>Tambah Lokasi QR</h3>
        <button class="t-x" @click="showForm = false" aria-label="Tutup"><ion-icon :icon="closeOutline" /></button>
      </div>
      <div class="alert err" v-if="formError"><ion-icon :icon="alertCircleOutline" /> {{ formError }}</div>
      <form class="form-grid cols" @submit.prevent="submit">
        <div class="field"><label>Nama Area</label><input v-model.trim="f.name" placeholder="mis. Area Bantrac" required /></div>
        <div class="field"><label>Kode</label><input v-model.trim="f.code" placeholder="mis. QR-BAN" required /></div>
        <div class="field"><label>Area</label><input v-model.trim="f.area" placeholder="mis. Bantrac" required /></div>
        <div class="field"><label>Deskripsi</label><input v-model.trim="f.description" placeholder="opsional" /></div>
        <div class="form-actions full">
          <button class="btn-primary" :disabled="saving"><ion-icon :icon="saveOutline" /> {{ saving ? 'Menyimpan…' : 'Simpan' }}</button>
          <button class="btn-ghost" type="button" @click="showForm = false">Batal</button>
        </div>
      </form>
    </div>

    <div v-if="loading" class="card"><div class="loading"><ion-spinner name="crescent" /> Memuat…</div></div>
    <div v-else-if="error" class="card"><div class="empty">{{ error }}</div></div>
    <div v-else-if="items.length === 0" class="card"><div class="empty">Belum ada lokasi QR.</div></div>
    <div v-else class="grid g3">
      <div class="card loc" v-for="l in items" :key="l.id">
        <div class="loc-head">
          <div><div class="loc-name">{{ l.name }}</div><div class="muted">{{ l.code }} · {{ l.area }}</div></div>
          <button class="ico-btn danger" title="Hapus" @click="remove(l)"><ion-icon :icon="trashOutline" /></button>
        </div>
        <img :src="l.qrImage" alt="QR Code" class="loc-qr" />
        <div class="muted desc">{{ l.description || '—' }}</div>
        <div class="loc-foot"><ion-icon :icon="scanOutline" /> {{ l._count?.scanLogs ?? 0 }} kali dipindai</div>
      </div>
    </div>
  </page-shell>
</template>

<script setup lang="ts">
import { IonIcon, IonSpinner, onIonViewWillEnter } from '@ionic/vue';
import { reactive, ref } from 'vue';
import { addOutline, closeOutline, saveOutline, alertCircleOutline, trashOutline, scanOutline } from 'ionicons/icons';
import PageShell from '@/components/PageShell.vue';
import { superadminService } from '@/services/superadmin.service';
import type { AdminQrLocation } from '@/types';

const items = ref<AdminQrLocation[]>([]);
const loading = ref(true);
const error = ref('');
const showForm = ref(false);
const saving = ref(false);
const formError = ref('');
const f = reactive({ name: '', code: '', area: '', description: '' });

const toggleForm = () => { showForm.value = !showForm.value; formError.value = ''; };

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await superadminService.listQrLocations();
    if (data?.success) items.value = data.data;
    else error.value = 'Gagal memuat lokasi.';
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal memuat lokasi QR.';
  } finally {
    loading.value = false;
  }
};

const submit = async () => {
  saving.value = true;
  formError.value = '';
  try {
    await superadminService.createQrLocation({ ...f });
    Object.assign(f, { name: '', code: '', area: '', description: '' });
    showForm.value = false;
    await load();
  } catch (e: any) {
    formError.value = e?.response?.data?.message || 'Gagal menyimpan lokasi.';
  } finally {
    saving.value = false;
  }
};

const remove = async (l: AdminQrLocation) => {
  if (!confirm(`Hapus lokasi "${l.name}"?`)) return;
  try { await superadminService.deleteQrLocation(l.id); await load(); } catch (e: any) { error.value = e?.response?.data?.message || 'Gagal menghapus.'; }
};

onIonViewWillEnter(load);
</script>

<style scoped>
.form-grid.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-grid.cols .full { grid-column: 1 / -1; }
.loc-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.loc-name { font-size: 15px; font-weight: 600; }
.loc-qr { width: 140px; height: 140px; align-self: center; margin: 14px auto; border: 1px solid var(--db-line); border-radius: 12px; background: #fff; padding: 6px; }
.loc .desc { min-height: 18px; }
.loc-foot { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--db-ink-2); margin-top: 10px; border-top: 1px solid var(--db-line); padding-top: 10px; }
.loc-foot ion-icon { font-size: 15px; }
@media (max-width: 640px) { .form-grid.cols { grid-template-columns: 1fr; } }
</style>
