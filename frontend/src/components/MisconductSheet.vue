<template>
  <div class="cs-overlay" @click.self="$emit('close')">
    <div class="cs-modal">
      <div class="cs-toolbar no-print">
        <span class="cs-title-bar">Lembar Pelanggaran & Kesediaan Konseling</span>
        <div class="cs-tb-actions">
          <button class="btn-primary btn-sm" @click="print"><ion-icon :icon="printOutline" /> Cetak</button>
          <button class="btn-ghost btn-sm" @click="$emit('close')"><ion-icon :icon="closeOutline" /> Tutup</button>
        </div>
      </div>

      <div class="cs-sheet" ref="sheetEl">
        <div class="cs-head">
          <h1>SURAT PEMBERITAHUAN PELANGGARAN</h1>
          <h2>{{ m.operator?.section || '—' }} Section</h2>
        </div>

        <table class="cs-id">
          <tbody>
            <tr>
              <td class="lbl">Nama</td>
              <td class="val">{{ m.operator?.user?.fullName }}</td>
              <td class="lbl">No Code</td>
              <td class="val">{{ m.operator?.employeeId || '—' }}</td>
            </tr>
            <tr>
              <td class="lbl">Job</td>
              <td class="val">{{ m.operator?.position || '—' }}</td>
              <td class="lbl">Tanggal</td>
              <td class="val">{{ fmtLongDate(m.createdAt) }}</td>
            </tr>
          </tbody>
        </table>

        <table class="cs-id">
          <tbody>
            <tr>
              <td class="lbl">Jenis Pelanggaran</td>
              <td class="val">{{ m.type }}</td>
              <td class="lbl">Tingkat</td>
              <td class="val">{{ severityLabel(m.severity) }}</td>
            </tr>
          </tbody>
        </table>

        <div class="cs-block">
          <div class="cs-block-head">Uraian Pelanggaran:</div>
          <div class="cs-block-body lines">{{ m.description || '—' }}</div>
        </div>

        <div class="cs-block">
          <div class="cs-block-head">Pernyataan Kesediaan Mengikuti Konseling:</div>
          <div class="cs-block-body statement">
            Dengan ini saya, <b>{{ m.operator?.user?.fullName }}</b> ({{ m.operator?.employeeId || '—' }}),
            menyatakan bahwa saya telah menerima pemberitahuan atas pelanggaran tersebut di atas
            dan <b>bersedia mengikuti sesi konseling / pembinaan</b> yang dijadwalkan oleh atasan,
            serta berkomitmen untuk memperbaiki diri dan tidak mengulangi pelanggaran yang sama.
          </div>
        </div>

        <div class="cs-foot">
          <div class="cs-place">{{ 'Bekasi' }}, {{ fmtLongDate(m.createdAt) }}</div>
          <div class="cs-signs">
            <div class="sign">
              <div class="sign-role">Yang Membuat Pernyataan (Karyawan)</div>
              <div class="sign-space"></div>
              <div class="sign-name">( {{ m.operator?.user?.fullName }} )</div>
            </div>
            <div class="sign">
              <div class="sign-role">Atasan (Foreman)</div>
              <div class="sign-space"></div>
              <div class="sign-name">( {{ m.createdBy?.fullName || '………………………' }} )</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { ref } from 'vue';
import { printOutline, closeOutline } from 'ionicons/icons';
import type { MisconductItem } from '@/types';

defineProps<{ m: MisconductItem }>();
defineEmits<{ (e: 'close'): void }>();

const sheetEl = ref<HTMLElement | null>(null);

const severityLabel = (s: string) => {
  const map: Record<string, string> = { low: 'Rendah', medium: 'Sedang', high: 'Tinggi', critical: 'Kritis' };
  return map[s] || s;
};

const fmtLongDate = (d: string) => {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const print = () => {
  const html = sheetEl.value?.outerHTML;
  if (!html) return;
  const w = window.open('', '_blank', 'width=820,height=1100');
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>Pemberitahuan Pelanggaran</title><style>${printCss}</style></head><body>${html}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); w.close(); }, 250);
};

const printCss = `
* { box-sizing: border-box; font-family: 'Times New Roman', serif; color: #000; }
body { margin: 0; padding: 24px; }
.cs-sheet { width: 720px; margin: 0 auto; }
.cs-head { text-align: center; margin-bottom: 14px; }
.cs-head h1 { font-size: 18px; margin: 0; text-decoration: underline; letter-spacing: 1px; }
.cs-head h2 { font-size: 13px; margin: 2px 0 0; font-weight: normal; }
table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
.cs-id td { border: 1px solid #000; padding: 5px 8px; font-size: 13px; }
.cs-id .lbl { width: 120px; font-weight: bold; background: #f2f2f2; }
.cs-block { border: 1px solid #000; border-top: none; }
.cs-block-head { font-weight: bold; font-size: 12.5px; padding: 4px 8px; border-bottom: 1px solid #000; background: #f7f7f7; }
.cs-block-body { min-height: 60px; padding: 8px; font-size: 13px; white-space: pre-wrap; line-height: 1.6; }
.cs-block-body.statement { text-align: justify; }
.cs-foot { margin-top: 18px; font-size: 13px; }
.cs-place { text-align: right; margin-bottom: 12px; }
.cs-signs { display: flex; justify-content: space-around; gap: 16px; }
.sign { flex: 1; text-align: center; }
.sign-role { font-weight: bold; margin-bottom: 4px; }
.sign-space { height: 64px; }
.sign-name { border-top: 1px solid #000; padding-top: 4px; }
`;
</script>

<style scoped>
.cs-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.55); display: grid; place-items: start center; padding: 24px; z-index: 1000; overflow: auto; }
.cs-modal { background: #fff; border-radius: 12px; width: 100%; max-width: 800px; box-shadow: 0 18px 50px rgba(0,0,0,.3); }
.cs-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--db-line); }
.cs-title-bar { font-weight: 700; color: var(--db-ink); }
.cs-tb-actions { display: inline-flex; gap: 8px; }

.cs-sheet { padding: 28px 32px 36px; color: #111; font-family: 'Times New Roman', Georgia, serif; }
.cs-head { text-align: center; margin-bottom: 14px; }
.cs-head h1 { font-size: 20px; margin: 0; text-decoration: underline; letter-spacing: 1px; }
.cs-head h2 { font-size: 14px; margin: 2px 0 0; font-weight: 400; }
.cs-sheet table { width: 100%; border-collapse: collapse; }
.cs-id td { border: 1px solid #222; padding: 6px 9px; font-size: 13.5px; }
.cs-id .lbl { width: 120px; font-weight: 700; background: #f2f2f2; }
.cs-block { border: 1px solid #222; border-top: none; }
.cs-block-head { font-weight: 700; font-size: 13px; padding: 5px 9px; border-bottom: 1px solid #222; background: #f7f7f7; }
.cs-block-body { min-height: 62px; padding: 9px; font-size: 13.5px; white-space: pre-wrap; line-height: 1.7; }
.cs-block-body.statement { text-align: justify; white-space: normal; }
.cs-foot { margin-top: 20px; font-size: 13.5px; }
.cs-place { text-align: right; margin-bottom: 14px; }
.cs-signs { display: flex; justify-content: space-around; gap: 18px; }
.sign { flex: 1; text-align: center; }
.sign-role { font-weight: 700; margin-bottom: 4px; }
.sign-space { height: 64px; }
.sign-name { border-top: 1px solid #222; padding-top: 4px; }
</style>
