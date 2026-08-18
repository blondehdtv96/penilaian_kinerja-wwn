<template>
  <page-shell title="Kelola Role" subtitle="Peran & hak akses (permissions) sistem">
    <template #actions>
      <button class="btn-primary btn-sm" @click="openCreate"><ion-icon :icon="addOutline" /> Tambah Role</button>
    </template>

    <div class="card" v-if="showForm">
      <div class="card-head"><h3>{{ editing ? 'Edit Role' : 'Tambah Role' }}</h3>
        <button class="t-x" @click="closeForm" aria-label="Tutup"><ion-icon :icon="closeOutline" /></button>
      </div>
      <div class="alert err" v-if="formError"><ion-icon :icon="alertCircleOutline" /> {{ formError }}</div>
      <form class="form-grid" @submit.prevent="submit">
        <div class="field"><label>Nama Role</label><input v-model.trim="f.name" :disabled="!!editing && isSystem(editing.name)" required /></div>
        <div class="field"><label>Deskripsi</label><input v-model.trim="f.description" placeholder="Deskripsi singkat peran" /></div>
        <div class="field">
          <label>Permissions <span class="hint">(satu per baris)</span></label>
          <textarea v-model="f.permText" rows="6" placeholder="voo.create&#10;voo.approve_foreman&#10;dashboard.kpi"></textarea>
        </div>
        <div class="form-actions">
          <button class="btn-primary" :disabled="saving"><ion-icon :icon="saveOutline" /> {{ saving ? 'Menyimpan…' : 'Simpan' }}</button>
          <button class="btn-ghost" type="button" @click="closeForm">Batal</button>
        </div>
      </form>
    </div>

    <div class="card">
      <div class="card-head"><h3>Daftar Role</h3><span class="muted">{{ roles.length }}</span></div>
      <div v-if="loading" class="loading"><ion-spinner name="crescent" /> Memuat…</div>
      <div v-else-if="error" class="empty">{{ error }}</div>
      <div class="table-wrap" v-else>
        <table>
          <thead><tr><th>Role</th><th>Deskripsi</th><th class="amt">Permissions</th><th class="amt">User</th><th class="ta-r">Aksi</th></tr></thead>
          <tbody>
            <tr v-for="r in roles" :key="r.id">
              <td><span class="badge-muted">{{ r.name }}</span> <span v-if="isSystem(r.name)" class="muted sys">sistem</span></td>
              <td class="muted cell-wrap">{{ r.description || '—' }}</td>
              <td class="amt">{{ permCount(r) }}</td>
              <td class="amt">{{ r._count?.users ?? 0 }}</td>
              <td class="ta-r">
                <div class="row-actions">
                  <button class="ico-btn" title="Edit" @click="openEdit(r)"><ion-icon :icon="createOutline" /></button>
                  <button class="ico-btn danger" title="Hapus" :disabled="isSystem(r.name)" @click="remove(r)"><ion-icon :icon="trashOutline" /></button>
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
import { addOutline, closeOutline, saveOutline, alertCircleOutline, createOutline, trashOutline } from 'ionicons/icons';
import PageShell from '@/components/PageShell.vue';
import { superadminService } from '@/services/superadmin.service';
import type { AdminRole } from '@/types';

const SYSTEM = ['Super Admin', 'Section Manager', 'Foreman', 'Operator'];
const isSystem = (name: string) => SYSTEM.includes(name);

const roles = ref<AdminRole[]>([]);
const loading = ref(true);
const error = ref('');
const showForm = ref(false);
const editing = ref<AdminRole | null>(null);
const saving = ref(false);
const formError = ref('');
const f = reactive({ name: '', description: '', permText: '' });

const permArray = (r: AdminRole): string[] => {
  try { const v = JSON.parse(r.permissions); return Array.isArray(v) ? v : []; } catch { return []; }
};
const permCount = (r: AdminRole) => permArray(r).length;

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await superadminService.listRoles();
    if (data?.success) roles.value = data.data;
    else error.value = 'Gagal memuat role.';
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal memuat role.';
  } finally {
    loading.value = false;
  }
};

const openCreate = () => { editing.value = null; Object.assign(f, { name: '', description: '', permText: '' }); formError.value = ''; showForm.value = true; };
const openEdit = (r: AdminRole) => {
  editing.value = r;
  Object.assign(f, { name: r.name, description: r.description || '', permText: permArray(r).join('\n') });
  formError.value = '';
  showForm.value = true;
};
const closeForm = () => { showForm.value = false; };

const submit = async () => {
  saving.value = true;
  formError.value = '';
  const permissions = f.permText.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
  try {
    if (editing.value) await superadminService.updateRole(editing.value.id, { name: f.name, description: f.description, permissions });
    else await superadminService.createRole({ name: f.name, description: f.description, permissions });
    showForm.value = false;
    await load();
  } catch (e: any) {
    formError.value = e?.response?.data?.message || 'Gagal menyimpan role.';
  } finally {
    saving.value = false;
  }
};

const remove = async (r: AdminRole) => {
  if (!confirm(`Hapus role "${r.name}"?`)) return;
  try { await superadminService.deleteRole(r.id); await load(); } catch (e: any) { error.value = e?.response?.data?.message || 'Gagal menghapus role.'; }
};

onIonViewWillEnter(load);
</script>

<style scoped>
.cell-wrap { max-width: 360px; }
.sys { font-size: 10.5px; }
</style>
