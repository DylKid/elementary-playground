<template>
  <main>
    <!-- <p><strong>Press the Q key to stop noise</strong></p>
    <ADSRInput v-model="synthModel.adsr" />
    <div>
      <h4>Wave Type</h4>
      <select name="Wave Type" v-model="synthModel.waveType">
        <option value="sin">sin</option>
        <option value="saw">saw</option>
        <option value="square">square</option>
      </select>
    </div> -->
    <div>
      TODO: need to figure out how to v-model array
      <button @click="addSynth">Add Synth</button>
      <button @click="removeSynth">Remove Synth</button>
    </div>
    <SynthConfigInput v-model="synthConfig" />
    <SynthConfigInput v-model="synthConfig2" />
    <!-- <div v-for="[i, synthConfig] in config"> -->
    <!-- <SynthConfigInput v-model="synthConfig" /> -->
    <!-- </div> -->
  </main>
</template>

<script setup lang="ts">
import { el, type NodeRepr_t } from '@elemaudio/core'
import teoria from 'teoria'
import WebRenderer from '@elemaudio/web-renderer'
import { computed, onMounted, ref, watch } from 'vue'
import ADSRInput, { type ADSR } from '@/components/ADSRInput.vue'
import type { SynthModel, SynthConfig } from '@/lib/synth'
import { voiceOn, voiceOff, makeVoice, synthOut } from '@/lib/synth'
import SynthConfigInput from '@/components/SynthConfigInput.vue'

const config = ref<SynthConfig[]>([])

function addSynth() {
  config.value.push({
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
}

function removeSynth() {
  config.value.pop()
}

const adsr = ref<ADSR>()

watch(adsr, () => {
  console.log('watch', JSON.parse(JSON.stringify(adsr.value)))
})

const VALID_KEYS = ['a', 'w', 's', 'e', 'd', 'f', 't', 'g', 'y', 'h', 'u', 'j'] as const
type ValidKey = (typeof VALID_KEYS)[number]
type NoteMap = { [k in ValidKey]: string }

const NOTE_MAP: NoteMap = {
  a: 'C',
  w: 'C#',
  s: 'D',
  e: 'D#',
  d: 'E',
  f: 'F',
  t: 'F#',
  g: 'G',
  y: 'G#',
  h: 'A',
  u: 'A#',
  j: 'B'
}

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

const synthModel: SynthModel = {
  voices: [
    { gate: 0.0, freq: 440, key: 'v1-1' },
    { gate: 0.0, freq: 440, key: 'v2-1' },
    { gate: 0.0, freq: 440, key: 'v3-1' },
    { gate: 0.0, freq: 440, key: 'v4-1' }
  ],
  nextVoice: 0
}

const synthConfig2 = ref<SynthConfig>({
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

const synthModel2: SynthModel = {
  voices: [
    { gate: 0.0, freq: 440, key: 'v1-2' },
    { gate: 0.0, freq: 440, key: 'v2-2' },
    { gate: 0.0, freq: 440, key: 'v3-2' },
    { gate: 0.0, freq: 440, key: 'v4-2' }
  ],
  nextVoice: 0
}

// current list of keyboard keys currently pressed, may not include the same key twice
let keysDown: string[] = []

const core = new WebRenderer()
const ctx = new window.AudioContext()

function isValidKey(keyInput: string): keyInput is ValidKey {
  return ['a', 'w', 's', 'e', 'd', 'f', 't', 'g', 'y', 'h', 'u', 'j'].includes(keyInput)
}

function getFreqFromKey(key: ValidKey, octave: number): number {
  const note = NOTE_MAP[key] + octave
  return teoria.note(note).fq()
}

function synthVoicesOn(key: ValidKey) {
  voiceOn(synthModel, synthConfig.value, getFreqFromKey(key, synthConfig.value.octave))
  voiceOn(synthModel2, synthConfig2.value, getFreqFromKey(key, synthConfig2.value.octave))
}

function synthVoicesOff(key: ValidKey) {
  voiceOff(synthModel, getFreqFromKey(key, synthConfig.value.octave))
  voiceOff(synthModel2, getFreqFromKey(key, synthConfig2.value.octave))
}

function setupkeyboard() {
  document.addEventListener('keydown', (e) => {
    // panic quit key
    if (!isValidKey(e.key) && e.key === 'q') {
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      if (ctx.state === 'running') {
        ctx.suspend()
      }
    }
    // if key is a valid note and is not currently pressed
    if (isValidKey(e.key) && !keysDown.includes(e.key)) {
      // register the key, turn on a voice for that note and re-render
      keysDown.push(e.key)
      // turnVoiceOn(freq)
      synthVoicesOn(e.key)

      render()
    }
  })
  document.addEventListener('keyup', (e) => {
    // if the key is a valid note and that key has been pressed
    if (isValidKey(e.key) && keysDown.includes(e.key)) {
      // unregister the key pressed
      keysDown = keysDown.filter((key) => {
        return key !== e.key
      })
      // turn off a voice with that frequency (because only one particular frequency can be playing at a given time this should be unique)
      // turnVoiceOff(freq)
      // voiceOff(synthModel.value, freq)
      synthVoicesOff(e.key)
      render()
    }
  })
}

core.on('load', function () {
  if (ctx.state === 'suspended') {
    ctx.resume()
  }
  setupkeyboard()
})

document.addEventListener('pointerdown', async function start() {
  let node = await core.initialize(ctx, {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [2]
  })
  node.connect(ctx.destination)
  document.removeEventListener('pointerdown', start)
  ctx.resume()
  console.log('initialized')
})

function render() {
  const out1 = synthOut(synthModel, synthConfig.value)
  const out2 = synthOut(synthModel2, synthConfig2.value)
  const out = el.add(out1, out2)
  core.render(out, out)
}
</script>
