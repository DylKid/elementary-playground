<template>
  <div class="wrapper">
    <SynthView />
    <!-- <button @click="increment">Increment</button> -->
    <!-- <PotInput :model-value="potValue" @update:model-value="update" /> -->
    <!-- <PotInput v-model="potValue" @update:model-value="logUpdate" /> -->
    <!-- <ADSRInput v-model="adsr" @update:model-value="logUpdate" /> -->
    <!-- <SynthConfigInput v-model="config" @update:model-value="logUpdate" /> -->
    <!-- <p>Value {{ config }}</p> -->
  </div>
  <!-- <header>
    <div class="wrapper">
      <nav>
        <RouterLink to="/single-voice-synth"> Single Note Synth </RouterLink>
        <RouterLink to="/multi-voice-synth"> Multi Voice Synth </RouterLink>
      </nav>
    </div>
  </header>
  <RouterView /> -->
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import SynthView from '@/views/SynthView.vue'
import PotInput from './components/PotInput.vue'
import ADSRInput, { type ADSR } from './components/ADSRInput.vue'
import SynthConfigInput from '@/components/SynthConfigInput.vue'
import { ref, watch } from 'vue'
import type { SynthConfig } from './lib/synth'

const adsr = ref<ADSR>({
  attack: 0.005,
  decay: 0.05,
  sustain: 0.5,
  release: 0.5
})

const config = ref<SynthConfig>({
  waveType: 'saw',
  octave: 9,
  adsr: {
    attack: 1,
    decay: 1,
    sustain: 1,
    release: 1
  },
  volume: 0.05
})

watch(adsr, () => {
  console.log('app watch', JSON.parse(JSON.stringify(adsr.value)))
})

const potValue = ref(10)

function increment() {
  config.value.adsr.attack = config.value.adsr.attack + 0.1
  config.value.adsr.decay = config.value.adsr.decay + 0.1
  config.value.adsr.sustain = config.value.adsr.sustain + 0.1
  config.value.adsr.release = config.value.adsr.release + 0.1

  // adsr.value.attack = adsr.value.attack + 0.1
  // adsr.value.decay = adsr.value.decay + 0.1
  // adsr.value.sustain = adsr.value.sustain + 0.1
  // adsr.value.release = adsr.value.release + 0.1
}

function logUpdate(value: any) {
  console.log('log update', value)
}

function update(value: SynthConfig) {
  console.log(potValue)
  config.value = value
}
</script>
