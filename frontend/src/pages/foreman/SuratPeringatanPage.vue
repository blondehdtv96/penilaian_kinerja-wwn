<template>
  <page-shell title="Surat Peringatan" subtitle="Terbitkan Surat Peringatan (SP) bertingkat untuk operator">
    <div class="grid g-entry">
      <div class="card">
        <div class="card-head"><h3>Terbitkan Surat Peringatan</h3></div>
        <div class="alert ok" v-if="okMsg"><ion-icon :icon="checkmarkCircleOutline" /> {{ okMsg }}</div>
        <div class="alert err" v-if="error"><ion-icon :icon="alertCircleOutline" /> {{ error }}</div>
        <form class="form-grid" @submit.prevent="submit">
          <div class="field"><label>Operator</label><operator-select v-model="operatorId" /></div>
          <div class="field">
            <label>Tingkat SP</label>
            <div class="seg-tabs">
              <button type="button" :class="{ on: level === 1 }" @click="level = 1">SP 1</button>
              <button type="button" :class="{ on: level === 2 }" @click="level = 2">SP 2</button>
              <button type="button" :class="{ on: level === 3 }" @click="level = 3">SP 3</button>
            </div>
          </div>
          <div class="field"><label>Alasan</label><textarea v-model.trim="reason" rows="4" placeholder="Alasan penerbitan surat peringatan…" required></textarea></div>
          <div class="form-actions">
            <button class="btn-primary" :disabled="submitting || !operatorId || !reason">
              <ion-icon :icon="saveOutline" /> {{ submitting ? 'Menyimpan…' : 'Terbitkan' }}
            </button>
          </div>
        </form>
      </div>

      <div class="card">
        <div class="card-head"><h3>Surat Peringatan Terbaru</h3><span class="muted">{{ items.length }}</span></div>
        <div v-if="items.length === 0" class="empty">Belum ada surat peringatan diterbitkan.</div>
        <div class="table-wrap" v-else>
          <table>
            <thead><tr><th>Operator</th><th>Tingkat</th><th>Alasan</th><th>Tanggal</th></tr></thead>
            <tbody>
              <tr v-for="s in items" :key="s.id">
                <td><div class="who"><div class="t-ava">{{ initials(s.operator?.user?.fullName) }}</div>{{ s.operator?.user?.fullName }}</div></td>
                <td><span class="status" :class="s.level >= 3 ? 'critical' : s.level === 2 ? 'high' : 'medium'">SP {{ s.level }}</span></td>
                <td class="cell-wrap">{{ s.reason }}</td>
                <td class="muted">{{ fmtDateShort(s.issuedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </page-shell>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { onMounted, ref } from 'vue';
import { checkmarkCircleOutline, alertCircleOutline, saveOutline } from 'ionicons/icons';
import PageShell from '@/components/PageShell.vue';
import OperatorSelect from '@/components/OperatorSelect.vue';
import { recordsService } from '@/services/records.service';
import { useRealtime } from '@/composables/useRealtime';
import { initials, fmtDateShort } from '@/utils/format';
import type { SuratPeringatanItem } from '@/types';

const operatorId = ref<number | null>(null);
const level = ref<number>(1);
const reason = ref('');
const submitting = ref(false);
const error = ref('');
const okMsg = ref('');
const items = ref<SuratPeringatanItem[]>([]);

const load = async () => {
  try {
    const { data } = await recordsService.listSuratPeringatan();
    if (data?.success) items.value = data.data;
  } catch {
    /* abaikan */
  }
};

const submit = async () => {
  if (!operatorId.value) return;
  submitting.value = true;
  error.value = '';
  okMsg.value = '';
  try {
    const { data } = await recordsService.createSuratPeringatan({ operatorId: operatorId.value, level: level.value, reason: reason.value });
    if (data?.success) {
      okMsg.value = `Surat Peringatan SP ${level.value} diterbitkan.`;
      reason.value = '';
      await load();
    } else error.value = 'Gagal menyimpan.';
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal menyimpan.';
  } finally {
    submitting.value = false;
  }
};

onMounted(load);
useRealtime('record:changed', load);
</script>

<style scoped>
.cell-wrap { max-width: 300px; }
</style>
