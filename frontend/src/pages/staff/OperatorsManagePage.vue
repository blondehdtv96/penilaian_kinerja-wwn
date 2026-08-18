<template>
  <page-shell title="Kelola Operator" subtitle="Buat, ubah, dan hapus akun user dengan peran Operator">
    <template #actions>
      <button class="btn-primary btn-sm" @click="openCreate"><ion-icon :icon="addOutline" /> Tambah Operator</button>
    </template>

    <div class="card" v-if="showForm">
      <div class="card-head"><h3>{{ editing ? 'Edit Operator' : 'Tambah Operator' }}</h3>
        <button class="t-x" @click="closeForm" aria-label="Tutup"><ion-icon :icon="closeOutline" /></button>
      </div>
      <div class="alert err" v-if="formError"><ion-icon :icon="alertCircleOutline" /> {{ formError }}</div>
      <form class="form-grid cols" @submit.prevent="submit">
        <div class="field"><label>Nama Lengkap</label><input v-model.trim="f.fullName" required /></div>
        <div class="field"><label>Nama Pengguna</label><input v-model.trim="f.username" :disabled="!!editing" required /></div>
        <div class="field"><label>Email</label><input type="email" v-model.trim="f.email" required /></div>
        <div class="field"><label>NIK</label><input v-model.trim="f.nik" placeholder="opsional" /></div>
        <div class="field">
          <label>Kata Sandi <span class="hint" v-if="editing">(kosongkan jika tidak diubah)</span></label>
          <input type="password" v-model="f.password" :required="!editing" autocomplete="new-password" />
        </div>

        <div class="op-divider">Data Operator</div>
        <div class="field"><label>ID Karyawan</label><input v-model.trim="op.employeeId" required /></div>
        <div class="field"><label>Section</label><input v-model.trim="op.section" /></div>
        <div class="field">
          <label>Group</label>
          <select v-model="op.group">
            <option value="">Pilih group…</option>
            <option v-for="g in groupOptions" :key="g" :value="g">{{ g }}</option>
          </select>
        </div>
        <div class="field"><label>Posisi</label><input v-model.trim="op.position" placeholder="Operator" /></div>

        <label class="chk" v-if="editing"><input type="checkbox" v-model="f.isActive" /> Akun aktif</label>

        <div class="form-actions full">
          <button class="btn-primary" :disabled="saving"><ion-icon :icon="saveOutline" /> {{ saving ? 'Menyimpan…' : 'Simpan' }}</button>
          <button class="btn-ghost" type="button" @click="closeForm">Batal</button>
        </div>
      </form>
    </div>

    <div class="card">
      <div class="card-head"><h3>Daftar Operator</h3><span class="muted">{{ operators.length }}</span></div>
      <div v-if="loading" class="loading"><ion-spinner name="crescent" /> Memuat…</div>
      <div v-else-if="error" class="empty">{{ error }}</div>
      <div v-else-if="operators.length === 0" class="empty">Belum ada operator.</div>
      <div class="table-wrap" v-else>
        <table>
          <thead><tr><th>Operator</th><th>ID Karyawan</th><th>Section / Group / Posisi</th><th class="ta-c">Skor</th><th>Status</th><th class="ta-r">Aksi</th></tr></thead>
          <tbody>
            <tr v-for="u in operators" :key="u.id">
              <td><div class="who"><div class="t-ava"><UserAvatar /></div><div><div class="nm">{{ u.fullName }}</div><div class="muted">{{ u.username }} · {{ u.email }}</div></div></div></td>
              <td class="muted">{{ u.operator?.employeeId ?? '-' }}</td>
              <td class="muted">{{ u.operator?.section || '-' }} / {{ u.operator?.group || '-' }} / {{ u.operator?.position || '-' }}</td>
              <td class="ta-c">{{ u.operator?.performanceScore ?? 0 }}</td>
              <td><span class="status" :class="u.isActive ? 'final' : 'rejected'">{{ u.isActive ? 'Aktif' : 'Nonaktif' }}</span></td>
              <td class="ta-r">
                <div class="row-actions">
                  <button class="ico-btn" title="Edit" @click="openEdit(u)"><ion-icon :icon="createOutline" /></button>
                  <button class="ico-btn" :title="u.isActive ? 'Nonaktifkan' : 'Aktifkan'" @click="toggle(u)"><ion-icon :icon="u.isActive ? pauseOutline : playOutline" /></button>
                  <button class="ico-btn" title="Reset Kata Sandi" @click="resetPassword(u)"><ion-icon :icon="keyOutline" /></button>
                  <button class="ico-btn danger" title="Hapus" @click="remove(u)"><ion-icon :icon="trashOutline" /></button>
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
import { IonIcon, IonSpinner, onIonViewWillEnter } from '@ionic/vue';
import { reactive, ref } from 'vue';
import { addOutline, closeOutline, saveOutline, alertCircleOutline, createOutline, trashOutline, pauseOutline, playOutline, keyOutline } from 'ionicons/icons';
import PageShell from '@/components/PageShell.vue';
import { staffProduksiService } from '@/services/staff-produksi.service';
import UserAvatar from '@/components/UserAvatar.vue';
import type { StaffOperatorUser } from '@/types';

