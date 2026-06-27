/**
 * Template cetak Surat Peringatan (SP1 / SP2 / SP3).
 *
 * Merender dokumen HTML formal bergaya PT Bridgestone Tire Indonesia — Bekasi Plant,
 * lalu membukanya di jendela baru untuk dicetak. Pendekatan jendela terpisah dipakai
 * agar gaya cetak tidak berbenturan dengan CSS aplikasi (Ionic/Vue).
 *
 * Blok tanda tangan disesuaikan dengan role yang ada di sistem:
 *   - Operator         → pihak yang menerima peringatan
 *   - Foreman          → atasan langsung yang menerbitkan / mengusulkan
 *   - Section Manager  → mengetahui / persetujuan
 *   - HR & General Affair → catatan administrasi
 */

import type { SuratPeringatanItem } from '@/types';

interface LevelMeta {
  code: string; // SP-1
  title: string; // SURAT PERINGATAN PERTAMA
  intro: string;
  consequence: string;
  validity: string;
}

const LEVELS: Record<number, LevelMeta> = {
  1: {
    code: 'SP-1',
    title: 'SURAT PERINGATAN PERTAMA',
    intro:
      'Berdasarkan hasil evaluasi dan pemantauan kinerja serta kedisiplinan, dengan ini Perusahaan memberikan <b>Surat Peringatan Pertama (SP-1)</b> kepada karyawan berikut atas pelanggaran yang dilakukan:',
    consequence:
      'Surat Peringatan Pertama ini merupakan teguran resmi. Karyawan diharapkan memperbaiki sikap dan kinerjanya. Apabila pelanggaran terulang, Perusahaan dapat menerbitkan Surat Peringatan tingkat berikutnya.',
    validity: 'Surat Peringatan ini berlaku selama 6 (enam) bulan sejak tanggal diterbitkan.',
  },
  2: {
    code: 'SP-2',
    title: 'SURAT PERINGATAN KEDUA',
    intro:
      'Mengingat pelanggaran sebelumnya dan/atau pelanggaran baru yang dilakukan, dengan ini Perusahaan memberikan <b>Surat Peringatan Kedua (SP-2)</b> kepada karyawan berikut:',
    consequence:
      'Surat Peringatan Kedua ini diterbitkan karena karyawan belum menunjukkan perbaikan yang diharapkan. Apabila pelanggaran kembali terjadi, Perusahaan dapat menerbitkan Surat Peringatan Ketiga (terakhir).',
    validity: 'Surat Peringatan ini berlaku selama 6 (enam) bulan sejak tanggal diterbitkan.',
  },
  3: {
    code: 'SP-3',
    title: 'SURAT PERINGATAN KETIGA (TERAKHIR)',
    intro:
      'Sehubungan dengan pelanggaran yang masih berulang meskipun telah diberikan peringatan sebelumnya, dengan ini Perusahaan memberikan <b>Surat Peringatan Ketiga / Terakhir (SP-3)</b> kepada karyawan berikut:',
    consequence:
      'Surat Peringatan Ketiga ini merupakan peringatan terakhir. Apabila karyawan kembali melakukan pelanggaran selama masa berlaku surat ini, Perusahaan dapat mengambil tindakan tegas sesuai ketentuan yang berlaku, termasuk Pemutusan Hubungan Kerja (PHK).',
    validity: 'Surat Peringatan ini berlaku selama 6 (enam) bulan sejak tanggal diterbitkan.',
  },
};

