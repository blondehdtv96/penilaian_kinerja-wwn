<template>
  <page-shell title="Kelola User" subtitle="Manajemen akun & peran pengguna">
    <template #actions>
      <button class="btn-primary btn-sm" @click="openCreate"><ion-icon :icon="addOutline" /> Tambah User</button>
    </template>

    <div class="card" v-if="showForm">
      <div class="card-head"><h3>{{ editing ? 'Edit User' : 'Tambah User' }}</h3>
        <button class="t-x" @click="closeForm" aria-label="Tutup"><ion-icon :icon="closeOutline" /></button>
      </div>
      <div class="alert err" v-if="formError"><ion-icon :icon="alertCircleOutline" /> {{ formError }}</div>
      <form class="form-grid cols" @submit.prevent="submit">
        <div class="field"><label>Nama Lengkap</label><input v-model.trim="f.fullName" required /></div>
        <div class="field"><label>Nama Pengguna</label><input v-model.trim="f.username" :disabled="!!editing" required /></div>
        <div class="field"><label>Email</label><input type="email" v-model.trim="f.email" required /></div>
        <div class="field"><label>NIK</label><input v-model.trim="f.nik" placeholder="opsional" /></div>
        <div class="field">
          <label>Peran</label>
          <select v-model.number="f.roleId" required>
            <option :value="0" disabled>Pilih peran…</option>
            <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>
        </div>
        <div class="field">
          <label>Kata Sandi <span class="hint" v-if="editing">(kosongkan jika tidak diubah)</span></label>
          <input type="password" v-model="f.password" :required="!editing" autocomplete="new-password" />
        </div>

        <template v-if="isOperatorRole">
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
        </template>

        <label class="chk"><input type="checkbox" v-model="f.isActive" /> Akun aktif</label>

        <div class="form-actions full">
          <button class="btn-primary" :disabled="saving"><ion-icon :icon="saveOutline" /> {{ saving ? 'Menyimpan…' : 'Simpan' }}</button>
          <button class="btn-ghost" type="button" @click="closeForm">Batal</button>
        </div>
      </form>
    </div>

    <div class="card">
      <div class="card-head"><h3>Daftar User</h3><span class="muted">{{ users.length }}</span></div>
      <div v-if="loading" class="loading"><ion-spinner name="crescent" /> Memuat…</div>
      <div v-else-if="error" class="empty">{{ error }}</div>
      <div class="table-wrap" v-else>
        <table>
          <thead><tr><th>Pengguna</th><th>Email</th><th>Peran</th><th>Status</th><th class="ta-r">Aksi</th></tr></thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td><div class="who"><div class="t-ava"><UserAvatar /></div><div><div class="nm">{{ u.fullName }}</div><div class="muted">{{ u.username }}</div></div></div></td>
              <td class="muted">{{ u.email }}</td>
              <td><span class="badge-muted">{{ u.role.name }}</span></td>
              <td><span class="status" :class="u.isActive ? 'final' : 'rejected'">{{ u.isActive ? 'Aktif' : 'Nonaktif' }}</span></td>
              <td class="ta-r">
                <div class="row-actions">
                  <button class="ico-btn" title="Edit" @click="openEdit(u)"><ion-icon :icon="createOutline" /></button>
                  <button class="ico-btn" :title="u.isActive ? 'Nonaktifkan' : 'Aktifkan'" @click="toggle(u)"><ion-icon :icon="u.isActive ? pauseOutline : playOutline" /></button>
                  <button class="ico-btn danger" title="Hapus" :disabled="u.role.name === 'Super Admin'" @click="remove(u)"><ion-icon :icon="trashOutline" /></button>
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
import { computed, reactive, ref } from 'vue';
import { addOutline, closeOutline, saveOutline, alertCircleOutline, createOutline, trashOutline, pauseOutline, playOutline } from 'ionicons/icons';
import PageShell from '@/components/PageShell.vue';
import { superadminService } from '@/services/superadmin.service';
import UserAvatar from '@/components/UserAvatar.vue';
import type { AdminUser, AdminRole } from '@/types';

const users = ref<AdminUser[]>([]);
const roles = ref<AdminRole[]>([]);
const loading = ref(true);
const error = ref('');
const showForm = ref(false);
const editing = ref<AdminUser | null>(null);
const saving = ref(false);
const formError = ref('');

const groupOptions = ['A', 'B', 'C', 'D', 'Non-Shift'];

const blankForm = () => ({ fullName: '', username: '', email: '', nik: '', roleId: 0, password: '', isActive: true });
const f = reactive(blankForm());
const op = reactive({ employeeId: '', section: '', group: '', position: '' });

const isOperatorRole = computed(() => roles.value.find((r) => r.id === f.roleId)?.name === 'Operator');

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    const [u, r] = await Promise.all([superadminService.listUsers(), superadminService.listRoles()]);
    if (u.data?.success) users.value = u.data.data;
    if (r.data?.success) roles.value = r.data.data;
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal memuat user.';
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

const openEdit = (u: AdminUser) => {
  editing.value = u;
  Object.assign(f, { fullName: u.fullName, username: u.username, email: u.email, nik: u.nik || '', roleId: u.roleId, password: '', isActive: u.isActive });
  Object.assign(op, u.operator
    ? { employeeId: u.operator.employeeId, section: u.operator.section, group: u.operator.group, position: u.operator.position }
    : { employeeId: '', section: '', group: '', position: '' });
  formError.value = '';
  showForm.value = true;
};

const closeForm = () => { showForm.value = false; };

const submit = async () => {
  if (!f.roleId) { formError.value = 'Pilih peran.'; return; }
  saving.value = true;
  formError.value = '';
  try {
    if (editing.value) {
      const payload: any = { email: f.email, fullName: f.fullName, nik: f.nik, roleId: f.roleId, isActive: f.isActive };
      if (f.password) payload.password = f.password;
      if (isOperatorRole.value) {
        payload.createOperator = true;
        payload.operatorData = { ...op, position: op.position || 'Operator' };
      }
      await superadminService.updateUser(editing.value.id, payload);
    } else {
      const payload: any = { username: f.username, email: f.email, password: f.password, fullName: f.fullName, nik: f.nik, roleId: f.roleId, isActive: f.isActive };
      if (isOperatorRole.value) {
        payload.createOperator = true;
        payload.operatorData = { ...op, position: op.position || 'Operator' };
      }
      await superadminService.createUser(payload);
    }
    showForm.value = false;
    await load();
  } catch (e: any) {
    formError.value = e?.response?.data?.message || 'Gagal menyimpan user.';
  } finally {
    saving.value = false;
  }
};

const toggle = async (u: AdminUser) => {
  try { await superadminService.toggleUser(u.id); await load(); } catch { /* abaikan */ }
};

const remove = async (u: AdminUser) => {
  if (!confirm(`Hapus user "${u.fullName}"?`)) return;
  try { await superadminService.deleteUser(u.id); await load(); } catch (e: any) { error.value = e?.response?.data?.message || 'Gagal menghapus.'; }
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
.row-actions { display: inline-flex; gap: 4px; justify-content: flex-end; }
.ico-btn { width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center; color: var(--db-ink-2); font-size: 17px; }
.ico-btn:hover { background: var(--db-icon-bg); color: var(--db-ink); }
.ico-btn.danger:hover { background: var(--db-red-bg); color: var(--db-red); }
.ico-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.nm { font-weight: 500; }
@media (max-width: 640px) { .form-grid.cols { grid-template-columns: 1fr; } }
</style>
