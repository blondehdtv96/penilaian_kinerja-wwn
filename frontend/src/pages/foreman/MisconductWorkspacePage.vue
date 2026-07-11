<template>
  <page-shell
    title="Pembinaan & Pelanggaran"
    subtitle="Workspace terpadu: pilih operator, telusuri riwayat disiplin, dan catat tindakan dari satu tempat"
  >
    <div class="card">
      <div class="card-head"><h3>Pilih Operator</h3></div>
      <operator-select v-model="operatorId" />
    </div>

    <div v-if="!operatorId" class="card">
      <div class="empty">Pilih operator di atas untuk melihat ringkasan, riwayat disiplin, dan mencatat tindakan.</div>
    </div>

    <template v-else>
      <div class="grid g-workspace">
        <div class="stack">
          <!-- Ringkasan operator -->
          <div class="card">
            <div class="card-head"><h3>Ringkasan</h3></div>
            <div v-if="loadingData && !operatorDetail" class="loading"><ion-spinner name="crescent" /> Memuat…</div>
            <template v-else-if="operatorDetail">
              <div class="who op-who">
                <div class="t-ava">{{ initials(operatorDetail.user?.fullName) }}</div>
                <div>
                  <div class="op-name">{{ operatorDetail.user?.fullName }}</div>
                  <div class="muted">{{ operatorDetail.employeeId }} · {{ operatorDetail.section }}</div>
                </div>
              </div>
              <div class="info-list">
                <div class="info-row"><span>Poin Akumulasi</span><b>{{ operatorDetail.accumulatedPoints ?? 0 }}</b></div>
                <div class="info-row"><span>Total Pelanggaran</span><b>{{ operatorDetail.totalMisconduct ?? 0 }}</b></div>
                <div class="info-row"><span>Skor Kinerja</span><b>{{ operatorDetail.performanceScore ?? 0 }}</b></div>
              </div>
            </template>
          </div>

          <!-- Panel eskalasi terpandu (advisory) -->
          <div class="card" v-if="thresholds && operatorDetail">
            <div class="card-head"><h3>Saran Eskalasi</h3></div>
            <div class="alert" :class="isDue ? 'err' : 'info'">
              <ion-icon :icon="isDue ? warningOutline : informationCircleOutline" />
              <span v-if="isDue">
                ⚠ Sudah layak <b>{{ suggestedLabel }}</b>
                <template v-if="suggestedThreshold != null"> — poin akumulasi {{ operatorDetail.accumulatedPoints ?? 0 }} (ambang {{ suggestedThreshold }})</template>
              </span>
              <span v-else>Belum ada tindakan lanjutan yang disarankan saat ini.</span>
            </div>
            <p class="hint-line">
              <ion-icon :icon="informationCircleOutline" />
              Saran bersifat advisory — foreman/section manager tetap dapat menimbang tindakan lain.
            </p>
            <div class="esc-steps">
              <div v-for="s in escSteps" :key="s.ordinal" class="esc-step" :class="{ done: s.ordinal <= currentLevel, met: s.ordinal <= pointsStep }">
                <ion-icon :icon="s.ordinal <= currentLevel ? checkmarkCircleOutline : ellipseOutline" />
                <span>{{ s.label }}</span>
                <span class="muted">{{ s.threshold }} pts</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Timeline riwayat disiplin -->
        <div class="card">
          <div class="card-head"><h3>Riwayat Disiplin</h3><span class="muted">{{ timeline.length }} catatan</span></div>
          <div v-if="loadingData && timeline.length === 0" class="loading"><ion-spinner name="crescent" /> Memuat riwayat…</div>
          <div v-else-if="timeline.length === 0" class="empty">Belum ada catatan disiplin untuk operator ini.</div>
          <div v-else class="timeline-list">
            <div v-for="entry in timeline" :key="entry.kind + '-' + entry.id" class="tl-item">
              <span class="status" :class="badgeMeta(entry).cls">{{ badgeMeta(entry).label }}</span>
              <div class="tl-body">
                <div class="tl-title">{{ entryTitle(entry) }}</div>
                <div class="tl-meta muted">
                  {{ fmtDateShort(entry.date) }}
                  <template v-if="entryWho(entry)"> · dicatat oleh {{ entryWho(entry) }}</template>
                  <template v-if="entry.kind === 'kartu_kuning' && entry.raw.isManualOverride"> · <span class="fu-badge pending">Override</span></template>
                  <template v-if="entry.kind === 'surat_peringatan' && entry.raw.isManualOverride"> · <span class="fu-badge pending">Override</span></template>
                  <template v-if="entry.kind === 'konseling'">
                    <template v-if="entry.raw.acknowledgedAt"> · <span class="fu-badge done">Disetujui SM</span></template>
                    <template v-else> · <span class="fu-badge pending">Menunggu persetujuan SM</span></template>
                  </template>
                </div>
              </div>
              <div class="tl-actions">
                <button v-if="entry.kind === 'pelanggaran'" class="ico-btn" title="Lihat lembar" @click="sheetMisconduct = entry.raw">
                  <ion-icon :icon="documentTextOutline" />
                </button>
                <button v-else-if="entry.kind === 'konseling'" class="ico-btn" title="Lihat lembar" @click="sheetCounseling = entry.raw">
                  <ion-icon :icon="documentTextOutline" />
                </button>
                <button v-else-if="entry.kind === 'surat_peringatan'" class="ico-btn" title="Cetak Surat Peringatan" @click="printSuratPeringatan(entry.raw)">
                  <ion-icon :icon="printOutline" />
                </button>
                <button
                  v-if="entry.kind === 'konseling' && !entry.raw.acknowledgedAt && canAcknowledgeCounseling"
                  class="ico-btn"
                  title="Setujui (Mengetahui)"
                  @click="acknowledgeCounseling(entry.raw)"
                >
                  <ion-icon :icon="checkmarkCircleOutline" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Aksi: catat tindakan -->
      <div class="card" v-if="actionTabs.length">
        <div class="card-head"><h3>Catat Tindakan</h3></div>
        <div class="seg-tabs action-tabs">
          <button v-for="t in actionTabs" :key="t.key" type="button" :class="{ on: activeTab === t.key }" @click="switchTab(t.key)">
            <ion-icon :icon="t.icon" /> {{ t.label }}
          </button>
        </div>

        <div class="alert ok" v-if="okMsg"><ion-icon :icon="checkmarkCircleOutline" /> {{ okMsg }}</div>
        <div class="alert err" v-if="actionError"><ion-icon :icon="alertCircleOutline" /> {{ actionError }}</div>

        <!-- Form: Pelanggaran -->
        <form v-if="activeTab === 'pelanggaran'" class="form-grid" @submit.prevent="submitPelanggaran">
          <div class="field">
            <label>Jenis Pelanggaran</label>
            <select v-model.number="violationTypeId" required>
              <option :value="null" disabled>
                {{ loadingTypes ? 'Memuat katalog…' : (violationTypes.length ? 'Pilih jenis pelanggaran…' : 'Katalog belum tersedia') }}
              </option>
              <option v-for="t in violationTypes" :key="t.id" :value="t.id">{{ t.name }} — {{ t.points }} poin ({{ t.severity }})</option>
            </select>
          </div>
          <div class="field"><label>Deskripsi</label><textarea v-model.trim="misconductDescription" rows="4" required></textarea></div>
          <div class="form-actions">
            <button class="btn-primary" :disabled="submitting || !violationTypeId || !misconductDescription">
              <ion-icon :icon="saveOutline" /> {{ submitting ? 'Menyimpan…' : 'Simpan Pelanggaran' }}
            </button>
          </div>
        </form>

        <!-- Form: Konseling -->
        <form v-else-if="activeTab === 'konseling'" class="form-grid" @submit.prevent="submitKonseling">
          <div class="field">
            <label>Pelanggaran yang Ditindaklanjuti</label>
            <select v-model.number="konselingMisconductId" required>
              <option :value="null" disabled>
                {{ loadingPending ? 'Memuat pelanggaran…' : (pendingMisconducts.length ? 'Pilih pelanggaran…' : 'Tidak ada pelanggaran menunggu konseling') }}
              </option>
              <option v-for="m in pendingMisconducts" :key="m.id" :value="m.id">{{ m.type }} — {{ fmtDateShort(m.createdAt) }}</option>
            </select>
            <p class="hint-line"><ion-icon :icon="informationCircleOutline" /> Konseling hanya bisa ditautkan ke pelanggaran yang belum dikonseling.</p>
          </div>
          <div class="field">
            <label>Perihal</label>
            <div class="cat-row">
              <label v-for="opt in categories" :key="opt" :class="['cat-chip', { on: konselingCategory === opt }]">
                <input type="radio" :value="opt" v-model="konselingCategory" /> {{ opt }}
              </label>
            </div>
          </div>
          <div class="field"><label>Topik / Ringkasan</label><input v-model.trim="konselingTopic" required /></div>
          <div class="field"><label>Pws (Pengawas)</label><input v-model.trim="konselingPws" :placeholder="auth.user?.fullName || ''" /></div>
          <div class="field"><label>Paparan dari karyawan</label><textarea v-model.trim="konselingStatement" rows="3"></textarea></div>
          <div class="field"><label>Saran dari Atasan</label><textarea v-model.trim="konselingSuggestion" rows="3"></textarea></div>
          <div class="field"><label>Komitmen karyawan</label><textarea v-model.trim="konselingCommitment" rows="2"></textarea></div>
          <div class="field"><label>Tempat</label><input v-model.trim="konselingLocation" placeholder="Bekasi" /></div>
          <div class="form-actions">
            <button class="btn-primary" :disabled="submitting || !konselingMisconductId || !konselingTopic">
              <ion-icon :icon="saveOutline" /> {{ submitting ? 'Menyimpan…' : 'Simpan Konseling' }}
            </button>
          </div>
        </form>

        <!-- Form: Kartu Kuning -->
        <form v-else-if="activeTab === 'kartu_kuning'" class="form-grid" @submit.prevent="submitKartuKuning">
          <p class="hint-line" :class="{ warn: kkBelowThreshold }" v-if="thresholds && operatorDetail">
            <ion-icon :icon="informationCircleOutline" />
            Poin akumulasi: <b>{{ operatorDetail.accumulatedPoints ?? 0 }}</b> (ambang Kartu Kuning: {{ thresholds.kartuKuning }})
            <span v-if="kkBelowThreshold"> — penerbitan ini akan dicatat sebagai manual override.</span>
          </p>
          <div class="field"><label>Alasan</label><textarea v-model.trim="kkReason" rows="4" required></textarea></div>
          <div class="form-actions">
            <button class="btn-primary" :disabled="submitting || !kkReason">
              <ion-icon :icon="saveOutline" /> {{ submitting ? 'Menyimpan…' : 'Terbitkan Kartu Kuning' }}
            </button>
          </div>
        </form>

        <!-- Form: Surat Peringatan -->
        <form v-else-if="activeTab === 'surat_peringatan'" class="form-grid" @submit.prevent="submitSuratPeringatan">
          <div class="field">
            <label>Tingkat SP</label>
            <div class="seg-tabs">
              <button type="button" :class="{ on: spLevel === 1 }" :disabled="issuedSpLevels.includes(1)" @click="spLevel = 1">SP 1</button>
              <button type="button" :class="{ on: spLevel === 2 }" :disabled="issuedSpLevels.includes(2) || !issuedSpLevels.includes(1)" @click="spLevel = 2">SP 2</button>
              <button type="button" :class="{ on: spLevel === 3 }" :disabled="issuedSpLevels.includes(3) || !issuedSpLevels.includes(2)" @click="spLevel = 3">SP 3</button>
            </div>
            <p class="hint-line" :class="{ warn: spBelowThreshold }" v-if="thresholds">
              <ion-icon :icon="informationCircleOutline" />
              Ambang SP{{ spLevel }}: {{ spLevelThreshold }}
              <span v-if="spBelowThreshold"> — penerbitan ini akan dicatat sebagai manual override.</span>
            </p>
          </div>
          <div class="field"><label>Alasan</label><textarea v-model.trim="spReason" rows="4" required></textarea></div>
          <div class="form-actions">
            <button class="btn-primary" :disabled="submitting || !spReason">
              <ion-icon :icon="saveOutline" /> {{ submitting ? 'Menyimpan…' : 'Terbitkan Surat Peringatan' }}
            </button>
          </div>
        </form>
      </div>
    </template>

    <misconduct-sheet v-if="sheetMisconduct" :m="sheetMisconduct" @close="sheetMisconduct = null" />
    <counseling-sheet v-if="sheetCounseling" :c="sheetCounseling" @close="sheetCounseling = null" />
  </page-shell>
