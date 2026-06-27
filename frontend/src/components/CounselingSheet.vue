<template>
  <div class="cs-overlay" @click.self="$emit('close')">
    <div class="cs-modal">
      <div class="cs-toolbar no-print">
        <span class="cs-title-bar">Lembar Counseling - Coaching</span>
        <div class="cs-tb-actions">
          <button class="btn-primary btn-sm" @click="print"><ion-icon :icon="printOutline" /> Cetak</button>
          <button class="btn-ghost btn-sm" @click="$emit('close')"><ion-icon :icon="closeOutline" /> Tutup</button>
        </div>
      </div>

      <div class="cs-sheet" ref="sheetEl">
        <div class="cs-head">
          <h1>COUNSELING - COACHING</h1>
          <h2>{{ c.operator?.section || '—' }} Section</h2>
        </div>

        <table class="cs-id">
          <tbody>
            <tr>
              <td class="lbl">Nama</td>
              <td class="val">{{ c.operator?.user?.fullName }}</td>
              <td class="lbl">No Code</td>
              <td class="val">{{ c.operator?.employeeId }}</td>
            </tr>
            <tr>
              <td class="lbl">Job</td>
              <td class="val">{{ c.operator?.position }}</td>
              <td class="lbl">Pws</td>
              <td class="val">{{ c.pws || c.foreman?.fullName }}</td>
            </tr>
          </tbody>
        </table>

        <table class="cs-cat">
          <tbody>
            <tr>
              <td class="lbl">Perihal</td>
              <td v-for="opt in categories" :key="opt" :class="['cat', { on: c.category === opt }]">
                <span class="mark">{{ c.category === opt ? '◉' : '○' }}</span> {{ opt }}
              </td>
            </tr>
          </tbody>
        </table>

        <div class="cs-topic">{{ c.topic }}</div>

        <div class="cs-block">
          <div class="cs-block-head">Paparan / Penjelasan dari karyawan (uraian masalah):</div>
          <div class="cs-block-body lines">{{ c.employeeStatement || '—' }}</div>
        </div>

        <div class="cs-block">
          <div class="cs-block-head">Saran dari Atasan:</div>
          <div class="cs-block-body lines">{{ c.supervisorSuggestion || '—' }}</div>
        </div>

        <div class="cs-block">
          <div class="cs-block-head">Komitmen karyawan: <span class="sub">(untuk mencegah kejadian ulang)</span></div>
          <div class="cs-block-body lines">{{ c.employeeCommitment || '—' }}</div>
        </div>

        <div class="cs-foot">
          <div class="cs-place">{{ c.location || 'Bekasi' }}, {{ fmtLongDate(c.date) }}</div>
          <div class="cs-signs">
            <div class="sign">
              <div class="sign-role">Karyawan</div>
              <div class="sign-space"></div>
              <div class="sign-name">( {{ c.operator?.user?.fullName }} )</div>
            </div>
            <div class="sign">
              <div class="sign-role">Atasan (Foreman)</div>
              <div class="sign-space"></div>
              <div class="sign-name">( {{ c.foreman?.fullName }} )</div>
            </div>
            <div class="sign">
              <div class="sign-role">Mengetahui (Section Manager)</div>
              <div class="sign-space"></div>
              <div class="sign-name">( {{ c.acknowledgedBy?.fullName || '………………………' }} )</div>
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
import type { CounselingItem } from '@/types';

defineProps<{ c: CounselingItem }>();
defineEmits<{ (e: 'close'): void }>();

const categories = ['Safety', 'Quality', 'Produksi', 'Behaviour', 'Others'];
const sheetEl = ref<HTMLElement | null>(null);

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
  w.document.write(`<!doctype html><html><head><title>Counseling - Coaching</title><style>${printCss}</style></head><body>${html}</body></html>`);
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
table { width: 100%; border-collapse: collapse; }
.cs-id td, .cs-cat td { border: 1px solid #000; padding: 5px 8px; font-size: 13px; }
.cs-id .lbl, .cs-cat .lbl { width: 90px; font-weight: bold; background: #f2f2f2; }
.cs-cat .cat { text-align: center; }
.cs-cat .cat.on { font-weight: bold; }
.cs-topic { border: 1px solid #000; border-top: none; min-height: 54px; padding: 6px 8px; font-size: 13px; }
.cs-block { border: 1px solid #000; border-top: none; }
.cs-block-head { font-weight: bold; font-size: 12.5px; padding: 4px 8px; border-bottom: 1px solid #000; background: #f7f7f7; }
.cs-block-head .sub { font-weight: normal; font-style: italic; }
.cs-block-body { min-height: 70px; padding: 8px; font-size: 13px; white-space: pre-wrap; }
.cs-foot { margin-top: 18px; font-size: 13px; }
.cs-place { text-align: right; margin-bottom: 12px; }
.cs-signs { display: flex; justify-content: space-between; gap: 16px; }
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
.cs-id td, .cs-cat td { border: 1px solid #222; padding: 6px 9px; font-size: 13.5px; }
.cs-id .lbl, .cs-cat .lbl { width: 90px; font-weight: 700; background: #f2f2f2; }
.cs-cat .cat { text-align: center; }
.cs-cat .cat.on { font-weight: 700; background: #eef6ff; }
.cs-cat .mark { margin-right: 3px; }
.cs-topic { border: 1px solid #222; border-top: none; min-height: 54px; padding: 7px 9px; font-size: 13.5px; }
.cs-block { border: 1px solid #222; border-top: none; }
.cs-block-head { font-weight: 700; font-size: 13px; padding: 5px 9px; border-bottom: 1px solid #222; background: #f7f7f7; }
.cs-block-head .sub { font-weight: 400; font-style: italic; }
.cs-block-body { min-height: 72px; padding: 9px; font-size: 13.5px; white-space: pre-wrap; line-height: 1.7; }
.cs-foot { margin-top: 20px; font-size: 13.5px; }
.cs-place { text-align: right; margin-bottom: 14px; }
.cs-signs { display: flex; justify-content: space-between; gap: 18px; }
.sign { flex: 1; text-align: center; }
.sign-role { font-weight: 700; margin-bottom: 4px; }
.sign-space { height: 64px; }
.sign-name { border-top: 1px solid #222; padding-top: 4px; }
</style>
