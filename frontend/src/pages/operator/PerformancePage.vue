<template>
  <page-shell title="Kinerja Saya" :subtitle="op ? `${op.employeeId} · ${op.section}` : 'Ringkasan performa Anda'">
    <div v-if="loading" class="loading"><ion-spinner name="crescent" /> Memuat data kinerja…</div>
    <div v-else-if="error" class="card"><div class="empty">{{ error }}</div></div>

    <template v-else-if="op">
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
            <div class="info-row"><span>Line</span><b>{{ op.line }}</b></div>
            <div class="info-row"><span>Group</span><b>{{ op.group }}</b></div>
            <div class="info-row"><span>Posisi</span><b>{{ op.position }}</b></div>
          </div>
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
  </page-shell>
</template>

<script setup lang="ts">
import { IonSpinner } from '@ionic/vue';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import PageShell from '@/components/PageShell.vue';
import { operatorService } from '@/services/operators.service';
import { vooService } from '@/services/voo.service';
import { fmtNum, vooTypeLabel, vooStatusMeta } from '@/utils/format';
import type { OperatorListItem, VooSubmission } from '@/types';

const router = useRouter();
const go = (p: string) => router.push(p);
const op = ref<OperatorListItem | null>(null);
const recent = ref<VooSubmission[]>([]);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    const [p, v] = await Promise.all([operatorService.myProfile(), vooService.getMy()]);
    if (p.data?.success) op.value = p.data.data;
    if (v.data?.success) recent.value = (v.data.data as VooSubmission[]).slice(0, 5);
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal memuat data kinerja.';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.score { font-size: 52px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; margin: 2px 0; }
.mini-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 16px; }
.s-val.up { color: var(--db-green); }
.s-val.down { color: var(--db-red); }
</style>