</template>

<script setup lang="ts">
import { IonIcon, IonSpinner } from '@ionic/vue';
import { computed, onMounted, ref, watch } from 'vue';
import {
  checkmarkCircleOutline, alertCircleOutline, saveOutline, informationCircleOutline,
  chatbubblesOutline, cardOutline, documentAttachOutline, documentTextOutline, printOutline,
  warningOutline, ellipseOutline,
} from 'ionicons/icons';
import PageShell from '@/components/PageShell.vue';
import OperatorSelect from '@/components/OperatorSelect.vue';
import MisconductSheet from '@/components/MisconductSheet.vue';
import CounselingSheet from '@/components/CounselingSheet.vue';
import { recordsService } from '@/services/records.service';
import { operatorService } from '@/services/operators.service';
import { useRealtime } from '@/composables/useRealtime';
import { useAuthStore } from '@/stores/auth';
import { initials, fmtDateShort, severityMeta } from '@/utils/format';
import { printSuratPeringatan } from '@/utils/suratPeringatanTemplate';
import type {
  MisconductItem, CounselingItem, KartuKuningItem, SuratPeringatanItem,
  ViolationTypeItem, EscalationThresholds, OperatorDetail,
} from '@/types';

const auth = useAuthStore();

// ---------- Operator terpilih & data terkait ----------
const operatorId = ref<number | null>(null);
const operatorDetail = ref<OperatorDetail | null>(null);
const loadingData = ref(false);

