<template>
  <div class="adsr-container-container">
    <div class="adsr-container">
      <!-- Attack -->
      <div class="adsr-controller">
        <h4>Attack</h4>
        <select v-model="attackRangeIndex">
          <option value="0">1-10ms</option>
          <option value="1">10-100ms</option>
          <option value="2">100ms-1000ms</option>
          <option value="3">1-10s</option>
        </select>
        <PotInput v-model="attackFormValue" />
        <p>{{ precise(adsr.attack) }}</p>
      </div>
      <!-- Decay -->
      <div class="adsr-controller">
        <h4>Decay</h4>
        <select v-model="decayRangeIndex">
          <option value="0">1-10ms</option>
          <option value="1">10-100ms</option>
          <option value="2">100ms-1000ms</option>
          <option value="3">1-10s</option>
        </select>
        <PotInput v-model="decayFormValue" />
        <p>{{ precise(adsr.decay) }}</p>
      </div>

      <!-- Release -->
      <div class="adsr-controller">
        <h4>Release</h4>
        <select v-model="releaseRangeIndex">
          <option value="0">1-10ms</option>
          <option value="1">10-100ms</option>
          <option value="2">100ms-1000ms</option>
          <option value="3">1-10s</option>
        </select>
        <PotInput v-model="releaseFormValue" />
        <p>{{ precise(adsr.release) }}</p>
      </div>

      <!-- Sustain -->
      <div class="adsr-controller">
        <h4>Sustain</h4>
        <PotInput v-model="sustainFormValue" />
        <p>{{ precise(adsr.sustain) }}</p>
      </div>

      <EnvelopeGraph :adsr="adsr" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import mapNumberToRange from '@/lib/mapToRange'
import { computed, onMounted, ref, watch } from 'vue'
import PotInput from './PotInput.vue'
import EnvelopeGraph from './EnvelopeGraph.vue'

export interface ADSR {
  attack: number
  decay: number
  sustain: number
  release: number
}

function precise(x: number) {
  return x.toPrecision(6)
}

type ADRType = 'attack' | 'decay' | 'release'
type ADRRangeIndex = '0' | '1' | '2' | '3'

interface Range {
  start: number
  end: number
}

// 1-10ms, 10-100ms, 100-1000ms, and 1-10s
const RANGE_MAP: Record<ADRRangeIndex, Range> = {
  '0': { start: 0.001, end: 0.01 },
  '1': { start: 0.01, end: 0.1 },
  '2': { start: 0.1, end: 1 },
  '3': { start: 1, end: 1 }
}

const attackRangeIndex = ref<ADRRangeIndex>('2')
const decayRangeIndex = ref<ADRRangeIndex>('2')
const releaseRangeIndex = ref<ADRRangeIndex>('2')

function getAdrRange(index: ADRType): Range {
  switch (index) {
    case 'attack':
      return RANGE_MAP[attackRangeIndex.value]
    case 'decay':
      return RANGE_MAP[decayRangeIndex.value]
    case 'release':
      return RANGE_MAP[releaseRangeIndex.value]
  }
}

function adrValueToPot(adrValue: number, index: ADRType) {
  const range = getAdrRange(index)
  return mapNumberToRange(adrValue, range.start, range.end, 0, 100)
}

function potValueToAdr(adrValue: number, index: ADRType) {
  const range = getAdrRange(index)
  return mapNumberToRange(adrValue, 0, 100, range.start, range.end)
}

// positions of the pots (0-100)
const attackFormValue = ref(40)
const decayFormValue = ref(10)
const releaseFormValue = ref(20)
const sustainFormValue = ref(40)

// adsr envelope scaled
const adsr = computed(() => {
  return {
    attack: potValueToAdr(attackFormValue.value, 'attack'),
    decay: potValueToAdr(decayFormValue.value, 'decay'),
    release: potValueToAdr(releaseFormValue.value, 'release'),
    sustain: sustainFormValue.value / 100
  }
})

function adrIndexFromAdrValue(adr: number) {
  if (adr >= 0.001 && adr < 0.01) {
    return '0'
  } else if (adr >= 0.01 && adr < 0.1) {
    return '1'
  } else if (adr >= 0.1 && adr < 1) {
    return '2'
  } else if (adr >= 1 && adr < 10) {
    return '3'
  } else {
    throw new Error('Input out of range')
  }
}

// watch(props.modelValue, () => {
//   adrRangeIndexes.value.a = adrIndexFromAdrValue(props.modelValue.attack)
//   adrRangeIndexes.value.d = adrIndexFromAdrValue(props.modelValue.decay)
//   adrRangeIndexes.value.r = adrIndexFromAdrValue(props.modelValue.release)
//   attackFormValue.value = adrValueToPot(props.modelValue.attack, 'a')
//   decayFormValue.value = adrValueToPot(props.modelValue.decay, 'd')
//   releaseFormValue.value = adrValueToPot(props.modelValue.release, 'r')

//   console.log('form value converted attack (watch)', attackFormValue.value)
//   console.log('form value converted decay (watch)', decayFormValue.value)
//   console.log('form value converted release (watch)', releaseFormValue.value)
// })

// onMounted(() => {
//   adrRangeIndexes.value.a = adrIndexFromAdrValue(props.modelValue.attack)
//   adrRangeIndexes.value.d = adrIndexFromAdrValue(props.modelValue.decay)
//   adrRangeIndexes.value.r = adrIndexFromAdrValue(props.modelValue.release)
//   attackFormValue.value = adrValueToPot(props.modelValue.attack, 'a')
//   decayFormValue.value = adrValueToPot(props.modelValue.decay, 'd')
//   releaseFormValue.value = adrValueToPot(props.modelValue.release, 'r')
//   console.log('props.modelValue.attack', props.modelValue.attack)
//   console.log('props.modelValue.decay', props.modelValue.decay)
//   console.log('props.modelValue.release', props.modelValue.release)
//   console.log('form value converted attack', attackFormValue.value)
//   console.log('form value converted decay', decayFormValue.value)
//   console.log('form value converted release', releaseFormValue.value)
// })

const props = defineProps<{
  modelValue: ADSR
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: ADSR): void
}>()

watch(adsr, () => {
  console.log('watch ADSR (adsr input)')
  emit('update:modelValue', adsr.value)
})
</script>

<style>
.adsr-container {
  display: flex;
  flex-direction: row;
}

.adsr-controller {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-right: 50px;
}

.adsr-controller h2,
h3,
h4 {
  margin: 0px;
  padding: 0px;
}
</style>
