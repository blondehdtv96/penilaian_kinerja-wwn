<template>
  <ion-page>
    <ion-content :scroll-y="false">
      <!-- .db-main = scroller asli (mockup v3), bukan scroll bawaan ion-content -->
      <main class="db-main">
        <div class="db-panel">
          <header class="db-topbar">
            <button class="t-icon" @click="toggle" aria-label="Buka/tutup menu">
              <ion-icon :icon="menuIcon" />
            </button>
            <div class="t-search">
              <ion-icon :icon="searchOutline" />
              <input :placeholder="searchPlaceholder" aria-label="Cari" />
            </div>
            <div class="t-actions">
              <button class="t-icon bell" aria-label="Notifikasi">
                <ion-icon :icon="notificationsOutline" />
              </button>
              <button
                class="t-icon"
                @click="theme.toggle()"
                :aria-label="theme.isDark.value ? 'Mode terang' : 'Mode gelap'"
              >
                <ion-icon :icon="theme.isDark.value ? sunnyOutline : moonOutline" />
              </button>
              <div class="t-ava">{{ initial }}</div>
            </div>
          </header>

          <div class="db-content">
            <div class="page-head" v-if="title || subtitle || slots.actions">
              <div>
                <h1 v-if="title">{{ title }}</h1>
                <p v-if="subtitle">{{ subtitle }}</p>
              </div>
              <div class="head-right" v-if="slots.actions">
                <slot name="actions" />
              </div>
            </div>
            <slot />
          </div>
        </div>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent, IonIcon } from '@ionic/vue';
import { computed, useSlots } from 'vue';
import {
  searchOutline, notificationsOutline, moonOutline, sunnyOutline,
  menuOutline, chevronBackOutline, chevronForwardOutline,
} from 'ionicons/icons';
import { useSidebar } from '@/composables/useSidebar';
import { useTheme } from '@/composables/useTheme';
import { useAuthStore } from '@/stores/auth';

withDefaults(
  defineProps<{ title?: string; subtitle?: string; searchPlaceholder?: string }>(),
  { searchPlaceholder: 'Cari operator, event, area…' }
);

const slots = useSlots();
const auth = useAuthStore();
const theme = useTheme();
const { collapsed, isMobile, toggle } = useSidebar();

const initial = computed(() => auth.user?.fullName?.charAt(0).toUpperCase() ?? '?');
const menuIcon = computed(() => {
  if (isMobile.value) return menuOutline;
  return collapsed.value ? chevronForwardOutline : chevronBackOutline;
});
</script>

<style scoped>
.db-main {
  height: 100%;
  overflow-y: auto;
  /* Jarak atas/bawah dipindah ke margin .db-panel (BUKAN padding di sini), supaya
     header sticky top:0 menempel flush ke tepi atas saat di-scroll — tanpa celah
     konten yang mengintip di atas header. Padding kiri/kanan = gap mengambang. */
  padding: 0 14px;
}
.db-panel {
  background: var(--db-card);
  border: 1px solid var(--db-line);
  border-radius: var(--radius);
  box-shadow: var(--db-shadow-panel);
  position: relative;
  margin: 12px 0;
}

.db-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 13px 24px;
  background: color-mix(in srgb, var(--db-card) 72%, transparent);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid var(--db-line);
  border-radius: var(--radius) var(--radius) 0 0;
}
.t-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: var(--db-ink-2);
  font-size: 20px;
  flex-shrink: 0;
}
.t-icon:hover {
  background: var(--db-icon-bg);
  color: var(--db-ink);
}
.t-search {
  flex: 1;
  max-width: 440px;
  display: flex;
  align-items: center;
  gap: 9px;
  background: var(--db-icon-bg);
  border: 1px solid var(--db-line);
  border-radius: 11px;
  padding: 0 13px;
  color: var(--db-ink-3);
  font-size: 13px;
}
.t-search ion-icon { font-size: 17px; }
.t-search input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font: inherit;
  color: var(--db-ink);
  padding: 9px 0;
}
.t-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}
.bell { position: relative; }
.bell::after {
  content: '';
  position: absolute;
  top: 6px;
  right: 6px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--db-red);
  border: 1.5px solid var(--db-card);
}
.t-ava {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--db-brand);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
  margin-left: 6px;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .db-main { padding: 0 8px; }
  .db-panel { margin: 8px 0; }
  .db-topbar { padding: 11px 14px; gap: 10px; }
  .t-search { display: none; }
}
</style>
