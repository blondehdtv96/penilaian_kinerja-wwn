<template>
  <page-shell title="Scan Area QR" subtitle="Pindai QR area kerja atau identitas operator">
    <div class="grid g-bottom">
      <div class="card scan-card">
        <div class="scan-stage">
          <!-- Area kamera (html5-qrcode menyuntik <video> ke sini saat scanning) -->
          <div id="qr-reader" class="qr-reader" :class="{ active: scanning }"></div>

          <!-- Placeholder profesional saat kamera belum aktif -->
          <div v-if="!scanning" class="scan-placeholder">
            <div class="scan-frame">
              <span class="corner tl"></span>
              <span class="corner tr"></span>
              <span class="corner bl"></span>
              <span class="corner br"></span>
              <div class="scan-icon"><ion-icon :icon="qrCodeOutline" /></div>
            </div>
            <h3 class="ph-title">Arahkan kamera ke kode QR</h3>
            <p class="ph-sub">Pindai QR area kerja untuk langsung mengajukan VoO / Ide Kaizen, atau QR identitas operator.</p>
            <ul class="ph-tips">
              <li><ion-icon :icon="checkmarkCircleOutline" /> Pastikan QR berada di dalam bingkai</li>
              <li><ion-icon :icon="checkmarkCircleOutline" /> Jaga pencahayaan tetap cukup</li>
              <li><ion-icon :icon="checkmarkCircleOutline" /> Izinkan akses kamera saat diminta</li>
            </ul>
          </div>

          <!-- Garis pemindai animatif saat scanning -->
          <div v-else class="scan-line"></div>
        </div>

        <div class="form-actions" style="margin-top: 16px">
          <button class="btn-primary" v-if="!scanning" @click="start"><ion-icon :icon="scanOutline" /> Mulai Scan</button>
          <button class="btn-ghost" v-else @click="stop"><ion-icon :icon="stopCircleOutline" /> Berhenti</button>
        </div>
        <div class="alert err" v-if="error" style="margin-top: 12px"><ion-icon :icon="alertCircleOutline" /> {{ error }}</div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Hasil Scan</h3></div>
        <div v-if="!result" class="empty">Belum ada hasil. Mulai scan, atau tempel data QR secara manual.</div>
        <template v-else>
          <div v-if="result.type === 'area'" class="info-list">
            <div class="info-row"><span>Tipe</span><b>Area Kerja</b></div>
            <div class="info-row"><span>Nama</span><b>{{ result.location?.name }}</b></div>
            <div class="info-row"><span>Kode</span><b>{{ result.location?.code }}</b></div>
            <div class="info-row"><span>Area</span><b>{{ result.location?.area }}</b></div>
          </div>
          <div v-else-if="result.type === 'operator'" class="info-list">
            <div class="info-row"><span>Tipe</span><b>Operator</b></div>
            <div class="info-row"><span>Nama</span><b>{{ result.operator?.user?.fullName }}</b></div>
            <div class="info-row"><span>ID Karyawan</span><b>{{ result.operator?.employeeId }}</b></div>
          </div>
          <div class="alert ok" style="margin-top: 12px"><ion-icon :icon="checkmarkCircleOutline" /> Scan berhasil & tercatat.</div>
        </template>

        <div class="manual">
          <label class="muted">Input manual — tempel isi QR (JSON)</label>
          <textarea v-model.trim="manual" rows="2" placeholder='{"locationCode":"QR-BAN", ...}'></textarea>
          <button class="btn-ghost" @click="submitManual" :disabled="!manual">Proses Manual</button>
        </div>
      </div>
    </div>
  </page-shell>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { scanOutline, stopCircleOutline, alertCircleOutline, checkmarkCircleOutline, qrCodeOutline } from 'ionicons/icons';
import { Html5Qrcode } from 'html5-qrcode';
import PageShell from '@/components/PageShell.vue';
import { operatorService } from '@/services/operators.service';

const router = useRouter();

let scanner: Html5Qrcode | null = null;
const scanning = ref(false);
const result = ref<any>(null);
const error = ref('');
const manual = ref('');

const handle = async (text: string) => {
  error.value = '';
  try {
    const { data } = await operatorService.scanQR(text);
    if (data?.success) {
      result.value = data.data;
      const r = data.data;
      // QR area kerja → arahkan operator langsung ke form Ajukan VoO / Ide Kaizen,
      // membawa info lokasi agar form bisa menampilkan & mengisinya otomatis.
      if (r?.type === 'area' && r.location) {
        router.push({
          path: '/voo/submit',
          query: {
            lokasi: r.location.name ?? '',
            area: r.location.area ?? '',
            kode: r.location.code ?? '',
          },
        });
      }
    } else {
      error.value = 'QR tidak dikenali.';
    }
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'QR tidak valid.';
  }
};

