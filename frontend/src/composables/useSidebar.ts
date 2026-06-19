import { ref } from 'vue';

// Singleton level-modul: sidebar (App.vue) dan tombol toggle di topbar (PageShell)
// menggerakkan state collapse/drawer reaktif yang sama.
const collapsed = ref(false);
const mobileOpen = ref(false);
const isMobile = ref(false);

let mql: MediaQueryList | null = null;
let initialized = false;

const handleViewportChange = (e: MediaQueryListEvent | MediaQueryList) => {
  isMobile.value = e.matches;
  if (!e.matches) mobileOpen.value = false; // keluar dari mobile → tutup drawer
};

export function useSidebar() {
  const init = () => {
    if (initialized) return;
    initialized = true;
    collapsed.value = localStorage.getItem('sidebar-collapsed') === 'true';
    mql = window.matchMedia('(max-width: 767px)');
    isMobile.value = mql.matches;
    mql.addEventListener('change', handleViewportChange);
  };

  const teardown = () => {
    mql?.removeEventListener('change', handleViewportChange);
    mql = null;
    initialized = false;
  };

  const toggle = () => {
    if (isMobile.value) {
      mobileOpen.value = !mobileOpen.value;
    } else {
      collapsed.value = !collapsed.value;
      localStorage.setItem('sidebar-collapsed', String(collapsed.value));
    }
  };

  const closeMobile = () => {
    mobileOpen.value = false;
  };

  return { collapsed, mobileOpen, isMobile, init, teardown, toggle, closeMobile };
}