const misconducts = ref<MisconductItem[]>([]);
const pendingMisconducts = ref<MisconductItem[]>([]);
const loadingPending = ref(false);
const counselings = ref<CounselingItem[]>([]);
const kartuKunings = ref<KartuKuningItem[]>([]);
const suratPeringatans = ref<SuratPeringatanItem[]>([]);

const violationTypes = ref<ViolationTypeItem[]>([]);
const loadingTypes = ref(true);
const thresholds = ref<EscalationThresholds | null>(null);

const error = ref('');
const actionError = ref('');
const okMsg = ref('');
const submitting = ref(false);

const loadViolationTypes = async () => {
  loadingTypes.value = true;
  try {
    const { data } = await recordsService.listViolationTypes();
    if (data?.success) violationTypes.value = data.data;
  } catch { /* abaikan */ } finally { loadingTypes.value = false; }
};

const loadThresholds = async () => {
  try {
    const { data } = await recordsService.getEscalationConfig();
    if (data?.success) thresholds.value = data.data;
  } catch { /* abaikan */ }
};

const loadOperatorData = async (id: number) => {
  loadingData.value = true;
  error.value = '';
  try {
    const [opRes, misRes, counRes, kkRes, spRes] = await Promise.all([
      operatorService.getById(id),
      recordsService.listMisconduct({ operatorId: id }),
      recordsService.listCounseling(id),
      recordsService.listKartuKuning(id),
      recordsService.listSuratPeringatan(id),
    ]);
    if (opRes.data?.success) operatorDetail.value = opRes.data.data;
    if (misRes.data?.success) misconducts.value = misRes.data.data;
    if (counRes.data?.success) counselings.value = counRes.data.data;
    if (kkRes.data?.success) kartuKunings.value = kkRes.data.data;
    if (spRes.data?.success) suratPeringatans.value = spRes.data.data;
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal memuat data operator.';
  } finally {
    loadingData.value = false;
  }
};

