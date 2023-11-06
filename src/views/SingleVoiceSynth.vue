<template>
  <main>
    <p>
      While called a 'single voice synth' what I mean is that each note pressed only uses a single
      oscilator, but you can play four notes at once on this baby~
    </p>
    <!-- <p><strong>Press the Q key to stop noise</strong></p>
    <div>
      <h2>Octave</h2>
      <input type="number" max="9" min="1" v-model="octave" />
    </div>
    <div>
      <h2>ADSR</h2>
      <h3 class="m-0 p-0">Attack</h3>
      <div>
        <select v-model="adrRangeIndexes.a">
          <option value="0">1-10ms</option>
          <option value="1">10-100ms</option>
          <option value="2">100ms-1000ms</option>
          <option value="3">1-10s</option>
        </select>
      </div>
      <PotInput label="Attack" v-model="attackFormValue" />
      <p>The higher the value the longer it takes for the sound to reach full volume</p>

      <h3 class="m-0 p-0">Decay</h3>
      <div>
        <select v-model="adrRangeIndexes.d">
          <option value="0">1-10ms</option>
          <option value="1">10-100ms</option>
          <option value="2">100ms-1000ms</option>
          <option value="3">1-10s</option>
        </select>
      </div>
      <PotInput label="Decay" v-model="decayFormValue" />
      <p>Time that it takes for the amplitude to go from 'attack volume' to 'sustain volume'</p>

      <h3 class="m-0 p-0">Sustain</h3>
      <PotInput label="Sustain" v-model="sustainFormValue" />
      <p>The level of amplitude (0 - 100)% we are keeping as long as the key is pressed</p>

      <h3 class="m-0 p-0">Release</h3>
      <div>
        <select v-model="adrRangeIndexes.r">
          <option value="0">1-10ms</option>
          <option value="1">10-100ms</option>
          <option value="2">100ms-1000ms</option>
          <option value="3">1-10s</option>
        </select>
      </div>
      <PotInput label="Release" v-model="releaseFormValue" />
      <p>The time that it takes for the amplitude to go to 0 after the key is pressed</p>

      <EnvelopeGraph :adsr="adsr" />
    </div>
    <h1>Wave Type</h1>
    <select name="Wave Type" v-model="waveType">
      <option value="sin">sin</option>
      <option value="saw">saw</option>
      <option value="square">square</option>
    </select> -->
  </main>
</template>

<script setup lang="ts">
import { el, type NodeRepr_t } from '@elemaudio/core'
import teoria from 'teoria'
import WebRenderer from '@elemaudio/web-renderer'
import { computed, ref } from 'vue'
import PotInput from '@/components/PotInput.vue'
import EnvelopeGraph from '@/components/EnvelopeGraph.vue'
import mapNumberToRange from '@/lib/mapToRange'

type ADR = 'a' | 'd' | 'r'
type ADRRange = '0' | '1' | '2' | '3'

// 1-10ms, 10-100ms, 100-1000ms, and 1-10s
const RANGE_MAP: Record<ADRRange, number[]> = {
  '0': [0.001, 0.01],
  '1': [0.01, 0.1],
  '2': [0.1, 1],
  '3': [1, 10]
}

const adrRangeIndexes = ref<Record<ADR, ADRRange>>({
  a: '2',
  d: '2',
  r: '2'
})

const adrRangeMap = computed(() => {
  return {
    a: RANGE_MAP[adrRangeIndexes.value.a],
    d: RANGE_MAP[adrRangeIndexes.value.d],
    r: RANGE_MAP[adrRangeIndexes.value.r]
  }
})

function potToAdrRange(potValue: number, index: ADR) {
  return mapNumberToRange(
    potValue,
    0,
    100,
    adrRangeMap.value[index][0],
    adrRangeMap.value[index][1]
  )
}

// adsr envelope from values
const attackFormValue = ref(40)
const decayFormValue = ref(10)
const sustainFormValue = ref(40)
const releaseFormValue = ref(20)

