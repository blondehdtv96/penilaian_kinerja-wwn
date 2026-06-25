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
              <div class="bell-wrap">
                <button
                  class="t-icon bell"
                  :class="{ 'has-unread': notif.unread > 0 }"
                  @click.stop="bellOpen = !bellOpen"
                  :aria-expanded="bellOpen"
                  aria-label="Notifikasi"
                >
                  <ion-icon :icon="notificationsOutline" />
                  <span v-if="notif.unread > 0" class="bell-badge">{{ notif.unread > 9 ? '9+' : notif.unread }}</span>
                </button>

                <teleport to="body">
                  <div v-if="bellOpen" class="bell-backdrop" @click="bellOpen = false"></div>
                  <transition name="bell-pop">
                    <div v-if="bellOpen" class="bell-panel" role="menu" aria-label="Daftar notifikasi">
                      <div class="bell-head">
                        <span class="bell-h-title">Notifikasi</span>
                        <button v-if="notif.unread > 0" class="bell-markall" @click="notif.markAllRead()">
                          <ion-icon :icon="checkmarkDoneOutline" />
                          Tandai semua
                        </button>
                      </div>
                      <div class="bell-list">
                        <div v-if="!notif.items.length" class="bell-empty">
                          <ion-icon :icon="notificationsOffOutline" />
                          <p>Belum ada notifikasi</p>
                        </div>
                        <button
                          v-for="n in notif.items"
                          :key="n.id"
                          class="bell-item"
                          :class="[{ unread: !n.isRead }, 'lv-' + n.type]"
                          @click="openNotif(n)"
                        >
                          <span class="bi-dot"></span>
                          <span class="bi-main">
                            <span class="bi-title">{{ n.title }}</span>
                            <span v-if="n.body" class="bi-body">{{ n.body }}</span>
                            <span class="bi-time">{{ fmtRelative(n.createdAt) }}</span>
                          </span>
                        </button>
                      </div>
                    </div>
                  </transition>
                </teleport>
              </div>
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
import { computed, ref, watch, useSlots } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  searchOutline, notificationsOutline, notificationsOffOutline, checkmarkDoneOutline,
  moonOutline, sunnyOutline, menuOutline, chevronBackOutline, chevronForwardOutline,
} from 'ionicons/icons';
import { useSidebar } from '@/composables/useSidebar';
import { useTheme } from '@/composables/useTheme';
import { useAuthStore } from '@/stores/auth';
import { useNotificationsStore } from '@/stores/notifications';
import { fmtRelative } from '@/utils/format';
import type { NotificationDTO } from '@/services/notifications.service';

withDefaults(
  defineProps<{ title?: string; subtitle?: string; searchPlaceholder?: string }>(),
  { searchPlaceholder: 'Cari operator, event, area…' }
);

const slots = useSlots();
const auth = useAuthStore();
const theme = useTheme();
const notif = useNotificationsStore();
const router = useRouter();
const route = useRoute();
const { collapsed, isMobile, toggle } = useSidebar();

const bellOpen = ref(false);
const openNotif = (n: NotificationDTO) => {
  notif.markRead(n.id);
  bellOpen.value = false;
  if (n.link) router.push(n.link);
};
// Tutup panel notifikasi saat berpindah halaman.
watch(() => route.fullPath, () => { bellOpen.value = false; });

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
.bell-wrap { position: relative; display: flex; }
.bell { position: relative; }
.bell.has-unread { color: var(--db-ink); }
.bell-badge {
  position: absolute;
  top: 3px;
  right: 3px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  display: grid;
  place-items: center;
  background: var(--db-red);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  border-radius: 999px;
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

/* ---------- Panel notifikasi (di-teleport ke <body>) ---------- */
.bell-backdrop { position: fixed; inset: 0; z-index: 75; background: transparent; }
.bell-panel {
  position: fixed;
  top: 68px;
  right: 24px;
  z-index: 80;
  width: 360px;
  max-width: calc(100vw - 28px);
  max-height: min(70vh, 540px);
  display: flex;
  flex-direction: column;
  background: var(--db-card);
  border: 1px solid var(--db-line);
  border-radius: 16px;
  box-shadow: var(--db-shadow-panel);
  overflow: hidden;
}
.bell-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px;
  border-bottom: 1px solid var(--db-line);
}
.bell-h-title { font-size: 14px; font-weight: 700; color: var(--db-ink); }
.bell-markall {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: var(--db-brand);
  padding: 4px 8px;
  border-radius: 8px;
}
.bell-markall:hover { background: var(--db-icon-bg); }
.bell-markall ion-icon { font-size: 15px; }
.bell-list { overflow-y: auto; padding: 6px; }
.bell-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 38px 16px;
  color: var(--db-ink-3);
}
.bell-empty ion-icon { font-size: 30px; opacity: 0.6; }
.bell-empty p { font-size: 13px; }
.bell-item {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  width: 100%;
  text-align: left;
  padding: 11px 12px;
  border-radius: 11px;
  transition: background 0.14s ease;
}
.bell-item:hover { background: var(--db-icon-bg); }
.bell-item.unread { background: color-mix(in srgb, var(--db-brand) 6%, transparent); }
.bell-item.unread:hover { background: color-mix(in srgb, var(--db-brand) 10%, transparent); }
.bi-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  margin-top: 5px;
  border-radius: 50%;
  background: var(--db-ink-3);
}
.lv-info .bi-dot { background: var(--db-blue); }
.lv-success .bi-dot { background: var(--db-green); }
.lv-warning .bi-dot { background: var(--db-amber-ink); }
.lv-error .bi-dot { background: var(--db-red); }
.bell-item:not(.unread) .bi-dot { opacity: 0.35; }
.bi-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.bi-title { font-size: 13px; font-weight: 600; color: var(--db-ink); line-height: 1.3; }
.bi-body {
  font-size: 12px;
  color: var(--db-ink-2);
  line-height: 1.35;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.bi-time { font-size: 11px; color: var(--db-ink-3); margin-top: 1px; }

.bell-pop-enter-active, .bell-pop-leave-active { transition: opacity 0.16s ease, transform 0.16s ease; }
.bell-pop-enter-from, .bell-pop-leave-to { opacity: 0; transform: translateY(-6px) scale(0.98); }

@media (max-width: 640px) {
  .bell-panel { top: 60px; right: 8px; left: 8px; width: auto; max-width: none; }
}
</style>