const loadPendingMisconducts = async (id: number) => {
  loadingPending.value = true;
  try {
    const { data } = await recordsService.listMisconduct({ operatorId: id, counselingStatus: 'pending' });
    if (data?.success) pendingMisconducts.value = data.data;
  } catch { /* abaikan */ } finally { loadingPending.value = false; }
};

const reloadCurrentOperator = () => {
  if (!operatorId.value) return;
  loadOperatorData(operatorId.value);
  loadPendingMisconducts(operatorId.value);
};

watch(operatorId, (id) => {
  okMsg.value = '';
  actionError.value = '';
  operatorDetail.value = null;
  misconducts.value = [];
  pendingMisconducts.value = [];
  counselings.value = [];
  kartuKunings.value = [];
  suratPeringatans.value = [];
  if (id) {
    loadOperatorData(id);
    loadPendingMisconducts(id);
  }
});

onMounted(() => { loadViolationTypes(); loadThresholds(); });
useRealtime('record:changed', reloadCurrentOperator);

// ---------- Timeline gabungan ----------
type TimelineKind = 'pelanggaran' | 'konseling' | 'kartu_kuning' | 'surat_peringatan';
interface TimelineEntry { kind: TimelineKind; id: number; date: string; raw: any; }

const timeline = computed<TimelineEntry[]>(() => {
  const items: TimelineEntry[] = [];
  for (const m of misconducts.value) items.push({ kind: 'pelanggaran', id: m.id, date: m.createdAt, raw: m });
  for (const c of counselings.value) items.push({ kind: 'konseling', id: c.id, date: c.date || c.createdAt, raw: c });
  for (const k of kartuKunings.value) items.push({ kind: 'kartu_kuning', id: k.id, date: k.issuedAt, raw: k });
  for (const s of suratPeringatans.value) items.push({ kind: 'surat_peringatan', id: s.id, date: s.issuedAt, raw: s });
  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});

