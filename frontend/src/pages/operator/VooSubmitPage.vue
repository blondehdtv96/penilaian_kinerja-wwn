<template>
  <page-shell title="Ajukan VoO / Ide Kaizen" subtitle="Kirim usulan perbaikan atau ide kaizen Anda">
    <div class="card form-card">
      <div class="alert ok" v-if="okMsg"><ion-icon :icon="checkmarkCircleOutline" /> {{ okMsg }}</div>
      <div class="alert err" v-if="error"><ion-icon :icon="alertCircleOutline" /> {{ error }}</div>

      <div class="loc-banner" v-if="scanned.lokasi || scanned.area">
        <ion-icon :icon="locationOutline" />
        <div>
          <div class="loc-ttl">Lokasi dari hasil scan QR</div>
          <div class="loc-sub">
            <b>{{ scanned.lokasi || scanned.area }}</b>
            <span v-if="scanned.area && scanned.lokasi"> · {{ scanned.area }}</span>
            <span v-if="scanned.kode" class="loc-code">{{ scanned.kode }}</span>
          </div>
        </div>
      </div>

      <form class="form-grid" @submit.prevent="submit">
        <div class="field">
          <label for="t">Judul</label>
          <input id="t" v-model.trim="title" maxlength="120" placeholder="mis. Perbaikan alur material di Line A" required />
        </div>

        <div class="field">
          <label>Group / Shift</label>
          <div class="gs-row">
            <select v-model="group" aria-label="Group">
              <option v-for="g in groupOptions" :key="g.value" :value="g.value">{{ g.label }}</option>
            </select>
            <span class="gs-sep">-</span>
            <select v-model="shift" aria-label="Shift">
              <option v-for="s in shiftOptions" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label for="sumber">Sumber VoO</label>
            <select id="sumber" v-model="sumberVoo">
              <option v-for="s in sumberOptions" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div class="field">
            <label for="kat4m">Kategori 4M</label>
            <select id="kat4m" v-model="kategori4m">
              <option v-for="k in kategori4mOptions" :key="k" :value="k">{{ k }}</option>
            </select>
          </div>
        </div>

        <div class="field">
          <label for="d">Deskripsi</label>
          <textarea id="d" v-model.trim="description" rows="5" placeholder="Jelaskan usulan atau ide Anda secara ringkas…" required></textarea>
        </div>

        <div class="field">
          <label>Foto Pendukung <span class="hint">(opsional, maks 5)</span></label>
          <input type="file" accept="image/*" multiple @change="onFiles" :disabled="photos.length >= 5" />
          <div class="thumbs" v-if="photos.length">
            <div class="thumb" v-for="(p, i) in photos" :key="i">
              <img :src="p" alt="foto pendukung" />
              <button type="button" class="rm" @click="photos.splice(i, 1)" aria-label="Hapus foto">
                <ion-icon :icon="closeOutline" />
              </button>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn-primary" type="submit" :disabled="submitting || !title || !description">
            <ion-icon :icon="sendOutline" /> {{ submitting ? 'Mengirim…' : 'Kirim Pengajuan' }}
          </button>
          <button class="btn-ghost" type="button" @click="go('/voo/my')">Batal</button>
        </div>
      </form>
    </div>
  </page-shell>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { checkmarkCircleOutline, alertCircleOutline, closeOutline, sendOutline, locationOutline } from 'ionicons/icons';
import PageShell from '@/components/PageShell.vue';
import { vooService } from '@/services/voo.service';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const go = (p: string) => router.push(p);

const type = ref<string>('VoO/IdeKaizen');
const title = ref('');
const description = ref('');
const photos = ref<string[]>([]);
const submitting = ref(false);
const error = ref('');
const okMsg = ref('');

// Group / Shift — pilihan mengikuti standar profil operator (A, B, C, D, Non-Shift).
const groupOptions = [
  { value: '-', label: '-' },
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
];
const shiftOptions = ['NS', '1', '2', '3'];

// Sumber VoO & Kategori 4M — mengikuti form Input VOO lama (Picture1/Picture2).
const sumberOptions = [
  'Laporan Operator',
  'Interview Patrol',
  'LKBK/LKK',
  'Standard Monitoring',
  'Pendapat Baru',
  'Others',
];
const kategori4mOptions = ['Standard/Process', 'Mesin', 'Tools', 'Material', 'Lain-Lain'];
const sumberVoo = ref(sumberOptions[0]);
const kategori4m = ref(kategori4mOptions[0]);

