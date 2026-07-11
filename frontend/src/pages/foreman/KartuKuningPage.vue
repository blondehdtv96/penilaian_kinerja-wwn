<template>
  <page-shell title="Kartu Kuning" subtitle="Terbitkan kartu kuning (peringatan) untuk operator">
    <div class="grid g-entry">
      <div class="card">
        <div class="card-head"><h3>Terbitkan Kartu Kuning</h3></div>
        <div class="alert ok" v-if="okMsg"><ion-icon :icon="checkmarkCircleOutline" /> {{ okMsg }}</div>
        <div class="alert err" v-if="error"><ion-icon :icon="alertCircleOutline" /> {{ error }}</div>
        <form class="form-grid" @submit.prevent="submit">
          <div class="field">
            <label>Operator</label>
            <operator-select v-model="operatorId" />
            <p class="hint-line" :class="{ warn: isBelowThreshold }" v-if="selectedOperator && thresholds">
              <ion-icon :icon="informationCircleOutline" />
              Poin akumulasi: <b>{{ selectedOperator.accumulatedPoints ?? 0 }}</b> (ambang batas Kartu Kuning: {{ thresholds.kartuKuning }})
              <span v-if="isBelowThreshold"> — penerbitan ini akan dicatat sebagai manual override.</span>
            </p>
          </div>
          <div class="field"><label>Alasan</label><textarea v-model.trim="reason" rows="4" placeholder="Alasan penerbitan kartu kuning…" required></textarea></div>
          <div class="form-actions">
            <button class="btn-primary" :disabled="submitting || !operatorId || !reason">
              <ion-icon :icon="saveOutline" /> {{ submitting ? 'Menyimpan…' : 'Terbitkan' }}
            </button>
          </div>
        </form>
      </div>

      <div class="card">
        <div class="card-head">
          <h3>Kartu Kuning Terbaru</h3>
          <div class="head-actions">
            <month-year-filter v-model="period" @update:modelValue="load" />
            <span class="muted">{{ items.length }}</span>
          </div>
        </div>
        <div v-if="items.length === 0" class="empty">Belum ada kartu kuning diterbitkan.</div>
        <div class="table-wrap" v-else>
          <table>
            <thead><tr><th>Operator</th><th>Alasan</th><th>Poin Saat Terbit</th><th></th><th>Tanggal</th></tr></thead>
            <tbody>
              <tr v-for="k in items" :key="k.id">
                <td><div class="who"><div class="t-ava">{{ initials(k.operator?.user?.fullName) }}</div>{{ k.operator?.user?.fullName }}</div></td>
                <td class="cell-wrap">{{ k.reason }}</td>
                <td class="muted">{{ k.accumulatedPointsAtIssuance ?? '-' }}</td>
                <td><span v-if="k.isManualOverride" class="fu-badge pending">Manual Override</span></td>
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
import { computed, onMounted, ref } from 'vue';
import { checkmarkCircleOutline, alertCircleOutline, saveOutline, informationCircleOutline } from 'ionicons/icons';
import PageShell from '@/components/PageShell.vue';
import OperatorSelect from '@/components/OperatorSelect.vue';
import MonthYearFilter, { type MonthYearValue } from '@/components/MonthYearFilter.vue';
import { recordsService } from '@/services/records.service';
import { operatorService } from '@/services/operators.service';
import { useRealtime } from '@/composables/useRealtime';
import { initials, fmtDateShort } from '@/utils/format';
import type { EscalationThresholds, KartuKuningItem, OperatorListItem } from '@/types';

const operators = ref<OperatorListItem[]>([]);
const thresholds = ref<EscalationThresholds | null>(null);
const operatorId = ref<number | null>(null);
const reason = ref('');
const submitting = ref(false);
const error = ref('');
const okMsg = ref('');
const items = ref<KartuKuningItem[]>([]);
const period = ref<MonthYearValue>({ month: null, year: null });

const selectedOperator = computed(() => operators.value.find((o) => o.id === operatorId.value) || null);
const isBelowThreshold = computed(() =>
  !!(selectedOperator.value && thresholds.value && (selectedOperator.value.accumulatedPoints ?? 0) < thresholds.value.kartuKuning),
);

const loadOperators = async () => {
  try {
    const { data } = await operatorService.getAll();
    if (data?.success) operators.value = data.data;
  } catch {
    /* abaikan */
  }
};

const loadThresholds = async () => {
  try {
    const { data } = await recordsService.getEscalationConfig();
    if (data?.success) thresholds.value = data.data;
  } catch {
    /* abaikan */
  }
};

const load = async () => {
  try {
    const { data } = await recordsService.listKartuKuning(undefined, {
      month: period.value.month || undefined,
      year: period.value.year || undefined,
    });
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
      okMsg.value = data.data?.isManualOverride
        ? 'Kartu kuning diterbitkan sebagai manual override (poin masih di bawah ambang batas).'
        : 'Kartu kuning diterbitkan.';
      reason.value = '';
      await Promise.all([load(), loadOperators()]);
    } else error.value = 'Gagal menyimpan.';
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal menyimpan.';
  } finally {
    submitting.value = false;
  }
};

onMounted(() => { loadOperators(); loadThresholds(); load(); });
useRealtime('record:changed', () => { load(); loadOperators(); });
</script>

<style scoped>
.cell-wrap { max-width: 320px; }
.head-actions { display: flex; align-items: center; gap: 12px; }
.hint-line { display: flex; align-items: center; gap: 6px; margin: 6px 0 0; font-size: 12px; color: var(--db-ink-3); }
.hint-line ion-icon { font-size: 15px; flex-shrink: 0; }
.hint-line.warn { color: #92400e; }
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
.fu-badge.pending { background: #fef3c7; color: #92400e; }
</style>
