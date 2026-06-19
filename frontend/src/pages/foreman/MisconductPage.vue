<template>
  <page-shell title="Input Pelanggaran" subtitle="Catat pelanggaran (misconduct) operator">
    <div class="grid g-entry">
      <div class="card">
        <div class="card-head"><h3>Form Pelanggaran</h3></div>
        <div class="alert ok" v-if="okMsg"><ion-icon :icon="checkmarkCircleOutline" /> {{ okMsg }}</div>
        <div class="alert err" v-if="error"><ion-icon :icon="alertCircleOutline" /> {{ error }}</div>
        <form class="form-grid" @submit.prevent="submit">
          <div class="field"><label>Operator</label><operator-select v-model="operatorId" /></div>
          <div class="field">
            <label>Jenis Pelanggaran</label>
            <select v-model="ptype">
              <option v-for="t in types" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="field">
            <label>Tingkat Keparahan</label>
            <select v-model="severity">
              <option value="low">Rendah</option>
              <option value="medium">Sedang</option>
              <option value="high">Tinggi</option>
              <option value="critical">Kritis</option>
            </select>
          </div>
          <div class="field"><label>Deskripsi</label><textarea v-model.trim="description" rows="4" required></textarea></div>
          <div class="field"><label>Poin Penalti <span class="hint">(opsional)</span></label><input type="number" v-model.number="points" min="0" /></div>
          <div class="form-actions">
            <button class="btn-primary" :disabled="submitting || !operatorId || !description">
              <ion-icon :icon="saveOutline" /> {{ submitting ? 'Menyimpan…' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>

      <div class="card">
        <div class="card-head"><h3>Pelanggaran Terbaru</h3><span class="muted">{{ items.length }}</span></div>
        <div v-if="items.length === 0" class="empty">Belum ada pelanggaran tercatat.</div>
        <div class="table-wrap" v-else>
          <table>
            <thead><tr><th>Operator</th><th>Jenis</th><th>Keparahan</th><th>Tanggal</th></tr></thead>
            <tbody>
              <tr v-for="m in items" :key="m.id">
                <td><div class="who"><div class="t-ava">{{ initials(m.operator?.user?.fullName) }}</div>{{ m.operator?.user?.fullName }}</div></td>
                <td>{{ m.type }}</td>
                <td><span class="status" :class="severityMeta(m.severity).cls">{{ severityMeta(m.severity).label }}</span></td>
                <td class="muted">{{ fmtDateShort(m.createdAt) }}</td>
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
import { initials, fmtDateShort, severityMeta } from '@/utils/format';
import type { MisconductItem } from '@/types';

const types = ['Keterlambatan', 'Pelanggaran Keselamatan', 'Pelanggaran Mutu', 'Pelanggaran Prosedur', 'Ketidakhadiran', 'Lainnya'];
const operatorId = ref<number | null>(null);
const ptype = ref(types[0]);
const severity = ref('low');
const description = ref('');
const points = ref<number>(0);
const submitting = ref(false);
const error = ref('');
const okMsg = ref('');
const items = ref<MisconductItem[]>([]);

const load = async () => {
  try {
    const { data } = await recordsService.listMisconduct();
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
    const { data } = await recordsService.createMisconduct({
      operatorId: operatorId.value,
      type: ptype.value,
      severity: severity.value,
      description: description.value,
      points: points.value || 0,
    });
    if (data?.success) {
      okMsg.value = 'Pelanggaran tercatat & ter-hash on-chain.';
      description.value = '';
      points.value = 0;
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
