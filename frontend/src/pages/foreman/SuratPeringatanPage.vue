<template>
  <page-shell title="Surat Peringatan" subtitle="Terbitkan Surat Peringatan (SP) bertingkat untuk operator">
    <div class="grid g-entry">
      <div class="card">
        <div class="card-head"><h3>Terbitkan Surat Peringatan</h3></div>
        <div class="alert ok" v-if="okMsg"><ion-icon :icon="checkmarkCircleOutline" /> {{ okMsg }}</div>
        <div class="alert err" v-if="error"><ion-icon :icon="alertCircleOutline" /> {{ error }}</div>
        <form class="form-grid" @submit.prevent="submit">
          <div class="field">
            <label>Operator</label>
            <operator-select v-model="operatorId" />
            <p class="hint-line" v-if="operatorId && issuedLevels.length > 0">
              <ion-icon :icon="informationCircleOutline" />
              SP yang sudah diterbitkan: {{ issuedLevels.slice().sort().join(', ') }}
            </p>
          </div>
          <div class="field">
            <label>Tingkat SP</label>
            <div class="seg-tabs">
              <button type="button" :class="{ on: level === 1 }" :disabled="issuedLevels.includes(1)" @click="level = 1">SP 1</button>
              <button type="button" :class="{ on: level === 2 }" :disabled="issuedLevels.includes(2) || !issuedLevels.includes(1)" @click="level = 2">SP 2</button>
              <button type="button" :class="{ on: level === 3 }" :disabled="issuedLevels.includes(3) || !issuedLevels.includes(2)" @click="level = 3">SP 3</button>
            </div>
            <p class="hint-line" :class="{ warn: isBelowThreshold }" v-if="selectedOperator && thresholds">
              <ion-icon :icon="informationCircleOutline" />
              Poin akumulasi: <b>{{ selectedOperator.accumulatedPoints ?? 0 }}</b> (ambang batas SP{{ level }}: {{ levelThreshold }})
              <span v-if="isBelowThreshold"> — penerbitan ini akan dicatat sebagai manual override.</span>
            </p>
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
        <div class="card-head">
          <h3>Surat Peringatan Terbaru</h3>
          <div class="head-actions">
            <month-year-filter v-model="period" @update:modelValue="load" />
            <span class="muted">{{ items.length }}</span>
          </div>
        </div>
        <div v-if="items.length === 0" class="empty">Belum ada surat peringatan diterbitkan.</div>
        <div class="table-wrap" v-else>
          <table>
            <thead><tr><th>Operator</th><th>Tingkat</th><th>Alasan</th><th>Poin Saat Terbit</th><th>Tanggal</th><th></th></tr></thead>
            <tbody>
              <tr v-for="s in items" :key="s.id">
                <td><div class="who"><div class="t-ava"><UserAvatar /></div>{{ s.operator?.user?.fullName }}</div></td>
                <td>
                  <span class="status" :class="s.level >= 3 ? 'critical' : s.level === 2 ? 'high' : 'medium'">SP {{ s.level }}</span>
                  <span v-if="s.isManualOverride" class="fu-badge pending">Override</span>
                </td>
                <td class="cell-wrap">{{ s.reason }}</td>
                <td class="muted">{{ s.accumulatedPointsAtIssuance ?? '-' }}</td>
                <td class="muted">{{ fmtDateShort(s.issuedAt) }}</td>
                <td>
                  <button class="btn-ghost btn-sm" type="button" @click="print(s)" title="Cetak Surat Peringatan">
                    <ion-icon :icon="printOutline" /> Cetak
                  </button>
                </td>
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
import { computed, onMounted, ref, watch } from 'vue';
import { checkmarkCircleOutline, alertCircleOutline, saveOutline, printOutline, informationCircleOutline } from 'ionicons/icons';
import PageShell from '@/components/PageShell.vue';
import OperatorSelect from '@/components/OperatorSelect.vue';
import MonthYearFilter, { type MonthYearValue } from '@/components/MonthYearFilter.vue';
import { recordsService } from '@/services/records.service';
import { operatorService } from '@/services/operators.service';
import { useRealtime } from '@/composables/useRealtime';
import { fmtDateShort } from '@/utils/format';
import UserAvatar from '@/components/UserAvatar.vue';
import { printSuratPeringatan } from '@/utils/suratPeringatanTemplate';
import type { EscalationThresholds, OperatorListItem, SuratPeringatanItem } from '@/types';

const operators = ref<OperatorListItem[]>([]);
const thresholds = ref<EscalationThresholds | null>(null);
const issuedLevels = ref<number[]>([]);
const operatorId = ref<number | null>(null);
const level = ref<number>(1);
const reason = ref('');
const submitting = ref(false);
const error = ref('');
const okMsg = ref('');
const items = ref<SuratPeringatanItem[]>([]);
const period = ref<MonthYearValue>({ month: null, year: null });

const selectedOperator = computed(() => operators.value.find((o) => o.id === operatorId.value) || null);
const levelThreshold = computed(() => {
  if (!thresholds.value) return undefined;
  return level.value === 1 ? thresholds.value.sp1 : level.value === 2 ? thresholds.value.sp2 : thresholds.value.sp3;
});
const isBelowThreshold = computed(() =>
  !!(selectedOperator.value && levelThreshold.value !== undefined && (selectedOperator.value.accumulatedPoints ?? 0) < levelThreshold.value),
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
    const { data } = await recordsService.listSuratPeringatan(undefined, {
      month: period.value.month || undefined,
      year: period.value.year || undefined,
    });
    if (data?.success) items.value = data.data;
  } catch {
    /* abaikan */
  }
};

// Saat operator dipilih, muat SP yang sudah diterbitkan untuk mencegah pelanggaran
// urutan/duplikasi level di UI (R6.2, R6.7) dan sarankan level berikutnya.
watch(operatorId, async (id) => {
  if (!id) { issuedLevels.value = []; return; }
  try {
    const { data } = await recordsService.listSuratPeringatan(id);
    // Operator bisa sudah diganti lagi sebelum request ini selesai — buang
    // response basi agar level SP yang disarankan tidak berasal dari riwayat
    // operator yang salah.
    if (operatorId.value !== id) return;
    if (data?.success) {
      const levels = data.data.map((sp: SuratPeringatanItem) => sp.level);
      issuedLevels.value = levels;
      const next = [1, 2, 3].find((l) => !levels.includes(l)) ?? 3;
      level.value = next;
    }
  } catch {
    /* abaikan */
  }
});

const print = (s: SuratPeringatanItem) => printSuratPeringatan(s);

const submit = async () => {
  if (!operatorId.value) return;
  submitting.value = true;
  error.value = '';
  okMsg.value = '';
  try {
    const { data } = await recordsService.createSuratPeringatan({ operatorId: operatorId.value, level: level.value, reason: reason.value });
    if (data?.success) {
      okMsg.value = data.data?.isManualOverride
        ? `Surat Peringatan SP ${level.value} diterbitkan sebagai manual override.`
        : `Surat Peringatan SP ${level.value} diterbitkan.`;
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
.cell-wrap { max-width: 300px; }
.head-actions { display: flex; align-items: center; gap: 12px; }
.btn-sm { padding: 5px 10px; font-size: 12px; display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }
.btn-sm ion-icon { font-size: 15px; }
.hint-line { display: flex; align-items: center; gap: 6px; margin: 6px 0 0; font-size: 12px; color: var(--db-ink-3); }
.hint-line ion-icon { font-size: 15px; flex-shrink: 0; }
.hint-line.warn { color: #92400e; }
.fu-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.fu-badge.pending { background: #fef3c7; color: #92400e; }
</style>
