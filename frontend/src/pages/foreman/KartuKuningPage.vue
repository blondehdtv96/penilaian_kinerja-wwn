<template>
  <page-shell title="Kartu Kuning" subtitle="Terbitkan kartu kuning (peringatan) untuk operator">
    <div class="grid g-entry">
      <div class="card">
        <div class="card-head"><h3>Terbitkan Kartu Kuning</h3></div>
        <div class="alert ok" v-if="okMsg"><ion-icon :icon="checkmarkCircleOutline" /> {{ okMsg }}</div>
        <div class="alert err" v-if="error"><ion-icon :icon="alertCircleOutline" /> {{ error }}</div>
        <form class="form-grid" @submit.prevent="submit">
          <div class="field"><label>Operator</label><operator-select v-model="operatorId" /></div>
          <div class="field"><label>Alasan</label><textarea v-model.trim="reason" rows="4" placeholder="Alasan penerbitan kartu kuning…" required></textarea></div>
          <div class="form-actions">
            <button class="btn-primary" :disabled="submitting || !operatorId || !reason">
              <ion-icon :icon="saveOutline" /> {{ submitting ? 'Menyimpan…' : 'Terbitkan' }}
            </button>
          </div>
        </form>
      </div>

      <div class="card">
        <div class="card-head"><h3>Kartu Kuning Terbaru</h3><span class="muted">{{ items.length }}</span></div>
        <div v-if="items.length === 0" class="empty">Belum ada kartu kuning diterbitkan.</div>
        <div class="table-wrap" v-else>
          <table>
            <thead><tr><th>Operator</th><th>Alasan</th><th>Tanggal</th></tr></thead>
            <tbody>
              <tr v-for="k in items" :key="k.id">
                <td><div class="who"><div class="t-ava">{{ initials(k.operator?.user?.fullName) }}</div>{{ k.operator?.user?.fullName }}</div></td>
                <td class="cell-wrap">{{ k.reason }}</td>
                <td class="muted">{{ fmtDateShort(k.issuedAt) }}</td>
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
import type { KartuKuningItem } from '@/types';

const operatorId = ref<number | null>(null);
const reason = ref('');
const submitting = ref(false);
const error = ref('');
const okMsg = ref('');
const items = ref<KartuKuningItem[]>([]);

const load = async () => {
  try {
    const { data } = await recordsService.listKartuKuning();
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
    const { data } = await recordsService.createKartuKuning({ operatorId: operatorId.value, reason: reason.value });
    if (data?.success) {
      okMsg.value = 'Kartu kuning diterbitkan.';
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
.cell-wrap { max-width: 320px; }
</style>
