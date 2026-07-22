const fs = require('fs');
const path = require('path');

// ============================================================================
// Penggabung diagram — menyatukan SVG per-diagram (docs/diagrams/individual/*)
// menjadi SATU SVG per kategori (docs/diagrams/<kategori>.svg).
//
// Cara: tiap SVG anak di-embed sebagai <image href="data:image/svg+xml;base64,...">
// pada satu kanvas induk, disusun vertikal, dengan judul kategori + sub-judul.
// Data-URI mengisolasi tiap anak sepenuhnya (tak ada bentrok id/marker antar
// diagram Mermaid), dan tetap self-contained (tanpa fetch eksternal).
//
// Jalankan setelah generate-svgs.js:  node docs/combine-svgs.js
// ============================================================================

const individualDir = path.join(__dirname, 'diagrams', 'individual');
const outputDir = path.join(__dirname, 'diagrams');

// Palet: aksen merah Bridgestone + netral gelap.
const ACCENT = '#C8102E';
const INK = '#1f2937';
const SUBTLE = '#6b7280';
const BG = '#ffffff';

const categories = {
  flowchart: {
    title: 'FLOWCHART',
    items: [
      ['flowchart-auth', '1. Autentikasi & Navigasi Peran'],
      ['flowchart-voo', '2. Pengajuan & Persetujuan VoO'],
      ['flowchart-misconduct', '3. Pencatatan Pelanggaran (Katalog + Eskalasi)'],
      ['flowchart-disciplinary', '4. Tindakan Disiplin (Konseling / Kartu Kuning / SP)'],
      ['flowchart-qr-scan', '5. Pemindaian QR'],
    ],
  },
  activity: {
    title: 'ACTIVITY DIAGRAM',
    items: [
      ['activity-login', '1. Login & Navigasi Berdasarkan Peran'],
      ['activity-voo', '2. Pengajuan VoO / Ide Kaizen'],
      ['activity-misconduct', '3. Pencatatan Pelanggaran & Eskalasi Disiplin'],
    ],
  },
  usecase: {
    title: 'USE CASE DIAGRAM',
    items: [
      ['usecase-overall', '1. Keseluruhan Sistem'],
      ['usecase-per-role', '2. Per Peran'],
    ],
  },
  sequence: {
    title: 'SEQUENCE DIAGRAM',
    items: [
      ['seq-login', '1. Login (+ koneksi Socket.IO)'],
      ['seq-voo-approval', '2. Pengajuan & Persetujuan VoO'],
      ['seq-misconduct', '3. Pencatatan Pelanggaran (transaksi + eskalasi)'],
      ['seq-realtime-notification', '4. Notifikasi Realtime (Socket.IO by room)'],
      ['seq-qr-scan', '5. Pemindaian QR Area / Operator'],
      ['seq-dashboard', '6. Dashboard KPI & Ekspor'],
      ['seq-blockchain', '7. Penyimpanan Hash Blockchain'],
    ],
  },
  class: {
    title: 'CLASS DIAGRAM',
    items: [
      ['class-domain', '1. Model Domain (Entitas Prisma)'],
      ['class-backend', '2. Lapisan Backend (Controller / Service / Engine)'],
    ],
  },
  arch: {
    title: 'DIAGRAM ARSITEKTUR',
    items: [
      ['arch-overview', '1. Gambaran Umum Arsitektur Sistem'],
      ['arch-data-flow', '2. Alur Data'],
      ['arch-performance-score', '3. Perhitungan Skor Kinerja Operator'],
    ],
  },
};

// Ambil ukuran intrinsik (W, H) dari viewBox root SVG.
function readSize(svg) {
  const m = svg.match(/viewBox="\s*([-\d.]+)\s+([-\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (m) return { w: parseFloat(m[3]), h: parseFloat(m[4]) };
  const wm = svg.match(/width="([\d.]+)"/);
  const hm = svg.match(/height="([\d.]+)"/);
  return { w: wm ? parseFloat(wm[1]) : 800, h: hm ? parseFloat(hm[1]) : 600 };
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Layout konstanta.
const PAD = 40;          // margin kiri/kanan/atas/bawah kanvas
const CAT_TITLE_H = 64;  // ruang judul kategori
const SUB_TITLE_H = 40;  // ruang sub-judul tiap diagram
const GAP = 64;          // jarak antar diagram
const MAX_TILE_W = 1600; // batas lebar tiap tile agartidak berlebihan

function combine(key, cat) {
  const tiles = cat.items.map(([file, label]) => {
    const p = path.join(individualDir, `${file}.svg`);
    const svg = fs.readFileSync(p, 'utf8');
    const { w, h } = readSize(svg);
    const scale = Math.min(1, MAX_TILE_W / w);
    const b64 = Buffer.from(svg, 'utf8').toString('base64');
    return { label, w: w * scale, h: h * scale, b64 };
  });

  const contentW = Math.max(600, ...tiles.map((t) => t.w));
  const canvasW = contentW + PAD * 2;

  let y = PAD + CAT_TITLE_H;
  const bodyParts = [];
  for (const t of tiles) {
    // sub-judul
    bodyParts.push(
      `<text x="${PAD}" y="${y + 26}" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="700" fill="${INK}">${esc(t.label)}</text>`
    );
    // garis aksen tipis di bawah sub-judul
    bodyParts.push(
      `<rect x="${PAD}" y="${y + SUB_TITLE_H - 4}" width="${contentW}" height="2" fill="${ACCENT}" opacity="0.25"/>`
    );
    const imgY = y + SUB_TITLE_H + 8;
    bodyParts.push(
      `<image x="${PAD}" y="${imgY}" width="${t.w.toFixed(1)}" height="${t.h.toFixed(1)}" href="data:image/svg+xml;base64,${t.b64}" xlink:href="data:image/svg+xml;base64,${t.b64}"/>`
    );
    y = imgY + t.h + GAP;
  }
  const canvasH = y - GAP + PAD;

  const header =
    `<text x="${PAD}" y="${PAD + 40}" font-family="Segoe UI, Arial, sans-serif" font-size="40" font-weight="800" fill="${ACCENT}">${esc(cat.title)}</text>` +
    `<text x="${canvasW - PAD}" y="${PAD + 40}" text-anchor="end" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="${SUBTLE}">Sistem Penilaian Kinerja VoO / Ide Kaizen</text>`;

  const svgOut =
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `width="${canvasW.toFixed(0)}" height="${canvasH.toFixed(0)}" viewBox="0 0 ${canvasW.toFixed(0)} ${canvasH.toFixed(0)}">` +
    `<rect x="0" y="0" width="${canvasW.toFixed(0)}" height="${canvasH.toFixed(0)}" fill="${BG}"/>` +
    header +
    bodyParts.join('') +
    `</svg>`;

  const outFile = path.join(outputDir, `${key}.svg`);
  fs.writeFileSync(outFile, svgOut, 'utf8');
  return { key, tiles: tiles.length, canvasW: Math.round(canvasW), canvasH: Math.round(canvasH) };
}

console.log('Menggabungkan diagram per kategori...\n');
for (const [key, cat] of Object.entries(categories)) {
  const r = combine(key, cat);
  console.log(`  ${key}.svg  (${r.tiles} diagram, ${r.canvasW}x${r.canvasH})`);
}
console.log(`\nOutput: ${outputDir}`);
