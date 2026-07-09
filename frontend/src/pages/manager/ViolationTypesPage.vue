<template>
  <page-shell title="Katalog Pelanggaran" subtitle="Kelola jenis pelanggaran & poin yang dipakai Foreman saat input pelanggaran">
    <template #actions>
      <button class="btn-primary btn-sm" @click="openCreate"><ion-icon :icon="addOutline" /> Tambah Jenis</button>
    </template>

    <div class="card" v-if="showForm">
      <div class="card-head"><h3>{{ editing ? 'Edit Jenis Pelanggaran' : 'Tambah Jenis Pelanggaran' }}</h3>
        <button class="t-x" @click="closeForm" aria-label="Tutup"><ion-icon :icon="closeOutline" /></button>
      </div>
      <div class="alert err" v-if="formError"><ion-icon :icon="alertCircleOutline" /> {{ formError }}</div>
      <form class="form-grid cols" @submit.prevent="submit">
        <div class="field"><label>Nama Pelanggaran</label><input v-model.trim="f.name" required maxlength="100" /></div>
        <div class="field"><label>Kategori</label><input v-model.trim="f.category" placeholder="Safety, Kedisiplinan, Produksi…" required /></div>
        <div class="field">
          <label>Keparahan</label>
          <select v-model="f.severity" required>
            <option value="" disabled>Pilih keparahan…</option>
            <option value="low">Rendah</option>
            <option value="medium">Sedang</option>
            <option value="high">Tinggi</option>
            <option value="critical">Kritis</option>
          </select>
        </div>
        <div class="field"><label>Poin</label><input type="number" v-model.number="f.points" min="1" max="100" required /></div>
        <div class="form-actions full">
          <button class="btn-primary" :disabled="saving"><ion-icon :icon="saveOutline" /> {{ saving ? 'Menyimpan…' : 'Simpan' }}</button>
          <button class="btn-ghost" type="button" @click="closeForm">Batal</button>
        </div>
      </form>
    </div>

    <div class="card">
      <div class="card-head"><h3>Daftar Jenis Pelanggaran</h3><span class="muted">{{ items.length }}</span></div>
      <div v-if="loading" class="loading"><ion-spinner name="crescent" /> Memuat…</div>
      <div v-else-if="error" class="empty">{{ error }}</div>
      <div v-else-if="items.length === 0" class="empty">Belum ada jenis pelanggaran di katalog. Klik "Tambah Jenis" untuk membuat yang pertama.</div>
      <div class="table-wrap" v-else>
        <table>
          <thead><tr><th>Nama</th><th>Kategori</th><th>Keparahan</th><th class="amt">Poin</th><th>Status</th><th class="ta-r">Aksi</th></tr></thead>
          <tbody>
            <tr v-for="t in items" :key="t.id">
              <td>{{ t.name }}</td>
              <td class="muted">{{ t.category }}</td>
              <td><span class="status" :class="severityMeta(t.severity).cls">{{ severityMeta(t.severity).label }}</span></td>
              <td class="amt">{{ t.points }}</td>
              <td><span class="status" :class="t.isActive ? 'final' : 'rejected'">{{ t.isActive ? 'Aktif' : 'Nonaktif' }}</span></td>
              <td class="ta-r">
                <div class="row-actions">
                  <button class="ico-btn" title="Edit" @click="openEdit(t)"><ion-icon :icon="createOutline" /></button>
                  <button class="ico-btn danger" title="Nonaktifkan" :disabled="!t.isActive" @click="deactivate(t)"><ion-icon :icon="banOutline" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </page-shell>
</template>

<script setup lang="ts">
import { IonIcon, IonSpinner } from '@ionic/vue';
import { onMounted, reactive, ref } from 'vue';
import { addOutline, closeOutline, saveOutline, alertCircleOutline, createOutline, banOutline } from 'ionicons/icons';
import PageShell from '@/components/PageShell.vue';
import { recordsService } from '@/services/records.service';
import { severityMeta } from '@/utils/format';
import type { ViolationTypeItem } from '@/types';

const items = ref<ViolationTypeItem[]>([]);
const loading = ref(true);
const error = ref('');
const showForm = ref(false);
const editing = ref<ViolationTypeItem | null>(null);
const saving = ref(false);
const formError = ref('');

const blankForm = () => ({ name: '', category: '', severity: '', points: 5 });
const f = reactive(blankForm());

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await recordsService.listViolationTypes();
    if (data?.success) items.value = data.data;
    else error.value = 'Gagal memuat katalog.';
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal memuat katalog.';
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editing.value = null;
  Object.assign(f, blankForm());
  formError.value = '';
  showForm.value = true;
};

const openEdit = (t: ViolationTypeItem) => {
  editing.value = t;
  Object.assign(f, { name: t.name, category: t.category, severity: t.severity, points: t.points });
  formError.value = '';
  showForm.value = true;
};

const closeForm = () => { showForm.value = false; };

const submit = async () => {
  saving.value = true;
  formError.value = '';
  try {
    if (editing.value) {
      await recordsService.updateViolationType(editing.value.id, { ...f });
    } else {
      await recordsService.createViolationType({ ...f });
    }
    showForm.value = false;
    await load();
  } catch (e: any) {
    formError.value = e?.response?.data?.message || 'Gagal menyimpan jenis pelanggaran.';
  } finally {
    saving.value = false;
  }
};

const deactivate = async (t: ViolationTypeItem) => {
  if (!confirm(`Nonaktifkan jenis pelanggaran "${t.name}"? Riwayat pelanggaran yang sudah tercatat tidak berubah.`)) return;
  try {
    await recordsService.deactivateViolationType(t.id);
    await load();
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal menonaktifkan.';
  }
};

onMounted(load);
</script>

<style scoped>
.form-grid.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-grid.cols .full { grid-column: 1 / -1; }
.t-x { width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center; color: var(--db-ink-3); font-size: 18px; }
.t-x:hover { background: var(--db-icon-bg); color: var(--db-ink); }
.ta-r { text-align: right; }
.row-actions { display: inline-flex; gap: 4px; justify-content: flex-end; }
.ico-btn { width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center; color: var(--db-ink-2); font-size: 17px; }
.ico-btn:hover { background: var(--db-icon-bg); color: var(--db-ink); }
.ico-btn.danger:hover { background: var(--db-red-bg); color: var(--db-red); }
.ico-btn:disabled { opacity: 0.35; cursor: not-allowed; }
@media (max-width: 640px) { .form-grid.cols { grid-template-columns: 1fr; } }
</style>
