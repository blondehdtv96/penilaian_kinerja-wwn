<template>
  <page-shell title="Scan Area QR" subtitle="Pindai QR area kerja atau identitas operator">
    <div class="grid g-bottom">
      <div class="card">
        <div id="qr-reader" class="qr-reader"></div>
        <div class="form-actions" style="margin-top: 14px">
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
import { scanOutline, stopCircleOutline, alertCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { Html5Qrcode } from 'html5-qrcode';
import PageShell from '@/components/PageShell.vue';
import { operatorService } from '@/services/operators.service';

let scanner: Html5Qrcode | null = null;
const scanning = ref(false);
const result = ref<any>(null);
const error = ref('');
const manual = ref('');

const handle = async (text: string) => {
  error.value = '';
  try {
    const { data } = await operatorService.scanQR(text);
    if (data?.success) result.value = data.data;
    else error.value = 'QR tidak dikenali.';
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
  } catch {
    scanning.value = false;
    error.value = 'Tidak bisa mengakses kamera. Gunakan input manual di bawah.';
  }
};

const submitManual = () => handle(manual.value);

onUnmounted(stop);
</script>

<style scoped>
.qr-reader {
  width: 100%;
  min-height: 240px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--db-icon-bg);
  border: 1px solid var(--db-line);
}
.manual { margin-top: 18px; display: flex; flex-direction: column; gap: 8px; border-top: 1px solid var(--db-line); padding-top: 16px; }
.manual textarea {
  width: 100%; border: 1px solid var(--db-line-2); border-radius: 10px; padding: 10px 12px;
  font: inherit; font-size: 12.5px; background: var(--db-card); color: var(--db-ink); resize: vertical;
}
.manual textarea:focus { outline: none; border-color: var(--db-brand); }
.manual .btn-ghost { align-self: flex-start; }
</style>
