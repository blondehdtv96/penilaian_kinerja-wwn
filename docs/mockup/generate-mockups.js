/**
 * Generator mockup antarmuka (wireframe) untuk penulisan skripsi.
 *
 * Menghasilkan satu berkas SVG per halaman ke docs/mockup/svg/. Gaya gambar
 * mengikuti konvensi rancangan antarmuka skripsi: hitam-putih, garis tipis,
 * tanpa warna — supaya tetap terbaca saat dicetak grayscale.
 *
 * Isi tiap halaman disalin dari tangkapan layar aplikasi yang berjalan
 * (docs/mockup/screenshots/), sehingga mockup selaras dengan implementasi.
 *
 * Jalankan: node docs/mockup/generate-mockups.js
 */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'svg');
const W = 1060;

const SANS = 'Arial, Helvetica, sans-serif';
const SERIF = "'Times New Roman', Times, serif";

const INK = '#000';
const MUTED = '#555';
const FAINT = '#8a8a8a';
const HAIR = '#bbb';
const WASH = '#f2f2f2';

// ---------------------------------------------------------------- primitives

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const rect = (x, y, w, h, o = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r ?? 0}"` +
  ` fill="${o.fill ?? 'none'}" stroke="${o.stroke ?? INK}" stroke-width="${o.sw ?? 1}"` +
  `${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;

const line = (x1, y1, x2, y2, o = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"` +
  ` stroke="${o.stroke ?? INK}" stroke-width="${o.sw ?? 1}"` +
  `${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;

const circle = (cx, cy, r, o = {}) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${o.fill ?? 'none'}"` +
  ` stroke="${o.stroke ?? INK}" stroke-width="${o.sw ?? 1}"/>`;

const txt = (x, y, s, o = {}) =>
  `<text x="${x}" y="${y}" font-family="${o.ff ?? SANS}" font-size="${o.fs ?? 11}"` +
  ` fill="${o.fill ?? INK}" text-anchor="${o.anchor ?? 'start'}"` +
  `${o.weight ? ` font-weight="${o.weight}"` : ''}` +
  `${o.ls ? ` letter-spacing="${o.ls}"` : ''}>${esc(s)}</text>`;

/** Kotak isian (input) dengan label di atasnya. */
const field = (x, y, w, label, placeholder, o = {}) => {
  const h = o.h ?? 26;
  const parts = [];
  if (label) parts.push(txt(x, y - 6, label, { fs: 10 }));
  parts.push(rect(x, y, w, h, { fill: '#fff' }));
  if (placeholder) parts.push(txt(x + 8, y + h / 2 + 4, placeholder, { fs: 10, fill: FAINT }));
  if (o.caret) parts.push(txt(x + w - 12, y + h / 2 + 4, '▾', { fs: 9, fill: MUTED }));
  return parts.join('\n');
};

/** Tombol. `solid` menandai aksi utama (diarsir abu-abu). */
const btn = (x, y, w, label, o = {}) => {
  const h = o.h ?? 24;
  return [
    rect(x, y, w, h, { fill: o.solid ? '#d9d9d9' : '#fff' }),
    txt(x + w / 2, y + h / 2 + 4, label, {
      fs: 10,
      anchor: 'middle',
      weight: o.solid ? 'bold' : 'normal',
    }),
  ].join('\n');
};

/** Label status / pill kecil. */
const pill = (x, y, label, o = {}) => {
  const w = o.w ?? label.length * 5.6 + 14;
  const h = 15;
  return [
    rect(x, y, w, h, { fill: WASH, stroke: HAIR, r: 7 }),
    txt(x + w / 2, y + 11, label, { fs: 8, anchor: 'middle', fill: MUTED }),
  ].join('\n');
};

/** Kartu berjudul. */
const card = (x, y, w, h, title, o = {}) => {
  const parts = [rect(x, y, w, h, { fill: '#fff' })];
  if (title) {
    parts.push(txt(x + 14, y + 24, title, { fs: 12, weight: 'bold' }));
    if (o.right) parts.push(txt(x + w - 14, y + 24, o.right, { fs: 9, fill: MUTED, anchor: 'end' }));
    parts.push(line(x, y + 36, x + w, y + 36, { stroke: HAIR }));
  }
  return parts.join('\n');
};

/** Kartu angka ringkas (KPI tile). */
const stat = (x, y, w, h, label, value, sub) =>
  [
    rect(x, y, w, h, { fill: '#fff' }),
    txt(x + 12, y + 20, label, { fs: 9, fill: MUTED }),
    txt(x + 12, y + 48, value, { fs: 22, weight: 'bold' }),
    sub ? txt(x + 12, y + h - 12, sub, { fs: 8, fill: FAINT }) : '',
  ].join('\n');

/**
 * Tabel. `cols` = [{ label, w, align }]; `rows` = array of array of string.
 * Sel bernilai `null` digambar sebagai pill agar status terlihat berbeda.
 */
const table = (x, y, w, cols, rows, o = {}) => {
  const rh = o.rh ?? 26;
  const parts = [];
  let cx = x;
  for (const c of cols) {
    const end = c.align === 'end';
    parts.push(
      txt(end ? cx + c.w - 6 : cx, y, c.label, {
        fs: 9,
        fill: MUTED,
        anchor: end ? 'end' : 'start',
      })
    );
    cx += c.w;
  }
  parts.push(line(x, y + 8, x + w, y + 8, { stroke: '#999' }));
  rows.forEach((row, i) => {
    const baseY = y + 8 + rh * i;
    let rx = x;
    row.forEach((cell, ci) => {
      const c = cols[ci];
      if (cell === null || cell === undefined || cell === '') {
        rx += c.w;
        return;
      }
      if (typeof cell === 'object' && cell.pill) {
        parts.push(pill(rx + 6, baseY + rh / 2 - 8, cell.pill));
      } else {
        const end = c.align === 'end';
        parts.push(
          txt(end ? rx + c.w - 6 : rx, baseY + rh / 2 + 4, cell, {
            fs: 10,
            anchor: end ? 'end' : 'start',
          })
        );
      }
      rx += c.w;
    });
    parts.push(line(x, baseY + rh, x + w, baseY + rh, { stroke: '#d5d5d5' }));
  });
  return parts.join('\n');
};

// ------------------------------------------------------------------- kerangka

/** Bingkai luar + judul sistem + nama halaman (meniru gaya mockup skripsi). */
const frameHead = (pageName, H) =>
  [
    rect(0, 0, W, H, { fill: '#fff', stroke: 'none' }),
    rect(10, 10, W - 20, H - 20, { sw: 1 }),
    txt(W / 2, 36, 'Sistem Penilaian Kinerja Operator — PT Bridgestone Tire Indonesia', {
      ff: SERIF,
      fs: 15,
      anchor: 'middle',
    }),
    line(10, 50, W - 10, 50),
    rect(W / 2 - 110, 50, 220, 22, { fill: '#fff' }),
    txt(W / 2, 65, pageName, { fs: 10, anchor: 'middle' }),
  ].join('\n');

/** Sidebar navigasi kiri: identitas perusahaan, kartu pengguna, daftar menu. */
const sidebar = (x, y, w, h, user, nav, active) => {
  const parts = [rect(x, y, w, h, { fill: WASH })];

  // identitas aplikasi
  parts.push(rect(x + 12, y + 12, 26, 26, { fill: '#fff' }));
  parts.push(txt(x + 25, y + 30, 'B', { fs: 14, weight: 'bold', anchor: 'middle' }));
  parts.push(txt(x + 46, y + 24, 'PT Bridgestone', { fs: 10, weight: 'bold' }));
  parts.push(txt(x + 46, y + 36, 'Tire Curing Indonesia', { fs: 8, fill: MUTED }));

  // kartu pengguna aktif
  parts.push(rect(x + 12, y + 48, w - 24, 46, { fill: '#fff' }));
  parts.push(circle(x + 32, y + 71, 12));
  parts.push(txt(x + 52, y + 64, user.name, { fs: 10, weight: 'bold' }));
  parts.push(txt(x + 52, y + 76, user.email, { fs: 7, fill: MUTED }));
  parts.push(txt(x + 52, y + 88, user.role.toUpperCase(), { fs: 7, fill: MUTED, ls: 0.5 }));

  // daftar menu
  parts.push(txt(x + 14, y + 116, 'NAVIGASI UTAMA', { fs: 7, fill: FAINT, ls: 1 }));
  let iy = y + 126;
  nav.forEach((item) => {
    const isActive = item === active;
    if (isActive) parts.push(rect(x + 8, iy, w - 16, 22, { fill: '#fff' }));
    parts.push(rect(x + 16, iy + 7, 8, 8, { stroke: isActive ? INK : '#999' }));
    parts.push(
      txt(x + 32, iy + 15, item, {
        fs: 9.5,
        weight: isActive ? 'bold' : 'normal',
        fill: isActive ? INK : MUTED,
      })
    );
    iy += 24;
  });

  // status & keluar
  parts.push(circle(x + 20, y + h - 46, 3, { fill: INK }));
  parts.push(txt(x + 30, y + h - 43, 'Blockchain Aktif', { fs: 8, fill: MUTED }));
  parts.push(btn(x + 12, y + h - 34, w - 24, 'Keluar'));
  return parts.join('\n');
};

