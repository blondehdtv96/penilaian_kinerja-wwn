<template>
  <ion-page>
    <ion-content :scroll-y="true">
      <button
        class="theme-toggle"
        @click="theme.toggle()"
        :aria-label="theme.isDark.value ? 'Mode terang' : 'Mode gelap'"
      >
        <ion-icon :icon="theme.isDark.value ? sunnyOutline : moonOutline" />
      </button>

      <div class="login-wrap">
        <div class="login-card">
          <div class="brand">
            <div class="logo"><img :src="brandLogo" alt="Logo Bridgestone" /></div>
            <div class="b-txt">
              <b>PT Bridgestone</b>
              <small>Tire Curing Indonesia — Bekasi Plant</small>
            </div>
          </div>

          <h1>Masuk</h1>
          <p class="lead">Sistem Penilaian Kinerja — VoO / Ide Kaizen</p>

          <div class="alert" v-if="error">
            <ion-icon :icon="alertCircleOutline" /> {{ error }}
          </div>

          <form class="form-grid" @submit.prevent="submit">
            <div class="field">
              <label for="username">Nama Pengguna</label>
              <input
                id="username"
                v-model.trim="username"
                type="text"
                autocomplete="username"
                placeholder="mis. section_manager"
                required
              />
            </div>

            <div class="field">
              <label for="password">Kata Sandi</label>
              <div class="pw">
                <input
                  id="password"
                  v-model="password"
                  :type="showPw ? 'text' : 'password'"
                  autocomplete="current-password"
                  placeholder="Masukkan kata sandi"
                  required
                />
                <button
                  type="button"
                  class="pw-toggle"
                  @click="showPw = !showPw"
                  :aria-label="showPw ? 'Sembunyikan sandi' : 'Tampilkan sandi'"
                >
                  <ion-icon :icon="showPw ? eyeOffOutline : eyeOutline" />
                </button>
              </div>
            </div>

            <button class="btn-primary btn-block btn-lg" type="submit" :disabled="auth.loading">
              <ion-icon :icon="logInOutline" v-if="!auth.loading" />
              {{ auth.loading ? 'Memproses…' : 'Masuk' }}
            </button>
          </form>

          <div class="demo">
            <div class="demo-head">Akun demo — klik untuk mengisi</div>
            <div class="demo-grid">
              <button
                v-for="acc in demoAccounts"
                :key="acc.username"
                type="button"
                class="demo-item"
                @click="fill(acc)"
              >
                <span class="demo-role">{{ acc.label }}</span>
                <span class="demo-user">{{ acc.username }}</span>
              </button>
            </div>

            <div class="demo-divider">
              <span>Staff Produksi</span>
            </div>
            <div class="demo-grid demo-grid-staff">
              <button
                v-for="acc in staffProduksiAccounts"
                :key="acc.username"
                type="button"
                class="demo-item demo-item-staff"
                @click="fill(acc)"
              >
                <div class="demo-item-inner">
                  <span class="demo-role">{{ acc.label }}</span>
                  <span class="demo-badge">Monitor</span>
                </div>
                <span class="demo-user">{{ acc.username }}</span>
                <span class="demo-desc">Akses VoO &amp; Misconduct Monitor</span>
              </button>
            </div>
          </div>
        </div>

        <p class="foot">Audit trail terjamin blockchain · v2.0</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent, IonIcon } from '@ionic/vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  alertCircleOutline, eyeOutline, eyeOffOutline, logInOutline, moonOutline, sunnyOutline,
} from 'ionicons/icons';
import { useAuthStore } from '@/stores/auth';
import { useTheme } from '@/composables/useTheme';
import { landingFor } from '@/router';
import brandLogo from '@/assets/bridgestone-logo.png';

const auth = useAuthStore();
const router = useRouter();
const theme = useTheme();

const username = ref('');
const password = ref('');
const showPw = ref(false);
const error = ref('');

interface DemoAccount { label: string; username: string; password: string; badge?: string }
const demoAccounts: DemoAccount[] = [
  { label: 'Super Admin', username: 'superadmin', password: 'superadmin123' },
  { label: 'Section Manager', username: 'section_manager', password: 'manager123' },
  { label: 'Foreman', username: 'foreman01', password: 'foreman123' },
  { label: 'Operator', username: 'operator01', password: 'operator123' },
];

const staffProduksiAccounts: DemoAccount[] = [
  { label: 'Staff Produksi', username: 'staff_produksi', password: 'staff123', badge: 'Staff' },
];