const badgeMeta = (entry: TimelineEntry): { label: string; cls: string } => {
  switch (entry.kind) {
    case 'pelanggaran': return severityMeta(entry.raw.severity);
    case 'konseling': return { label: 'Konseling', cls: 'foreman' };
    case 'kartu_kuning': return { label: 'Kartu Kuning', cls: 'pending' };
    case 'surat_peringatan': {
      const lvl = entry.raw.level as number;
      return { label: `SP ${lvl}`, cls: lvl >= 3 ? 'critical' : lvl === 2 ? 'high' : 'medium' };
    }
  }
};
const entryTitle = (entry: TimelineEntry): string => {
  switch (entry.kind) {
    case 'pelanggaran': return entry.raw.type;
    case 'konseling': return entry.raw.topic;
    case 'kartu_kuning': return entry.raw.reason;
    case 'surat_peringatan': return entry.raw.reason;
  }
};
const entryWho = (entry: TimelineEntry): string | undefined => {
  switch (entry.kind) {
    case 'pelanggaran': return entry.raw.createdBy?.fullName;
    case 'konseling': return entry.raw.foreman?.fullName;
    case 'kartu_kuning': return entry.raw.issuedBy?.fullName;
    case 'surat_peringatan': return entry.raw.issuedBy?.fullName;
  }
};

// ---------- Saran eskalasi terpandu (advisory) ----------
const STEP_LABELS: Record<number, string> = {
  0: 'Tidak ada tindakan', 1: 'Konseling', 2: 'Kartu Kuning',
  3: 'Surat Peringatan 1', 4: 'Surat Peringatan 2', 5: 'Surat Peringatan 3',
};

