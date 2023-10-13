<template>
  <main>
    <p>
      While called a 'single voice synth' what I mean is that each note pressed only uses a single
      oscilator, but you can play four notes at once on this baby~
    </p>
    <p><strong>Press the Q key to stop noise</strong></p>
    <div>
      <h2>Octave</h2>
      <input type="number" max="9" min="1" v-model="octave" />
    </div>
    <div>
      <h2>ASDR</h2>
      <ControlPot label="Attack" v-model="attack" />
      <p>The higher the value the longer it takes for the sound to reach full volume</p>
      <p>Time that it takes for the amplitude to go from 'attack volume' to 'sustain volume'</p>
      <ControlPot label="Decay" v-model="decay" />
      <p>The level of amplitude (1 - 100) we are keeping as long as the key is pressed</p>
      <ControlPot label="Sustain" v-model="sustain" />
      <p>The time that it takes for the amplitude to go to 0 after the key is pressed</p>
      <ControlPot label="Release" v-model="release" />
      <p>The time that it takes for the amplitude to go to 0 after the key is pressed</p>
    </div>
    <h1>Wave Type</h1>
    <select name="Wave Type" v-model="waveType">
      <option value="sin">sin</option>
      <option value="saw">saw</option>
      <option value="square">square</option>
      <option value="triange">triange</option>
    </select>
  </main>
</template>

<script setup lang="ts">
import { el, type NodeRepr_t } from '@elemaudio/core'
import teoria from 'teoria'
import WebRenderer from '@elemaudio/web-renderer'
import { ref } from 'vue'
import ControlPot from '@/components/ControlPot.vue'

type WaveType = 'sin' | 'saw' | 'square' | 'triangle'

type ElementaryNode = number | NodeRepr_t

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

// octave of the current note e.g. C#5
const octave = ref(5)
// asdr envelope
const attack = ref(40)
const decay = ref(10)
const sustain = ref(40)
const release = ref(20)
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
  const realAttack = attack.value / 10
  const realSustain = sustain.value / 100
  const realDecay = decay.value / 10
  const realRelease = release.value / 10
  const gate = el.const({ key: `${voice.key}:gate`, value: 0.2 * voice.gate })
  const env = el.adsr(realAttack, realDecay, realSustain, realRelease, gate)
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
    case 'triangle':
      tone = el.triangle(el.const({ key: `${voice.key}:freq`, value: voice.freq }))
      break
    default:
      tone = el.cycle(el.const({ key: `${voice.key}:freq`, value: voice.freq }))
  }
  return el.mul(env, tone)
}

function render() {
  let out = el.add(...voices.map(synthVoice))
  core.render(out, out)
  draw(out)
}

function draw(node: ElementaryNode) {
  console.log(node)
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
