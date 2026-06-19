<template>
  <select :value="modelValue ?? ''" @change="onChange" :required="required">
    <option value="" disabled>{{ loading ? 'Memuat operator…' : 'Pilih operator…' }}</option>
    <option v-for="o in operators" :key="o.id" :value="o.id">
      {{ o.user.fullName }} — {{ o.employeeId }} ({{ o.section }})
    </option>
  </select>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { operatorService } from '@/services/operators.service';
import type { OperatorListItem } from '@/types';

withDefaults(defineProps<{ modelValue: number | null; required?: boolean }>(), { required: true });
const emit = defineEmits<{ (e: 'update:modelValue', v: number | null): void }>();

const operators = ref<OperatorListItem[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await operatorService.getAll();
    if (data?.success) operators.value = data.data;
  } catch {
    /* abaikan — select tetap kosong */
  } finally {
    loading.value = false;
  }
});

const onChange = (e: Event) => {
  const v = (e.target as HTMLSelectElement).value;
  emit('update:modelValue', v ? Number(v) : null);
};
</script>