const operators = ref<StaffOperatorUser[]>([]);
const loading = ref(true);
const error = ref('');
const showForm = ref(false);
const editing = ref<StaffOperatorUser | null>(null);
const saving = ref(false);
const formError = ref('');

const groupOptions = ['A', 'B', 'C', 'D', 'Non-Shift'];

const blankForm = () => ({ fullName: '', username: '', email: '', nik: '', password: '', isActive: true });
const f = reactive(blankForm());
const op = reactive({ employeeId: '', section: '', group: '', position: '' });

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    const r = await staffProduksiService.listOperators();
    if (r.data?.success) operators.value = r.data.data;
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal memuat data operator.';
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  Object.assign(f, blankForm());
  Object.assign(op, { employeeId: '', section: '', group: '', position: '' });
  editing.value = null;
  formError.value = '';
  showForm.value = true;
};

const openEdit = (u: StaffOperatorUser) => {
  editing.value = u;
  Object.assign(f, { fullName: u.fullName, username: u.username, email: u.email, nik: u.nik || '', password: '', isActive: u.isActive });
  Object.assign(op, {
    employeeId: u.operator?.employeeId || '',
    section: u.operator?.section || '',
    group: u.operator?.group || '',
    position: u.operator?.position || '',
  });
  formError.value = '';
  showForm.value = true;
};

const closeForm = () => { showForm.value = false; };

const submit = async () => {
  if (!op.employeeId) { formError.value = 'ID Karyawan wajib diisi.'; return; }
  saving.value = true;
  formError.value = '';
  try {
    const operatorData = { ...op, position: op.position || 'Operator' };
    if (editing.value) {
      const payload: any = { email: f.email, fullName: f.fullName, nik: f.nik, isActive: f.isActive, operatorData };
      if (f.password) payload.password = f.password;
      await staffProduksiService.updateOperator(editing.value.id, payload);
    } else {
      const payload: any = { username: f.username, email: f.email, password: f.password, fullName: f.fullName, nik: f.nik, isActive: f.isActive, operatorData };
      await staffProduksiService.createOperator(payload);
    }
    showForm.value = false;
    await load();
  } catch (e: any) {
    formError.value = e?.response?.data?.message || 'Gagal menyimpan data operator.';
  } finally {
    saving.value = false;
  }
};

const toggle = async (u: StaffOperatorUser) => {
  try { await staffProduksiService.toggleOperator(u.id); await load(); } catch { /* abaikan */ }
};

const resetPassword = async (u: StaffOperatorUser) => {
  const newPassword = prompt(`Kata sandi baru untuk ${u.fullName} (minimal 6 karakter):`);
  if (!newPassword) return;
  if (newPassword.length < 6) { alert('Kata sandi minimal 6 karakter.'); return; }
  try {
    await staffProduksiService.resetPassword(u.id, newPassword);
    alert('Kata sandi berhasil direset.');
  } catch (e: any) {
    alert(e?.response?.data?.message || 'Gagal mereset kata sandi.');
  }
};

const remove = async (u: StaffOperatorUser) => {
  if (!confirm(`Hapus operator "${u.fullName}"? Tindakan ini tidak dapat dibatalkan.`)) return;
  try { await staffProduksiService.deleteOperator(u.id); await load(); } catch (e: any) { error.value = e?.response?.data?.message || 'Gagal menghapus.'; }
};

onIonViewWillEnter(load);
</script>

<style scoped>
.form-grid.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-grid.cols .full, .form-grid.cols .op-divider, .form-grid.cols .chk { grid-column: 1 / -1; }
.op-divider { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--db-ink-3); border-top: 1px solid var(--db-line); padding-top: 12px; }
.chk { display: flex; align-items: center; gap: 8px; font-size: 13.5px; color: var(--db-ink-2); }
.t-x { width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center; color: var(--db-ink-3); font-size: 18px; }
.t-x:hover { background: var(--db-icon-bg); color: var(--db-ink); }
.ta-r { text-align: right; }
.ta-c { text-align: center; }
.row-actions { display: inline-flex; gap: 4px; justify-content: flex-end; }
.ico-btn { width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center; color: var(--db-ink-2); font-size: 17px; }
.ico-btn:hover { background: var(--db-icon-bg); color: var(--db-ink); }
.ico-btn.danger:hover { background: var(--db-red-bg); color: var(--db-red); }
.nm { font-weight: 500; }
@media (max-width: 640px) { .form-grid.cols { grid-template-columns: 1fr; } }
</style>
