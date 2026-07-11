<template>
  <page-shell title="Dashboard" :subtitle="op ? `${op.employeeId} · ${op.section}` : 'Ringkasan kinerja & aktivitas Anda'">
    <template #actions>
      <button class="btn-primary" @click="go('/scan')">
        <ion-icon :icon="qrCodeOutline" /> Scan QR
      </button>
    </template>

    <div v-if="loading" class="loading"><ion-spinner name="crescent" /> Memuat data kinerja…</div>

    <template v-else>
      <div v-if="error" class="alert err"><ion-icon :icon="alertCircleOutline" /> {{ error }}</div>

    <template v-if="op">
      <div class="grid g-bottom">
        <div class="card">
          <div class="muted">Skor Kinerja</div>
          <div class="score">{{ op.performanceScore }}</div>
          <div class="muted">indeks akumulatif</div>
          <div class="mini-grid">
            <div class="stat-mini"><div class="s-val up">{{ fmtNum(op.totalMerit) }}</div><div class="s-lbl">VoO disetujui</div></div>
            <div class="stat-mini"><div class="s-val down">{{ fmtNum(op.totalMisconduct) }}</div><div class="s-lbl">Pelanggaran</div></div>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Identitas</h3></div>
          <div class="info-list">
            <div class="info-row"><span>ID Karyawan</span><b>{{ op.employeeId }}</b></div>
            <div class="info-row"><span>Section</span><b>{{ op.section }}</b></div>
            <div class="info-row"><span>Group</span><b>{{ op.group }}</b></div>
            <div class="info-row"><span>Posisi</span><b>{{ op.position }}</b></div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Pelanggaran Saya</h3><span class="muted">{{ misconducts.length }}</span></div>
        <div v-if="misconducts.length === 0" class="empty">Tidak ada pelanggaran tercatat. Pertahankan!</div>
        <div class="table-wrap" v-else>
          <table>
            <thead><tr><th>Jenis</th><th>Tingkat</th><th>Status Konseling</th><th>Tanggal</th><th class="ta-r">Aksi</th></tr></thead>
            <tbody>
              <tr v-for="m in misconducts" :key="m.id">
                <td>{{ m.type }}</td>
                <td><span class="status" :class="severityMeta(m.severity).cls">{{ severityMeta(m.severity).label }}</span></td>
                <td>
                  <span v-if="m.counseling" class="fu-badge done"><ion-icon :icon="checkmarkCircleOutline" /> Sudah dikonseling</span>
                  <span v-else class="fu-badge pending"><ion-icon :icon="timeOutline" /> Menunggu konseling</span>
                </td>
                <td class="muted">{{ fmtDateShort(m.createdAt) }}</td>
                <td class="ta-r">
                  <button class="ico-btn" title="Lihat / Cetak lembar pelanggaran & kesediaan konseling" @click="sheet = m">
                    <ion-icon :icon="documentTextOutline" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Pengajuan VoO Terbaru</h3><button class="pill" @click="go('/voo/my')">Lihat Semua</button></div>
        <div v-if="recent.length === 0" class="empty">Belum ada pengajuan VoO / Ide Kaizen.</div>
        <div class="table-wrap" v-else>
          <table>
            <thead><tr><th>Judul</th><th>Tipe</th><th>Status</th><th class="amt">Poin</th></tr></thead>
            <tbody>
              <tr v-for="v in recent" :key="v.id">
                <td>{{ v.title }}</td>
                <td class="muted">{{ vooTypeLabel(v.type) }}</td>
                <td><span class="status" :class="vooStatusMeta(v.status).cls">{{ vooStatusMeta(v.status).label }}</span></td>
                <td class="amt" :class="v.points > 0 ? 'pos' : ''">{{ v.points > 0 ? '+' + v.points : '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

      <div v-else-if="!error" class="card"><div class="empty">Data kinerja belum tersedia.</div></div>
    </template>

    <misconduct-sheet v-if="sheet" :m="sheet" @close="sheet = null" />
  </page-shell>
</template>

<script setup lang="ts">
import { IonSpinner, IonIcon } from '@ionic/vue';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { documentTextOutline, checkmarkCircleOutline, timeOutline, qrCodeOutline, alertCircleOutline } from 'ionicons/icons';
import PageShell from '@/components/PageShell.vue';
import MisconductSheet from '@/components/MisconductSheet.vue';
import { operatorService } from '@/services/operators.service';
import { vooService } from '@/services/voo.service';
import { recordsService } from '@/services/records.service';
import { useRealtime } from '@/composables/useRealtime';
import { fmtNum, fmtDateShort, vooTypeLabel, vooStatusMeta, severityMeta } from '@/utils/format';
import type { OperatorListItem, VooSubmission, MisconductItem } from '@/types';

const router = useRouter();
const go = (p: string) => router.push(p);
const op = ref<OperatorListItem | null>(null);
const recent = ref<VooSubmission[]>([]);
const misconducts = ref<MisconductItem[]>([]);
const sheet = ref<MisconductItem | null>(null);
const loading = ref(true);
const error = ref('');

const load = async () => {
  error.value = '';
  // Muat tiap bagian secara independen: kegagalan salah satu panggilan tidak boleh
  // mengosongkan seluruh dashboard. Profil adalah bagian utama; VoO & pelanggaran
  // bersifat pelengkap (best-effort).
  const [p, v, m] = await Promise.allSettled([
    operatorService.myProfile(),
    vooService.getMy(),
    recordsService.listMyMisconduct(),
  ]);

  if (p.status === 'fulfilled' && p.value.data?.success) {
    op.value = p.value.data.data;
  } else if (p.status === 'rejected') {
    error.value = p.reason?.response?.data?.message || 'Gagal memuat profil operator.';
  }

  if (v.status === 'fulfilled' && v.value.data?.success) {
    recent.value = (v.value.data.data as VooSubmission[]).slice(0, 5);
  }
  if (m.status === 'fulfilled' && m.value.data?.success) {
    misconducts.value = m.value.data.data;
  }

  loading.value = false;
};

onMounted(load);
useRealtime(['voo:changed', 'record:changed'], load);
</script>

<style scoped>
.score { font-size: 52px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; margin: 2px 0; }
.mini-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 16px; }
.s-val.up { color: var(--db-green); }
.s-val.down { color: var(--db-red); }
.ta-r { text-align: right; }
.ico-btn { width: 32px; height: 32px; border-radius: 8px; display: inline-grid; place-items: center; color: var(--db-ink-2); font-size: 17px; background: transparent; border: none; cursor: pointer; }
.ico-btn:hover { background: var(--db-icon-bg); color: var(--db-ink); }
.fu-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; white-space: nowrap; }
.fu-badge ion-icon { font-size: 14px; }
.fu-badge.done { background: #dcfce7; color: #166534; }
.fu-badge.pending { background: #fef3c7; color: #92400e; }
</style>
