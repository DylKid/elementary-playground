<template>
  <div class="wrapper">
    <SynthView />
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
</script>