const currentLevel = computed(() => {
  let lvl = 0;
  if (counselings.value.length > 0) lvl = Math.max(lvl, 1);
  if (kartuKunings.value.length > 0) lvl = Math.max(lvl, 2);
  for (const s of suratPeringatans.value) {
    if (s.level >= 1 && s.level <= 3) lvl = Math.max(lvl, s.level + 2);
  }
  return lvl;
});

const requiredStepFromPoints = (points: number, t: EscalationThresholds): number => {
  let step = 0;
  if (points >= t.counseling) step = 1;
  if (points >= t.kartuKuning) step = 2;
  if (points >= t.sp1) step = 3;
  if (points >= t.sp2) step = 4;
  if (points >= t.sp3) step = 5;
  return step;
};
const stepThreshold = (step: number, t: EscalationThresholds): number | null => {
  switch (step) {
    case 1: return t.counseling;
    case 2: return t.kartuKuning;
    case 3: return t.sp1;
    case 4: return t.sp2;
    case 5: return t.sp3;
    default: return null;
  }
};

const pointsStep = computed(() =>
  thresholds.value ? requiredStepFromPoints(operatorDetail.value?.accumulatedPoints ?? 0, thresholds.value) : 0,
);
const nextAboveCurrent = computed(() => Math.min(currentLevel.value + 1, 5));
const suggestedStep = computed(() => Math.max(pointsStep.value, nextAboveCurrent.value));
const isDue = computed(() => suggestedStep.value > currentLevel.value);
const suggestedLabel = computed(() => STEP_LABELS[suggestedStep.value] ?? '-');
const suggestedThreshold = computed(() => (thresholds.value ? stepThreshold(suggestedStep.value, thresholds.value) : null));
const escSteps = computed(() => {
  if (!thresholds.value) return [];
  return [1, 2, 3, 4, 5].map((ord) => ({ ordinal: ord, label: STEP_LABELS[ord], threshold: stepThreshold(ord, thresholds.value!) }));
});

// ---------- RBAC aksi (samakan dengan misconduct.routes.ts) ----------
const canCreateMisconduct = computed(() => auth.hasAnyRole(['Foreman', 'Section Manager']));
const canCreateCounseling = computed(() => auth.hasRole('Foreman'));
const canAcknowledgeCounseling = computed(() => auth.hasRole('Section Manager'));
const canCreateKartuKuning = computed(() => auth.hasAnyRole(['Foreman', 'Section Manager']));
const canCreateSuratPeringatan = computed(() => auth.hasAnyRole(['Foreman', 'Section Manager']));

// ---------- Tab aksi "Catat tindakan" ----------
type ActionKind = 'pelanggaran' | 'konseling' | 'kartu_kuning' | 'surat_peringatan';
const allActionTabs: { key: ActionKind; label: string; icon: string; allowed: import('vue').ComputedRef<boolean> }[] = [
  { key: 'pelanggaran', label: 'Pelanggaran', icon: alertCircleOutline, allowed: canCreateMisconduct },
  { key: 'konseling', label: 'Konseling', icon: chatbubblesOutline, allowed: canCreateCounseling },
  { key: 'kartu_kuning', label: 'Kartu Kuning', icon: cardOutline, allowed: canCreateKartuKuning },
  { key: 'surat_peringatan', label: 'Surat Peringatan', icon: documentAttachOutline, allowed: canCreateSuratPeringatan },
];
const actionTabs = computed(() => allActionTabs.filter((t) => t.allowed.value));
const activeTab = ref<ActionKind>('pelanggaran');

watch(actionTabs, (tabs) => {
  if (!tabs.find((t) => t.key === activeTab.value) && tabs.length) activeTab.value = tabs[0].key;
}, { immediate: true });

const switchTab = (key: ActionKind) => {
  activeTab.value = key;
  okMsg.value = '';
  actionError.value = '';
};

// ---------- Form: Pelanggaran ----------
const violationTypeId = ref<number | null>(null);
const misconductDescription = ref('');

