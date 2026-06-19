<!--
  DashboardKPIPage.vue — PT Bridgestone Merit-Misconduct System
  ============================================================
  INTEGRASI (cek sebelum/sesudah drop-in):
  1. Ionicons: semua ikon di-import dari 'ionicons/icons' (bawaan Ionic, BUKAN package baru).
  2. Scroll model: ion-content dipakai dengan :scroll-y="false". Scroll asli ditangani
     oleh <main class="db-main"> (overflow-y:auto) supaya sticky header + "scrollbar di
     luar panel" + corner-reveal jalan. JANGAN balikin ke scroll bawaan ion-content.
  3. Warna: token desain di-scope lokal via CSS var (--db-*) di <style scoped>. Ini
     SENGAJA tidak pakai --ion-color-* karena palet ink/grey shadcn tidak ada di palet
     Ionic — pola yang sama dengan pengecualian sidebar App.vue di CLAUDE.md. Tidak
     mengubah tema global.
  4. Router: path di go('...') adalah TEBAKAN dari README. Sesuaikan dengan router-mu.
  5. Data: semua angka di bawah ini MOCK. Ganti dengan store Pinia (lihat blok // DATA).
-->
<template>
  <ion-page>
    <ion-content :scroll-y="false" :style="{ '--background': 'var(--db-canvas)' }">
      <div class="db-shell" :class="{ dark }">

        <!-- ============ SIDEBAR (fixed, tidak ikut scroll) ============ -->
        <aside class="db-side" :class="{ collapsed }">
          <div class="brand">
            <div class="logo">B</div>
            <div class="brand-txt" v-show="!collapsed">
              <b>PT Bridgestone</b><small>Tire Indonesia</small>
            </div>
          </div>

          <div class="me" v-show="!collapsed">
            <div class="ava">{{ user.initial }}</div>
            <div class="me-txt">
              <div class="nm">{{ user.name }}</div>
              <div class="em">{{ user.email }}</div>
              <span class="role">{{ user.role }}</span>
            </div>
          </div>

          <div class="nav-label" v-show="!collapsed">Main navigation</div>
          <a
            v-for="item in navItems"
            :key="item.key"
            class="nav-item"
            :class="{ active: active === item.key }"
            @click="selectNav(item)"
          >
            <ion-icon :icon="item.icon" />
            <span v-show="!collapsed">{{ item.label }}</span>
          </a>

          <div class="spacer"></div>
          <div class="chain" v-show="!collapsed">
            <span class="dot"></span> Blockchain: Connected
          </div>
          <button class="signout" @click="signOut">
            <ion-icon :icon="icons.logout" />
            <span v-show="!collapsed">Sign Out</span>
          </button>
        </aside>

        <!-- ============ MAIN: kertas yang digulir ============ -->
        <main class="db-main">
          <div class="db-panel">

            <!-- glass header, sticky -->
            <header class="db-topbar">
              <button class="toggle" @click="collapsed = !collapsed" aria-label="Toggle sidebar">
                <ion-icon :icon="collapsed ? icons.expand : icons.collapse" />
              </button>
              <div class="search" @click="focusSearch">
                <ion-icon :icon="icons.search" />
                <input ref="searchEl" v-model="query" placeholder="Cari operator, event, block…" />
                <span class="kbd">⌘K</span>
              </div>
              <div class="top-actions">
                <button class="ic bell" @click="openNotifications" aria-label="Notifikasi">
                  <ion-icon :icon="icons.bell" />
                </button>
                <button class="ic" @click="dark = !dark" aria-label="Mode gelap">
                  <ion-icon :icon="dark ? icons.sun : icons.moon" />
                </button>
                <button class="ic" @click="openTheme" aria-label="Tema">
                  <ion-icon :icon="icons.palette" />
                </button>
                <div class="ava-sm">{{ user.initial }}</div>
              </div>
            </header>

            <div class="db-content">
              <!-- page head -->
              <div class="page-head">
                <div>
                  <h1>Dashboard KPI</h1>
                  <p>Selamat datang, {{ user.name }}</p>
                </div>
                <div class="head-right">
                  <button class="daterange" @click="openRange">
                    <ion-icon :icon="icons.calendar" /> {{ dateRange }}
                  </button>
                  <button class="icon-btn" @click="exportReport" aria-label="Export">
                    <ion-icon :icon="icons.download" />
                  </button>
                </div>
              </div>

              <!-- KPI ROW -->
              <div class="grid g4">
                <div class="card">
                  <div class="kpi-top"><span class="kpi-ico"><ion-icon :icon="icons.users" /></span> Total Operator</div>
                  <div class="val">{{ kpi.operators }} <span class="delta up"><ion-icon :icon="icons.up" /> 4.2%</span></div>
                  <div class="sub-note">operator terdaftar</div>
                  <div class="btn-row">
                    <button class="btn dark-btn" @click="go('/merit/new')"><ion-icon :icon="icons.plus" /> Catat Event</button>
                    <button class="btn" @click="go('/operators/scan')"><ion-icon :icon="icons.qr" /> Scan QR</button>
                  </div>
                </div>
                <div class="card">
                  <div class="kpi-top"><span class="kpi-ico"><ion-icon :icon="icons.trophy" /></span> Total Merit</div>
                  <div class="val">{{ kpi.merit }}</div>
                  <div class="sub-note"><span class="delta up"><ion-icon :icon="icons.up" /> 8.5%</span> penghargaan tercatat</div>
                </div>
                <div class="card">
                  <div class="kpi-top"><span class="kpi-ico"><ion-icon :icon="icons.alert" /></span> Total Misconduct</div>
                  <div class="val">{{ kpi.misconduct }}</div>
                  <div class="sub-note"><span class="delta up"><ion-icon :icon="icons.down" /> 5.5%</span> turun, pelanggaran tercatat</div>
                </div>
                <div class="card">
                  <div class="kpi-top spread">
                    <span class="lbl"><span class="kpi-ico"><ion-icon :icon="icons.cube" /></span> Blok Blockchain</span>
                    <span class="badge">live</span>
                  </div>
                  <div class="val">{{ kpi.blocks }}</div>
                  <div class="spark"><span v-for="(h,i) in spark" :key="i" :style="{ height: h + '%' }"></span></div>
                </div>
              </div>

              <!-- MID ROW -->
              <div class="grid g3">
                <div class="card">
                  <div class="card-head"><h3>Merit per Departemen</h3><ion-icon class="muted" :icon="icons.arrowUR" /></div>
                  <div class="muted">Total event tercatat</div>
                  <div class="val sm">1,284 <span class="delta up s"><ion-icon :icon="icons.up" /> 15.5%</span></div>
                  <div class="seg"><span v-for="(d,i) in dept" :key="i" :style="{ width: d.pct + '%', background: greys[i] }"></span></div>
                  <div class="src-list">
                    <div class="src-row" v-for="(d,i) in dept" :key="d.name">
                      <span class="d" :style="{ background: greys[i] }"></span> {{ d.name }} <b>{{ d.count }}</b>
                    </div>
                  </div>
                  <div class="footnote"><ion-icon :icon="icons.lock" /> Semua event ter-hash on-chain — audit trail tidak bisa diubah.</div>
                </div>

                <div class="card">
                  <div class="card-head"><h3>Tren Kinerja</h3>
                    <button class="pill" @click="cycleRange">{{ trendRange }} <ion-icon :icon="icons.chevD" /></button>
                  </div>
                  <div class="muted">6 bulan terakhir</div>
                  <div class="bars">
                    <div class="bar-col" v-for="b in trend" :key="b.m">
                      <div class="bar" :style="{ height: b.h + '%' }"></div><span class="b-lbl">{{ b.m }}</span>
                    </div>
                  </div>
                  <div class="trend">Naik 5.2% bulan ini <span class="up"><ion-icon :icon="icons.up" /></span></div>
                </div>

                <div class="card">
                  <div class="card-head"><h3>Merit vs Misconduct</h3><ion-icon class="muted" :icon="icons.chevR" /></div>
                  <div class="muted">Data 1–14 Jun 2026</div>
                  <div class="donut-wrap">
                    <svg width="172" height="172" viewBox="0 0 42 42">
                      <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="var(--db-track)" stroke-width="6" />
                      <circle v-for="(c,i) in donut" :key="i" cx="21" cy="21" r="15.9" fill="transparent"
                        :stroke="greys[i]" stroke-width="6" :stroke-dasharray="c.dash" :stroke-dashoffset="c.off" />
                    </svg>
                    <div class="donut-center"><div class="n">142</div><div class="muted xs">events</div></div>
                  </div>
                  <div class="cat-grid">
                    <div class="cat" v-for="(c,i) in cats" :key="c.name">
                      <span class="d" :style="{ background: greys[i] }"></span> {{ c.name }} <b>{{ c.pct }}%</b>
                    </div>
                  </div>
                </div>
              </div>

              <!-- BOTTOM ROW -->
              <div class="grid g-bottom">
                <div class="card">
                  <div class="card-head"><h3>Aktivitas Terbaru</h3><button class="pill" @click="go('/merit')">Lihat Semua</button></div>
                  <table>
                    <thead><tr><th>Operator</th><th>Tanggal</th><th>Tipe</th><th class="amt">Poin</th></tr></thead>
                    <tbody>
                      <tr v-for="e in activity" :key="e.id">
                        <td><div class="who"><div class="t-ava">{{ e.initial }}</div> {{ e.name }}</div></td>
                        <td class="muted">{{ e.date }}</td>
                        <td><span class="tag" :class="e.type">{{ e.type === 'merit' ? 'Merit' : 'Misconduct' }}</span></td>
                        <td class="amt" :class="e.points > 0 ? 'pos' : 'neg'">{{ e.points > 0 ? '+' : '−' }}{{ Math.abs(e.points) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="stack">
                  <div class="card">
                    <div class="card-head"><h3>Target KPI Bulanan</h3><button class="pill" @click="go('/reports')">Report</button></div>
                    <div class="muted">75% tercapai</div>
                    <div class="goal-val">387 <small>dari 515 target merit</small></div>
                    <div class="progress"><span :style="{ width: '75%' }"></span></div>
                  </div>
                  <div class="card">
                    <div class="card-head"><h3>5 Operator Terbaik</h3><button class="pill" @click="go('/operators/ranking')">Lihat Semua</button></div>
                    <div class="rank-list">
                      <div class="rank-row" v-for="(r,i) in topOps" :key="r.name">
                        <span class="rank-no">{{ i + 1 }}</span>
                        <div class="r-ava">{{ r.initial }}</div>
                        <span class="r-name">{{ r.name }}</span>
                        <b class="r-pts">+{{ r.points }}</b>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { IonPage, IonContent, IonIcon, useIonRouter } from '@ionic/vue';
import {
  gridOutline, peopleOutline, shieldCheckmarkOutline, lockClosedOutline,
  cubeOutline, documentTextOutline, ribbonOutline, personOutline, logOutOutline,
  searchOutline, notificationsOutline, moonOutline, sunnyOutline, colorPaletteOutline,
  calendarOutline, downloadOutline, chevronBackOutline, chevronForwardOutline,
  chevronDownOutline, trendingUpOutline, trendingDownOutline, addOutline,
  qrCodeOutline, trophyOutline, alertCircleOutline, arrowForwardOutline,
} from 'ionicons/icons';

const router = useIonRouter();
const go = (path: string) => router.push(path); // TODO: verifikasi path dengan router-mu

// ---- UI state (semua tombol nyambung ke sini) ----
const collapsed = ref(false);
const dark = ref(false);
const active = ref('dashboard');
const query = ref('');
const searchEl = ref<HTMLInputElement | null>(null);
const trendRange = ref('Harian');
const dateRange = ref('18 Mei 2026 – 14 Jun 2026');

const focusSearch = () => searchEl.value?.focus();
const cycleRange = () => {
  const o = ['Harian', 'Mingguan', 'Bulanan'];
  trendRange.value = o[(o.indexOf(trendRange.value) + 1) % o.length];
};
const selectNav = (item: { key: string; path: string }) => { active.value = item.key; go(item.path); };
const signOut = () => go('/login');          // TODO: panggil authStore.logout() lalu redirect
const exportReport = () => go('/reports');   // TODO: sambungkan ke export laporan asli
const openNotifications = () => { /* TODO: buka panel notifikasi */ };
const openTheme = () => { dark.value = !dark.value; };
const openRange = () => { /* TODO: buka date-range picker */ };

const icons = {
  logout: logOutOutline, search: searchOutline, bell: notificationsOutline,
  moon: moonOutline, sun: sunnyOutline, palette: colorPaletteOutline,
  calendar: calendarOutline, download: downloadOutline,
  collapse: chevronBackOutline, expand: chevronForwardOutline,
  up: trendingUpOutline, down: trendingDownOutline, plus: addOutline, qr: qrCodeOutline,
  trophy: trophyOutline, alert: alertCircleOutline, cube: cubeOutline,
  arrowUR: arrowForwardOutline, chevD: chevronDownOutline, chevR: chevronForwardOutline,
  users: peopleOutline, lock: lockClosedOutline,
};

const navItems = [
  { key: 'dashboard',  label: 'Dashboard KPI',        icon: gridOutline,            path: '/dashboard' },
  { key: 'user',       label: 'Kelola User',          icon: peopleOutline,          path: '/admin/users' },
  { key: 'role',       label: 'Kelola Role',          icon: shieldCheckmarkOutline, path: '/admin/roles' },
  { key: 'permission', label: 'Kelola Permission',    icon: lockClosedOutline,      path: '/admin/permissions' },
  { key: 'blockchain', label: 'Blockchain Integrity', icon: cubeOutline,            path: '/blockchain' },
  { key: 'export',     label: 'Export Laporan',       icon: documentTextOutline,    path: '/reports' },
  { key: 'ranking',    label: 'Ranking Kinerja',      icon: ribbonOutline,          path: '/operators/ranking' },
  { key: 'profile',    label: 'My Profile',           icon: personOutline,          path: '/profile' },
];

// ---- DATA (MOCK — ganti dengan store Pinia) ----
const user = { initial: 'S', name: 'Super Administrator', email: 'admin@bridgestone.co.id', role: 'SUPER ADMIN' };
const kpi = { operators: 248, merit: 387, misconduct: 142, blocks: '1,482' };
const spark = [40, 55, 48, 70, 60, 82, 74, 90, 85, 95, 88, 100];
const greys = ['#111827', '#4b5563', '#9ca3af', '#d1d5db'];
const dept = [
  { name: 'Curing', count: 437, pct: 34 }, { name: 'Building', count: 351, pct: 27 },
  { name: 'Mixing', count: 283, pct: 22 }, { name: 'Inspection', count: 213, pct: 17 },
];
const trend = [
  { m: 'Jan', h: 55 }, { m: 'Feb', h: 88 }, { m: 'Mar', h: 48 },
  { m: 'Apr', h: 95 }, { m: 'Mei', h: 62 }, { m: 'Jun', h: 70 },
];
const donut = [
  { dash: '44 56', off: 25 }, { dash: '29 71', off: 81 },
  { dash: '15 85', off: 52 }, { dash: '12 88', off: 37 },
];
const cats = [
  { name: 'Safety', pct: 44 }, { name: 'Quality', pct: 29 },
  { name: 'Attendance', pct: 15 }, { name: 'Procedure', pct: 12 },
];
const activity = [
  { id: 1, initial: 'SW', name: 'Siti Wulandari', date: '14 Jun 2026, 10:15', type: 'merit', points: 15 },
  { id: 2, initial: 'AP', name: 'Agus Pratama',   date: '14 Jun 2026, 09:40', type: 'mis',   points: -10 },
  { id: 3, initial: 'RH', name: 'Rudi Hartono',   date: '13 Jun 2026, 16:22', type: 'merit', points: 8 },
  { id: 4, initial: 'KS', name: 'Karina Sari',    date: '13 Jun 2026, 14:05', type: 'merit', points: 20 },
  { id: 5, initial: 'BT', name: 'Bambang Teguh',  date: '12 Jun 2026, 11:30', type: 'mis',   points: -5 },
  { id: 6, initial: 'DN', name: 'Dewi Novita',    date: '12 Jun 2026, 08:50', type: 'merit', points: 12 },
  { id: 7, initial: 'FH', name: 'Fajar Hidayat',  date: '11 Jun 2026, 15:10', type: 'mis',   points: -8 },
];
const topOps = [
  { initial: 'KS', name: 'Karina Sari', points: 312 }, { initial: 'DN', name: 'Dewi Novita', points: 287 },
  { initial: 'RH', name: 'Rudi Hartono', points: 261 }, { initial: 'SW', name: 'Siti Wulandari', points: 240 },
  { initial: 'AP', name: 'Agus Pratama', points: 218 },
];
</script>

<style scoped>
/* ===== TOKEN DESAIN (scoped) ===== */
.db-shell{
  --db-canvas:#ffffff;          /* PUTIH sesuai permintaan. Geser ke #f5f5f7 kalau mau float lebih kuat di light mode */
  --db-card:#ffffff; --db-ink:#111827; --db-ink-2:#6b7280; --db-ink-3:#9ca3af;
  --db-line:#ececee; --db-line-2:#e5e7eb; --db-track:#eceef1;
  --db-icon-bg:#f4f5f7; --db-green:#10b981; --db-green-bg:#ecfdf5;
  --db-red:#ef4444; --db-red-bg:#fef2f2; --db-brand:#ef4444;
  --db-shadow:0 1px 2px rgba(16,24,40,.04), 0 4px 16px rgba(16,24,40,.04);
  --radius:22px;
  display:flex;height:100%;background:var(--db-canvas);font-family:'Inter',system-ui,sans-serif;
  color:var(--db-ink);font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased;
}
/* ===== DARK MODE (tinggal nyala via tombol bulan) ===== */
.db-shell.dark{
  --db-canvas:#0b0f17; --db-card:#111827; --db-ink:#f9fafb; --db-ink-2:#9ca3af; --db-ink-3:#6b7280;
  --db-line:#1f2937; --db-line-2:#243041; --db-track:#1f2937; --db-icon-bg:#1f2937;
  --db-green-bg:rgba(16,185,129,.12); --db-red-bg:rgba(239,68,68,.12);
  --db-shadow:0 1px 2px rgba(0,0,0,.3), 0 8px 24px rgba(0,0,0,.35);
}

/* ===== SIDEBAR ===== */
.db-side{flex-shrink:0;width:252px;overflow-y:auto;padding:16px 14px;display:flex;flex-direction:column;gap:3px;transition:width .18s ease}
.db-side.collapsed{width:74px}
.db-side::-webkit-scrollbar{width:0}
.brand{display:flex;align-items:center;gap:11px;padding:6px 8px 12px}
.logo{width:38px;height:38px;flex-shrink:0;border-radius:10px;background:var(--db-brand);color:#fff;display:grid;place-items:center;font-weight:800;font-size:19px;box-shadow:0 6px 14px rgba(239,68,68,.32)}
.brand-txt{display:flex;flex-direction:column}
.brand-txt b{font-size:14.5px;font-weight:700;line-height:1.15}
.brand-txt small{font-size:11px;color:var(--db-ink-3)}
.me{display:flex;align-items:center;gap:11px;padding:11px 8px;border-radius:12px;background:var(--db-card);box-shadow:var(--db-shadow);margin-bottom:6px}
.me .ava{width:38px;height:38px;flex-shrink:0;border-radius:50%;background:var(--db-brand);color:#fff;display:grid;place-items:center;font-weight:700;font-size:14px;box-shadow:0 4px 10px rgba(239,68,68,.3)}
.me .nm{font-size:13px;font-weight:700;line-height:1.2}
.me .em{font-size:10.5px;color:var(--db-ink-3)}
.me .role{display:inline-block;margin-top:3px;font-size:9px;font-weight:700;letter-spacing:.05em;color:#b45309;background:#fef3c7;padding:2px 7px;border-radius:5px}
.nav-label{font-size:10px;font-weight:700;letter-spacing:.08em;color:var(--db-ink-3);text-transform:uppercase;padding:14px 10px 6px}
.nav-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:11px;color:var(--db-ink-2);font-weight:500;font-size:13.5px;cursor:pointer;transition:.15s;white-space:nowrap}
.nav-item ion-icon{font-size:20px;flex-shrink:0;opacity:.85}
.nav-item:hover{background:rgba(120,120,130,.08);color:var(--db-ink)}
.nav-item.active{background:var(--db-card);color:var(--db-ink);font-weight:600;box-shadow:var(--db-shadow)}
.nav-item.active ion-icon{color:var(--db-brand);opacity:1}
.spacer{flex:1;min-height:8px}
.chain{display:flex;align-items:center;gap:8px;padding:10px 12px;font-size:12px;color:var(--db-ink-2)}
.chain .dot{width:8px;height:8px;border-radius:50%;background:var(--db-green);box-shadow:0 0 8px var(--db-green)}
.signout{display:flex;align-items:center;gap:10px;justify-content:center;padding:11px;border-radius:11px;background:var(--db-red-bg);color:#b91c1c;font-weight:600;font-size:13px;border:1px solid rgba(239,68,68,.18);cursor:pointer}
.signout ion-icon{font-size:18px}

/* ===== MAIN (kertas yang digulir; INI yang scroll, bukan ion-content) ===== */
.db-main{flex:1;min-width:0;height:100%;overflow-y:auto;padding:12px 14px 12px 6px}
.db-panel{background:var(--db-card);border:1px solid var(--db-line);border-radius:var(--radius);box-shadow:0 1px 3px rgba(0,0,0,.05),0 14px 44px rgba(16,24,40,.08);position:relative}
.db-topbar{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:14px;padding:13px 24px;background:color-mix(in srgb, var(--db-card) 72%, transparent);backdrop-filter:blur(16px) saturate(180%);-webkit-backdrop-filter:blur(16px) saturate(180%);border-bottom:1px solid var(--db-line);border-radius:var(--radius) var(--radius) 0 0}
.toggle,.ic{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;color:var(--db-ink-2);cursor:pointer;border:none;background:transparent;font-size:20px}
.toggle:hover,.ic:hover{background:var(--db-icon-bg);color:var(--db-ink)}
.search{flex:1;max-width:440px;display:flex;align-items:center;gap:9px;background:var(--db-icon-bg);border:1px solid var(--db-line);border-radius:11px;padding:0 13px;color:var(--db-ink-3);font-size:13px;cursor:text}
.search ion-icon{font-size:17px}
.search input{flex:1;border:none;background:transparent;outline:none;font:inherit;color:var(--db-ink);padding:9px 0}
.search .kbd{font-size:11px;background:var(--db-card);border:1px solid var(--db-line-2);border-radius:6px;padding:1px 6px}
.top-actions{margin-left:auto;display:flex;align-items:center;gap:8px}
.bell{position:relative}
.bell::after{content:"";position:absolute;top:6px;right:6px;width:7px;height:7px;border-radius:50%;background:var(--db-red);border:1.5px solid var(--db-card)}
.ava-sm{width:32px;height:32px;border-radius:50%;background:var(--db-brand);color:#fff;display:grid;place-items:center;font-size:12px;font-weight:700;margin-left:6px}

.db-content{padding:22px 24px 36px;display:flex;flex-direction:column;gap:18px}
.page-head{display:flex;align-items:flex-start;justify-content:space-between}
.page-head h1{font-size:25px;font-weight:700;letter-spacing:-.01em}
.page-head p{font-size:13.5px;color:var(--db-ink-2);margin-top:3px}
.head-right{display:flex;align-items:center;gap:10px}
.daterange{display:flex;align-items:center;gap:8px;background:var(--db-card);border:1px solid var(--db-line-2);border-radius:11px;padding:9px 14px;font-size:13px;font-weight:500;color:var(--db-ink);cursor:pointer}
.icon-btn{width:40px;height:40px;border-radius:11px;background:var(--db-ink);color:var(--db-card);display:grid;place-items:center;border:none;cursor:pointer;font-size:18px}

.grid{display:grid;gap:16px}
.g4{grid-template-columns:repeat(4,1fr)}
.g3{grid-template-columns:1.05fr 1.2fr 1.1fr}
.g-bottom{grid-template-columns:1.55fr 1fr}
.card{background:var(--db-card);border:1px solid var(--db-line);border-radius:16px;padding:20px;box-shadow:var(--db-shadow)}
.kpi-top{display:flex;align-items:center;gap:10px;color:var(--db-ink-2);font-size:13px;font-weight:500;margin-bottom:14px}
.kpi-top.spread{justify-content:space-between}
.kpi-top .lbl{display:flex;align-items:center;gap:10px}
.kpi-ico{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;font-size:18px;background:var(--db-icon-bg);color:var(--db-ink-2)}
.val{font-size:30px;font-weight:700;letter-spacing:-.02em}
.val.sm{font-size:29px;margin-top:4px}
.delta{font-size:12.5px;font-weight:600;display:inline-flex;align-items:center;gap:3px;margin-left:4px}
.delta.s{font-size:13px}
.delta ion-icon{font-size:15px}
.up{color:var(--db-green)} .down{color:var(--db-red)}
.sub-note{font-size:12px;color:var(--db-ink-2);margin-top:6px}
.btn-row{display:flex;gap:9px;margin-top:15px}
.btn{border-radius:10px;padding:9px 15px;font-size:12.5px;font-weight:600;cursor:pointer;border:1px solid var(--db-line-2);display:inline-flex;align-items:center;gap:7px;background:var(--db-card);color:var(--db-ink)}
.btn.dark-btn{background:var(--db-ink);color:var(--db-card);border-color:var(--db-ink)}
.badge{background:var(--db-red);color:#fff;font-size:10.5px;font-weight:600;padding:3px 8px;border-radius:7px}
.spark{display:flex;align-items:flex-end;gap:2px;height:48px;margin-top:10px}
.spark span{flex:1;background:var(--db-ink);border-radius:2px;opacity:.85}
.card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
.card-head h3{font-size:16.5px;font-weight:600}
.muted{color:var(--db-ink-2);font-size:12.5px}
.muted.xs{font-size:11px}
.pill{display:flex;align-items:center;gap:6px;border:1px solid var(--db-line-2);border-radius:9px;padding:6px 12px;font-size:12.5px;font-weight:600;cursor:pointer;background:var(--db-card);color:var(--db-ink)}
.seg{display:flex;height:9px;border-radius:6px;overflow:hidden;margin:14px 0 16px;gap:2px}
.src-list{display:flex;flex-direction:column;gap:13px}
.src-row{display:flex;align-items:center;gap:10px;font-size:13.5px}
.src-row .d{width:9px;height:9px;border-radius:50%}
.src-row b{margin-left:auto;font-weight:600}
.footnote{display:flex;gap:9px;align-items:center;background:var(--db-icon-bg);border-radius:12px;padding:11px 13px;margin-top:16px;font-size:12px;color:var(--db-ink-2)}
.footnote ion-icon{font-size:16px;color:var(--db-ink-3)}
.bars{display:flex;align-items:flex-end;justify-content:space-between;gap:13px;height:190px;margin:18px 4px 8px}
.bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;height:100%;justify-content:flex-end}
.bar{width:100%;max-width:34px;background:var(--db-ink);border-radius:7px}
.b-lbl{font-size:11.5px;color:var(--db-ink-2)}
.trend{font-size:13px;font-weight:600;margin-top:4px;display:flex;align-items:center;gap:6px}
.donut-wrap{display:flex;justify-content:center;margin:6px 0 18px;position:relative}
.donut-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center}
.donut-center .n{font-size:23px;font-weight:700}
.cat-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.cat{display:flex;align-items:center;gap:8px;background:var(--db-icon-bg);border-radius:10px;padding:10px 12px;font-size:12.5px}
.cat .d{width:9px;height:9px;border-radius:50%}
.cat b{margin-left:auto;font-weight:600}
table{width:100%;border-collapse:collapse}
th{text-align:left;font-size:11.5px;color:var(--db-ink-3);font-weight:600;padding:14px 8px 12px}
td{padding:10px 8px;border-top:1px solid var(--db-line);font-size:13.5px;vertical-align:middle}
.who{display:flex;align-items:center;gap:11px}
.t-ava{width:32px;height:32px;border-radius:50%;background:var(--db-icon-bg);color:var(--db-ink);display:grid;place-items:center;font-weight:600;font-size:11px}
.tag{font-size:11.5px;font-weight:600;padding:3px 11px;border-radius:20px}
.tag.merit{background:var(--db-green-bg);color:#047857} .tag.mis{background:var(--db-red-bg);color:#b91c1c}
.amt{text-align:right;font-weight:600}
.amt.pos{color:var(--db-green)} .amt.neg{color:var(--db-red)}
.progress{height:12px;background:var(--db-track);border-radius:20px;overflow:hidden;margin-top:14px}
.progress span{display:block;height:100%;background:var(--db-ink);border-radius:20px}
.goal-val{font-size:29px;font-weight:700;letter-spacing:-.02em;margin-top:10px}
.goal-val small{font-size:13.5px;color:var(--db-ink-3);font-weight:500}
.rank-list{display:flex;flex-direction:column;gap:4px;margin-top:6px}
.rank-row{display:flex;align-items:center;gap:11px;padding:8px 4px;border-top:1px solid var(--db-line)}
.rank-row:first-child{border-top:none}
.rank-no{width:20px;font-weight:700;color:var(--db-ink-3);font-size:13px;text-align:center}
.r-ava{width:30px;height:30px;border-radius:50%;background:var(--db-icon-bg);color:var(--db-ink);display:grid;place-items:center;font-weight:600;font-size:11px}
.r-name{font-size:13.5px;font-weight:500}
.r-pts{margin-left:auto;font-weight:600;color:var(--db-green)}
.stack{display:flex;flex-direction:column;gap:16px}
@media(max-width:1180px){.g4{grid-template-columns:repeat(2,1fr)}.g3,.g-bottom{grid-template-columns:1fr}}
</style>