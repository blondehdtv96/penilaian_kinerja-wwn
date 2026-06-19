import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { IonicVue } from '@ionic/vue';
import App from './App.vue';
import router from './router';
import { useAuthStore } from '@/stores/auth';
import { useTheme } from '@/composables/useTheme';

// Inter — satu-satunya typeface sistem (self-hosted). Bobot mengikuti hierarki DESIGN.md:
// 400 body, 500 label, 600 judul, 700 headline/display, 800 (KPI/rank saja).
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';

// Ionic core CSS
import '@ionic/vue/css/core.css';
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

// Design system (mockup v3): token + reset/base + kelas komponen pakai-ulang
import '@/theme/tokens.css';
import '@/theme/base.css';
import '@/theme/components.css';

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(IonicVue);
app.use(router);

// Terapkan tema (light/dark) tersimpan sebelum mount agar tidak ada flash.
useTheme().init();

// Pulihkan auth dari localStorage SEBELUM router resolve — mencegah race redirect
// ke /login saat reload halaman.
const authStore = useAuthStore();
authStore.initializeAuth().then(() => {
  router.isReady().then(() => {
    app.mount('#app');
  });
});
