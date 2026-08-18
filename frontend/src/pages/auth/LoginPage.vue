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

.foot { font-size: 11.5px; color: var(--db-ink-3); }

.theme-toggle {
  position: fixed; top: 16px; right: 16px; z-index: 5;
  width: 40px; height: 40px; border-radius: 11px; display: grid; place-items: center;
  background: var(--db-card); border: 1px solid var(--db-line); color: var(--db-ink-2);
  font-size: 19px; box-shadow: var(--db-shadow);
}
.theme-toggle:hover { color: var(--db-ink); }
</style>
