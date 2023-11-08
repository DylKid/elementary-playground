<template>
  <div class="adsr-container-container">
    <!-- <button @click="bump">Bump</button> -->
    <div class="adsr-container">
      <div class="adsr-controller">
        <h4>Attack</h4>
        <select v-model="attackRangeIndex" @change="update">
          <option value="0">1-10ms</option>
          <option value="1">10-100ms</option>
          <option value="2">100ms-1000ms</option>
          <option value="3">1-10s</option>
        </select>
        <!-- <PotInput :model-value="attackFormValue" @update:model-value="update('attack', $event)" /> -->
        <PotInput v-model="attackFormValue" @update:model-value="update" />
        <p>{{ precise(adsr.attack) }}</p>
      </div>

      <div class="adsr-controller">
        <h4>Decay</h4>
        <select v-model="decayRangeIndex" @change="update">
          <option value="0">1-10ms</option>
          <option value="1">10-100ms</option>
          <option value="2">100ms-1000ms</option>
          <option value="3">1-10s</option>
        </select>
        <!-- <PotInput :model-value="decayFormValue" @update:model-value="update('decay', $event)" /> -->
        <PotInput v-model="decayFormValue" @update:model-value="update" />
        <p>{{ precise(adsr.decay) }}</p>
      </div>

      <div class="adsr-controller">
        <h4>Release</h4>
        <select v-model="releaseRangeIndex" @change="update">
          <option value="0">1-10ms</option>
          <option value="1">10-100ms</option>
          <option value="2">100ms-1000ms</option>
          <option value="3">1-10s</option>
        </select>
        <!-- <PotInput :model-value="releaseFormValue" @update:model-value="update('release', $event)" /> -->
        <PotInput v-model="releaseFormValue" @update:model-value="update" />
        <p>{{ precise(adsr.release) }}</p>
      </div>

      <div class="adsr-controller">
        <h4>Sustain</h4>
        <PotInput v-model="sustainFormValue" @update:model-value="update" />
        <p>{{ adsr.sustain }}</p>
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

const round = (n: number) => parseFloat(n.toFixed(6))

const limit = (n: number) => (n > 10 ? 10 : n)

function bump() {
  attackFormValue.value = parseFloat((attackFormValue.value + 1).toFixed(6))
  console.log('bump')
  console.log(attackFormValue.value)
  // decayFormValue.value = parseFloat(decayFormValue.value + (0.01).toFixed(6))
  // releaseFormValue.value = parseFloat(releaseFormValue.value + (0.01).toFixed(6))
  // sustainFormValue.value = parseFloat(sustainFormValue.value + (0.01).toFixed(6))
}

export interface ADSR {
  attack: number
  decay: number
  sustain: number
  release: number
}

type ADRType = 'attack' | 'decay' | 'release'
type ADSRType = 'attack' | 'decay' | 'release' | 'sustain'
type ADRRangeIndex = '0' | '1' | '2' | '3'

interface Range {
  start: number
  end: number
}

// 1-10ms, 10-100ms, 100-1000ms, and 1-10s
const RANGE_MAP: Record<ADRRangeIndex, Range> = {
  '0': { start: 0.001, end: 0.0099999 },
  '1': { start: 0.01, end: 0.099999 },
  '2': { start: 0.1, end: 0.999999 },
  '3': { start: 1, end: 10 }
}

function precise(x: number) {
  return x.toPrecision(3)
}

interface Props {
  modelValue: ADSR
}
const props = withDefaults(defineProps<Props>(), {})

const emit = defineEmits<{
  (e: 'update:modelValue', value: ADSR): void
}>()

const attackRangeIndex = ref<ADRRangeIndex>('2')
const decayRangeIndex = ref<ADRRangeIndex>('2')
const releaseRangeIndex = ref<ADRRangeIndex>('2')

// positions of the pots (0-100)
const attackFormValue = ref(10)
const decayFormValue = ref(10)
const releaseFormValue = ref(20)
const sustainFormValue = ref(40)

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
  return round(mapNumberToRange(adrValue, range.start, range.end, 0, 100))
}

function potValueToAdr(adrValue: number, index: ADRType): number {
  const range = getAdrRange(index)
  return limit(round(mapNumberToRange(adrValue, 0, 100, range.start, range.end)))
}

function adrIndexFromAdrValue(adr: number) {
  if (adr >= 0.001 && adr < 0.01) {
    return '0'
  } else if (adr >= 0.01 && adr < 0.1) {
    return '1'
  } else if (adr >= 0.1 && adr < 1) {
    return '2'
  } else if (adr >= 1 && adr <= 11) {
    return '3'
  } else {
    throw new Error('out of range')
  }
}

// adsr envelope scaled
const adsr = computed(() => {
  console.log('<==== compute adsr ====>', attackFormValue.value)
  const newVal = {
    attack: potValueToAdr(attackFormValue.value, 'attack'),
    decay: potValueToAdr(decayFormValue.value, 'decay'),
    release: potValueToAdr(releaseFormValue.value, 'release'),
    sustain: sustainFormValue.value / 100
  }
  return newVal
})

watch(props, () => {
  console.log('watch props', JSON.parse(JSON.stringify(props.modelValue)))
  updateFromProps(props.modelValue)
})
onMounted(async () => {
  updateFromProps(props.modelValue)
})

function updateFromProps(props: ADSR) {
  attackRangeIndex.value = adrIndexFromAdrValue(props.attack)
  decayRangeIndex.value = adrIndexFromAdrValue(props.decay)
  releaseRangeIndex.value = adrIndexFromAdrValue(props.release)
  attackFormValue.value = adrValueToPot(props.attack, 'attack')
  decayFormValue.value = adrValueToPot(props.decay, 'decay')
  releaseFormValue.value = adrValueToPot(props.release, 'release')
  sustainFormValue.value = Math.round((props.sustain > 1 ? 1 : props.sustain) * 100)
}

function update() {
  const data: Record<ADSRType, number> = {
    attack: potValueToAdr(attackFormValue.value, 'attack'),
    decay: potValueToAdr(decayFormValue.value, 'decay'),
    release: potValueToAdr(releaseFormValue.value, 'release'),
    sustain: sustainFormValue.value / 100
  }
  emit('update:modelValue', data)
}

// TODO: bi-directional data
// watch(props.modelValue, () => {
//   console.log('watch props')
//   attackRangeIndex.value = adrIndexFromAdrValue(props.modelValue.attack)
//   decayRangeIndex.value = adrIndexFromAdrValue(props.modelValue.decay)
//   releaseRangeIndex.value = adrIndexFromAdrValue(props.modelValue.release)

//   attackFormValue.value = adrValueToPot(props.modelValue.attack, 'attack')
//   decayFormValue.value = adrValueToPot(props.modelValue.decay, 'decay')
//   releaseFormValue.value = adrValueToPot(props.modelValue.release, 'release')
//   sustainFormValue.value = props.modelValue.sustain

//   // console.log('props.modelValue.attack', props.modelValue.attack)
//   // // console.log('props.modelValue.decay', props.modelValue.decay)
//   // // console.log('props.modelValue.release', props.modelValue.release)
//   // console.log('form value converted attack', attackFormValue.value)
//   // // console.log('form value converted decay', decayFormValue.value)
//   // // console.log('form value converted release', releaseFormValue.value)
// })

// watch(adsr, () => {
//   emit('update:modelValue', { ...adsr.value })
// })
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
}

.adsr-controller h2,
h3,
h4 {
  margin: 0px;
  padding: 0px;
}
</style>