// Auto-isi Group dari profil operator yang login bila cocok dengan opsi (A/B/C/D).
// Profil "Non-Shift" tidak punya huruf group, jadi group tetap "-".
const profileGroup = auth.user?.operator?.group ?? '';
const group = ref(groupOptions.some((g) => g.value === profileGroup) ? profileGroup : '-');
const shift = ref('NS');

// Lokasi yang dibawa dari halaman Scan QR (query params). Dipakai untuk menampilkan
// banner lokasi dan mengisi awal deskripsi agar operator tinggal melengkapi.
const scanned = {
  lokasi: (route.query.lokasi as string) || '',
  area: (route.query.area as string) || '',
  kode: (route.query.kode as string) || '',
};

if (scanned.lokasi || scanned.area) {
  const parts = [scanned.lokasi, scanned.area].filter(Boolean).join(' - ');
  const kode = scanned.kode ? ` (${scanned.kode})` : '';
  description.value = `Lokasi: ${parts}${kode}\n\n`;
}

const onFiles = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const files = input.files;
  if (!files) return;
  const remaining = 5 - photos.value.length;
  Array.from(files)
    .slice(0, remaining)
    .forEach((f) => {
      const r = new FileReader();
      r.onload = () => {
        if (typeof r.result === 'string') photos.value.push(r.result);
      };
      r.readAsDataURL(f);
    });
  input.value = '';
};

const submit = async () => {
  error.value = '';
  okMsg.value = '';
  submitting.value = true;
  try {
    const { data } = await vooService.create({
      title: title.value,
      description: description.value,
      type: type.value,
      groupShift: `${group.value} / ${shift.value}`,
      sumberVoo: sumberVoo.value,
      kategori4m: kategori4m.value,
      photos: JSON.stringify(photos.value),
    });
    if (data?.success) {
      okMsg.value = 'Pengajuan terkirim dan tercatat di blockchain. Mengarahkan…';
      setTimeout(() => router.push('/voo/my'), 900);
    } else {
      error.value = 'Gagal mengirim pengajuan.';
    }
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal mengirim pengajuan.';
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.form-card { max-width: 660px; }
.loc-banner {
  display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
  padding: 12px 14px; border-radius: 12px;
  background: var(--db-icon-bg); border: 1px solid var(--db-line);
}
.loc-banner ion-icon { font-size: 22px; color: var(--db-brand); flex-shrink: 0; }
.loc-ttl { font-size: 12px; color: var(--db-muted); }
.loc-sub { font-size: 14px; color: var(--db-ink); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.loc-code {
  font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px;
  background: var(--db-card); border: 1px solid var(--db-line-2); color: var(--db-muted);
}
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 520px) { .field-row { grid-template-columns: 1fr; } }
.field select {
  width: 100%;
  border: 1px solid var(--db-line-2);
  border-radius: 9px;
  padding: 9px 12px;
  font: inherit;
  font-size: 14px;
  background: var(--db-card);
  color: var(--db-ink);
  cursor: pointer;
}
.field select:focus { outline: none; border-color: var(--db-brand); }
.gs-row { display: flex; align-items: center; gap: 10px; }
.gs-row select {
  min-width: 90px;
  border: 1px solid var(--db-line-2);
  border-radius: 9px;
  padding: 9px 12px;
  font: inherit;
  font-size: 14px;
  background: var(--db-card);
  color: var(--db-ink);
  cursor: pointer;
}
.gs-row select:focus { outline: none; border-color: var(--db-brand); }
.gs-sep { color: var(--db-ink-3); font-weight: 600; }
.field input[type='file'] { padding: 9px 11px; font-size: 13px; }
.thumbs { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
.thumb { position: relative; width: 76px; height: 76px; border-radius: 10px; overflow: hidden; border: 1px solid var(--db-line); }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.thumb .rm {
  position: absolute; top: 3px; right: 3px; width: 22px; height: 22px; border-radius: 50%;
  background: rgba(0, 0, 0, 0.6); color: #fff; display: grid; place-items: center; font-size: 14px;
}
</style>
