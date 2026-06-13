import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { IonicVue } from '@ionic/vue';
import App from './App.vue';
import router from './router';
import { useAuthStore } from '@/stores/auth';

// Inter — the system's sole typeface (self-hosted, no runtime network dependency).
// Weights map to the DESIGN.md hierarchy: 400 body, 500 labels, 600 titles,
// 700 headlines/display, 800 the Extrabold Ceiling (KPI/rank numbers only).
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';

// Ionic CSS
import '@ionic/vue/css/core.css';
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

// TailwindCSS
import './assets/styles/tailwind.css';

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(IonicVue);
app.use(router);

// Initialize auth from localStorage BEFORE router resolves
// This prevents the race condition where router redirects to /login
// before auth state is restored from localStorage
const authStore = useAuthStore();
authStore.initializeAuth().then(() => {
  router.isReady().then(() => {
    app.mount('#app');
  });
});
