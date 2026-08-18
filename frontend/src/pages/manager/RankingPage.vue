<template>
  <page-shell title="Ranking Operator" subtitle="Peringkat kinerja berdasarkan skor akumulatif">
    <template #actions>
      <select class="filter-sel" v-model="section">
        <option value="">Semua Section</option>
        <option v-for="s in sections" :key="s" :value="s">{{ s }}</option>
      </select>
    </template>

    <div v-if="loading" class="loading"><ion-spinner name="crescent" /> Memuat…</div>
    <div v-else-if="error" class="card"><div class="empty">{{ error }}</div></div>

    <template v-else>
      <div class="grid g3" v-if="podium.length">
        <div class="card podium" v-for="(o, i) in podium" :key="o.id" :class="'p' + (i + 1)">
          <div class="pm-rank">#{{ i + 1 }}</div>
          <div class="pm-ava"><UserAvatar /></div>
          <div class="pm-name">{{ o.user.fullName }}</div>
          <div class="pm-score">{{ o.performanceScore }}</div>
          <div class="pm-sub">{{ o.section }} · {{ o.totalMerit }} VoO disetujui</div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Peringkat Lengkap</h3><span class="muted">{{ ranked.length }} operator</span></div>
        <div v-if="ranked.length === 0" class="empty">Tidak ada operator pada section ini.</div>
        <div class="table-wrap" v-else>
          <table>
            <thead><tr><th>#</th><th>Operator</th><th>Section</th><th class="amt">Skor</th><th class="amt">VoO</th><th class="amt">Pelanggaran</th></tr></thead>
            <tbody>
              <tr v-for="(o, i) in ranked" :key="o.id" class="row-link" @click="go(`/operators/${o.id}`)">
                <td class="rank-no">{{ i + 1 }}</td>
                <td><div class="who"><div class="t-ava"><UserAvatar /></div>{{ o.user.fullName }}</div></td>
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
import { IonSpinner, onIonViewWillEnter } from '@ionic/vue';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import PageShell from '@/components/PageShell.vue';
import { operatorService } from '@/services/operators.service';
import { useRealtime } from '@/composables/useRealtime';
import UserAvatar from '@/components/UserAvatar.vue';
import type { OperatorListItem } from '@/types';

const router = useRouter();
const go = (p: string) => router.push(p);
const all = ref<OperatorListItem[]>([]);
const loading = ref(true);
const error = ref('');
const section = ref('');

const sections = computed(() => [...new Set(all.value.map((o) => o.section).filter(Boolean))]);
const ranked = computed(() => (section.value ? all.value.filter((o) => o.section === section.value) : all.value));
const podium = computed(() => ranked.value.slice(0, 3));

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await operatorService.ranking();
    if (data?.success) all.value = data.data;
    else error.value = 'Gagal memuat ranking.';
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Gagal memuat ranking.';
  } finally {
    loading.value = false;
  }
};

onIonViewWillEnter(load);
useRealtime(['voo:changed', 'record:changed'], load);
</script>

<style scoped>
.podium { text-align: center; position: relative; overflow: hidden; }
.podium::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: var(--db-line-2); }
.podium.p1::before { background: var(--db-brand); }
.pm-rank { font-size: 13px; font-weight: 700; color: var(--db-ink-3); }
.podium.p1 .pm-rank { color: var(--db-brand); }
.pm-ava {
  width: 56px; height: 56px; border-radius: 50%; background: var(--db-icon-bg); color: var(--db-ink);
  display: grid; place-items: center; font-weight: 700; font-size: 19px; margin: 10px auto 8px;
}
.podium.p1 .pm-ava { background: var(--db-brand); color: #fff; }
.pm-name { font-size: 14.5px; font-weight: 600; }
.pm-score { font-size: 30px; font-weight: 800; letter-spacing: -0.02em; margin: 4px 0; }
.pm-sub { font-size: 12px; color: var(--db-ink-2); }
.row-link { cursor: pointer; }
.row-link:hover { background: var(--db-icon-bg); }
</style>