const fill = (acc: DemoAccount) => {
  username.value = acc.username;
  password.value = acc.password;
  error.value = '';
};

const submit = async () => {
  error.value = '';
  try {
    const ok = await auth.login(username.value, password.value);
    if (ok) {
      router.push(landingFor(auth.role));
    } else {
      error.value = 'Nama pengguna atau kata sandi salah.';
    }
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal masuk. Periksa koneksi ke server.';
  }
};
</script>

<style scoped>
.login-wrap {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 32px 18px;
}
.login-card {
  width: 100%;
  max-width: 410px;
  background: var(--db-card);
  border: 1px solid var(--db-line);
  border-radius: var(--radius);
  box-shadow: var(--db-shadow-panel);
  padding: 30px 28px;
}
.brand { display: flex; align-items: center; gap: 12px; margin-bottom: 22px; }
.brand .logo {
  width: 44px; height: 44px; border-radius: 12px; background: #fff;
  display: grid; place-items: center; overflow: hidden;
  border: 1px solid var(--db-line); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.brand .logo img { width: 100%; height: 100%; object-fit: contain; display: block; }
.b-txt b { font-size: 15px; font-weight: 700; display: block; line-height: 1.15; }
.b-txt small { font-size: 11px; color: var(--db-ink-3); }

.login-card h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.01em; }
.lead { font-size: 13px; color: var(--db-ink-2); margin: 3px 0 20px; }

.alert {
  display: flex; align-items: center; gap: 8px; background: var(--db-red-bg);
  color: var(--db-red-ink); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 10px;
  padding: 10px 13px; font-size: 13px; font-weight: 500; margin-bottom: 16px;
}
.alert ion-icon { font-size: 18px; flex-shrink: 0; }

.pw { position: relative; display: flex; }
.pw input { padding-right: 44px; }
.pw-toggle {
  position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
  width: 34px; height: 34px; display: grid; place-items: center;
  color: var(--db-ink-3); font-size: 18px; border-radius: 8px;
}
.pw-toggle:hover { color: var(--db-ink); background: var(--db-icon-bg); }

.btn-block { margin-top: 4px; }

.demo { margin-top: 22px; border-top: 1px solid var(--db-line); padding-top: 16px; }
.demo-head {
  font-size: 10.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--db-ink-3); margin-bottom: 10px;
}
.demo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.demo-item {
  display: flex; flex-direction: column; gap: 2px; text-align: left;
  background: var(--db-icon-bg); border: 1px solid var(--db-line); border-radius: 10px;
  padding: 9px 11px; transition: border-color 0.15s ease;
}
.demo-item:hover { border-color: var(--db-brand); }
.demo-role { font-size: 12.5px; font-weight: 600; color: var(--db-ink); }
.demo-user { font-size: 11px; color: var(--db-ink-3); }

.demo-divider {
  display: flex; align-items: center; gap: 10px;
  margin: 14px 0 10px; font-size: 10.5px; font-weight: 700;
  letter-spacing: 0.06em; text-transform: uppercase; color: var(--db-ink-3);
}
.demo-divider::before,
.demo-divider::after {
  content: ''; flex: 1; height: 1px; background: var(--db-line);
}

.demo-grid-staff { grid-template-columns: 1fr; }

.demo-item-staff {
  background: linear-gradient(135deg, rgba(var(--db-brand-rgb, 239,68,68), 0.04), var(--db-icon-bg));
  border-color: rgba(239, 68, 68, 0.18);
}
.demo-item-staff:hover { border-color: var(--db-brand); background: rgba(239, 68, 68, 0.07); }

.demo-item-inner {
  display: flex; align-items: center; justify-content: space-between; gap: 6px;
}
.demo-badge {
  font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
  background: var(--db-brand); color: #fff;
  padding: 2px 7px; border-radius: 20px;
}
.demo-desc { font-size: 10.5px; color: var(--db-ink-3); margin-top: 1px; }

.foot { font-size: 11.5px; color: var(--db-ink-3); }

.theme-toggle {
  position: fixed; top: 16px; right: 16px; z-index: 5;
  width: 40px; height: 40px; border-radius: 11px; display: grid; place-items: center;
  background: var(--db-card); border: 1px solid var(--db-line); color: var(--db-ink-2);
  font-size: 19px; box-shadow: var(--db-shadow);
}
.theme-toggle:hover { color: var(--db-ink); }
</style>
