<template>
  <page-shell title="Monitor Operator" subtitle="Daftar & kinerja seluruh operator">
    <div class="card">
      <div class="toolbar">
        <div class="search-box grow">
          <ion-icon :icon="searchOutline" />
          <input v-model.trim="q" placeholder="Cari nama, ID karyawan, atau section…" />
        </div>
        <span class="muted">{{ filtered.length }} operator</span>
      </div>

      <div v-if="loading" class="loading"><ion-spinner name="crescent" /> Memuat…</div>
      <div v-else-if="error" class="empty">{{ error }}</div>
      <div v-else-if="filtered.length === 0" class="empty">Tidak ada operator yang cocok.</div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>Operator</th><th>Section / Group</th><th class="amt">Skor</th><th class="amt">VoO</th><th class="amt">Pelanggaran</th></tr>
          </thead>
          <tbody>
            <tr v-for="(o, i) in filtered" :key="o.id" class="row-link" @click="go(`/operators/${o.id}`)">
              <td class="rank-no">{{ i + 1 }}</td>
              <td>
                <div class="who">
                  <div class="t-ava">{{ initials(o.user.fullName) }}</div>
                  <div><div class="nm">{{ o.user.fullName }}</div><div class="muted">{{ o.employeeId }}</div></div>
                </div>
              </td>
              <td class="muted">{{ o.section }} · {{ o.group }}</td>
              <td class="amt">{{ o.performanceScore }}</td>
              <td class="amt pos">{{ o.totalMerit }}</td>
              <td class="amt neg">{{ o.totalMisconduct }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </page-shell>
</template>

<script setup lang="ts">
import { IonIcon, IonSpinner } from '@ionic/vue';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { searchOutline } from 'ionicons/icons';
import PageShell from '@/components/PageShell.vue';
import { operatorService } from '@/services/operators.service';
import { useRealtime } from '@/composables/useRealtime';
import { initials } from '@/utils/format';
import type { OperatorListItem } from '@/types';

const router = useRouter();
const go = (p: string) => router.push(p);
const items = ref<OperatorListItem[]>([]);
const loading = ref(true);
const error = ref('');
const q = ref('');

const filtered = computed(() => {
  const term = q.value.toLowerCase();
  if (!term) return items.value;
  return items.value.filter(
    (o) =>
      o.user.fullName.toLowerCase().includes(term) ||
      o.employeeId.toLowerCase().includes(term) ||
      o.section.toLowerCase().includes(term)
  );
});

const load = async () => {
  try {
    const { data } = await operatorService.getAll();
    if (data?.success) items.value = data.data;
    else error.value = 'Gagal memuat operator.';
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
.search-box {
  display: flex; align-items: center; gap: 9px; max-width: 420px;
  background: var(--db-icon-bg); border: 1px solid var(--db-line); border-radius: 11px;
  padding: 0 13px; color: var(--db-ink-3);
}
.search-box ion-icon { font-size: 17px; }
.search-box input { flex: 1; border: none; background: transparent; outline: none; font: inherit; color: var(--db-ink); padding: 9px 0; }
.row-link { cursor: pointer; }
.row-link:hover { background: var(--db-icon-bg); }
.nm { font-weight: 500; }
</style>
