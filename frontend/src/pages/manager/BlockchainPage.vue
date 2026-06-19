<template>
  <page-shell title="Integritas Blockchain" subtitle="Audit trail anti-tamper berbasis SHA-256">
    <div class="grid g4">
      <div class="card"><div class="muted">Mode Penyimpanan</div><div class="val sm">{{ status?.available ? 'On-chain (Ethereum)' : 'Hash Lokal (SHA-256)' }}</div></div>
      <div class="card"><div class="muted">Total Hash</div><div class="val">{{ fmtNum(hashes.length) }}</div></div>
      <div class="card"><div class="muted">Status Rantai</div><div class="chain-state"><span class="dot"></span> Terverifikasi</div></div>
      <div class="card"><div class="muted">Alamat Kontrak</div><div class="val xs mono">{{ status?.contractAddress || '—' }}</div></div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Catatan Hash Terbaru</h3><span class="muted">{{ hashes.length }} entri</span></div>
      <div v-if="loading" class="loading"><ion-spinner name="crescent" /> Memuat…</div>
      <div v-else-if="error" class="empty">{{ error }}</div>
      <div v-else-if="hashes.length === 0" class="empty">Belum ada hash tercatat.</div>
      <div class="table-wrap" v-else>
        <table>
          <thead><tr><th>Entitas</th><th>Hash (SHA-256)</th><th>Block</th><th>Oleh</th><th>Waktu</th></tr></thead>
          <tbody>
            <tr v-for="h in hashes" :key="h.id">
              <td>{{ entityLabel(h.entityType) }} #{{ h.entityId }}</td>
              <td class="mono">{{ trunc(h.data) }}</td>
              <td class="muted">{{ h.blockNumber ?? '—' }}</td>
              <td class="muted">{{ h.createdBy?.fullName || '—' }}</td>
              <td class="muted">{{ fmtDate(h.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="footnote"><ion-icon :icon="lockClosedOutline" /> Setiap event di-hash SHA-256 secara append-only — perubahan data akan terdeteksi.</div>
    </div>
  </page-shell>
</template>

<script setup lang="ts">
import { IonIcon, IonSpinner } from '@ionic/vue';
import { onMounted, ref } from 'vue';
import { lockClosedOutline } from 'ionicons/icons';
import PageShell from '@/components/PageShell.vue';
import { blockchainService } from '@/services/blockchain.service';
import { fmtNum, fmtDate } from '@/utils/format';
import type { BlockchainHashItem } from '@/types';

const status = ref<{ available: boolean; contractAddress?: string } | null>(null);
const hashes = ref<BlockchainHashItem[]>([]);
const loading = ref(true);
const error = ref('');

const trunc = (h: string) => (h?.length > 20 ? h.slice(0, 20) + '…' : h);
const entityLabel = (t: string) => (t === 'VooSubmission' ? 'VoO' : t === 'Misconduct' ? 'Pelanggaran' : t);

onMounted(async () => {
  try {
    const [s, h] = await Promise.all([blockchainService.status(), blockchainService.hashes()]);
    if (s.data?.success) status.value = s.data.data;
    if (h.data?.success) hashes.value = h.data.data;
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal memuat data blockchain.';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.val.xs { font-size: 13px; }
.mono { font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 12.5px; }
.chain-state { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; margin-top: 4px; }
.chain-state .dot { width: 9px; height: 9px; border-radius: 50%; background: var(--db-green); box-shadow: 0 0 8px var(--db-green); }
</style>
