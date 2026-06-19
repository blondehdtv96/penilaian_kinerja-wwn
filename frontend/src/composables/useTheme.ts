import { ref } from 'vue';

// Singleton level-modul: tombol dark-mode di topbar dan inisialisasi di main.ts
// berbagi state reaktif yang sama. Tema disetel via atribut [data-theme] di <html>,
// token --db-* di tokens.css ikut berubah.
const isDark = ref(false);
const STORAGE_KEY = 'theme';

const apply = () => {
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light');
};

export function useTheme() {
  const init = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark') isDark.value = true;
    else if (saved === 'light') isDark.value = false;
    else isDark.value = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    apply();
  };

  const set = (dark: boolean) => {
    isDark.value = dark;
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
    apply();
  };

  const toggle = () => set(!isDark.value);

  return { isDark, init, set, toggle };
}