/** Bar atas area konten: pencarian, notifikasi, mode gelap, avatar. */
const topbar = (x, y, w) =>
  [
    rect(x + 14, y + 12, 400, 26, { fill: WASH }),
    circle(x + 30, y + 25, 5, { stroke: MUTED }),
    txt(x + 44, y + 29, 'Cari operator, event, area…', { fs: 10, fill: FAINT }),
    circle(x + w - 84, y + 25, 9, { stroke: MUTED }),
    txt(x + w - 84, y + 28, '⚑', { fs: 9, anchor: 'middle', fill: MUTED }),
    circle(x + w - 54, y + 25, 9, { stroke: MUTED }),
    txt(x + w - 54, y + 28, '☾', { fs: 9, anchor: 'middle', fill: MUTED }),
    circle(x + w - 24, y + 25, 11, { fill: WASH }),
    line(x, y + 50, x + w, y + 50, { stroke: HAIR }),
  ].join('\n');

/** Judul halaman + keterangan + tombol aksi di kanan atas. */
const pageHead = (x, y, w, title, subtitle, actions = []) => {
  const parts = [
    txt(x + 14, y, title, { fs: 19, weight: 'bold' }),
    txt(x + 14, y + 20, subtitle, { fs: 10, fill: MUTED }),
  ];
  let ax = x + w - 14;
  [...actions].reverse().forEach((a, i) => {
    const aw = a.label.length * 6.2 + 26;
    ax -= aw;
    parts.push(btn(ax, y - 17, aw, a.label, { solid: i === actions.length - 1 || a.solid }));
    ax -= 10;
  });
  return parts.join('\n');
};

