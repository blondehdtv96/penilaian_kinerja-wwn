<template>
  <page-shell title="Log Audit" subtitle="Jejak aktivitas append-only seluruh sistem">
    <template #actions>
      <select class="filter-sel" v-model="moduleSel" @change="load">
        <option value="">Semua Modul</option>
        <option v-for="m in modules" :key="m.v" :value="m.v">{{ m.l }}</option>
      </select>
      <month-year-filter v-model="period" @update:modelValue="load" />
    </template>

    <div class="card">
      <div v-if="loading" class="loading"><ion-spinner name="crescent" /> Memuat…</div>
      <div v-else-if="error" class="empty">{{ error }}</div>
      <div v-else-if="items.length === 0" class="empty">Belum ada aktivitas tercatat untuk filter ini.</div>
      <div class="table-wrap" v-else>
        <table>
          <thead><tr><th>Waktu</th><th>Pengguna</th><th>Aksi</th><th>Modul</th><th>Detail</th></tr></thead>
          <tbody>
            <tr v-for="l in items" :key="l.id">
              <td class="muted">{{ fmtDate(l.createdAt) }}</td>
              <td><div class="who"><div class="t-ava">{{ initials(l.user?.fullName) }}</div>{{ l.user?.fullName || '—' }}</div></td>
              <td><span class="status" :class="actionCls(l.action)">{{ l.action }}</span></td>
              <td class="muted">{{ l.module }}</td>
              <td class="muted detail">{{ l.details }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </page-shell>
</template>

<script setup lang="ts">
import { IonSpinner } from '@ionic/vue';
import { onMounted, ref } from 'vue';
import PageShell from '@/components/PageShell.vue';
import MonthYearFilter, { type MonthYearValue } from '@/components/MonthYearFilter.vue';
import { auditService } from '@/services/audit.service';
import { fmtDate, initials } from '@/utils/format';
import type { AuditLogItem } from '@/types';

const items = ref<AuditLogItem[]>([]);
const loading = ref(true);
const error = ref('');
const moduleSel = ref('');
const period = ref<MonthYearValue>({ month: null, year: null });

const modules = [
  { v: 'voo', l: 'VoO' },
  { v: 'records', l: 'Records' },
  { v: 'auth', l: 'Autentikasi' },
  { v: 'operators', l: 'Operator' },
  { v: 'users', l: 'User' },
  { v: 'roles', l: 'Role' },
];

const actionCls = (a: string) => {
  if (a === 'POST') return 'final';
  if (a === 'DELETE') return 'rejected';
  if (a === 'PUT' || a === 'PATCH') return 'foreman';
  return 'pending';
};

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await auditService.logs({
      ...(moduleSel.value ? { module: moduleSel.value } : {}),
      ...(period.value.month ? { month: period.value.month } : {}),
      ...(period.value.year ? { year: period.value.year } : {}),
    });
    if (data?.success) items.value = data.data;
    else error.value = 'Gagal memuat log.';
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal memuat log audit.';
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>

<style scoped>
.detail { max-width: 360px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