const esc = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const fmtLong = (iso?: string): string => {
  if (!iso) return '..............................';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '..............................';
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const roleName = (issuedBy?: SuratPeringatanItem['issuedBy']): string => {
  const r = issuedBy?.role;
  if (!r) return '';
  return typeof r === 'string' ? r : r.name ?? '';
};

/** Susun dokumen HTML lengkap untuk satu Surat Peringatan. */
export function buildSuratPeringatanHtml(record: SuratPeringatanItem): string {
  const meta = LEVELS[record.level] ?? LEVELS[1];
  const op = record.operator;
  const nama = esc(op?.user?.fullName);
  const noCode = esc(op?.employeeId || '-');
  const bagian = esc([op?.section, op?.line].filter(Boolean).join(' / ') || '-');
  const jabatan = esc(op?.position || 'Operator');
  const grup = esc(op?.group || '-');
  const tanggal = fmtLong(record.issuedAt);
  const alasan = esc(record.reason);
  const issuer = esc(record.issuedBy?.fullName || '');
  const issuerRole = roleName(record.issuedBy);

  // Nama penanda tangan diisi otomatis bila role penerbit cocok.
  const foremanName = issuerRole === 'Foreman' ? issuer : '';
  const managerName = issuerRole === 'Section Manager' ? issuer : '';
  const reg = `GP-018 / ${meta.code} / ${new Date(record.issuedAt || Date.now()).getFullYear()}`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>${meta.code} - ${nama}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: "Times New Roman", Georgia, serif; color: #111; font-size: 12.5pt; line-height: 1.5; margin: 0; }
  .sheet { max-width: 720px; margin: 0 auto; padding: 24px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #111; padding-bottom: 8px; }
  .brand { font-family: Arial, Helvetica, sans-serif; }
  .brand .logo { font-size: 24pt; font-weight: 800; letter-spacing: 1px; font-style: italic; }
  .brand .sub { font-size: 10pt; font-weight: 700; line-height: 1.25; }
  .reg { font-family: Arial, sans-serif; font-size: 9pt; text-align: right; }
  .sect { font-family: Arial, sans-serif; font-size: 9.5pt; margin-top: 6px; }
  .title-wrap { text-align: center; margin: 22px 0 6px; }
  .title { display: inline-block; font-family: Arial, sans-serif; font-weight: 800; font-size: 15pt; letter-spacing: 1px; border: 2px solid #111; padding: 6px 18px; }
  .level-badge { text-align: center; font-family: Arial, sans-serif; font-size: 10pt; font-weight: 700; color: #b00020; margin-bottom: 16px; }
  p { margin: 9px 0; text-align: justify; }
  table.bio { border-collapse: collapse; margin: 6px 0 6px 8px; }
  table.bio td { padding: 2px 6px; vertical-align: top; }
  table.bio td.k { width: 150px; }
  table.bio td.s { width: 12px; }
  .reason-box { border: 1px solid #555; border-radius: 4px; padding: 10px 12px; margin: 6px 0 12px; min-height: 56px; background: #fafafa; }
  .note { font-size: 11.5pt; }
  .sign-grid { display: flex; justify-content: space-between; gap: 16px; margin-top: 34px; }
  .sign { width: 30%; text-align: center; font-size: 11.5pt; }
  .sign .role { font-weight: 700; }
  .sign .line { margin-top: 64px; border-top: 1px solid #111; padding-top: 4px; }
  .sign .nm { font-weight: 700; }
  .place-date { text-align: right; margin-top: 18px; }
  .hr-box { margin-top: 30px; border: 1px solid #111; }
  .hr-box .row { display: flex; border-bottom: 1px solid #111; }
  .hr-box .row:last-child { border-bottom: none; }
  .hr-box .lbl { width: 200px; padding: 8px 10px; border-right: 1px solid #111; font-family: Arial, sans-serif; font-size: 9.5pt; font-weight: 600; }
  .hr-box .val { flex: 1; padding: 8px 10px; min-height: 34px; }
  .foot { margin-top: 14px; font-size: 8.5pt; color: #555; font-family: Arial, sans-serif; text-align: center; }
  .toolbar { position: fixed; top: 0; left: 0; right: 0; background: #1f2430; color: #fff; padding: 10px 16px; display: flex; gap: 10px; justify-content: center; font-family: Arial, sans-serif; }
  .toolbar button { font: inherit; font-size: 13px; font-weight: 700; padding: 8px 18px; border: none; border-radius: 8px; cursor: pointer; }
  .toolbar .print { background: #e8392b; color: #fff; }
  .toolbar .close { background: #3a4150; color: #fff; }
  @media print { .toolbar { display: none; } .sheet { padding: 0; } body { font-size: 12pt; } }
</style>
</head>
<body>
  <div class="toolbar">
    <button class="print" onclick="window.print()">Cetak / Simpan PDF</button>
    <button class="close" onclick="window.close()">Tutup</button>
  </div>
  <div class="sheet">
    <div class="head">
      <div class="brand">
        <div class="logo">BRIDGESTONE</div>
        <div class="sub">PT BRIDGESTONE TIRE INDONESIA<br/>BEKASI PLANT</div>
      </div>
      <div class="reg">Regist. No. ${esc(reg)}<br/>${tanggal}</div>
    </div>
    <div class="sect"><b>SEKSI:</b> ${bagian} &nbsp;&nbsp; <b>GROUP:</b> ${grup}</div>

    <div class="title-wrap"><span class="title">SURAT PERINGATAN</span></div>
    <div class="level-badge">${meta.title}</div>

    <p>${meta.intro}</p>

    <table class="bio">
      <tr><td class="k">Nama</td><td class="s">:</td><td>${nama}</td></tr>
      <tr><td class="k">No. Code / NIP</td><td class="s">:</td><td>${noCode}</td></tr>
      <tr><td class="k">Bagian / Line</td><td class="s">:</td><td>${bagian}</td></tr>
      <tr><td class="k">Jabatan</td><td class="s">:</td><td>${jabatan}</td></tr>
    </table>

    <p style="margin-bottom:4px">Telah melanggar ketentuan / Perjanjian Kerja Bersama (PKB) yang berlaku, yaitu:</p>
    <div class="reason-box">${alasan || '-'}</div>

    <p class="note">${meta.consequence}</p>
    <p class="note">${meta.validity} Karyawan yang bersangkutan diharapkan untuk tidak mengulangi pelanggaran dan menjalankan tugas sesuai ketentuan Perusahaan.</p>

    <div class="place-date">Bekasi, ${tanggal}</div>

    <div class="sign-grid">
      <div class="sign">
        <div class="role">Mengetahui,<br/>Section Manager</div>
        <div class="line nm">( ${managerName || '..............................'} )</div>
      </div>
      <div class="sign">
        <div class="role">Atasan Langsung,<br/>Foreman</div>
        <div class="line nm">( ${foremanName || '..............................'} )</div>
      </div>
      <div class="sign">
        <div class="role">Yang Menerima,<br/>Operator</div>
        <div class="line nm">( ${nama || '..............................'} )</div>
      </div>
    </div>

    <div class="hr-box">
      <div class="row"><div class="lbl">Data dari Seksi</div><div class="val"></div></div>
      <div class="row"><div class="lbl">Usulan Sanksi</div><div class="val">${esc(meta.code)}</div></div>
      <div class="row"><div class="lbl">Catatan HR &amp; Gen. Affair</div><div class="val"></div></div>
    </div>

    <div class="foot">Dokumen ini dihasilkan oleh Sistem Penilaian Kinerja (VoO / Ide Kaizen) — PT Bridgestone Tire Indonesia, Bekasi Plant.</div>
  </div>
  <script>window.onload = function () { setTimeout(function () { try { window.focus(); } catch (e) {} }, 100); };<\/script>
</body>
</html>`;
}

/** Buka dokumen Surat Peringatan di jendela baru dan siap dicetak. */
export function printSuratPeringatan(record: SuratPeringatanItem): void {
  const html = buildSuratPeringatanHtml(record);
  const win = window.open('', '_blank', 'width=900,height=1000');
  if (!win) {
    alert('Pop-up diblokir browser. Izinkan pop-up untuk mencetak Surat Peringatan.');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