const svg = (H, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">\n` +
  body +
  `\n</svg>\n`;

// ------------------------------------------------------------------ peran/nav

const NAV = {
  operator: [
    'Dashboard',
    'Scan Area QR',
    'Ajukan VoO / Ide Kaizen',
    'Pengajuan Saya',
    'Pelanggaran Saya',
    'Profil Saya',
  ],
  foreman: ['Persetujuan VoO', 'Pembinaan & Pelanggaran', 'Monitor Operator', 'Profil Saya'],
  manager: [
    'Dashboard KPI',
    'Pembinaan & Pelanggaran',
    'Monitor Operator',
    'Persetujuan Final',
    'Ranking Operator',
    'Analisis Tren',
    'Export Laporan',
    'Blockchain',
    'Log Audit',
    'Katalog Pelanggaran',
    'Profil Saya',
  ],
  admin: [
    'Dashboard KPI',
    'Monitor Operator',
    'Persetujuan Final',
    'Ranking Operator',
    'Export Laporan',
    'Blockchain',
    'Log Audit',
    'Katalog Pelanggaran',
    'Kelola User',
    'Kelola Role',
    'Lokasi QR',
    'Profil Saya',
  ],
  staff: ['Monitor VoO / Kaizen', 'Monitor Pelanggaran', 'Profil Saya'],
};

const USER = {
  operator: { name: 'Operator 1', email: 'operator1@bridgestone.com', role: 'Operator' },
  foreman: { name: 'Foreman Line 1', email: 'foreman01@bridgestone.com', role: 'Foreman' },
  manager: {
    name: 'Section Manager',
    email: 'sectionmanager@bridgestone.com',
    role: 'Section Manager',
  },
  admin: {
    name: 'Super Administrator',
    email: 'superadmin@bridgestone.com',
    role: 'Super Admin',
  },
  staff: { name: 'Staff Produksi', email: 'staffproduksi@bridgestone.com', role: 'Staff Produksi' },
};

/**
 * Membangun halaman ber-shell (sidebar + topbar). `draw(cx, cy, cw)` menerima
 * origin area konten dan mengembalikan potongan SVG isi halaman.
 */
const shellPage = ({ pageName, who, active, height, draw }) => {
  const H = height;
  const bodyY = 84;
  const sideX = 26;
  const sideW = 208;
  const sideH = H - bodyY - 26;
  const cx = 250;
  const cw = W - cx - 26;

  return svg(
    H,
    [
      frameHead(pageName, H),
      sidebar(sideX, bodyY, sideW, sideH, USER[who], NAV[who], active),
      rect(cx, bodyY, cw, sideH, { fill: '#fff' }),
      topbar(cx, bodyY, cw),
      draw(cx, bodyY + 50, cw),
    ].join('\n')
  );
};

// --------------------------------------------------------------------- halaman

const pages = {};

// 01 — Login
pages['01-login'] = () => {
  const H = 600;
  const cw = 360;
  const cx = (W - cw) / 2;
  const cy = 130;
  const ch = 340;
  const ix = cx + 30;
  const iw = cw - 60;

  return svg(
    H,
    [
      frameHead('Halaman Login', H),
      rect(cx, cy, cw, ch, { fill: '#fff' }),
      // kepala kartu
      circle(cx + 30, cy + 26, 11),
      txt(cx + 30, cy + 30, 'B', { fs: 11, weight: 'bold', anchor: 'middle' }),
      txt(cx + 50, cy + 24, 'PT Bridgestone', { fs: 11, weight: 'bold' }),
      txt(cx + 50, cy + 36, 'Tire Curing Indonesia — Bekasi Plant', { fs: 8, fill: MUTED }),
      line(cx, cy + 50, cx + cw, cy + 50, { sw: 2 }),

      txt(ix, cy + 82, 'Masuk', { fs: 20, weight: 'bold' }),
      txt(ix, cy + 100, 'Sistem Penilaian Kinerja — VoO / Ide Kaizen', { fs: 9, fill: MUTED }),

      field(ix, cy + 128, iw, 'Nama Pengguna', 'mis. section_manager'),
      field(ix, cy + 186, iw, 'Kata Sandi', 'Masukkan kata sandi'),
      circle(ix + iw - 16, cy + 199, 5, { stroke: MUTED }),

      btn(ix, cy + 232, iw, 'Masuk', { solid: true, h: 28 }),
      line(ix, cy + 276, ix + iw, cy + 276, { stroke: HAIR }),
      txt(ix, cy + 292, 'AKUN DEMO — KLIK UNTUK MENGISI', { fs: 7, fill: FAINT, ls: 1 }),

      rect(ix, cy + 300, iw / 2 - 5, 26, { fill: WASH }),
      txt(ix + 8, cy + 316, 'Super Admin', { fs: 9 }),
      rect(ix + iw / 2 + 5, cy + 300, iw / 2 - 5, 26, { fill: WASH }),
      txt(ix + iw / 2 + 13, cy + 316, 'Section Manager', { fs: 9 }),

      txt(W / 2, cy + ch + 30, 'Audit trail terjamin blockchain · v2.0', {
        fs: 8,
        fill: FAINT,
        anchor: 'middle',
      }),
    ].join('\n')
  );
};

// 02 — Dashboard Operator
pages['02-operator-dashboard'] = () =>
  shellPage({
    pageName: 'Dashboard Operator',
    who: 'operator',
    active: 'Dashboard',
    height: 700,
    draw: (x, y, w) =>
      [
        pageHead(x, y + 30, w, 'Dashboard', 'EMP1001 · Curing', [{ label: 'Scan QR' }]),
        // skor kinerja
        card(x + 14, y + 60, 420, 150, null),
        txt(x + 30, y + 84, 'Skor Kinerja', { fs: 9, fill: MUTED }),
        txt(x + 30, y + 122, '84.4', { fs: 34, weight: 'bold' }),
        txt(x + 30, y + 138, 'indeks akumulatif', { fs: 8, fill: FAINT }),
        rect(x + 30, y + 152, 190, 44, { fill: WASH }),
        txt(x + 42, y + 174, '16', { fs: 15, weight: 'bold' }),
        txt(x + 42, y + 188, 'VoO disetujui', { fs: 8, fill: MUTED }),
        rect(x + 234, y + 152, 190, 44, { fill: WASH }),
        txt(x + 246, y + 174, '1', { fs: 15, weight: 'bold' }),
        txt(x + 246, y + 188, 'Pelanggaran', { fs: 8, fill: MUTED }),
        // identitas
        card(x + 452, y + 60, w - 466, 150, 'Identitas'),
        table(
          x + 468,
          y + 112,
          w - 498,
          [
            { label: '', w: 190 },
            { label: '', w: 96, align: 'end' },
          ],
          [
            ['ID Karyawan', 'EMP1001'],
            ['Section', 'Curing'],
            ['Group', 'A'],
            ['Posisi', 'Curing Operator'],
          ],
          { rh: 22 }
        ),
        // pelanggaran saya
        card(x + 14, y + 226, w - 28, 130, 'Pelanggaran Saya', { right: '1 catatan' }),
        table(
          x + 30,
          y + 282,
          w - 60,
          [
            { label: 'Jenis', w: 230 },
            { label: 'Tingkat', w: 130 },
            { label: 'Status Konseling', w: 220 },
            { label: 'Tanggal', w: 130, align: 'end' },
          ],
          [['Late Arrival', { pill: 'Rendah' }, { pill: 'Menunggu konseling' }, '12 Jul 2026']]
        ),
        // pengajuan terbaru
        card(x + 14, y + 372, w - 28, 130, 'Pengajuan VoO Terbaru', { right: 'Lihat Semua' }),
        table(
          x + 30,
          y + 428,
          w - 60,
          [
            { label: 'Judul', w: 280 },
            { label: 'Tipe', w: 190 },
            { label: 'Status', w: 180 },
            { label: 'Poin', w: 60, align: 'end' },
          ],
          [['Perbaikan Alur Material', 'VoO / Ide Kaizen', { pill: 'Diteruskan ke Manager' }, '—']]
        ),
      ].join('\n'),
  });

// 03 — Scan Area QR
pages['03-operator-scan-qr'] = () =>
  shellPage({
    pageName: 'Scan Area QR',
    who: 'operator',
    active: 'Scan Area QR',
    height: 620,
    draw: (x, y, w) => {
      const lw = 470;
      return [
        pageHead(x, y + 30, w, 'Scan Area QR', 'Pindai QR area kerja atau identitas operator'),
        card(x + 14, y + 60, lw, 380, null),
        rect(x + 34, y + 80, lw - 40, 260, { fill: WASH, dash: '4 3' }),
        rect(x + 34 + (lw - 40) / 2 - 34, y + 130, 68, 68, { fill: '#fff' }),
        txt(x + 34 + (lw - 40) / 2, y + 172, 'QR', { fs: 16, weight: 'bold', anchor: 'middle' }),
        txt(x + 34 + (lw - 40) / 2, y + 226, 'Arahkan kamera ke kode QR', {
          fs: 12,
          weight: 'bold',
          anchor: 'middle',
        }),
        txt(x + 34 + (lw - 40) / 2, y + 246, 'Pindai QR area kerja untuk langsung mengajukan', {
          fs: 9,
          fill: MUTED,
          anchor: 'middle',
        }),
        txt(x + 34 + (lw - 40) / 2, y + 260, 'VoO / Ide Kaizen, atau QR identitas operator.', {
          fs: 9,
          fill: MUTED,
          anchor: 'middle',
        }),
        txt(x + 70, y + 288, '✓  Pastikan QR berada di dalam bingkai', { fs: 9, fill: MUTED }),
        txt(x + 70, y + 306, '✓  Jaga pencahayaan tetap cukup', { fs: 9, fill: MUTED }),
        txt(x + 70, y + 324, '✓  Izinkan akses kamera saat diminta', { fs: 9, fill: MUTED }),
        btn(x + 34, y + 360, 130, 'Mulai Scan', { solid: true, h: 28 }),

        card(x + lw + 28, y + 60, w - lw - 42, 380, 'Hasil Scan'),
        txt(x + lw + 28 + (w - lw - 42) / 2, y + 140, 'Belum ada hasil. Mulai scan, atau', {
          fs: 9,
          fill: FAINT,
          anchor: 'middle',
        }),
        txt(x + lw + 28 + (w - lw - 42) / 2, y + 156, 'tempel data QR secara manual.', {
          fs: 9,
          fill: FAINT,
          anchor: 'middle',
        }),
        line(x + lw + 48, y + 210, x + w - 34, y + 210, { stroke: HAIR }),
        txt(x + lw + 48, y + 236, 'Input manual — tempel isi QR (JSON)', { fs: 9 }),
        rect(x + lw + 48, y + 246, w - lw - 82, 54, { fill: '#fff' }),
        txt(x + lw + 56, y + 266, '{"locationCode":"QR-CUR", …}', { fs: 9, fill: FAINT }),
        btn(x + lw + 48, y + 314, 130, 'Proses Manual'),
      ].join('\n');
    },
  });

// 04 — Ajukan VoO / Ide Kaizen
pages['04-operator-ajukan-voo'] = () =>
  shellPage({
    pageName: 'Form Ajukan VoO / Ide Kaizen',
    who: 'operator',
    active: 'Ajukan VoO / Ide Kaizen',
    height: 800,
    draw: (x, y, w) => {
      const fw = 640;
      const fx = x + 34;
      const half = (fw - 20) / 2;
      return [
        pageHead(x, y + 30, w, 'Ajukan VoO / Ide Kaizen', 'Kirim usulan perbaikan atau ide kaizen Anda'),
        card(x + 14, y + 60, fw + 40, 560, null),

        field(fx, y + 96, fw, 'Judul', 'mis. Perbaikan alur material di Line A'),

        txt(fx, y + 152, 'Group / Shift', { fs: 10 }),
        field(fx, y + 158, half - 12, '', 'A', { caret: true }),
        txt(fx + half - 6, y + 175, '-', { fs: 10 }),
        field(fx + half + 10, y + 158, half - 10, '', 'NS', { caret: true }),

        field(fx, y + 220, half - 12, 'Sumber VoO', 'Laporan Operator', { caret: true }),
        field(fx + half + 10, y + 220, half - 10, 'Kategori 4M', 'Standard/Process', { caret: true }),

        txt(fx, y + 276, 'Klasifikasi', { fs: 10 }),
        txt(fx + 58, y + 276, '(pilih salah satu)', { fs: 8, fill: FAINT }),
        ...['Safety', 'Environment', 'Quality', 'Cost', 'Delivery'].map((label, i) => {
          const bw = 118;
          const bx = fx + i * (bw + 10);
          return [
            rect(bx, y + 284, bw, 26, { fill: '#fff' }),
            rect(bx + 10, y + 293, 9, 9, { stroke: MUTED }),
            txt(bx + 26, y + 301, label, { fs: 9 }),
          ].join('\n');
        }),

        txt(fx, y + 336, 'Deskripsi', { fs: 10 }),
        rect(fx, y + 344, fw, 118, { fill: '#fff' }),
        txt(fx + 8, y + 364, 'Jelaskan usulan atau ide Anda secara ringkas…', { fs: 10, fill: FAINT }),

        txt(fx, y + 488, 'Foto Pendukung', { fs: 10 }),
        txt(fx + 88, y + 488, '(opsional, maks 5)', { fs: 8, fill: FAINT }),
        rect(fx, y + 496, fw, 30, { fill: '#fff' }),
        btn(fx + 8, y + 500, 96, 'Pilih Berkas', { h: 22 }),
        txt(fx + 116, y + 515, 'Belum ada berkas dipilih', { fs: 9, fill: FAINT }),

        btn(fx, y + 548, 160, 'Kirim Pengajuan', { solid: true, h: 30 }),
        btn(fx + 172, y + 548, 90, 'Batal', { h: 30 }),
      ].join('\n');
    },
  });

// 05 — Pengajuan Saya
pages['05-operator-pengajuan-saya'] = () =>
  shellPage({
    pageName: 'Riwayat Pengajuan Operator',
    who: 'operator',
    active: 'Pengajuan Saya',
    height: 560,
    draw: (x, y, w) =>
      [
        pageHead(x, y + 30, w, 'Pengajuan Saya', 'Riwayat VoO / Ide Kaizen Anda', [
          { label: '+ Ajukan Baru' },
        ]),
        card(x + 14, y + 60, w - 28, 200, null),
        table(
          x + 30,
          y + 96,
          w - 60,
          [
            { label: 'Pengajuan', w: 250 },
            { label: 'Tipe', w: 130 },
            { label: 'Tanggal', w: 100 },
            { label: 'Status', w: 166 },
            { label: 'Poin', w: 70, align: 'end' },
          ],
          [
            [
              'Perbaikan Alur Material',
              'VoO / Ide Kaizen',
              '12 Jul 2026',
              { pill: 'Diteruskan ke Manager' },
              '—',
            ],
            ['Efisiensi Waktu Setup', 'VoO / Ide Kaizen', '12 Jul 2026', { pill: 'Menunggu Foreman' }, '—'],
            ['Ide Kaizen Safety Guard', 'Ide Kaizen', '12 Jul 2026', { pill: 'Disetujui Final' }, '+15'],
          ],
          { rh: 30 }
        ),
      ].join('\n'),
  });

// 06 — Pelanggaran Saya
pages['06-operator-pelanggaran-saya'] = () =>
  shellPage({
    pageName: 'Riwayat Pelanggaran Operator',
    who: 'operator',
    active: 'Pelanggaran Saya',
    height: 560,
    draw: (x, y, w) =>
      [
        pageHead(
          x,
          y + 30,
          w,
          'Pelanggaran Saya',
          'Riwayat pelanggaran yang diberikan Foreman / Section Manager'
        ),
        txt(x + 14, y + 66, 'PERIODE', { fs: 7, fill: FAINT, ls: 1 }),
        field(x + 14, y + 74, 120, '', 'Semua Bulan', { caret: true }),
        field(x + 144, y + 74, 120, '', 'Semua Tahun', { caret: true }),
        card(x + 14, y + 120, w - 28, 160, null),
        table(
          x + 30,
          y + 156,
          w - 60,
          [
            { label: 'Jenis', w: 200 },
            { label: 'Keparahan', w: 96 },
            { label: 'Poin', w: 56 },
            { label: 'Diberikan Oleh', w: 140 },
            { label: 'Status Tindak Lanjut', w: 144 },
            { label: 'Tanggal', w: 80, align: 'end' },
          ],
          [
            [
              'Late Arrival',
              { pill: 'Rendah' },
              '-5',
              'Foreman Line 1',
              { pill: 'Belum dikonseling' },
              '12 Jul 2026',
            ],
          ],
          { rh: 30 }
        ),
      ].join('\n'),
  });

// 07 — Profil Saya
pages['07-profil-saya'] = () =>
  shellPage({
    pageName: 'Profil Pengguna',
    who: 'operator',
    active: 'Profil Saya',
    height: 660,
    draw: (x, y, w) => {
      const lw = 470;
      const rx = x + lw + 28;
      const rw = w - lw - 42;
      return [
        pageHead(x, y + 30, w, 'Profil Saya', 'Informasi akun dan peran Anda'),
        card(x + 14, y + 60, lw, 420, null),
        circle(x + 60, y + 106, 24),
        txt(x + 100, y + 104, 'Operator 1', { fs: 16, weight: 'bold' }),
        pill(x + 100, y + 116, 'Operator'),
        table(
          x + 34,
          y + 158,
          lw - 40,
          [
            { label: '', w: 240 },
            { label: '', w: 190, align: 'end' },
          ],
          [
            ['Nama Pengguna', 'operator01'],
            ['Email', 'operator1@bridgestone.com'],
            ['NIK', 'NIP-OP-001'],
            ['Status Akun', 'Aktif'],
          ],
          { rh: 28 }
        ),
        btn(x + 34, y + 296, lw - 40, 'Ubah Profil', { solid: true, h: 30 }),
        btn(x + 34, y + 336, lw - 40, 'Keluar dari Akun', { h: 30 }),

        card(rx, y + 60, rw, 420, 'Data Operator'),
        table(
          rx + 20,
          y + 112,
          rw - 40,
          [
            { label: '', w: 130 },
            { label: '', w: 96, align: 'end' },
          ],
          [
            ['ID Karyawan', 'EMP1001'],
            ['Section', 'Curing'],
            ['Group', 'A'],
            ['Posisi', 'Curing Operator'],
          ],
          { rh: 26 }
        ),
        rect(rx + rw / 2 - 70, y + 250, 140, 140, { fill: '#fff' }),
        txt(rx + rw / 2, y + 326, 'QR', { fs: 22, weight: 'bold', anchor: 'middle' }),
        txt(rx + rw / 2, y + 410, 'QR Identitas — tunjukkan ke Foreman', {
          fs: 8,
          fill: MUTED,
          anchor: 'middle',
        }),
      ].join('\n');
    },
  });

// 08 — Persetujuan VoO (Foreman)
pages['08-foreman-persetujuan-voo'] = () =>
  shellPage({
    pageName: 'Persetujuan VoO — Foreman',
    who: 'foreman',
    active: 'Persetujuan VoO',
    height: 560,
    draw: (x, y, w) =>
      [
        pageHead(x, y + 30, w, 'Persetujuan VoO', 'Tinjau & setujui pengajuan VoO / Ide Kaizen (tahap Foreman)'),
        card(x + 14, y + 60, w - 28, 220, 'Menunggu Persetujuan', { right: '1 pengajuan' }),
        btn(x + w - 116, y + 68, 92, 'Muat Ulang', { h: 22 }),

        rect(x + 34, y + 112, w - 68, 130, { fill: '#fff' }),
        pill(x + 50, y + 128, 'VoO / Ide Kaizen'),
        txt(x + 152, y + 139, '12 Jul 2026, 12.10', { fs: 9, fill: MUTED }),
        txt(x + 50, y + 172, 'Efisiensi Waktu Setup', { fs: 13, weight: 'bold' }),
        txt(x + 50, y + 192, 'Mengurangi waktu setup mesin dari 30 menit ke 15 menit', {
          fs: 9,
          fill: MUTED,
        }),
        circle(x + 58, y + 216, 8, { stroke: MUTED }),
        txt(x + 74, y + 220, 'Operator 3', { fs: 9 }),
        txt(x + 136, y + 220, '· diajukan Operator 3', { fs: 9, fill: MUTED }),
        btn(x + w - 214, y + 128, 80, 'Detail'),
        btn(x + w - 124, y + 128, 90, 'Setujui', { solid: true }),
      ].join('\n'),
  });

// 09 — Pembinaan & Pelanggaran (Foreman)
pages['09-foreman-pembinaan-pelanggaran'] = () =>
  shellPage({
    pageName: 'Workspace Pembinaan & Pelanggaran',
    who: 'foreman',
    active: 'Pembinaan & Pelanggaran',
    height: 764,
    draw: (x, y, w) => {
      const lw = 340;
      const rx = x + lw + 34;
      const rw = w - lw - 48;
      return [
        pageHead(
          x,
          y + 30,
          w,
          'Pembinaan & Pelanggaran',
          'Workspace terpadu: pilih operator, telusuri riwayat disiplin, dan catat tindakan'
        ),
        // pemilih operator
        card(x + 14, y + 60, w - 28, 100, 'Pilih Operator'),
        rect(x + 34, y + 104, w - 68, 40, { fill: '#fff' }),
        circle(x + 56, y + 124, 11, { stroke: MUTED }),
        txt(x + 76, y + 120, 'Operator 1', { fs: 10, weight: 'bold' }),
        txt(x + 76, y + 134, 'EMP1001 · Curing', { fs: 8, fill: MUTED }),
        txt(x + w - 44, y + 128, '▾', { fs: 10, fill: MUTED }),

        // ringkasan
        card(x + 14, y + 176, lw, 190, 'Ringkasan'),
        circle(x + 46, y + 226, 11, { stroke: MUTED }),
        txt(x + 66, y + 222, 'Operator 1', { fs: 11, weight: 'bold' }),
        txt(x + 66, y + 236, 'EMP1001 · Curing', { fs: 8, fill: MUTED }),
        table(
          x + 34,
          y + 262,
          lw - 40,
          [
            { label: '', w: 200 },
            { label: '', w: 100, align: 'end' },
          ],
          [
            ['Poin Akumulasi', '0'],
            ['Total Pelanggaran', '1'],
            ['Skor Kinerja', '84.4'],
          ],
          { rh: 28 }
        ),

        // saran eskalasi
        card(x + 14, y + 382, lw, 200, 'Saran Eskalasi'),
        rect(x + 34, y + 430, lw - 40, 42, { fill: WASH }),
        txt(x + 46, y + 448, '⚠  Sudah layak Konseling — poin', { fs: 9 }),
        txt(x + 46, y + 462, 'akumulasi 0 (ambang 5)', { fs: 9 }),
        txt(x + 34, y + 490, 'Saran bersifat advisory — foreman/section', { fs: 8, fill: FAINT }),
        txt(x + 34, y + 502, 'manager tetap dapat menimbang tindakan lain.', { fs: 8, fill: FAINT }),
        ...[
          ['Konseling', '5 pts'],
          ['Kartu Kuning', '10 pts'],
          ['Surat Peringatan', '20 pts'],
        ].map((row, i) => {
          const ry = y + 522 + i * 20;
          return [
            circle(x + 40, ry, 5, { stroke: MUTED }),
            txt(x + 54, ry + 4, row[0], { fs: 9 }),
            txt(x + lw - 6, ry + 4, row[1], { fs: 9, fill: MUTED, anchor: 'end' }),
          ].join('\n');
        }),

        // riwayat disiplin
        card(rx, y + 176, rw, 406, 'Riwayat Disiplin', { right: '1 catatan' }),
        rect(rx + 20, y + 226, rw - 40, 56, { fill: '#fff' }),
        pill(rx + 36, y + 246, 'Rendah'),
        txt(rx + 110, y + 248, 'Late Arrival', { fs: 11, weight: 'bold' }),
        txt(rx + 110, y + 266, '12 Jul 2026 · dicatat oleh Foreman Line 1', { fs: 9, fill: MUTED }),
        rect(rx + rw - 52, y + 244, 18, 20, { stroke: MUTED }),
      ].join('\n');
    },
  });

// 10 — Monitor Operator
pages['10-monitor-operator'] = () =>
  shellPage({
    pageName: 'Monitor Operator',
    who: 'foreman',
    active: 'Monitor Operator',
    height: 620,
    draw: (x, y, w) =>
      [
        pageHead(x, y + 30, w, 'Monitor Operator', 'Daftar & kinerja seluruh operator'),
        card(x + 14, y + 60, w - 28, 340, null),
        field(x + 34, y + 82, 300, '', 'Cari nama, ID karyawan, atau section…'),
        txt(x + 348, y + 99, '5 operator', { fs: 9, fill: MUTED }),
        table(
          x + 34,
          y + 140,
          w - 68,
          [
            { label: '#', w: 26 },
            { label: 'Operator', w: 240 },
            { label: 'Section / Group', w: 200 },
            { label: 'Skor', w: 90, align: 'end' },
            { label: 'VoO', w: 70, align: 'end' },
            { label: 'Pelanggaran', w: 90, align: 'end' },
          ],
          [
            ['1', 'Operator 3 — EMP1003', 'Curing · C', '93.8', '8', '4'],
            ['2', 'Operator 1 — EMP1001', 'Curing · A', '84.4', '16', '1'],
            ['3', 'Operator 2 — EMP1002', 'Curing · B', '57.7', '9', '2'],
            ['4', 'Operator 5 — EMP1005', 'Curing · Non-Shift', '55.8', '7', '2'],
            ['5', 'Operator 4 — EMP1004', 'Curing · D', '55.2', '12', '4'],
          ],
          { rh: 32 }
        ),
      ].join('\n'),
  });

// 11 — Detail Operator
pages['11-detail-operator'] = () =>
  shellPage({
    pageName: 'Detail Operator',
    who: 'foreman',
    active: 'Monitor Operator',
    height: 520,
    draw: (x, y, w) => {
      const sw = (w - 28 - 3 * 14) / 4;
      return [
        pageHead(x, y + 30, w, 'Operator 1', 'EMP1001 · Curing · Curing Operator', [
          { label: '← Kembali' },
        ]),
        stat(x + 14, y + 60, sw, 100, 'Skor Kinerja', '84.4'),
        stat(x + 28 + sw, y + 60, sw, 100, 'VoO Disetujui', '16'),
        stat(x + 42 + sw * 2, y + 60, sw, 100, 'Pelanggaran', '1'),
        stat(x + 56 + sw * 3, y + 60, sw, 100, 'Group', 'A'),
      ].join('\n');
    },
  });

// 12 — Dashboard KPI (Section Manager)
pages['12-manager-dashboard-kpi'] = () =>
  shellPage({
    pageName: 'Dashboard KPI — Section Manager',
    who: 'manager',
    active: 'Dashboard KPI',
    height: 840,
    draw: (x, y, w) => {
      const sw = (w - 28 - 3 * 14) / 4;
      const cw3 = (w - 28 - 2 * 14) / 3;
      return [
        pageHead(x, y + 30, w, 'Dashboard KPI', 'Selamat datang, Section Manager', [
          { label: '12 bulan terakhir' },
          { label: 'Unduh' },
        ]),
        stat(x + 14, y + 60, sw, 116, 'Total Operator', '5', 'operator terdaftar'),
        stat(x + 28 + sw, y + 60, sw, 116, 'VoO / Ide Kaizen', '3', '1 disetujui · 1 menunggu'),
        stat(x + 42 + sw * 2, y + 60, sw, 116, 'Total Pelanggaran', '1', 'pelanggaran tercatat'),
        stat(x + 56 + sw * 3, y + 60, sw, 116, 'Skor Rata-rata', '69.4', 'aktivitas VoO 12 bulan'),

        // rekap catatan pembinaan
        card(x + 14, y + 192, cw3, 250, 'Rekap Catatan Pembinaan'),
        txt(x + 30, y + 254, 'Total catatan tercatat', { fs: 9, fill: MUTED }),
        txt(x + 30, y + 284, '1', { fs: 24, weight: 'bold' }),
        rect(x + 30, y + 296, cw3 - 32, 8, { fill: '#d9d9d9' }),
        table(
          x + 30,
          y + 322,
          cw3 - 32,
          [
            { label: '', w: cw3 - 82 },
            { label: '', w: 50, align: 'end' },
          ],
          [
            ['Pelanggaran', '1'],
            ['Konseling', '0'],
            ['Kartu Kuning', '0'],
            ['Surat Peringatan', '0'],
          ],
          { rh: 22 }
        ),

        // status VoO (donut)
        card(x + 28 + cw3, y + 192, cw3, 250, 'Status VoO'),
        txt(x + 44 + cw3, y + 254, 'Distribusi seluruh pengajuan', { fs: 9, fill: MUTED }),
        circle(x + 28 + cw3 + cw3 / 2, y + 322, 46, { sw: 14, stroke: '#d0d0d0' }),
        circle(x + 28 + cw3 + cw3 / 2, y + 322, 46, { sw: 14, stroke: '#7a7a7a', dash: '96 193' }),
        txt(x + 28 + cw3 + cw3 / 2, y + 322, '3', { fs: 18, weight: 'bold', anchor: 'middle' }),
        txt(x + 28 + cw3 + cw3 / 2, y + 336, 'VoO', { fs: 8, fill: MUTED, anchor: 'middle' }),
        pill(x + 44 + cw3, y + 396, 'Disetujui 33%'),
        pill(x + 44 + cw3 + 110, y + 396, 'Menunggu 33%'),
        pill(x + 44 + cw3, y + 416, 'Proses/Ditolak 33%'),

        // target persetujuan
        card(x + 42 + cw3 * 2, y + 192, cw3, 250, 'Target Persetujuan VoO'),
        txt(x + 58 + cw3 * 2, y + 254, '33% disetujui final', { fs: 9, fill: MUTED }),
        txt(x + 58 + cw3 * 2, y + 284, '1', { fs: 24, weight: 'bold' }),
        txt(x + 78 + cw3 * 2, y + 284, 'dari 3 pengajuan', { fs: 9, fill: MUTED }),
        rect(x + 58 + cw3 * 2, y + 296, cw3 - 32, 8, { fill: '#fff' }),
        rect(x + 58 + cw3 * 2, y + 296, (cw3 - 32) / 3, 8, { fill: '#7a7a7a' }),
        table(
          x + 58 + cw3 * 2,
          y + 322,
          cw3 - 32,
          [
            { label: '', w: cw3 - 82 },
            { label: '', w: 50, align: 'end' },
          ],
          [
            ['Menunggu persetujuan', '1'],
            ['Konseling', '0'],
            ['Kartu Kuning', '0'],
            ['Surat Peringatan', '0'],
          ],
          { rh: 22 }
        ),

        // grafik tren
        card(x + 14, y + 458, w - 28, 200, 'Tren VoO vs Pelanggaran — 12 Bulan', {
          right: 'VoO · Pelanggaran',
        }),
        ...Array.from({ length: 12 }, (_, i) => {
          const bx = x + 60 + i * ((w - 160) / 12);
          const h = i === 10 ? 90 : 4;
          const h2 = i === 10 ? 40 : 3;
          return [
            rect(bx, y + 610 - h, 12, h, { fill: '#8f8f8f' }),
            rect(bx + 14, y + 610 - h2, 12, h2, { fill: '#d0d0d0' }),
            txt(bx + 13, y + 628, ['Sep', 'Okt', 'Nov', 'Des', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu'][i], {
              fs: 8,
              fill: MUTED,
              anchor: 'middle',
            }),
          ].join('\n');
        }),
        line(x + 50, y + 610, x + w - 40, y + 610, { stroke: HAIR }),
      ].join('\n');
    },
  });

// 13 — Persetujuan Final (Section Manager)
pages['13-manager-persetujuan-final'] = () =>
  shellPage({
    pageName: 'Persetujuan Final VoO — Section Manager',
    who: 'manager',
    active: 'Persetujuan Final',
    height: 600,
    draw: (x, y, w) =>
      [
        pageHead(x, y + 30, w, 'Persetujuan Final', 'Persetujuan akhir & penetapan poin VoO / Ide Kaizen'),
        card(x + 14, y + 60, w - 28, 220, 'Menunggu Persetujuan Final', { right: '1 pengajuan' }),
        rect(x + 34, y + 112, w - 68, 130, { fill: '#fff' }),
        pill(x + 50, y + 128, 'VoO / Ide Kaizen'),
        txt(x + 152, y + 139, '12 Jul 2026, 12.10', { fs: 9, fill: MUTED }),
        txt(x + 50, y + 172, 'Perbaikan Alur Material', { fs: 13, weight: 'bold' }),
        txt(x + 50, y + 192, 'Mengurangi waste pada proses pemindahan material', {
          fs: 9,
          fill: MUTED,
        }),
        circle(x + 58, y + 216, 8, { stroke: MUTED }),
        txt(x + 74, y + 220, 'Operator 1', { fs: 9 }),
        txt(x + 136, y + 220, '· sudah disetujui Foreman', { fs: 9, fill: MUTED }),
        btn(x + w - 214, y + 128, 80, 'Detail'),
        btn(x + w - 124, y + 128, 90, 'Setujui', { solid: true }),
      ].join('\n'),
  });

// 14 — Ranking Operator
pages['14-manager-ranking-operator'] = () =>
  shellPage({
    pageName: 'Ranking Operator',
    who: 'manager',
    active: 'Ranking Operator',
    height: 780,
    draw: (x, y, w) => {
      const pw = (w - 28 - 2 * 14) / 3;
      const podium = [
        ['#1', 'Operator 3', '93.8', 'Curing · 8 VoO disetujui'],
        ['#2', 'Operator 1', '84.4', 'Curing · 16 VoO disetujui'],
        ['#3', 'Operator 2', '57.7', 'Curing · 9 VoO disetujui'],
      ];
      return [
        pageHead(x, y + 30, w, 'Ranking Operator', 'Peringkat kinerja berdasarkan skor akumulatif', [
          { label: 'Semua Section' },
        ]),
        ...podium.map((p, i) => {
          const px = x + 14 + i * (pw + 14);
          const cxp = px + pw / 2;
          return [
            rect(px, y + 60, pw, 200, { fill: '#fff' }),
            i === 0 ? rect(px, y + 60, pw, 4, { fill: '#4d4d4d', stroke: 'none' }) : '',
            txt(cxp, y + 88, p[0], { fs: 10, anchor: 'middle', fill: MUTED }),
            circle(cxp, y + 126, 22, { stroke: i === 0 ? INK : MUTED, sw: i === 0 ? 2 : 1 }),
            txt(cxp, y + 172, p[1], { fs: 12, weight: 'bold', anchor: 'middle' }),
            txt(cxp, y + 208, p[2], { fs: 26, weight: 'bold', anchor: 'middle' }),
            txt(cxp, y + 234, p[3], { fs: 8, fill: MUTED, anchor: 'middle' }),
          ].join('\n');
        }),
        card(x + 14, y + 278, w - 28, 320, 'Peringkat Lengkap', { right: '5 operator' }),
        table(
          x + 34,
          y + 344,
          w - 68,
          [
            { label: '#', w: 26 },
            { label: 'Operator', w: 280 },
            { label: 'Section', w: 180 },
            { label: 'Skor', w: 90, align: 'end' },
            { label: 'VoO', w: 70, align: 'end' },
            { label: 'Pelanggaran', w: 70, align: 'end' },
          ],
          [
            ['1', 'Operator 3', 'Curing', '93.8', '8', '4'],
            ['2', 'Operator 1', 'Curing', '84.4', '16', '1'],
            ['3', 'Operator 2', 'Curing', '57.7', '9', '2'],
            ['4', 'Operator 5', 'Curing', '55.8', '7', '2'],
            ['5', 'Operator 4', 'Curing', '55.2', '12', '4'],
          ],
          { rh: 32 }
        ),
      ].join('\n');
    },
  });

// 15 — Analisis Tren
pages['15-manager-analisis-tren'] = () =>
  shellPage({
    pageName: 'Analisis Tren',
    who: 'manager',
    active: 'Analisis Tren',
    height: 800,
    draw: (x, y, w) => {
      const sw = (w - 28 - 3 * 14) / 4;
      const months = ['Sep', 'Okt', 'Nov', 'Des', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu'];
      return [
        pageHead(x, y + 30, w, 'Analisis Tren', 'Tren VoO / Ide Kaizen vs Pelanggaran — 12 bulan terakhir'),
        stat(x + 14, y + 60, sw, 100, 'Total VoO (12 bln)', '3'),
        stat(x + 28 + sw, y + 60, sw, 100, 'Total Pelanggaran (12 bln)', '1'),
        stat(x + 42 + sw * 2, y + 60, sw, 100, 'VoO Bulan Ini', '0'),
        stat(x + 56 + sw * 3, y + 60, sw, 100, 'Rata-rata VoO / bln', '0.3'),

        card(x + 14, y + 176, w - 28, 250, 'Tren 12 Bulan', { right: 'VoO · Pelanggaran' }),
        ...months.map((m, i) => {
          const bx = x + 60 + i * ((w - 160) / 12);
          const h = i === 10 ? 120 : 4;
          const h2 = i === 10 ? 55 : 3;
          return [
            rect(bx, y + 386 - h, 12, h, { fill: '#8f8f8f' }),
            rect(bx + 14, y + 386 - h2, 12, h2, { fill: '#d0d0d0' }),
            txt(bx + 13, y + 404, m, { fs: 8, fill: MUTED, anchor: 'middle' }),
          ].join('\n');
        }),
        line(x + 50, y + 386, x + w - 40, y + 386, { stroke: HAIR }),

        card(x + 14, y + 442, w - 28, 180, 'Rincian Bulanan'),
        table(
          x + 34,
          y + 508,
          w - 68,
          [
            { label: 'Bulan', w: 260 },
            { label: 'VoO', w: 200, align: 'end' },
            { label: 'Pelanggaran', w: 170, align: 'end' },
            { label: 'Selisih', w: 86, align: 'end' },
          ],
          [
            ['Jun', '0', '0', '+0'],
            ['Jul', '3', '1', '+2'],
            ['Agu', '0', '0', '+0'],
          ],
          { rh: 30 }
        ),
      ].join('\n');
    },
  });

// 16 — Export Laporan
pages['16-manager-export-laporan'] = () =>
  shellPage({
    pageName: 'Export Laporan',
    who: 'manager',
    active: 'Export Laporan',
    height: 700,
    draw: (x, y, w) => {
      const sw = (w - 68 - 3 * 14) / 4;
      return [
        pageHead(x, y + 30, w, 'Export Laporan', 'Laporan kinerja & ekspor data', [
          { label: 'Cetak' },
          { label: 'Unduh Excel' },
        ]),
        card(x + 14, y + 60, w - 28, 460, null),
        txt(x + 34, y + 100, 'Laporan Kinerja Operator', { fs: 14, weight: 'bold' }),
        txt(x + 34, y + 120, 'Dibuat: 04 Agu 2026, 12.54 · PT Bridgestone Tire Indonesia', {
          fs: 9,
          fill: MUTED,
        }),
        rect(x + w - 84, y + 82, 40, 34, { fill: '#fff' }),
        txt(x + w - 64, y + 105, 'B', { fs: 15, weight: 'bold', anchor: 'middle' }),

        rect(x + 34, y + 140, sw, 70, { fill: WASH }),
        txt(x + 46, y + 174, '5', { fs: 18, weight: 'bold' }),
        txt(x + 46, y + 194, 'Operator', { fs: 8, fill: MUTED }),
        rect(x + 48 + sw, y + 140, sw, 70, { fill: WASH }),
        txt(x + 60 + sw, y + 174, '3', { fs: 18, weight: 'bold' }),
        txt(x + 60 + sw, y + 194, 'Total VoO', { fs: 8, fill: MUTED }),
        rect(x + 62 + sw * 2, y + 140, sw, 70, { fill: WASH }),
        txt(x + 74 + sw * 2, y + 174, '1', { fs: 18, weight: 'bold' }),
        txt(x + 74 + sw * 2, y + 194, 'VoO Disetujui', { fs: 8, fill: MUTED }),
        rect(x + 76 + sw * 3, y + 140, sw, 70, { fill: WASH }),
        txt(x + 88 + sw * 3, y + 174, '1', { fs: 18, weight: 'bold' }),
        txt(x + 88 + sw * 3, y + 194, 'Pelanggaran', { fs: 8, fill: MUTED }),

        txt(x + 34, y + 250, 'Rincian Operator', { fs: 12, weight: 'bold' }),
        table(
          x + 34,
          y + 290,
          w - 68,
          [
            { label: '#', w: 26 },
            { label: 'Nama', w: 170 },
            { label: 'ID', w: 150 },
            { label: 'Section', w: 150 },
            { label: 'Skor', w: 80, align: 'end' },
            { label: 'VoO', w: 60, align: 'end' },
            { label: 'Pelanggaran', w: 80, align: 'end' },
          ],
          [
            ['1', 'Operator 3', 'EMP1003', 'Curing', '93.8', '8', '4'],
            ['2', 'Operator 1', 'EMP1001', 'Curing', '84.4', '16', '1'],
            ['3', 'Operator 2', 'EMP1002', 'Curing', '57.7', '9', '2'],
            ['4', 'Operator 5', 'EMP1005', 'Curing', '55.8', '7', '2'],
            ['5', 'Operator 4', 'EMP1004', 'Curing', '55.2', '12', '4'],
          ],
          { rh: 28 }
        ),
      ].join('\n');
    },
  });

// 17 — Integritas Blockchain
pages['17-manager-blockchain'] = () =>
  shellPage({
    pageName: 'Integritas Blockchain',
    who: 'manager',
    active: 'Blockchain',
    height: 620,
    draw: (x, y, w) => {
      const sw = (w - 28 - 3 * 14) / 4;
      return [
        pageHead(x, y + 30, w, 'Integritas Blockchain', 'Audit trail anti-tamper berbasis SHA-256'),
        stat(x + 14, y + 60, sw, 116, 'Mode Penyimpanan', 'Hash Lokal', 'SHA-256'),
        stat(x + 28 + sw, y + 60, sw, 116, 'Total Hash', '0'),
        stat(x + 42 + sw * 2, y + 60, sw, 116, 'Status Rantai', 'Terverifikasi'),
        stat(x + 56 + sw * 3, y + 60, sw, 116, 'Alamat Kontrak', '—'),

        card(x + 14, y + 192, w - 28, 240, 'Catatan Hash Terbaru', { right: '0 entri' }),
        txt(x + 14 + (w - 28) / 2, y + 300, 'Belum ada hash tercatat.', {
          fs: 10,
          fill: FAINT,
          anchor: 'middle',
        }),
        rect(x + 34, y + 380, w - 68, 34, { fill: WASH }),
        txt(x + 50, y + 401, '⚿  Setiap event di-hash SHA-256 secara append-only — perubahan data akan terdeteksi.', {
          fs: 9,
          fill: MUTED,
        }),
      ].join('\n');
    },
  });

// 18 — Log Audit
pages['18-manager-log-audit'] = () =>
  shellPage({
    pageName: 'Log Audit',
    who: 'manager',
    active: 'Log Audit',
    height: 620,
    draw: (x, y, w) =>
      [
        pageHead(x, y + 30, w, 'Log Audit', 'Jejak aktivitas append-only seluruh sistem'),
        field(x + w - 374, y + 12, 116, '', 'Semua Modul', { caret: true }),
        field(x + w - 248, y + 12, 116, '', 'Semua Bulan', { caret: true }),
        field(x + w - 122, y + 12, 108, '', 'Semua Tahun', { caret: true }),
        card(x + 14, y + 60, w - 28, 300, null),
        table(
          x + 34,
          y + 96,
          w - 68,
          [
            { label: 'Waktu', w: 130 },
            { label: 'Modul', w: 120 },
            { label: 'Aksi', w: 210 },
            { label: 'Pengguna', w: 150 },
            { label: 'Hash', w: 106, align: 'end' },
          ],
          [
            ['12 Jul 2026 12.10', 'VoO', 'CREATE pengajuan', 'operator01', '9f2a…c1'],
            ['12 Jul 2026 12.22', 'VoO', 'APPROVE Foreman', 'foreman01', '4b7d…8e'],
            ['12 Jul 2026 13.05', 'Misconduct', 'CREATE pelanggaran', 'foreman01', 'a13c…70'],
          ],
          { rh: 30 }
        ),
      ].join('\n'),
  });

// 19 — Katalog Pelanggaran
pages['19-manager-katalog-pelanggaran'] = () =>
  shellPage({
    pageName: 'Katalog Jenis Pelanggaran',
    who: 'manager',
    active: 'Katalog Pelanggaran',
    height: 700,
    draw: (x, y, w) =>
      [
        pageHead(
          x,
          y + 30,
          w,
          'Katalog Pelanggaran',
          'Kelola jenis pelanggaran & poin yang dipakai Foreman saat input pelanggaran',
          [{ label: '+ Tambah Jenis' }]
        ),
        card(x + 14, y + 60, w - 28, 420, 'Daftar Jenis Pelanggaran', { right: '8 jenis' }),
        table(
          x + 34,
          y + 116,
          w - 68,
          [
            { label: 'Nama', w: 246 },
            { label: 'Kategori', w: 120 },
            { label: 'Keparahan', w: 110 },
            { label: 'Poin', w: 64, align: 'end' },
            { label: 'Status', w: 96 },
            { label: 'Aksi', w: 80, align: 'end' },
          ],
          [
            ['Kesalahan Kualitas Produk', 'Quality', { pill: 'Sedang' }, '10', { pill: 'Aktif' }, '✎  ⊘'],
            ['Meninggalkan Area Kerja Tanpa Izin', 'Kedisiplinan', { pill: 'Sedang' }, '10', { pill: 'Aktif' }, '✎  ⊘'],
            ['Merokok di Area Terlarang', 'Safety', { pill: 'Tinggi' }, '20', { pill: 'Aktif' }, '✎  ⊘'],
            ['Pelanggaran Prosedur Keselamatan Berat', 'Safety', { pill: 'Kritis' }, '30', { pill: 'Aktif' }, '✎  ⊘'],
            ['Terlambat Masuk Kerja', 'Kedisiplinan', { pill: 'Rendah' }, '5', { pill: 'Aktif' }, '✎  ⊘'],
            ['Tidak Memakai APD', 'Safety', { pill: 'Sedang' }, '15', { pill: 'Aktif' }, '✎  ⊘'],
            ['Tidak Mencapai Target Produksi', 'Produksi', { pill: 'Rendah' }, '5', { pill: 'Aktif' }, '✎  ⊘'],
            ['Tidur Saat Bekerja', 'Kedisiplinan', { pill: 'Tinggi' }, '20', { pill: 'Aktif' }, '✎  ⊘'],
          ],
          { rh: 40 }
        ),
      ].join('\n'),
  });

// 20 — Kelola User
pages['20-admin-kelola-pengguna'] = () =>
  shellPage({
    pageName: 'Kelola User — Super Admin',
    who: 'admin',
    active: 'Kelola User',
    height: 760,
    draw: (x, y, w) =>
      [
        pageHead(x, y + 30, w, 'Kelola User', 'Manajemen akun & peran pengguna', [
          { label: '+ Tambah User' },
        ]),
        card(x + 14, y + 60, w - 28, 500, 'Daftar User', { right: '10 akun' }),
        table(
          x + 34,
          y + 116,
          w - 68,
          [
            { label: 'Pengguna', w: 210 },
            { label: 'Email', w: 200 },
            { label: 'Peran', w: 116 },
            { label: 'Status', w: 80 },
            { label: 'Aksi', w: 110, align: 'end' },
          ],
          [
            ['Operator 5 — operator05', 'operator5@bridgestone.com', { pill: 'Operator' }, { pill: 'Aktif' }, '✎  ⏸  ✖'],
            ['Operator 4 — operator04', 'operator4@bridgestone.com', { pill: 'Operator' }, { pill: 'Aktif' }, '✎  ⏸  ✖'],
            ['Operator 3 — operator03', 'operator3@bridgestone.com', { pill: 'Operator' }, { pill: 'Aktif' }, '✎  ⏸  ✖'],
            ['Operator 2 — operator02', 'operator2@bridgestone.com', { pill: 'Operator' }, { pill: 'Aktif' }, '✎  ⏸  ✖'],
            ['Operator 1 — operator01', 'operator1@bridgestone.com', { pill: 'Operator' }, { pill: 'Aktif' }, '✎  ⏸  ✖'],
            ['Staff Produksi — staff_produksi', 'staffproduksi@bridgestone.com', { pill: 'Staff Produksi' }, { pill: 'Aktif' }, '✎  ⏸  ✖'],
            ['Foreman Line 2 — foreman02', 'foreman2@bridgestone.com', { pill: 'Foreman' }, { pill: 'Aktif' }, '✎  ⏸  ✖'],
            ['Foreman Line 1 — foreman01', 'foreman1@bridgestone.com', { pill: 'Foreman' }, { pill: 'Aktif' }, '✎  ⏸  ✖'],
            ['Section Manager — section_manager', 'sectionmanager@bridgestone.com', { pill: 'Section Manager' }, { pill: 'Aktif' }, '✎  ⏸  ✖'],
            ['Super Administrator — superadmin', 'superadmin@bridgestone.com', { pill: 'Super Admin' }, { pill: 'Aktif' }, '✎  ⏸  ✖'],
          ],
          { rh: 40 }
        ),
      ].join('\n'),
  });

// 21 — Kelola Role
pages['21-admin-kelola-peran'] = () =>
  shellPage({
    pageName: 'Kelola Role & Hak Akses',
    who: 'admin',
    active: 'Kelola Role',
    height: 680,
    draw: (x, y, w) =>
      [
        pageHead(x, y + 30, w, 'Kelola Role', 'Peran & hak akses (permissions) sistem', [
          { label: '+ Tambah Role' },
        ]),
        card(x + 14, y + 60, w - 28, 400, 'Daftar Role', { right: '5 role' }),
        table(
          x + 34,
          y + 116,
          w - 68,
          [
            { label: 'Role', w: 130 },
            { label: 'Deskripsi', w: 346 },
            { label: 'Permissions', w: 100, align: 'end' },
            { label: 'User', w: 70, align: 'end' },
            { label: 'Aksi', w: 70, align: 'end' },
          ],
          [
            [{ pill: 'Foreman' }, 'Approve VoO, input pelanggaran, konseling, kartu kuning/SP', '14', '2', '✎'],
            [{ pill: 'Operator' }, 'Scan QR area, submit VoO/Ide Kaizen, unggah foto, lihat status', '7', '5', '✎'],
            [{ pill: 'Section Manager' }, 'Persetujuan final, dashboard KPI, ranking, tren, ekspor', '13', '1', '✎'],
            [{ pill: 'Staff Produksi' }, 'Monitor VoO/Kaizen & catatan pelanggaran — read-only', '6', '1', '✎'],
            [{ pill: 'Super Admin' }, 'Akses penuh: role, user, data, pengaturan, audit, blockchain', '36', '1', '✎'],
          ],
          { rh: 44 }
        ),
      ].join('\n'),
  });

// 22 — Lokasi QR
pages['22-admin-lokasi-qr'] = () =>
  shellPage({
    pageName: 'Kelola Lokasi QR',
    who: 'admin',
    active: 'Lokasi QR',
    height: 620,
    draw: (x, y, w) => {
      const cwq = 300;
      return [
        pageHead(x, y + 30, w, 'Lokasi QR', 'Kelola area kerja & QR code pemindaian', [
          { label: '+ Tambah Lokasi' },
        ]),
        ...[0, 1, 2].map((i) => {
          const px = x + 14 + i * (cwq + 16);
          return [
            rect(px, y + 60, cwq, 310, { fill: '#fff' }),
            txt(px + 20, y + 90, ['Area Curing', 'Area Banbury', 'Area Assembly'][i], {
              fs: 12,
              weight: 'bold',
            }),
            txt(px + 20, y + 106, ['QR-CUR · Curing', 'QR-BAN · Banbury', 'QR-ASM · Assembly'][i], {
              fs: 9,
              fill: MUTED,
            }),
            rect(px + cwq - 40, y + 80, 18, 20, { stroke: MUTED }),
            rect(px + 20, y + 122, 140, 140, { fill: '#fff' }),
            txt(px + 90, y + 200, 'QR', { fs: 22, weight: 'bold', anchor: 'middle' }),
            txt(px + 20, y + 290, ['Area kerja Curing', 'Area kerja Banbury', 'Area kerja Assembly'][i], {
              fs: 9,
              fill: MUTED,
            }),
            line(px + 20, y + 306, px + cwq - 20, y + 306, { stroke: HAIR }),
            txt(px + 20, y + 328, `${[0, 12, 5][i]} kali dipindai`, { fs: 9, fill: FAINT }),
          ].join('\n');
        }),
      ].join('\n');
    },
  });

// 23 — Monitor VoO / Kaizen (Staff Produksi)
pages['23-staff-monitor-voo'] = () =>
  shellPage({
    pageName: 'Monitor VoO / Ide Kaizen — Staff Produksi',
    who: 'staff',
    active: 'Monitor VoO / Kaizen',
    height: 700,
    draw: (x, y, w) => {
      const sw = (w - 28 - 4 * 12) / 5;
      const tiles = [
        ['3', 'TOTAL'],
        ['1', 'PENDING'],
        ['1', 'DITERUSKAN'],
        ['1', 'DISETUJUI'],
        ['0', 'DITOLAK'],
      ];
      return [
        pageHead(x, y + 30, w, 'Monitor VoO / Ide Kaizen', 'Pantau seluruh pengajuan VoO dan Ide Kaizen dari operator'),
        txt(x + 14, y + 66, 'STATUS', { fs: 7, fill: FAINT, ls: 1 }),
        field(x + 14, y + 74, 150, '', 'Semua Status', { caret: true }),
        txt(x + 178, y + 66, 'JENIS', { fs: 7, fill: FAINT, ls: 1 }),
        field(x + 178, y + 74, 130, '', 'Semua Jenis', { caret: true }),
        btn(x + 322, y + 75, 96, 'Muat Ulang'),

        ...tiles.map((t, i) => {
          const px = x + 14 + i * (sw + 12);
          return [
            rect(px, y + 122, sw, 70, { fill: '#fff' }),
            txt(px + sw / 2, y + 158, t[0], { fs: 20, weight: 'bold', anchor: 'middle' }),
            txt(px + sw / 2, y + 178, t[1], { fs: 8, fill: MUTED, anchor: 'middle', ls: 0.5 }),
          ].join('\n');
        }),

        card(x + 14, y + 208, w - 28, 300, 'Daftar Pengajuan', { right: '3 pengajuan' }),
        table(
          x + 34,
          y + 264,
          w - 68,
          [
            { label: '#', w: 26 },
            { label: 'Operator', w: 120 },
            { label: 'Judul', w: 190 },
            { label: 'Jenis', w: 100 },
            { label: 'Status', w: 150 },
            { label: 'Poin', w: 50, align: 'end' },
            { label: 'Tanggal', w: 80, align: 'end' },
          ],
          [
            ['1', 'Operator 3', 'Efisiensi Waktu Setup', { pill: 'VoO' }, { pill: 'Menunggu Foreman' }, '-', '12 Jul 2026'],
            ['2', 'Operator 2', 'Ide Kaizen Safety Guard', { pill: 'Ide Kaizen' }, { pill: 'Disetujui Final' }, '+15', '12 Jul 2026'],
            ['3', 'Operator 1', 'Perbaikan Alur Material', { pill: 'VoO' }, { pill: 'Diteruskan ke Manager' }, '-', '12 Jul 2026'],
          ],
          { rh: 36 }
        ),
      ].join('\n');
    },
  });

// 24 — Monitor Pelanggaran (Staff Produksi)
pages['24-staff-monitor-pelanggaran'] = () =>
  shellPage({
    pageName: 'Monitor Pelanggaran — Staff Produksi',
    who: 'staff',
    active: 'Monitor Pelanggaran',
    height: 720,
    draw: (x, y, w) => {
      const sw = (w - 28 - 4 * 12) / 5;
      const tiles = [
        ['1', 'TOTAL'],
        ['1', 'BELUM KONSELING'],
        ['0', 'SUDAH KONSELING'],
        ['0', 'TINGGI'],
        ['0', 'KRITIS'],
      ];
      const tabs = ['Pelanggaran', 'Konseling', 'Kartu Kuning', 'Surat Peringatan'];
      return [
        pageHead(
          x,
          y + 30,
          w,
          'Monitor Pelanggaran',
          'Pantau seluruh catatan pelanggaran, konseling, kartu kuning, dan surat peringatan'
        ),
        ...tabs.map((t, i) => {
          const tw = t.length * 6.4 + 40;
          const tx = x + 14 + tabs.slice(0, i).reduce((a, s) => a + s.length * 6.4 + 50, 0);
          return [
            rect(tx, y + 60, tw, 30, { fill: '#fff', sw: i === 0 ? 2 : 1 }),
            txt(tx + tw / 2, y + 79, t, {
              fs: 10,
              anchor: 'middle',
              weight: i === 0 ? 'bold' : 'normal',
            }),
          ].join('\n');
        }),

        ...tiles.map((t, i) => {
          const px = x + 14 + i * (sw + 12);
          return [
            rect(px, y + 106, sw, 70, { fill: '#fff' }),
            txt(px + sw / 2, y + 142, t[0], { fs: 20, weight: 'bold', anchor: 'middle' }),
            txt(px + sw / 2, y + 162, t[1], { fs: 7.5, fill: MUTED, anchor: 'middle', ls: 0.5 }),
          ].join('\n');
        }),

        txt(x + 14, y + 200, 'KEPARAHAN', { fs: 7, fill: FAINT, ls: 1 }),
        field(x + 14, y + 208, 100, '', 'Semua', { caret: true }),
        txt(x + 124, y + 200, 'TINDAK LANJUT', { fs: 7, fill: FAINT, ls: 1 }),
        field(x + 124, y + 208, 130, '', 'Semua', { caret: true }),
        txt(x + 264, y + 200, 'PERIODE', { fs: 7, fill: FAINT, ls: 1 }),
        field(x + 264, y + 208, 116, '', 'Semua Bulan', { caret: true }),
        field(x + 390, y + 208, 110, '', 'Semua Tahun', { caret: true }),
        btn(x + 512, y + 209, 96, 'Muat Ulang'),

        card(x + 14, y + 262, w - 28, 240, 'Pelanggaran', { right: '1 catatan' }),
        table(
          x + 34,
          y + 318,
          w - 68,
          [
            { label: '#', w: 24 },
            { label: 'Operator', w: 104 },
            { label: 'Jenis', w: 120 },
            { label: 'Keparahan', w: 86 },
            { label: 'Poin Penalti', w: 76 },
            { label: 'Status Tindak Lanjut', w: 134 },
            { label: 'Dicatat Oleh', w: 92 },
            { label: 'Tanggal', w: 80, align: 'end' },
          ],
          [
            [
              '1',
              'Operator 1',
              'Late Arrival',
              { pill: 'Rendah' },
              '-5',
              { pill: 'Belum dikonseling' },
              'Foreman Line 1',
              '12 Jul 2026',
            ],
          ],
          { rh: 36 }
        ),
      ].join('\n');
    },
  });

// ----------------------------------------------------------------------- main

fs.mkdirSync(OUT, { recursive: true });
const names = Object.keys(pages).sort();
for (const name of names) {
  fs.writeFileSync(path.join(OUT, `${name}.svg`), pages[name](), 'utf8');
  console.log(`✓ ${name}.svg`);
}

// Halaman indeks untuk melihat seluruh mockup sekaligus di browser.
const judul = (n) =>
  n
    .replace(/^\d+-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const index =
  `<!doctype html>
<meta charset="utf-8">
<title>Mockup Antarmuka — Sistem Penilaian Kinerja Operator</title>
<style>
  body { background:#fff; margin:0; padding:32px; font:13px/1.5 Arial, Helvetica, sans-serif; color:#111 }
  h1 { font:600 20px Arial; margin:0 0 4px }
  p.lead { margin:0 0 28px; color:#555 }
  figure { margin:0 0 34px }
  figcaption { margin-bottom:8px; font-weight:bold }
  img { width:100%; max-width:1060px; display:block; border:0 }
</style>
<h1>Mockup Antarmuka Sistem Penilaian Kinerja Operator</h1>
<p class="lead">PT Bridgestone Tire Indonesia — Bekasi Plant · ${names.length} halaman</p>
` +
  names
    .map(
      (n, i) =>
        `<figure><figcaption>Gambar ${i + 1}. ${judul(n)}</figcaption>` +
        `<img src="svg/${n}.svg" alt="${judul(n)}"></figure>`
    )
    .join('\n');

fs.writeFileSync(path.join(__dirname, 'index.html'), index, 'utf8');
console.log('✓ index.html');
console.log(`\n${names.length} mockup dibuat di ${OUT}`);
