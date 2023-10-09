import { createRouter, createWebHistory } from 'vue-router'
import SingleVoiceSynth from '../views/SingleVoiceSynth.vue'
import MutliVoiceSynth from '../views/MultiVoiceSynth.vue'
import Home from '../views/Home.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/single-voice-synth',
      name: 'single-voice-synth',
      component: SingleVoiceSynth
    },
    {
      path: '/multi-voice-synth',
      name: 'multi-voice-synth',
      component: MutliVoiceSynth
    },
    {
      path: '/',
      name: 'home',
      component: Home
    }
  ]
})

export default router