const submitPelanggaran = async () => {
  if (!operatorId.value || !violationTypeId.value) return;
  submitting.value = true; actionError.value = ''; okMsg.value = '';
  try {
    const { data } = await recordsService.createMisconduct({
      operatorId: operatorId.value, violationTypeId: violationTypeId.value, description: misconductDescription.value,
    });
    if (data?.success) {
      okMsg.value = 'Pelanggaran tercatat, poin akumulasi operator diperbarui & ter-hash on-chain.';
      violationTypeId.value = null; misconductDescription.value = '';
      reloadCurrentOperator();
    } else actionError.value = 'Gagal menyimpan.';
  } catch (e: any) {
    actionError.value = e?.response?.data?.message || 'Gagal menyimpan.';
  } finally { submitting.value = false; }
};

// ---------- Form: Konseling ----------
const categories = ['Safety', 'Quality', 'Produksi', 'Behaviour', 'Others'];
const konselingMisconductId = ref<number | null>(null);
const konselingCategory = ref('Safety');
const konselingTopic = ref('');
const konselingPws = ref('');
const konselingStatement = ref('');
const konselingSuggestion = ref('');
const konselingCommitment = ref('');
const konselingLocation = ref('');

watch(konselingMisconductId, () => {
  const m = pendingMisconducts.value.find((x) => x.id === konselingMisconductId.value);
  if (!m) return;
  if (!konselingTopic.value) konselingTopic.value = m.type;
  konselingStatement.value = m.description || konselingStatement.value;
});

const resetKonselingForm = () => {
  konselingMisconductId.value = null; konselingTopic.value = ''; konselingPws.value = '';
  konselingStatement.value = ''; konselingSuggestion.value = ''; konselingCommitment.value = '';
  konselingLocation.value = ''; konselingCategory.value = 'Safety';
};

const submitKonseling = async () => {
  if (!konselingMisconductId.value) return;
  submitting.value = true; actionError.value = ''; okMsg.value = '';
  try {
    const { data } = await recordsService.createCounseling({
      misconductId: konselingMisconductId.value,
      topic: konselingTopic.value,
      category: konselingCategory.value,
      pws: konselingPws.value,
      employeeStatement: konselingStatement.value,
      supervisorSuggestion: konselingSuggestion.value,
      employeeCommitment: konselingCommitment.value,
      location: konselingLocation.value,
    });
    if (data?.success) {
      okMsg.value = 'Lembar konseling tercatat.';
      resetKonselingForm();
      reloadCurrentOperator();
    } else actionError.value = 'Gagal menyimpan.';
  } catch (e: any) {
    actionError.value = e?.response?.data?.message || 'Gagal menyimpan.';
  } finally { submitting.value = false; }
};

const acknowledgeCounseling = async (c: CounselingItem) => {
  try {
    const { data } = await recordsService.acknowledgeCounseling(c.id);
    if (data?.success) reloadCurrentOperator();
  } catch (e: any) {
    actionError.value = e?.response?.data?.message || 'Gagal menyetujui.';
  }
};

// ---------- Form: Kartu Kuning ----------
const kkReason = ref('');
const kkBelowThreshold = computed(() =>
  !!(thresholds.value && operatorDetail.value && (operatorDetail.value.accumulatedPoints ?? 0) < thresholds.value.kartuKuning),
);

const submitKartuKuning = async () => {
  if (!operatorId.value || !kkReason.value) return;
  submitting.value = true; actionError.value = ''; okMsg.value = '';
  try {
    const { data } = await recordsService.createKartuKuning({ operatorId: operatorId.value, reason: kkReason.value });
    if (data?.success) {
      okMsg.value = data.data?.isManualOverride
        ? 'Kartu kuning diterbitkan sebagai manual override (poin masih di bawah ambang batas).'
        : 'Kartu kuning diterbitkan.';
      kkReason.value = '';
      reloadCurrentOperator();
    } else actionError.value = 'Gagal menyimpan.';
  } catch (e: any) {
    actionError.value = e?.response?.data?.message || 'Gagal menyimpan.';
  } finally { submitting.value = false; }
};

