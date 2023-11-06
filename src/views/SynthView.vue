<template>
  <main>
    <div>
      <button @click="addSynth">Add Synth</button>
      <button @click="removeSynth">Remove Synth</button>
    </div>
    <div>
      <div v-for="(c, index) in config" :key="'synth-config-' + index">
        <SynthConfigInput v-model="config[index]" />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { el } from '@elemaudio/core'
import teoria from 'teoria'
import WebRenderer from '@elemaudio/web-renderer'
import { computed, ref } from 'vue'
import type { SynthModel, SynthConfig } from '@/lib/synth'
import { voiceOn, voiceOff, synthOut } from '@/lib/synth'
import SynthConfigInput from '@/components/SynthConfigInput.vue'

const config = ref<SynthConfig[]>([])
const model: SynthModel[] = []

interface SynthState {
  config: SynthConfig
  model: SynthModel
}

const state = computed(() => {
  const synthState: SynthState[] = []
  for (let i = 0; i < config.value.length; i++) {
    synthState.push({
      config: config.value[i],
      model: model[i]
    })
  }
  return synthState
})

let count = 0

function addSynth() {
  count++
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
  model.push({
    voices: [
      { gate: 0.0, freq: 440, key: `v1-${count}` },
      { gate: 0.0, freq: 440, key: `v2-${count}` },
      { gate: 0.0, freq: 440, key: `v3-${count}` },
      { gate: 0.0, freq: 440, key: `v4-${count}` }
    ],
    nextVoice: 0
  })
}

function removeSynth() {
  config.value.pop()
  model.pop()
}

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
  state.value.forEach((s) => {
    voiceOn(s.model, s.config, getFreqFromKey(key, s.config.octave))
  })
}

function synthVoicesOff(key: ValidKey) {
  state.value.forEach((s) => {
    voiceOff(s.model, getFreqFromKey(key, s.config.octave))
  })
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
  const s = state.value.map((s) => {
    return synthOut(s.model, s.config)
  })
  const out = el.add(...s)
  core.render(out, out)
}
</script>
