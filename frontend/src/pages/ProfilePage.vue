<template>
  <page-shell title="Profil Saya" subtitle="Informasi akun dan peran Anda">
    <div class="grid g-bottom">
      <div class="card">
        <div class="prof-head">
          <div class="prof-ava"><UserAvatar /></div>
          <div class="prof-id">
            <h2>{{ auth.user?.fullName }}</h2>
            <span class="badge-muted">{{ auth.user?.role }}</span>
          </div>
        </div>
        <div class="info-list">
          <div class="info-row"><span>Nama Pengguna</span><b>{{ auth.user?.username }}</b></div>
          <div class="info-row"><span>Email</span><b>{{ auth.user?.email }}</b></div>
          <div class="info-row"><span>NIK</span><b>{{ auth.user?.nik || '-' }}</b></div>
          <div class="info-row"><span>Status Akun</span><b>{{ auth.user?.isActive ? 'Aktif' : 'Nonaktif' }}</b></div>
        </div>
        <button class="btn-primary btn-block" style="margin-top: 18px" @click="openEdit">
          <ion-icon :icon="createOutline" /> Ubah Profil
        </button>
        <button class="btn-ghost btn-block" style="margin-top: 10px" @click="logout">
          <ion-icon :icon="logOutOutline" /> Keluar dari Akun
        </button>
      </div>

      <div class="card" v-if="editing">
        <div class="card-head"><h3>Ubah Profil</h3></div>
        <div class="alert err" v-if="formError"><ion-icon :icon="alertCircleOutline" /> {{ formError }}</div>
        <div class="alert ok" v-if="formOk"><ion-icon :icon="checkmarkCircleOutline" /> {{ formOk }}</div>
        <form class="edit-form" @submit.prevent="save">
          <div class="field">
            <label>Email</label>
            <input type="email" v-model.trim="form.email" required />
          </div>
          <div class="field">
            <label>NIK</label>
            <input v-model.trim="form.nik" placeholder="Nomor Induk Karyawan" />
          </div>

          <div class="op-divider">Ubah Kata Sandi <span class="hint">(opsional)</span></div>
          <div class="field">
            <label>Kata Sandi Saat Ini</label>
            <input type="password" v-model="form.currentPassword" autocomplete="current-password"
                   :required="!!form.password" placeholder="Wajib jika mengubah sandi" />
          </div>
          <div class="field">
            <label>Kata Sandi Baru</label>
            <input type="password" v-model="form.password" autocomplete="new-password"
                   placeholder="Min. 6 karakter — kosongkan jika tidak diubah" />
          </div>

          <div class="form-actions">
            <button class="btn-primary" :disabled="saving">
              <ion-icon :icon="saveOutline" /> {{ saving ? 'Menyimpan…' : 'Simpan' }}
            </button>
            <button class="btn-ghost" type="button" @click="closeEdit">Batal</button>
          </div>
        </form>
      </div>

      <div class="card" v-if="op">
        <div class="card-head"><h3>Data Operator</h3></div>
        <div class="info-list">
          <div class="info-row"><span>ID Karyawan</span><b>{{ op.employeeId }}</b></div>
          <div class="info-row"><span>Section</span><b>{{ op.section }}</b></div>
          <div class="info-row"><span>Group</span><b>{{ op.group }}</b></div>
          <div class="info-row"><span>Posisi</span><b>{{ op.position }}</b></div>
        </div>
        <div class="qr-wrap" v-if="op.qrCode">
          <img :src="op.qrCode" alt="QR Identitas Operator" />
          <span class="muted">QR Identitas — tunjukkan ke Foreman</span>
        </div>
      </div>
    </div>
  </page-shell>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  logOutOutline, createOutline, saveOutline,
  alertCircleOutline, checkmarkCircleOutline,
} from 'ionicons/icons';
import PageShell from '@/components/PageShell.vue';
import { useAuthStore } from '@/stores/auth';
import UserAvatar from '@/components/UserAvatar.vue';

const auth = useAuthStore();
const router = useRouter();
const op = computed(() => auth.user?.operator ?? null);

const editing = ref(false);
const saving = ref(false);
const formError = ref('');
const formOk = ref('');
const form = reactive({ email: '', nik: '', currentPassword: '', password: '' });

const openEdit = () => {
  form.email = auth.user?.email || '';
  form.nik = auth.user?.nik || '';
  form.currentPassword = '';
  form.password = '';
  formError.value = '';
  formOk.value = '';
  editing.value = true;
};

const closeEdit = () => { editing.value = false; };

const save = async () => {
  formError.value = '';
  formOk.value = '';
  if (form.password && !form.currentPassword) {
    formError.value = 'Masukkan kata sandi saat ini untuk mengubah sandi.';
    return;
  }
  saving.value = true;
  try {
    const payload: {
      email?: string; nik?: string | null; password?: string; currentPassword?: string;
    } = {
      email: form.email,
      nik: form.nik.trim() === '' ? null : form.nik.trim(),
    };
    if (form.password) {
      payload.password = form.password;
      payload.currentPassword = form.currentPassword;
    }
    const res = await auth.updateProfile(payload);
    if (res?.success) {
      formOk.value = 'Profil berhasil diperbarui.';
      form.currentPassword = '';
      form.password = '';
    } else {
      formError.value = res?.message || 'Gagal memperbarui profil.';
    }
  } catch (e: any) {
    formError.value = e?.response?.data?.message || 'Gagal memperbarui profil.';
  } finally {
    saving.value = false;
  }
};

const logout = () => {
  auth.logout();
  router.push('/login');
};
</script>

<style scoped>
.prof-head { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
.prof-ava {
  width: 60px; height: 60px; border-radius: 50%; background: var(--db-brand); color: #fff;
  display: grid; place-items: center; font-weight: 700; font-size: 24px;
  box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);
}
.prof-id h2 { font-size: 19px; font-weight: 700; }
.prof-id .badge-muted { margin-top: 6px; }
.qr-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-top: 18px; }
.qr-wrap img {
  width: 180px; height: 180px; border-radius: 12px; border: 1px solid var(--db-line);
  background: #fff; padding: 8px;
}
.edit-form { display: flex; flex-direction: column; gap: 14px; }
.edit-form .field { display: flex; flex-direction: column; gap: 6px; }
.edit-form label { font-size: 13px; font-weight: 600; color: var(--db-ink-2); }
.edit-form input {
  width: 100%; padding: 10px 12px; border: 1px solid var(--db-line);
  border-radius: 10px; font-size: 14px; background: var(--db-card); color: var(--db-ink);
}
.edit-form .op-divider {
  font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--db-ink-3); border-top: 1px solid var(--db-line); padding-top: 12px;
}
.edit-form .hint { font-weight: 500; text-transform: none; letter-spacing: 0; color: var(--db-ink-3); }
.form-actions { display: flex; gap: 10px; margin-top: 4px; }
.alert { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 10px; font-size: 13.5px; margin-bottom: 14px; }
.alert.err { background: var(--db-red-bg, #fee2e2); color: var(--db-red, #ef4444); }
.alert.ok { background: #dcfce7; color: #16a34a; }
</style>
