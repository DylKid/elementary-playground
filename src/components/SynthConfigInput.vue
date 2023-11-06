<template>
  <div class="synth-input-container">
    <div>
      <h4>Volume</h4>
      <PotInput v-model="volumeFormValue" />
    </div>
    <ADSRInput v-model="synthConfig.adsr" />
    <div>
      <h4>Wave Type</h4>
      <select name="Wave Type" v-model="synthConfig.waveType">
        <option value="sin">sin</option>
        <option value="saw">saw</option>
        <option value="square">square</option>
      </select>
    </div>
    <div>
      <h4>Octave</h4>
      <input type="number" max="9" min="1" v-model="synthConfig.octave" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import ADSRInput, { type ADSR } from '@/components/ADSRInput.vue'
import type { SynthConfig, WaveType } from '@/lib/synth'
import mapNumberToRange from '@/lib/mapToRange'
import PotInput from './PotInput.vue'

const volumeFormValue = ref(100)

watch(volumeFormValue, () => {
  synthConfig.value.volume = mapNumberToRange(volumeFormValue.value, 0, 100, 0, 1)
})

const synthConfig = ref<SynthConfig>({
  waveType: 'sin',
  octave: 5,
  adsr: {
    attack: 0.002,
    decay: 0.02,
    sustain: 80,
    release: 0.2
  },
  volume: 1
})

// watch(synthModel.value, () => {
//   console.log('synth model update')
// })

onMounted(() => {
  synthConfig.value = props.modelValue
})

const props = defineProps<{
  modelValue: SynthConfig
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: SynthConfig): void
}>()

watch(synthConfig, () => {
  console.log('watch ADSR (adsr input)')
  emit('update:modelValue', synthConfig.value)
})
</script>

<style>
.synth-input-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
}
</style>