// ---------- Form: Surat Peringatan ----------
const spLevel = ref(1);
const spReason = ref('');
const issuedSpLevels = computed(() => suratPeringatans.value.map((s) => s.level));
const spLevelThreshold = computed(() => {
  if (!thresholds.value) return undefined;
  return spLevel.value === 1 ? thresholds.value.sp1 : spLevel.value === 2 ? thresholds.value.sp2 : thresholds.value.sp3;
});
const spBelowThreshold = computed(() =>
  !!(operatorDetail.value && spLevelThreshold.value !== undefined && (operatorDetail.value.accumulatedPoints ?? 0) < spLevelThreshold.value),
);

watch(issuedSpLevels, (levels) => {
  const next = [1, 2, 3].find((l) => !levels.includes(l)) ?? 3;
  spLevel.value = next;
}, { immediate: true });

const submitSuratPeringatan = async () => {
  if (!operatorId.value || !spReason.value) return;
  submitting.value = true; actionError.value = ''; okMsg.value = '';
  try {
    const { data } = await recordsService.createSuratPeringatan({ operatorId: operatorId.value, level: spLevel.value, reason: spReason.value });
    if (data?.success) {
      okMsg.value = data.data?.isManualOverride
        ? `Surat Peringatan SP ${spLevel.value} diterbitkan sebagai manual override.`
        : `Surat Peringatan SP ${spLevel.value} diterbitkan.`;
      spReason.value = '';
      reloadCurrentOperator();
    } else actionError.value = 'Gagal menyimpan.';
  } catch (e: any) {
    actionError.value = e?.response?.data?.message || 'Gagal menyimpan.';
  } finally { submitting.value = false; }
};

// ---------- Lembar cetak/lihat ----------
const sheetMisconduct = ref<MisconductItem | null>(null);
const sheetCounseling = ref<CounselingItem | null>(null);
</script>

<style scoped>
.g-workspace { grid-template-columns: 360px 1fr; align-items: start; }
@media (max-width: 980px) { .g-workspace { grid-template-columns: 1fr; } }

.op-who { margin-bottom: 12px; }
.op-name { font-weight: 600; font-size: 14px; }

.hint-line { display: flex; align-items: center; gap: 6px; margin: 8px 0 0; font-size: 12px; color: var(--db-ink-3); }
.hint-line ion-icon { font-size: 15px; flex-shrink: 0; }
.hint-line.warn { color: #92400e; }

.esc-steps { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
.esc-step { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--db-ink-3); }
.esc-step ion-icon { font-size: 16px; flex-shrink: 0; }
.esc-step.done { color: var(--db-ink); font-weight: 600; }
.esc-step.done ion-icon { color: var(--db-green); }
.esc-step .muted { margin-left: auto; }

.timeline-list { display: flex; flex-direction: column; gap: 2px; }
.tl-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 4px;
  border-top: 1px solid var(--db-line);
}
.tl-item:first-child { border-top: none; }
.tl-body { flex: 1; min-width: 0; }
.tl-title { font-size: 13.5px; font-weight: 500; color: var(--db-ink); }
.tl-meta { font-size: 12px; margin-top: 2px; }
.tl-actions { display: inline-flex; gap: 4px; flex-shrink: 0; }

.fu-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.fu-badge.done { background: #dcfce7; color: #166534; }
.fu-badge.pending { background: #fef3c7; color: #92400e; }

.action-tabs { margin-bottom: 16px; flex-wrap: wrap; }
.action-tabs button { display: inline-flex; align-items: center; gap: 6px; }
.action-tabs button ion-icon { font-size: 16px; }

.cat-row { display: flex; flex-wrap: wrap; gap: 8px; }
.cat-chip { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border: 1px solid var(--db-line); border-radius: 999px; font-size: 13px; cursor: pointer; color: var(--db-ink-2); }
.cat-chip.on { background: var(--db-accent, #2563eb); border-color: var(--db-accent, #2563eb); color: #fff; }
.cat-chip input { display: none; }
</style>