const stop = async () => {
  try {
    if (scanner && scanner.isScanning) await scanner.stop();
  } catch {
    /* abaikan */
  }
  try {
    scanner?.clear();
  } catch {
    /* abaikan */
  }
  scanner = null;
  scanning.value = false;
};

const start = async () => {
  error.value = '';

  // Camera (getUserMedia) only works on secure origins. localhost is exempt, but a LAN
  // IP must be served over HTTPS. Give a clear message instead of a silent failure.
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    error.value =
      'Kamera membutuhkan koneksi aman (HTTPS). Buka aplikasi lewat https:// (mis. https://192.168.137.1:5173) dan terima peringatan sertifikat, atau gunakan input manual di bawah.';
    return;
  }

  try {
    scanner = new Html5Qrcode('qr-reader');
    scanning.value = true;
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: 240 },
      async (text: string) => {
        await stop();
        await handle(text);
      },
      () => {
        /* abaikan frame gagal-decode */
      }
    );
  } catch (e: any) {
    scanning.value = false;
    const name = e?.name || '';
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      error.value = 'Izin kamera ditolak. Aktifkan izin kamera untuk situs ini di pengaturan browser, lalu coba lagi.';
    } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      error.value = 'Kamera tidak ditemukan pada perangkat ini. Gunakan input manual di bawah.';
    } else {
      error.value = 'Tidak bisa mengakses kamera. Pastikan memakai HTTPS dan izin kamera aktif, atau gunakan input manual di bawah.';
    }
  }
};

const submitManual = () => handle(manual.value);

onUnmounted(stop);
</script>

<style scoped>
/* ---------- Panggung kamera / placeholder ---------- */
.scan-stage {
  position: relative;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  background:
    radial-gradient(120% 120% at 50% 0%, color-mix(in srgb, var(--db-brand) 8%, transparent), transparent 60%),
    var(--db-icon-bg);
  border: 1px solid var(--db-line);
  min-height: 340px;
  display: grid;
  place-items: center;
}
.qr-reader {
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
}
.qr-reader.active { min-height: 340px; }
.qr-reader :deep(video) { border-radius: 16px; object-fit: cover; }

/* ---------- Placeholder ---------- */
.scan-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 28px 22px;
  gap: 6px;
}
.scan-frame {
  position: relative;
  width: 132px;
  height: 132px;
  display: grid;
  place-items: center;
  margin-bottom: 18px;
}
.scan-frame .corner {
  position: absolute;
  width: 26px;
  height: 26px;
  border: 3px solid var(--db-brand);
}
.scan-frame .tl { top: 0; left: 0; border-right: none; border-bottom: none; border-radius: 8px 0 0 0; }
.scan-frame .tr { top: 0; right: 0; border-left: none; border-bottom: none; border-radius: 0 8px 0 0; }
.scan-frame .bl { bottom: 0; left: 0; border-right: none; border-top: none; border-radius: 0 0 0 8px; }
.scan-frame .br { bottom: 0; right: 0; border-left: none; border-top: none; border-radius: 0 0 8px 0; }
.scan-icon {
  width: 72px;
  height: 72px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--db-brand) 14%, transparent);
  color: var(--db-brand);
  font-size: 38px;
}
.ph-title { font-size: 16px; font-weight: 700; color: var(--db-ink); }
.ph-sub {
  font-size: 13px;
  color: var(--db-ink-2);
  max-width: 360px;
  line-height: 1.5;
  margin-top: 2px;
}
.ph-tips {
  list-style: none;
  margin: 16px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
  text-align: left;
}
.ph-tips li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--db-ink-2);
}
.ph-tips li ion-icon { font-size: 16px; color: var(--db-green); flex-shrink: 0; }

/* ---------- Garis pemindai animatif ---------- */
.scan-line {
  position: absolute;
  left: 8%;
  right: 8%;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, transparent, var(--db-brand), transparent);
  box-shadow: 0 0 12px 2px color-mix(in srgb, var(--db-brand) 60%, transparent);
  animation: scan-sweep 2.4s ease-in-out infinite;
  pointer-events: none;
}
@keyframes scan-sweep {
  0%   { top: 12%; opacity: 0.2; }
  50%  { top: 88%; opacity: 1; }
  100% { top: 12%; opacity: 0.2; }
}
@media (prefers-reduced-motion: reduce) {
  .scan-line { animation: none; top: 50%; }
}

.manual { margin-top: 18px; display: flex; flex-direction: column; gap: 8px; border-top: 1px solid var(--db-line); padding-top: 16px; }
.manual textarea {
  width: 100%; border: 1px solid var(--db-line-2); border-radius: 10px; padding: 10px 12px;
  font: inherit; font-size: 12.5px; background: var(--db-card); color: var(--db-ink); resize: vertical;
}
.manual textarea:focus { outline: none; border-color: var(--db-brand); }
.manual .btn-ghost { align-self: flex-start; }
</style>
