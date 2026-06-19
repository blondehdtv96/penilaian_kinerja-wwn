<template>
  <page-shell title="Input Konseling" subtitle="Catat sesi konseling / pembinaan operator">
    <div class="grid g-entry">
      <div class="card">
        <div class="card-head"><h3>Form Konseling</h3></div>
        <div class="alert ok" v-if="okMsg"><ion-icon :icon="checkmarkCircleOutline" /> {{ okMsg }}</div>
        <div class="alert err" v-if="error"><ion-icon :icon="alertCircleOutline" /> {{ error }}</div>
        <form class="form-grid" @submit.prevent="submit">
          <div class="field"><label>Operator</label><operator-select v-model="operatorId" /></div>
          <div class="field"><label>Topik</label><input v-model.trim="topic" placeholder="mis. Kedisiplinan jam kerja" required /></div>
          <div class="field"><label>Catatan</label><textarea v-model.trim="notes" rows="4" placeholder="Ringkasan sesi konseling…"></textarea></div>
          <div class="form-actions">
            <button class="btn-primary" :disabled="submitting || !operatorId || !topic">
              <ion-icon :icon="saveOutline" /> {{ submitting ? 'Menyimpan…' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>

      <div class="card">
        <div class="card-head"><h3>Konseling Terbaru</h3><span class="muted">{{ items.length }}</span></div>
        <div v-if="items.length === 0" class="empty">Belum ada catatan konseling.</div>
        <div class="table-wrap" v-else>
          <table>
            <thead><tr><th>Operator</th><th>Topik</th><th>Tanggal</th></tr></thead>
            <tbody>
              <tr v-for="c in items" :key="c.id">
                <td><div class="who"><div class="t-ava">{{ initials(c.operator?.user?.fullName) }}</div>{{ c.operator?.user?.fullName }}</div></td>
                <td>{{ c.topic }}</td>
                <td class="muted">{{ fmtDateShort(c.date) }}</td>
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
import { initials, fmtDateShort } from '@/utils/format';
import type { CounselingItem } from '@/types';

const operatorId = ref<number | null>(null);
const topic = ref('');
const notes = ref('');
const submitting = ref(false);
const error = ref('');
const okMsg = ref('');
const items = ref<CounselingItem[]>([]);

const load = async () => {
  try {
    const { data } = await recordsService.listCounseling();
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
    const { data } = await recordsService.createCounseling({ operatorId: operatorId.value, topic: topic.value, notes: notes.value });
    if (data?.success) {
      okMsg.value = 'Konseling tercatat.';
      topic.value = '';
      notes.value = '';
      await load();
    } else error.value = 'Gagal menyimpan.';
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal menyimpan.';
  } finally {
    submitting.value = false;
  }
};

onMounted(load);
</script>
