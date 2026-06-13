<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="login-shell">
        <!-- Brand panel — the dark "control room" threshold. -->
        <aside class="brand-panel">
          <!-- Tone-on-tone hash texture: data integrity, made visible but quiet. -->
          <div class="hash-field" aria-hidden="true">
            <span
              v-for="(line, i) in hashLines"
              :key="i"
              class="hash-line"
              :class="{ 'hash-line--accent': line.accent }"
            >{{ line.text }}</span>
          </div>

          <div class="brand-inner">
            <div class="brand-lockup">
              <div class="logo-square">B</div>
              <div class="brand-name">
                <h1>PT Bridgestone</h1>
                <p>Tire Indonesia</p>
              </div>
            </div>

            <div class="brand-statement">
              <h2>Merit &amp; misconduct, recorded on an immutable ledger.</h2>
              <p>
                Every performance event is hashed into a tamper-proof chain.
                What is recorded here is permanent — and trusted.
              </p>
            </div>

            <div class="brand-status">
              <span class="status-dot"></span>
              <span>Blockchain&nbsp;·&nbsp;Connected</span>
            </div>
          </div>
        </aside>

        <!-- Form panel — the bright working surface. -->
        <main class="form-panel">
          <div class="form-inner">
            <header class="form-head">
              <h2>Sign in</h2>
              <p>Access the performance tracking system.</p>
            </header>

            <form
              class="login-form"
              @submit.prevent="handleLogin"
              :aria-describedby="error ? 'login-error' : undefined"
              novalidate
            >
              <div class="field">
                <label for="username" class="field-label">Username</label>
                <input
                  id="username"
                  v-model="form.username"
                  type="text"
                  autocomplete="username"
                  class="field-input"
                  placeholder="e.g. supervisor.bekasi"
                  :disabled="loading"
                  required
                />
              </div>

              <div class="field">
                <label for="password" class="field-label">Password</label>
                <div class="password-wrap">
                  <input
                    id="password"
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    autocomplete="current-password"
                    class="field-input field-input--password"
                    placeholder="Enter your password"
                    :disabled="loading"
                    required
                  />
                  <button
                    type="button"
                    class="password-toggle"
                    :aria-label="showPassword ? 'Hide password' : 'Show password'"
                    :aria-pressed="showPassword"
                    :disabled="loading"
                    @click="showPassword = !showPassword"
                  >
                    <ion-icon :icon="showPassword ? eyeOffOutline : eyeOutline"></ion-icon>
                  </button>
                </div>
              </div>

              <div v-if="error" id="login-error" role="alert" class="form-error">
                <ion-icon :icon="alertCircleOutline" class="form-error__icon"></ion-icon>
                <span>{{ error }}</span>
              </div>

              <button
                type="submit"
                class="submit-btn"
                :disabled="loading"
                :aria-busy="loading"
              >
                <span v-if="loading" class="submit-spinner" aria-hidden="true"></span>
                {{ loading ? 'Signing in…' : 'Sign in' }}
              </button>
            </form>

            <p class="form-foot">
              Authorized personnel only. Access is logged for audit integrity.
            </p>
          </div>
        </main>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, IonIcon } from '@ionic/vue';
import { eyeOutline, eyeOffOutline, alertCircleOutline } from 'ionicons/icons';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const form = ref({
  username: '',
  password: ''
});

const loading = ref(false);
const error = ref('');
const showPassword = ref(false);

// Partial SHA-256 fragments rendered as a tone-on-tone typographic texture.
// Not real records — a deliberate, brand-typeset whisper of the ledger beneath.
const hashLines = [
  { text: '9f3a1d · c20e7b · a41f', accent: false },
  { text: '7b1142 · 84df0a · e3c9', accent: false },
  { text: 'a0e5c9 · 11bce3 · 6d20', accent: true },
  { text: '3c87fa · 90ab14 · 7e55', accent: false },
  { text: 'd41d8c · d98f00 · b204', accent: false },
  { text: 'e6b7f2 · 1a4c08 · 9fd1', accent: false },
  { text: '5f0cba · 7723ee · c108', accent: true },
  { text: '2bd4a9 · 0e61fc · 88a3', accent: false },
  { text: 'cafe01 · 4455bb · 19de', accent: false },
  { text: '8e2f7a · b30c91 · 04ff', accent: false },
  { text: '1c9d6e · 5a2b88 · f730', accent: true },
  { text: 'b75e30 · 22aa10 · 6c4d', accent: false },
  { text: 'f0091a · 7d6e23 · 91b8', accent: false },
  { text: '4a8c2f · e510dd · 3b07', accent: false }
];

