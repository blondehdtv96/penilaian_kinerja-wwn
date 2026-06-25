<template>
  <page-shell
    :title="op?.user?.fullName || 'Detail Operator'"
    :subtitle="op ? `${op.employeeId} · ${op.section} · ${op.position}` : 'Riwayat & kinerja operator'"
  >
    <template #actions>
      <button class="btn-ghost btn-sm" @click="back"><ion-icon :icon="arrowBackOutline" /> Kembali</button>
    </template>

    <div v-if="loading" class="loading"><ion-spinner name="crescent" /> Memuat…</div>
    <div v-else-if="error" class="card"><div class="empty">{{ error }}</div></div>

    <template v-else-if="op">
      <div class="grid g4">
        <div class="card"><div class="muted">Skor Kinerja</div><div class="val">{{ op.performanceScore }}</div></div>
        <div class="card"><div class="muted">VoO Disetujui</div><div class="val up">{{ op.totalMerit }}</div></div>
        <div class="card"><div class="muted">Pelanggaran</div><div class="val down">{{ op.totalMisconduct }}</div></div>
        <div class="card"><div class="muted">Line / Group</div><div class="val sm">{{ op.line }} · {{ op.group }}</div></div>
      </div>

      <div class="grid g-bottom">
        <div class="card">
          <div class="card-head"><h3>Pengajuan VoO / Ide Kaizen</h3></div>
          <div v-if="!op.vooSubmissions?.length" class="empty">Tidak ada pengajuan.</div>
          <div class="mini-list" v-else>
            <div class="mini-row" v-for="v in op.vooSubmissions" :key="v.id">
              <div><div class="mr-ttl">{{ v.title }}</div><div class="muted">{{ vooTypeLabel(v.type) }} · {{ fmtDateShort(v.createdAt) }}</div></div>
              <span class="status" :class="vooStatusMeta(v.status).cls">{{ vooStatusMeta(v.status).label }}</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head"><h3>Pelanggaran</h3></div>
          <div v-if="!op.misconducts?.length" class="empty">Tidak ada pelanggaran.</div>
          <div class="mini-list" v-else>
            <div class="mini-row" v-for="m in op.misconducts" :key="m.id">
              <div><div class="mr-ttl">{{ m.type }}</div><div class="muted">{{ fmtDateShort(m.createdAt) }}</div></div>
              <span class="status" :class="severityMeta(m.severity).cls">{{ severityMeta(m.severity).label }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="grid g3">
        <div class="card">
          <div class="card-head"><h3>Konseling</h3></div>
          <div v-if="!op.counselings?.length" class="empty">—</div>
          <div class="mini-list" v-else>
            <div class="mini-row" v-for="c in op.counselings" :key="c.id">
              <div><div class="mr-ttl">{{ c.topic }}</div><div class="muted">{{ fmtDateShort(c.date) }}</div></div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Kartu Kuning</h3></div>
          <div v-if="!op.kartuKunings?.length" class="empty">—</div>
          <div class="mini-list" v-else>
            <div class="mini-row" v-for="k in op.kartuKunings" :key="k.id">
              <div><div class="mr-ttl cell-wrap">{{ k.reason }}</div><div class="muted">{{ fmtDateShort(k.issuedAt) }}</div></div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Surat Peringatan</h3></div>
          <div v-if="!op.suratPeringatan?.length" class="empty">—</div>
          <div class="mini-list" v-else>
            <div class="mini-row" v-for="s in op.suratPeringatan" :key="s.id">
              <div><div class="mr-ttl cell-wrap">{{ s.reason }}</div><div class="muted">{{ fmtDateShort(s.issuedAt) }}</div></div>
              <span class="status" :class="s.level >= 3 ? 'critical' : s.level === 2 ? 'high' : 'medium'">SP {{ s.level }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </page-shell>
</template>

<script setup lang="ts">
import { IonIcon, IonSpinner } from '@ionic/vue';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { arrowBackOutline } from 'ionicons/icons';
import PageShell from '@/components/PageShell.vue';
import { operatorService } from '@/services/operators.service';
import { useRealtime } from '@/composables/useRealtime';
import { fmtDateShort, vooTypeLabel, vooStatusMeta, severityMeta } from '@/utils/format';
import type { OperatorDetail } from '@/types';

const route = useRoute();
const router = useRouter();
const op = ref<OperatorDetail | null>(null);
const loading = ref(true);
const error = ref('');
const back = () => router.back();

const load = async () => {
  const id = Number(route.params.id);
  try {
    const { data } = await operatorService.getById(id);
    if (data?.success) op.value = data.data;
    else error.value = 'Operator tidak ditemukan.';
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal memuat operator.';
  } finally {
    loading.value = false;
  }
};

onMounted(load);
useRealtime(['voo:changed', 'record:changed'], load);
</script>

<style scoped>
.val.up { color: var(--db-green); }
.val.down { color: var(--db-red); }
.mini-list { display: flex; flex-direction: column; }
.mini-row {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 11px 0; border-top: 1px solid var(--db-line);
}
.mini-row:first-child { border-top: none; }
.mr-ttl { font-size: 13.5px; font-weight: 500; }
.cell-wrap { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
