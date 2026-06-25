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
import type { OperatorDetail } from '@/types';

const route = useRoute();
const router = useRouter();
const op = ref<OperatorDetail | null>(null);
const loading = ref(true);
const error = ref('');
const back = () => router.back();

onMounted(async () => {
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
});
</script>

<style scoped>
.val.up { color: var(--db-green); }
.val.down { color: var(--db-red); }
</style>
