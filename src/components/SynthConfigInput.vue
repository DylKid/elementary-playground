<template>
  <div class="synth-input-container">
    <div class="adsr-controller">
      <h4>Volume</h4>
      <PotInput v-model="volumeFormValue" @update:model-value="update" />
      <p>{{ volumeFormValue / 100 }}</p>
    </div>
    <ADSRInput v-model="adsr" @update:model-value="update" />
    <div>
      <h4>Wave Type</h4>
      <select v-model="waveType" @change="update" ref="waveTypeSelect">
        <option value="sin">sin</option>
        <option value="saw">saw</option>
        <option value="square">square</option>
      </select>
    </div>
    <div>
      <h4>Octave</h4>
      <input type="number" max="9" min="1" v-model="octave" @input="update" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import ADSRInput, { type ADSR } from '@/components/ADSRInput.vue'
import type { SynthConfig, WaveType } from '@/lib/synth'
import PotInput from './PotInput.vue'

const waveTypeSelect = ref(null)

const props = defineProps<{
  modelValue: SynthConfig
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: SynthConfig): void
}>()

const volumeFormValue = ref(100)
const waveType = ref<WaveType>('sin')
const octave = ref(5)
const adsr = ref<ADSR>({
  attack: 1,
  decay: 1,
  sustain: 0.2,
  release: 0.01
})

onMounted(() => {
  updateFromProps(props.modelValue)
})
watch(props, () => {
  updateFromProps(props.modelValue)
})

function updateFromProps(props: SynthConfig) {
  waveType.value = props.waveType.toString() as WaveType
  octave.value = props.octave
  adsr.value = props.adsr
  volumeFormValue.value = Math.round((props.volume > 1 ? 1 : props.volume) * 100)
}

function update() {
  emit('update:modelValue', {
    waveType: waveType.value,
    octave: octave.value,
    adsr: { ...adsr.value },
    volume: volumeFormValue.value / 100
  })
}

// function updateAdsr(value: ADSR) {
//   console.log('update adsr', value)

//   emit('update:modelValue', data)
// }

// function updateVolume(value: number) {
//   const data = { ...synthConfig.value, volume: mapNumberToRange(value, 0, 100, 0, 1) }
//   emit('update:modelValue', data)
// }

// onMounted(() => {
//   synthConfig.value = { ...props.modelValue }
//   volumeFormValue.value = mapNumberToRange(props.modelValue.volume, 0, 1, 0, 100)
//   // console.log('synth config on mounted')
//   // console.log('synth config value')
//   // console.log(JSON.parse(JSON.stringify(synthConfig.value)))
//   console.log('synth config props')
//   console.log(JSON.parse(JSON.stringify(props.modelValue)))
// })

// watch(synthConfig, () => {
//   synthConfig.value = { ...props.modelValue }
//   volumeFormValue.value = mapNumberToRange(props.modelValue.volume, 0, 1, 0, 100)
//   console.log('synthConfig on watch value', synthConfig.value.adsr.attack)
// })

// watch(props, () => {
//   synthConfig.value = { ...props.modelValue }
//   volumeFormValue.value = mapNumberToRange(props.modelValue.volume, 0, 1, 0, 100)
//   console.log('synthConfig on watch props', synthConfig.value.adsr.attack)
// })
</script>

<style>
.synth-input-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
}
.adsr-controller {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-right: 50px;
}
</style>
