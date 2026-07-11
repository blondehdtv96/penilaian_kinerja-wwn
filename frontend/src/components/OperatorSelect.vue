<template>
  <div class="op-select" ref="rootEl" :class="{ open }">
    <button
      type="button"
      class="op-trigger"
      :disabled="loading"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="toggle"
    >
      <template v-if="selected">
        <span class="op-ava"><UserAvatar /></span>
        <span class="op-trigger-text">
          <span class="op-name">{{ selected.user.fullName }}</span>
          <span class="op-meta">{{ selected.employeeId }} · {{ selected.section }}</span>
        </span>
        <button type="button" class="op-clear" title="Kosongkan" @click.stop="clear">
          <ion-icon :icon="closeCircleOutline" />
        </button>
      </template>
      <span v-else class="op-placeholder">{{ loading ? 'Memuat operator…' : placeholder }}</span>
      <ion-icon :icon="chevronDownOutline" class="op-chevron" />
    </button>

    <transition name="op-pop">
      <div v-if="open" class="op-panel" role="listbox">
        <div class="op-search">
          <ion-icon :icon="searchOutline" />
          <input
            ref="searchEl"
            v-model="query"
            type="text"
            placeholder="Cari nama, No Code, atau section…"
            @keydown="onKeydown"
          />
        </div>
        <div class="op-list">
          <div v-if="loading" class="op-empty"><ion-spinner name="crescent" /> Memuat operator…</div>
          <div v-else-if="filtered.length === 0" class="op-empty">Operator tidak ditemukan.</div>
          <button
            v-for="(o, idx) in filtered"
            :key="o.id"
            type="button"
            role="option"
            class="op-item"
            :class="{ active: idx === activeIndex, selected: o.id === modelValue }"
            :aria-selected="o.id === modelValue"
            @mouseenter="activeIndex = idx"
            @click="select(o)"
          >
            <span class="op-ava"><UserAvatar /></span>
            <span class="op-item-text">
              <span class="op-name">{{ o.user.fullName }}</span>
              <span class="op-meta">{{ o.employeeId }} · {{ o.section }} · {{ o.group }}</span>
            </span>
            <ion-icon v-if="o.id === modelValue" :icon="checkmarkOutline" class="op-check" />
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { IonIcon, IonSpinner } from '@ionic/vue';
import { chevronDownOutline, searchOutline, checkmarkOutline, closeCircleOutline } from 'ionicons/icons';
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { operatorService } from '@/services/operators.service';
import UserAvatar from '@/components/UserAvatar.vue';
import type { OperatorListItem } from '@/types';

const props = withDefaults(
  defineProps<{ modelValue: number | null; required?: boolean; placeholder?: string }>(),
  { required: true, placeholder: 'Pilih operator…' },
);
const emit = defineEmits<{ (e: 'update:modelValue', v: number | null): void }>();

const operators = ref<OperatorListItem[]>([]);
const loading = ref(true);
const open = ref(false);
const query = ref('');
const activeIndex = ref(0);
const rootEl = ref<HTMLElement | null>(null);
const searchEl = ref<HTMLInputElement | null>(null);

onMounted(async () => {
  document.addEventListener('mousedown', onClickOutside);
  try {
    const { data } = await operatorService.getAll();
    if (data?.success) operators.value = data.data;
  } catch {
    /* abaikan — daftar tetap kosong */
  } finally {
    loading.value = false;
  }
});
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside));

const selected = computed(() => operators.value.find((o) => o.id === props.modelValue) || null);

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return operators.value;
  return operators.value.filter((o) => {
    const hay = `${o.user.fullName} ${o.employeeId} ${o.section} ${o.group}`.toLowerCase();
    return hay.includes(q);
  });
});

const onClickOutside = (e: MouseEvent) => {
  if (open.value && rootEl.value && !rootEl.value.contains(e.target as Node)) close();
};

const toggle = () => {
  if (loading.value) return;
  open.value ? close() : openPanel();
};

const openPanel = () => {
  open.value = true;
  query.value = '';
  const idx = filtered.value.findIndex((o) => o.id === props.modelValue);
  activeIndex.value = idx >= 0 ? idx : 0;
  nextTick(() => searchEl.value?.focus());
};

const close = () => { open.value = false; };

const select = (o: OperatorListItem) => {
  emit('update:modelValue', o.id);
  close();
};

const clear = () => {
  emit('update:modelValue', null);
  close();
};

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeIndex.value = Math.min(activeIndex.value + 1, filtered.value.length - 1);
    scrollActiveIntoView();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeIndex.value = Math.max(activeIndex.value - 1, 0);
    scrollActiveIntoView();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const o = filtered.value[activeIndex.value];
    if (o) select(o);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    close();
  }
};

const scrollActiveIntoView = () => {
  nextTick(() => {
    const list = rootEl.value?.querySelector('.op-list');
    const item = list?.querySelectorAll('.op-item')[activeIndex.value] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  });
};
</script>

<style scoped>
.op-select { position: relative; }

.op-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--db-card);
  color: var(--db-ink);
  border: 1px solid var(--db-line-2);
  border-radius: 10px;
  padding: 8px 13px;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease;
}
.op-trigger:hover { border-color: var(--db-line-2); }
.op-select.open .op-trigger,
.op-trigger:focus-visible { outline: none; border-color: var(--db-brand); }
.op-trigger:disabled { opacity: 0.6; cursor: not-allowed; }

.op-placeholder { color: var(--db-ink-3); flex: 1; font-size: 14px; }

.op-ava {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--db-icon-bg);
  color: var(--db-ink);
  display: grid;
  place-items: center;
  font-weight: 600;
  font-size: 11px;
  flex-shrink: 0;
}
.op-trigger-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  overflow: hidden;
}
.op-name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--db-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.op-meta {
  font-size: 11.5px;
  color: var(--db-ink-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.op-clear {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  color: var(--db-ink-3);
  background: transparent;
  border: none;
  font-size: 16px;
}
.op-clear:hover { background: var(--db-icon-bg); color: var(--db-ink); }
.op-chevron {
  flex-shrink: 0;
  font-size: 16px;
  color: var(--db-ink-3);
  transition: transform 0.15s ease;
}
.op-select.open .op-chevron { transform: rotate(180deg); }

.op-panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 40;
  background: var(--db-card);
  border: 1px solid var(--db-line);
  border-radius: 12px;
  box-shadow: var(--db-shadow-panel);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 340px;
}
.op-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--db-line);
  flex-shrink: 0;
}
.op-search ion-icon { font-size: 16px; color: var(--db-ink-3); flex-shrink: 0; }
.op-search input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font: inherit;
  font-size: 13.5px;
  color: var(--db-ink);
}
.op-search input::placeholder { color: var(--db-ink-3); }

.op-list { overflow-y: auto; padding: 6px; }
.op-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px 12px;
  color: var(--db-ink-3);
  font-size: 13px;
}
.op-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 9px;
  border-radius: 10px;
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
}
.op-item:hover,
.op-item.active { background: var(--db-icon-bg); }
.op-item.selected { background: color-mix(in srgb, var(--db-brand) 8%, transparent); }
.op-item-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.op-item .op-name { font-weight: 500; }
.op-check { color: var(--db-brand); font-size: 17px; flex-shrink: 0; }

.op-pop-enter-active, .op-pop-leave-active { transition: opacity 0.14s ease, transform 0.14s ease; }
.op-pop-enter-from, .op-pop-leave-to { opacity: 0; transform: translateY(-4px) scale(0.98); }
</style>
