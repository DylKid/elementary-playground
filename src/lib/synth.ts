import { el } from '@elemaudio/core'
import type { ADSR } from '@/components/ADSRInput.vue'

export type WaveType = 'sin' | 'saw' | 'square'

export interface Voice {
  gate: number
  freq: number
  key: string
}

// export interface SynthModel {
//   // each voice of the synth, may not trigger multiple times for the same note
//   voices: Voice[]
//   octave: number
//   // index of next voice in voices to assign in a basic round-robin scheme
//   nextVoice: number
//   adsr: ADSR
//   waveType: WaveType
//   volume: number
// }

export interface SynthConfig {
  waveType: WaveType
  octave: number
  adsr: ADSR
  volume: number
}

export interface SynthModel {
  voices: Voice[]
  nextVoice: number
}

export function synthOut(model: SynthModel, config: SynthConfig) {
  console.log('synth out', model)
  return el.add(...model.voices.map((voice) => makeVoice(config, voice)))
}

export function voiceOn(model: SynthModel, config: SynthConfig, freq: number) {
  model.voices[model.nextVoice].gate = config.volume
  model.voices[model.nextVoice].freq = freq
  // go back to the start
  if (++model.nextVoice >= model.voices.length) {
    model.nextVoice = 0
  }
}

export function voiceOff(model: SynthModel, freq: number) {
  model.voices.forEach((voice) => {
    if (voice.freq === freq) {
      voice.gate = 0.0
    }
  })
}

export function makeVoice(config: SynthConfig, voice: Voice) {
  console.log('synthVoice', JSON.parse(JSON.stringify(config.adsr)))
  const gate = el.const({ key: `${voice.key}:gate`, value: 0.5 * voice.gate })
  const env = el.adsr(
    config.adsr.attack,
    config.adsr.decay,
    config.adsr.sustain,
    config.adsr.release,
    gate
  )
  let tone
  switch (config.waveType) {
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

// export default class Synth {
//   // each voice of the synth, may not trigger multiple times for the same note
//   voices: Voice[]
//   octave: number
//   // index of next voice in voices to assign in a basic round-robin scheme
//   nextVoice: number
//   adsr: ADSR
//   waveType: WaveType

//   constructor() {
//     this.voices = [
//       { gate: 0.0, freq: 440, key: 'v1' },
//       { gate: 0.0, freq: 440, key: 'v2' },
//       { gate: 0.0, freq: 440, key: 'v3' },
//       { gate: 0.0, freq: 440, key: 'v4' }
//     ]
//     this.octave = 5
//     this.nextVoice = 0
//     this.adsr = {
//       attack: 0.002,
//       decay: 0.02,
//       sustain: 80,
//       release: 0.2
//     }
//     this.waveType = 'sin'
//   }

//   output() {
//     // return el.add(...this.voices.map(this.synthVoice))
//     const voices = this.voices
//     const synthVoice = this.synthVoice
//     return 1
//   }

//   turnVoiceOn(freq: number) {
//     this.voices[this.nextVoice].gate = 1.0
//     this.voices[this.nextVoice].freq = freq
//     // go back to the start
//     if (++this.nextVoice >= this.voices.length) {
//       this.nextVoice = 0
//     }
//   }

//   turnVoiceOff(freq: number) {
//     this.voices.forEach((voice) => {
//       if (voice.freq === freq) {
//         voice.gate = 0.0
//       }
//     })
//   }

//   synthVoice(voice: Voice) {
//     console.log('synthVoice', JSON.parse(JSON.stringify(this.adsr)))
//     const gate = el.const({ key: `${voice.key}:gate`, value: 0.9 * voice.gate })
//     const env = el.adsr(
//       this.adsr.attack,
//       this.adsr.decay,
//       this.adsr.sustain,
//       this.adsr.release,
//       gate
//     )
//     let tone
//     switch (this.waveType) {
//       case 'sin':
//         tone = el.cycle(el.const({ key: `${voice.key}:freq`, value: voice.freq }))
//         break
//       case 'saw':
//         tone = el.saw(el.const({ key: `${voice.key}:freq`, value: voice.freq }))
//         break
//       case 'square':
//         tone = el.square(el.const({ key: `${voice.key}:freq`, value: voice.freq }))
//         break
//       default:
//         tone = el.cycle(el.const({ key: `${voice.key}:freq`, value: voice.freq }))
//     }
//     return el.mul(env, tone)
//   }
// }
