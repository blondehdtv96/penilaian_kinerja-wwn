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

      <form class="form-grid" @submit.prevent="openConfirm">
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
          <label>Klasifikasi <span class="hint">(pilih salah satu)</span></label>
          <div class="class-grid">
            <label
              v-for="c in classificationOptions"
              :key="c.value"
              class="class-chk"
              :class="{ active: classification === c.value, disabled: classification && classification !== c.value }"
            >
              <input
                type="checkbox"
                :value="c.value"
                :checked="classification === c.value"
                :disabled="!!classification && classification !== c.value"
                @change="toggleClassification(c.value)"
              />
              <span>{{ c.label }}</span>
            </label>
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

    <!-- Popup konfirmasi sebelum pengajuan benar-benar dikirim -->
    <div class="confirm-overlay" v-if="showConfirm" @click.self="showConfirm = false">
      <div class="confirm-modal">
        <div class="confirm-head">
          <ion-icon :icon="sendOutline" />
          <div>
            <div class="confirm-ttl">Konfirmasi Pengajuan</div>
            <div class="confirm-sub">Periksa kembali detail sebelum mengirim.</div>
          </div>
        </div>

        <div class="confirm-body">
          <div class="cf-row"><span class="cf-k">Judul</span><span class="cf-v">{{ title }}</span></div>
          <div class="cf-row"><span class="cf-k">Group / Shift</span><span class="cf-v">{{ group }} / {{ shift }}</span></div>
          <div class="cf-row"><span class="cf-k">Sumber VoO</span><span class="cf-v">{{ sumberVoo }}</span></div>
          <div class="cf-row"><span class="cf-k">Kategori 4M</span><span class="cf-v">{{ kategori4m }}</span></div>
          <div class="cf-row">
            <span class="cf-k">Klasifikasi</span>
            <span class="cf-v">{{ classificationLabel || '—' }}</span>
          </div>
          <div class="cf-row cf-col">
            <span class="cf-k">Deskripsi</span>
            <span class="cf-v cf-desc">{{ description }}</span>
          </div>
          <div class="cf-row"><span class="cf-k">Foto</span><span class="cf-v">{{ photos.length }} foto</span></div>
        </div>

        <div class="confirm-actions">
          <button class="btn-ghost" type="button" @click="showConfirm = false" :disabled="submitting">
            Periksa Lagi
          </button>
          <button class="btn-primary" type="button" @click="submit" :disabled="submitting">
            <ion-icon :icon="sendOutline" /> {{ submitting ? 'Mengirim…' : 'Konfirmasi & Kirim' }}
          </button>
        </div>
      </div>
    </div>
  </page-shell>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { ref, computed } from 'vue';
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

// Klasifikasi VoO — hanya boleh memilih satu. Checkbox lain otomatis nonaktif
// saat salah satu dipilih; klik ulang pada yang aktif untuk membatalkan.
const classificationOptions = [
  { value: 'safety', label: 'Safety' },
  { value: 'environment', label: 'Environment' },
  { value: 'quality', label: 'Quality' },
  { value: 'cost', label: 'Cost' },
  { value: 'delivery', label: 'Delivery' },
];
const classification = ref('');
const toggleClassification = (value: string) => {
  classification.value = classification.value === value ? '' : value;
};
const classificationLabel = computed(
  () => classificationOptions.find((c) => c.value === classification.value)?.label ?? ''
);

// Popup konfirmasi pengajuan.
const showConfirm = ref(false);
const openConfirm = () => {
  error.value = '';
  if (!title.value || !description.value) {
    error.value = 'Judul dan deskripsi wajib diisi.';
    return;
  }
  showConfirm.value = true;
};

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
      classification: JSON.stringify(classification.value ? [classification.value] : []),
      photos: JSON.stringify(photos.value),
    });
    if (data?.success) {
      showConfirm.value = false;
      okMsg.value = 'Pengajuan terkirim dan tercatat di blockchain. Mengarahkan…';
      setTimeout(() => router.push('/voo/my'), 900);
    } else {
      error.value = 'Gagal mengirim pengajuan.';
    }
  } catch (e: any) {
    showConfirm.value = false;
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
.class-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}
@media (max-width: 640px) { .class-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 400px) { .class-grid { grid-template-columns: repeat(2, 1fr); } }
.class-chk {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 10px 12px; border-radius: 10px; cursor: pointer;
  border: 1px solid var(--db-line-2); background: var(--db-card);
  color: var(--db-ink); font-size: 14px; font-weight: 500;
  text-align: center; transition: border-color .15s, background .15s, color .15s;
  user-select: none;
}
.class-chk input { accent-color: var(--db-brand); cursor: pointer; margin: 0; }
.class-chk:hover:not(.disabled) { border-color: var(--db-brand); }
.class-chk.active { border-color: var(--db-brand); background: var(--db-icon-bg); color: var(--db-brand); }
.class-chk.disabled { opacity: .45; cursor: not-allowed; }
.class-chk.disabled input { cursor: not-allowed; }
.field input[type='file'] { padding: 9px 11px; font-size: 13px; }
.thumbs { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
.thumb { position: relative; width: 76px; height: 76px; border-radius: 10px; overflow: hidden; border: 1px solid var(--db-line); }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.thumb .rm {
  position: absolute; top: 3px; right: 3px; width: 22px; height: 22px; border-radius: 50%;
  background: rgba(0, 0, 0, 0.6); color: #fff; display: grid; place-items: center; font-size: 14px;
}

/* Popup konfirmasi */
.confirm-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, .55);
  display: grid; place-items: center; padding: 20px; z-index: 1000; overflow: auto;
}
.confirm-modal {
  background: var(--db-card); border: 1px solid var(--db-line);
  border-radius: 14px; width: 100%; max-width: 460px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, .3); overflow: hidden;
}
.confirm-head {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 18px; border-bottom: 1px solid var(--db-line);
}
.confirm-head ion-icon { font-size: 24px; color: var(--db-brand); flex-shrink: 0; }
.confirm-ttl { font-weight: 700; color: var(--db-ink); font-size: 16px; }
.confirm-sub { font-size: 12px; color: var(--db-muted); }
.confirm-body { padding: 14px 18px; display: flex; flex-direction: column; gap: 10px; }
.cf-row { display: flex; gap: 12px; font-size: 14px; align-items: baseline; }
.cf-row.cf-col { flex-direction: column; gap: 4px; }
.cf-k { color: var(--db-muted); flex-shrink: 0; min-width: 96px; }
.cf-v { color: var(--db-ink); font-weight: 500; word-break: break-word; }
.cf-desc { white-space: pre-wrap; font-weight: 400; }
.confirm-actions {
  display: flex; gap: 10px; justify-content: flex-end;
  padding: 14px 18px; border-top: 1px solid var(--db-line);
}
@media (max-width: 480px) {
  .confirm-actions { flex-direction: column-reverse; }
  .confirm-actions button { width: 100%; }
  .cf-row:not(.cf-col) { flex-direction: column; gap: 2px; }
}
</style>
