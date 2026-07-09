<template>
  <page-shell title="Input Pelanggaran" subtitle="Catat pelanggaran (misconduct) operator">
    <div class="grid g-entry">
      <div class="card">
        <div class="card-head"><h3>Form Pelanggaran</h3></div>
        <div class="alert ok" v-if="okMsg"><ion-icon :icon="checkmarkCircleOutline" /> {{ okMsg }}</div>
        <div class="alert err" v-if="error"><ion-icon :icon="alertCircleOutline" /> {{ error }}</div>
        <form class="form-grid" @submit.prevent="submit">
          <div class="field">
            <label>Operator</label>
            <operator-select v-model="operatorId" />
            <p class="hint-line" v-if="selectedOperator">
              <ion-icon :icon="informationCircleOutline" />
              Poin akumulasi saat ini: <b>{{ selectedOperator.accumulatedPoints ?? 0 }}</b>
            </p>
          </div>
          <div class="field">
            <label>Jenis Pelanggaran</label>
            <select v-model.number="violationTypeId" required>
              <option :value="null" disabled>
                {{ loadingTypes ? 'Memuat katalog…' : (violationTypes.length ? 'Pilih jenis pelanggaran…' : 'Katalog pelanggaran belum tersedia') }}
              </option>
              <option v-for="t in violationTypes" :key="t.id" :value="t.id">
                {{ t.name }} — {{ t.points }} poin ({{ t.severity }})
              </option>
            </select>
            <p class="hint-line" v-if="violationTypes.length === 0 && !loadingTypes">
              <ion-icon :icon="informationCircleOutline" />
              Belum ada jenis pelanggaran di katalog. Minta Section Manager menambahkannya.
            </p>
            <p class="hint-line" v-else-if="selectedType">
              <ion-icon :icon="informationCircleOutline" />
              Kategori: {{ selectedType.category }} · Poin akan ditambahkan: <b>{{ selectedType.points }}</b>
            </p>
          </div>
          <div class="field"><label>Deskripsi</label><textarea v-model.trim="description" rows="4" required></textarea></div>
          <div class="form-actions">
            <button class="btn-primary" :disabled="submitting || !operatorId || !violationTypeId || !description">
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
            <thead><tr><th>Operator</th><th>Jenis</th><th>Poin</th><th>Keparahan</th><th>Status Tindak Lanjut</th><th>Tanggal</th></tr></thead>
            <tbody>
              <tr v-for="m in items" :key="m.id">
                <td><div class="who"><div class="t-ava">{{ initials(m.operator?.user?.fullName) }}</div>{{ m.operator?.user?.fullName }}</div></td>
                <td>{{ m.type }}</td>
                <td class="muted">{{ m.points }}</td>
                <td><span class="status" :class="severityMeta(m.severity).cls">{{ severityMeta(m.severity).label }}</span></td>
                <td>
                  <span v-if="m.counseling" class="fu-badge done"><ion-icon :icon="checkmarkCircleOutline" /> Sudah dikonseling</span>
                  <span v-else class="fu-badge pending"><ion-icon :icon="timeOutline" /> Belum dikonseling</span>
                </td>
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
import { computed, onMounted, ref } from 'vue';
import { checkmarkCircleOutline, alertCircleOutline, saveOutline, timeOutline, informationCircleOutline } from 'ionicons/icons';
import PageShell from '@/components/PageShell.vue';
import OperatorSelect from '@/components/OperatorSelect.vue';
import { recordsService } from '@/services/records.service';
import { operatorService } from '@/services/operators.service';
import { useRealtime } from '@/composables/useRealtime';
import { initials, fmtDateShort, severityMeta } from '@/utils/format';
import type { MisconductItem, OperatorListItem, ViolationTypeItem } from '@/types';

const operators = ref<OperatorListItem[]>([]);
const violationTypes = ref<ViolationTypeItem[]>([]);
const loadingTypes = ref(true);
const operatorId = ref<number | null>(null);
const violationTypeId = ref<number | null>(null);
const description = ref('');
const submitting = ref(false);
const error = ref('');
const okMsg = ref('');
const items = ref<MisconductItem[]>([]);

const selectedOperator = computed(() => operators.value.find((o) => o.id === operatorId.value) || null);
const selectedType = computed(() => violationTypes.value.find((t) => t.id === violationTypeId.value) || null);

const loadOperators = async () => {
  try {
    const { data } = await operatorService.getAll();
    if (data?.success) operators.value = data.data;
  } catch {
    /* abaikan */
  }
};

const loadViolationTypes = async () => {
  loadingTypes.value = true;
  try {
    const { data } = await recordsService.listViolationTypes();
    if (data?.success) violationTypes.value = data.data;
  } catch {
    /* abaikan */
  } finally {
    loadingTypes.value = false;
  }
};

const load = async () => {
  try {
    const { data } = await recordsService.listMisconduct();
    if (data?.success) items.value = data.data;
  } catch {
    /* abaikan */
  }
};

const submit = async () => {
  if (!operatorId.value || !violationTypeId.value) return;
  submitting.value = true;
  error.value = '';
  okMsg.value = '';
  try {
    const { data } = await recordsService.createMisconduct({
      operatorId: operatorId.value,
      violationTypeId: violationTypeId.value,
      description: description.value,
    });
    if (data?.success) {
      okMsg.value = 'Pelanggaran tercatat, poin akumulasi operator diperbarui & ter-hash on-chain.';
      description.value = '';
      violationTypeId.value = null;
      await Promise.all([load(), loadOperators()]);
    } else error.value = 'Gagal menyimpan.';
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal menyimpan.';
  } finally {
    submitting.value = false;
  }
};

onMounted(() => { loadOperators(); loadViolationTypes(); load(); });
useRealtime('record:changed', () => { load(); loadOperators(); });
</script>

<style scoped>
.fu-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.fu-badge ion-icon { font-size: 14px; }
.fu-badge.done { background: #dcfce7; color: #166534; }
.fu-badge.pending { background: #fef3c7; color: #92400e; }
.hint-line { display: flex; align-items: center; gap: 6px; margin: 6px 0 0; font-size: 12px; color: var(--db-ink-3); }
.hint-line ion-icon { font-size: 15px; flex-shrink: 0; }
</style>
