<template>
  <page-shell title="Counseling - Coaching" subtitle="Catat sesi konseling / pembinaan operator">
    <div class="grid g-entry">
      <div class="card" v-if="canCreate">
        <div class="card-head"><h3>Form Counseling - Coaching</h3></div>
        <div class="alert ok" v-if="okMsg"><ion-icon :icon="checkmarkCircleOutline" /> {{ okMsg }}</div>
        <div class="alert err" v-if="error"><ion-icon :icon="alertCircleOutline" /> {{ error }}</div>

        <form class="form-grid" @submit.prevent="submit">
          <!-- Identitas karyawan -->
          <div class="field">
            <label>Operator (Karyawan)</label>
            <select v-model.number="operatorId" required>
              <option :value="null" disabled>{{ loadingOps ? 'Memuat operator…' : 'Pilih operator…' }}</option>
              <option v-for="o in operators" :key="o.id" :value="o.id">
                {{ o.user.fullName }} — {{ o.employeeId }} ({{ o.section }})
              </option>
            </select>
          </div>

          <div class="op-info" v-if="selectedOperator">
            <div><span class="k">No Code</span><span class="v">{{ selectedOperator.employeeId }}</span></div>
            <div><span class="k">Job</span><span class="v">{{ selectedOperator.position }}</span></div>
            <div><span class="k">Section</span><span class="v">{{ selectedOperator.section }}</span></div>
          </div>

          <div class="field">
            <label>Pws (Pengawas / Atasan)</label>
            <input v-model.trim="pws" :placeholder="auth.user?.fullName || 'Nama pengawas'" />
          </div>

          <!-- Perihal / kategori -->
          <div class="field">
            <label>Perihal</label>
            <div class="cat-row">
              <label v-for="opt in categories" :key="opt" :class="['cat-chip', { on: category === opt }]">
                <input type="radio" :value="opt" v-model="category" /> {{ opt }}
              </label>
            </div>
          </div>

          <div class="field"><label>Topik / Ringkasan Perihal</label><input v-model.trim="topic" placeholder="mis. Menjawab WA sambil berjalan" required /></div>

          <div class="field"><label>Paparan / Penjelasan dari karyawan (uraian masalah)</label><textarea v-model.trim="employeeStatement" rows="3" placeholder="Uraian masalah dari sudut pandang karyawan…"></textarea></div>

          <div class="field"><label>Saran dari Atasan</label><textarea v-model.trim="supervisorSuggestion" rows="3" placeholder="mis. Patuhi standard safety…"></textarea></div>

          <div class="field"><label>Komitmen karyawan <span class="hint">(untuk mencegah kejadian ulang)</span></label><textarea v-model.trim="employeeCommitment" rows="2" placeholder="Komitmen yang disepakati karyawan…"></textarea></div>

          <div class="field"><label>Tempat</label><input v-model.trim="location" placeholder="Bekasi" /></div>

          <div class="form-actions">
            <button class="btn-primary" :disabled="submitting || !operatorId || !topic">
              <ion-icon :icon="saveOutline" /> {{ submitting ? 'Menyimpan…' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>

      <div class="card">
        <div class="card-head"><h3>Riwayat Counseling</h3><span class="muted">{{ items.length }}</span></div>
        <div v-if="items.length === 0" class="empty">Belum ada catatan konseling.</div>
        <div class="table-wrap" v-else>
          <table>
            <thead><tr><th>Operator</th><th>Perihal</th><th>Topik</th><th>Tanggal</th><th class="ta-r">Aksi</th></tr></thead>
            <tbody>
              <tr v-for="c in items" :key="c.id">
                <td><div class="who"><div class="t-ava">{{ initials(c.operator?.user?.fullName) }}</div>{{ c.operator?.user?.fullName }}</div></td>
                <td><span class="badge-muted">{{ c.category }}</span></td>
                <td>{{ c.topic }}</td>
                <td class="muted">
                  {{ fmtDateShort(c.date) }}
                  <span v-if="c.acknowledgedBy" class="ack" title="Disetujui Section Manager"><ion-icon :icon="checkmarkDoneOutline" /></span>
                </td>
                <td class="ta-r">
                  <div class="row-actions">
                    <button class="ico-btn" title="Lihat / Cetak lembar" @click="openSheet(c)"><ion-icon :icon="documentTextOutline" /></button>
                    <button v-if="auth.hasRole('Section Manager') && !c.acknowledgedBy" class="ico-btn" title="Setujui (Mengetahui)" @click="acknowledge(c)"><ion-icon :icon="checkmarkCircleOutline" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <counseling-sheet v-if="sheet" :c="sheet" @close="sheet = null" />
  </page-shell>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { computed, onMounted, ref } from 'vue';
import { checkmarkCircleOutline, alertCircleOutline, saveOutline, documentTextOutline, checkmarkDoneOutline } from 'ionicons/icons';
import PageShell from '@/components/PageShell.vue';
import CounselingSheet from '@/components/CounselingSheet.vue';
import { recordsService } from '@/services/records.service';
import { operatorService } from '@/services/operators.service';
import { useRealtime } from '@/composables/useRealtime';
import { useAuthStore } from '@/stores/auth';
import { initials, fmtDateShort } from '@/utils/format';
import type { CounselingItem, OperatorListItem } from '@/types';

const auth = useAuthStore();

const categories = ['Safety', 'Quality', 'Produksi', 'Behaviour', 'Others'];

const operators = ref<OperatorListItem[]>([]);
const loadingOps = ref(true);
const operatorId = ref<number | null>(null);
const category = ref('Safety');
const topic = ref('');
const pws = ref('');
const employeeStatement = ref('');
const supervisorSuggestion = ref('');
const employeeCommitment = ref('');
const location = ref('');

const submitting = ref(false);
const error = ref('');
const okMsg = ref('');
const items = ref<CounselingItem[]>([]);
const sheet = ref<CounselingItem | null>(null);

const selectedOperator = computed(() => operators.value.find((o) => o.id === operatorId.value) || null);
const canCreate = computed(() => auth.hasRole('Foreman'));

const loadOperators = async () => {
  try {
    const { data } = await operatorService.getAll();
    if (data?.success) operators.value = data.data;
  } catch {
    /* abaikan */
  } finally {
    loadingOps.value = false;
  }
};

const load = async () => {
  try {
    const { data } = await recordsService.listCounseling();
    if (data?.success) items.value = data.data;
  } catch {
    /* abaikan */
  }
};

const resetForm = () => {
  topic.value = '';
  pws.value = '';
  employeeStatement.value = '';
  supervisorSuggestion.value = '';
  employeeCommitment.value = '';
  location.value = '';
  category.value = 'Safety';
};

const submit = async () => {
  if (!operatorId.value) return;
  submitting.value = true;
  error.value = '';
  okMsg.value = '';
  try {
    const { data } = await recordsService.createCounseling({
      operatorId: operatorId.value,
      topic: topic.value,
      category: category.value,
      pws: pws.value,
      employeeStatement: employeeStatement.value,
      supervisorSuggestion: supervisorSuggestion.value,
      employeeCommitment: employeeCommitment.value,
      location: location.value,
    });
    if (data?.success) {
      okMsg.value = 'Lembar counseling tercatat.';
      resetForm();
      await load();
    } else error.value = 'Gagal menyimpan.';
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal menyimpan.';
  } finally {
    submitting.value = false;
  }
};

const openSheet = (c: CounselingItem) => { sheet.value = c; };

const acknowledge = async (c: CounselingItem) => {
  try {
    const { data } = await recordsService.acknowledgeCounseling(c.id);
    if (data?.success) await load();
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal menyetujui.';
  }
};

onMounted(() => { loadOperators(); load(); });
useRealtime('record:changed', load);
</script>

<style scoped>
.op-info { display: flex; flex-wrap: wrap; gap: 18px; padding: 10px 12px; background: var(--db-icon-bg); border: 1px solid var(--db-line); border-radius: 10px; }
.op-info > div { display: flex; flex-direction: column; }
.op-info .k { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--db-ink-3); }
.op-info .v { font-size: 13.5px; font-weight: 600; color: var(--db-ink); }
.cat-row { display: flex; flex-wrap: wrap; gap: 8px; }
.cat-chip { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border: 1px solid var(--db-line); border-radius: 999px; font-size: 13px; cursor: pointer; color: var(--db-ink-2); }
.cat-chip.on { background: var(--db-accent, #2563eb); border-color: var(--db-accent, #2563eb); color: #fff; }
.cat-chip input { display: none; }
.ta-r { text-align: right; }
.row-actions { display: inline-flex; gap: 4px; justify-content: flex-end; }
.ico-btn { width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center; color: var(--db-ink-2); font-size: 17px; }
.ico-btn:hover { background: var(--db-icon-bg); color: var(--db-ink); }
.ack { margin-left: 6px; color: var(--db-green, #16a34a); vertical-align: middle; }
</style>
