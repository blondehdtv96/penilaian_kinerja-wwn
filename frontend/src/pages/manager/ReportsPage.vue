<template>
  <page-shell title="Export Laporan" subtitle="Laporan kinerja & ekspor data">
    <template #actions>
      <button class="btn-ghost btn-sm no-print" @click="printReport"><ion-icon :icon="printOutline" /> Cetak</button>
      <button class="btn-primary btn-sm no-print" @click="downloadExcel" :disabled="exporting">
        <ion-icon :icon="downloadOutline" /> {{ exporting ? 'Menyiapkan…' : 'Unduh Excel' }}
      </button>
    </template>

    <div v-if="loading" class="loading"><ion-spinner name="crescent" /> Memuat laporan…</div>
    <div v-else-if="error" class="card"><div class="empty">{{ error }}</div></div>

    <template v-else-if="report">
      <div class="card">
        <div class="rep-head">
          <div>
            <h2>Laporan Kinerja Operator</h2>
            <div class="muted">Dibuat: {{ fmtDate(report.generatedAt) }} · PT Bridgestone Tire Indonesia</div>
          </div>
          <div class="logo-r"><img :src="brandLogo" alt="Logo Bridgestone" /></div>
        </div>

        <div class="grid g4 rep-stats">
          <div class="stat-mini"><div class="s-val">{{ fmtNum(report.kpi.totalOperators) }}</div><div class="s-lbl">Operator</div></div>
          <div class="stat-mini"><div class="s-val">{{ fmtNum(report.kpi.totalVoo) }}</div><div class="s-lbl">Total VoO</div></div>
          <div class="stat-mini"><div class="s-val">{{ fmtNum(report.kpi.approvedVoo) }}</div><div class="s-lbl">VoO Disetujui</div></div>
          <div class="stat-mini"><div class="s-val">{{ fmtNum(report.kpi.totalMisconduct) }}</div><div class="s-lbl">Pelanggaran</div></div>
        </div>

        <div class="card-head" style="margin-top: 22px"><h3>Rincian Operator</h3></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Nama</th><th>ID</th><th>Section</th><th class="amt">Skor</th><th class="amt">VoO</th><th class="amt">Pelanggaran</th></tr></thead>
            <tbody>
              <tr v-for="(o, i) in report.operators" :key="o.employeeId">
                <td class="rank-no">{{ i + 1 }}</td>
                <td>{{ o.name }}</td>
                <td class="muted">{{ o.employeeId }}</td>
                <td class="muted">{{ o.section }}</td>
                <td class="amt">{{ o.performanceScore }}</td>
                <td class="amt pos">{{ o.totalMerit }}</td>
                <td class="amt neg">{{ o.totalMisconduct }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </page-shell>
</template>

<script setup lang="ts">
import { IonIcon, IonSpinner } from '@ionic/vue';
import { onMounted, ref } from 'vue';
import { printOutline, downloadOutline } from 'ionicons/icons';
import PageShell from '@/components/PageShell.vue';
import { dashboardService } from '@/services/dashboard.service';
import { fmtDate, fmtNum } from '@/utils/format';
import brandLogo from '@/assets/bridgestone-logo.png';

const report = ref<any>(null);
const loading = ref(true);
const error = ref('');
const exporting = ref(false);

const printReport = () => window.print();

const downloadExcel = async () => {
  exporting.value = true;
  try {
    const res = await dashboardService.exportExcel();
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan_kinerja_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal mengunduh Excel.';
  } finally {
    exporting.value = false;
  }
};

onMounted(async () => {
  try {
    const { data } = await dashboardService.exportPDF();
    if (data?.success) report.value = data.data;
    else error.value = 'Gagal memuat laporan.';
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal memuat laporan.';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.rep-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
.rep-head h2 { font-size: 20px; font-weight: 700; }
.logo-r {
  width: 44px; height: 44px; border-radius: 12px; background: #fff; overflow: hidden;
  display: grid; place-items: center; border: 1px solid var(--db-line);
}
.logo-r img { width: 100%; height: 100%; object-fit: contain; display: block; }
.rep-stats { margin-bottom: 4px; }
</style>
