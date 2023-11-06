import { createRouter, createWebHistory } from 'vue-router'
import SynthView from '../views/SynthView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'synth-view',
      component: SynthView
    }
  ]
})

export default router