// adsr envelope scaled
const adsr = computed(() => {
  return {
    attack: potToAdrRange(attackFormValue.value, 'a'),
    decay: potToAdrRange(decayFormValue.value, 'd'),
    sustain: sustainFormValue.value / 100,
    release: potToAdrRange(releaseFormValue.value, 'r')
  }
})

const octave = ref(5)

type WaveType = 'sin' | 'saw' | 'square'

interface Voice {
  gate: number
  freq: number
  key: string
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

// each voice of the synth, may not trigger multiple times for the same note
let voices = [
  { gate: 0.0, freq: 440, key: 'v1' },
  { gate: 0.0, freq: 440, key: 'v2' },
  { gate: 0.0, freq: 440, key: 'v3' },
  { gate: 0.0, freq: 440, key: 'v4' }
]
// index of next voice in voices to assign in a basic round-robin scheme
let nextVoice = 0

// current list of keyboard keys currently pressed, may not include the same key twice
let keysDown: string[] = []

// wave form to generate
const waveType = ref<WaveType>('sin')

const core = new WebRenderer()
const ctx = new window.AudioContext()

function isStringKey(keyInput: string): keyInput is ValidKey {
  return ['a', 'w', 's', 'e', 'd', 'f', 't', 'g', 'y', 'h', 'u', 'j'].includes(keyInput)
}

function getFreqFromKey(key: ValidKey): number {
  const note = NOTE_MAP[key] + octave.value
  return teoria.note(note).fq()
}

function setupkeyboard() {
  document.addEventListener('keydown', (e) => {
    // panic quit key
    if (!isStringKey(e.key) && e.key === 'q') {
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      if (ctx.state === 'running') {
        ctx.suspend()
      }
    }
    // if key is a valid note and is not currently pressed
    if (isStringKey(e.key) && !keysDown.includes(e.key)) {
      // register the key, turn on a voice for that note and re-render
      keysDown.push(e.key)
      const freq = getFreqFromKey(e.key)
      turnVoiceOn(freq)
      render()
    }
  })
  document.addEventListener('keyup', (e) => {
    // if the key is a valid note and that key has been pressed
    if (isStringKey(e.key) && keysDown.includes(e.key)) {
      // unregister the key pressed
      keysDown = keysDown.filter((key) => {
        return key !== e.key
      })
      const freq = getFreqFromKey(e.key)
      // turn off a voice with that frequency (because only one particular frequency can be playing at a given time this should be unique)
      turnVoiceOff(freq)
      render()
    }
  })
}

function turnVoiceOn(freq: number) {
  voices[nextVoice].gate = 1.0
  voices[nextVoice].freq = freq
  // go back to the start
  if (++nextVoice >= voices.length) {
    nextVoice = 0
  }
}

function turnVoiceOff(freq: number) {
  voices.forEach((voice) => {
    if (voice.freq === freq) {
      voice.gate = 0.0
    }
  })
}

function synthVoice(voice: Voice) {
  const gate = el.const({ key: `${voice.key}:gate`, value: 0.2 * voice.gate })
  const env = el.adsr(
    adsr.value.attack,
    adsr.value.decay,
    adsr.value.sustain,
    adsr.value.release,
    gate
  )
  let tone
  switch (waveType.value) {
    case 'sin':
      tone = el.cycle(el.const({ key: `${voice.key}:freq`, value: voice.freq }))
      break
    case 'saw':
      tone = el.saw(el.const({ key: `${voice.key}:freq`, value: voice.freq }))
      break
    case 'square':
      tone = el.square(el.const({ key: `${voice.key}:freq`, value: voice.freq }))
      break
    default:
      tone = el.cycle(el.const({ key: `${voice.key}:freq`, value: voice.freq }))
  }
  return el.mul(env, tone)
}

function render() {
  let out = el.add(...voices.map(synthVoice))
  core.render(out, out)
}

core.on('load', function () {
  if (ctx.state === 'suspended') {
    ctx.resume()
  }
  setupkeyboard()
})

document.addEventListener('pointerdown', async function start(e) {
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
</script>
