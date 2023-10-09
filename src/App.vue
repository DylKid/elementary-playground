<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <div class="wrapper">
      <nav>
        <RouterLink to="/single-voice-synth"> Single Note Synth </RouterLink>
        <RouterLink to="/multi-voice-synth"> Multi Voice Synth </RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>