const handleLogin = async () => {
  loading.value = true;
  error.value = '';

  try {
    await authStore.login(form.value.username, form.value.password);
    router.push('/dashboard');
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Login failed. Check your credentials and try again.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* ============================================================
   Login — "The Control Room" threshold
   Brand-surface exception: hardcoded Bridgestone values, like the
   App.vue sidebar (see frontend/CLAUDE.md). Red kept to ≤10% of surface.
   ============================================================ */

.login-shell {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  min-height: 100vh;
  min-height: 100dvh;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* ---------- Brand panel (dark) ---------- */
.brand-panel {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: clamp(2.5rem, 5vw, 4.5rem);
  background: linear-gradient(165deg, #111827 0%, #14152a 100%);
  border-right: 1px solid #1f2937;
  isolation: isolate;
}

/* Hash texture — barely-there bluish whisper toward #1a1a2e, with sparse red accents. */
.hash-field {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1.45rem;
  padding-left: 58%;
  z-index: -1;
  pointer-events: none;
  user-select: none;
  -webkit-mask-image: linear-gradient(105deg, transparent 0%, #000 55%, #000 90%, transparent 100%);
  mask-image: linear-gradient(105deg, transparent 0%, #000 55%, #000 90%, transparent 100%);
}

.hash-line {
  font-size: 0.82rem;
  font-weight: 500;
  letter-spacing: 0.18em;
  white-space: nowrap;
  color: rgba(124, 132, 176, 0.13);
  transform: translateX(var(--shift, 0));
}

.hash-line:nth-child(odd) { --shift: 1.5rem; }
.hash-line:nth-child(3n)  { --shift: -1rem; }

.hash-line--accent {
  color: rgba(239, 68, 68, 0.16);
}

.brand-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: clamp(2rem, 5vh, 3.5rem);
  max-width: 30rem;
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.logo-square {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.5rem;
  color: #fff;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.brand-name h1 {
  font-size: 1.125rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
  margin: 0;
}

.brand-name p {
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  color: #9ca3af;
  margin: 0.1rem 0 0;
}

.brand-statement h2 {
  font-size: clamp(1.5rem, 2.6vw, 2.125rem);
  font-weight: 700;
  line-height: 1.18;
  letter-spacing: -0.02em;
  color: #f3f4f6;
  margin: 0;
  text-wrap: balance;
}

.brand-statement p {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: #9ca3af;
  margin: 1rem 0 0;
  max-width: 32ch;
  text-wrap: pretty;
}

.brand-status {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #cbd5e1;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
  animation: status-pulse 2.8s ease-in-out infinite;
}

@keyframes status-pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(16, 185, 129, 0.85); }
  50%      { opacity: 0.65; box-shadow: 0 0 3px rgba(16, 185, 129, 0.5); }
}

/* ---------- Form panel (bright) ---------- */
.form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(2rem, 5vw, 4rem);
  background: #ffffff;
}

.form-inner {
  width: 100%;
  max-width: 23rem;
  animation: form-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes form-rise {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

.form-head {
  margin-bottom: 2rem;
}

.form-head h2 {
  font-size: 1.625rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #1f2937;
  margin: 0;
}

.form-head p {
  font-size: 0.9375rem;
  line-height: 1.5;
  color: #6b7280;
  margin: 0.4rem 0 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.field {
  display: flex;
  flex-direction: column;
}

.field-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.field-input {
  width: 100%;
  min-height: 48px;
  padding: 0.75rem 0.875rem;
  font-family: inherit;
  font-size: 0.9375rem;
  color: #1f2937;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
  appearance: none;
}

.field-input::placeholder {
  color: #6b7280;
}

.field-input:hover:not(:disabled) {
  border-color: #d1d5db;
}

/* Focus = a precise red color shift (a thickened border, not an outer glow). */
.field-input:focus {
  outline: none;
  border-color: #ef4444;
  box-shadow: inset 0 0 0 1px #ef4444;
}

.field-input:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.field-input--password {
  padding-right: 3rem;
}

.password-wrap {
  position: relative;
}

.password-toggle {
  position: absolute;
  top: 50%;
  right: 4px;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #6b7280;
  cursor: pointer;
  transition: color 0.18s ease, background 0.18s ease;
}

.password-toggle:hover:not(:disabled) {
  color: #1f2937;
  background: #f3f4f6;
}

.password-toggle:focus-visible {
  outline: 2px solid #ef4444;
  outline-offset: -2px;
}

.password-toggle:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.password-toggle ion-icon {
  font-size: 1.25rem;
}

/* Error — color always paired with icon + text, never color alone. */
.form-error {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 0.875rem;
  font-size: 0.875rem;
  line-height: 1.4;
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
}

.form-error__icon {
  flex-shrink: 0;
  font-size: 1.125rem;
  margin-top: 0.05rem;
}

.submit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 48px;
  margin-top: 0.25rem;
  padding: 0.75rem 1.5rem;
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #fff;
  background: #ef4444;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.18s ease, box-shadow 0.18s ease, transform 0.08s ease;
}

.submit-btn:hover:not(:disabled) {
  background: #b91c1c;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
}

.submit-btn:focus-visible {
  outline: 2px solid #ef4444;
  outline-offset: 2px;
}

.submit-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.submit-spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.form-foot {
  margin: 1.75rem 0 0;
  font-size: 0.75rem;
  line-height: 1.5;
  /* Steel Muted, not Steel Light — #9ca3af fails AA 4.5:1 on white (DESIGN.md). */
  color: #6b7280;
  text-align: center;
}

/* ---------- Responsive: split → stacked band ---------- */
@media (max-width: 900px) {
  .login-shell {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }

  .brand-panel {
    padding: 2rem 1.5rem;
    border-right: none;
    border-bottom: 1px solid #1f2937;
  }

  .brand-inner {
    gap: 1.5rem;
    max-width: none;
  }

  /* Trim the long-form statement on the compact band; keep the lockup + status. */
  .brand-statement p {
    display: none;
  }

  .brand-statement h2 {
    font-size: 1.25rem;
    max-width: 28ch;
  }

  .hash-field {
    padding-left: 50%;
    gap: 1rem;
  }

  .form-panel {
    padding: 2.5rem 1.5rem;
    align-items: flex-start;
  }

  .form-inner {
    margin: 0 auto;
  }
}

@media (max-width: 560px) {
  .brand-statement {
    display: none;
  }

  .brand-panel {
    padding: 1.5rem;
  }

  .hash-field {
    display: none;
  }
}

/* ---------- Reduced motion ---------- */
@media (prefers-reduced-motion: reduce) {
  .form-inner { animation: none; }
  .status-dot { animation: none; }
  .submit-spinner { animation-duration: 1.2s; }
}
</style>
