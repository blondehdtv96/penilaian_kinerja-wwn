<template>
  <div class="my-filter">
    <select class="my-sel" v-model="monthModel" aria-label="Filter bulan">
      <option value="">Semua Bulan</option>
      <option v-for="(m, idx) in monthNames" :key="idx" :value="idx + 1">{{ m }}</option>
    </select>
    <select class="my-sel" v-model="yearModel" aria-label="Filter tahun">
      <option value="">Semua Tahun</option>
      <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
    </select>
    <button v-if="modelValue.month || modelValue.year" type="button" class="my-clear" title="Hapus filter" @click="clear">
      <ion-icon :icon="closeCircleOutline" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { closeCircleOutline } from 'ionicons/icons';
import { computed } from 'vue';

export interface MonthYearValue {
  month?: number | null;
  year?: number | null;
}

const props = withDefaults(defineProps<{ modelValue: MonthYearValue; yearsBack?: number }>(), {
  yearsBack: 5,
});
const emit = defineEmits<{ (e: 'update:modelValue', v: MonthYearValue): void }>();

const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const currentYear = new Date().getFullYear();
const years = computed(() => {
  const list: number[] = [];
  for (let y = currentYear; y > currentYear - props.yearsBack; y--) list.push(y);
  return list;
});

const monthModel = computed({
  get: () => props.modelValue.month ?? '',
  set: (v: number | string) => emit('update:modelValue', { ...props.modelValue, month: v === '' ? null : Number(v) }),
});
const yearModel = computed({
  get: () => props.modelValue.year ?? '',
  set: (v: number | string) => emit('update:modelValue', { ...props.modelValue, year: v === '' ? null : Number(v) }),
});

const clear = () => emit('update:modelValue', { month: null, year: null });
</script>

<style scoped>
.my-filter { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.my-sel {
  border: 1px solid var(--db-line-2);
  border-radius: 9px;
  padding: 8px 12px;
  font: inherit;
  font-size: 13px;
  background: var(--db-card);
  color: var(--db-ink);
  cursor: pointer;
}
.my-sel:focus { outline: none; border-color: var(--db-brand); }
.my-clear {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--db-ink-3);
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;
}
.my-clear:hover { background: var(--db-icon-bg); color: var(--db-ink); }
</style>
