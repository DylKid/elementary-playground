import { el, type NodeRepr_t } from '@elemaudio/core'
import type { ADSR } from '@/components/ADSRInput.vue'

export type WaveType = 'sin' | 'saw' | 'square'

export interface Voice {
  gate: number
  freq: number
  key: string
}

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

export function synthOut(model: SynthModel, config: SynthConfig): number | NodeRepr_t {
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
  const gateVal = 0.2 * voice.gate
  console.log(gateVal)
  const gate = el.const({ key: `${voice.key}:gate`, value: gateVal })
  console.log({
    attack: config.adsr.attack,
    decay: config.adsr.decay,
    sustain: config.adsr.sustain,
    release: config.adsr.release,
    gate: gate
  })
  const env = el.adsr(
    el.const({ key: `${voice.key}:attack`, value: config.adsr.attack * 10 }),
    el.const({ key: `${voice.key}:decay`, value: config.adsr.decay }),
    el.const({ key: `${voice.key}:sustain`, value: config.adsr.sustain }),
    el.const({ key: `${voice.key}:release`, value: config.adsr.release }),
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
