<template>
  <div>
    <Scatter :data="data" :options="options" />
  </div>
</template>

<script lang="ts" setup>
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js'
import { computed } from 'vue'
import { Scatter } from 'vue-chartjs'

const props = defineProps<{
  adsr: {
    attack: number
    decay: number
    sustain: number
    release: number
  }
}>()

const data = computed(() => {
  return {
    datasets: [
      {
        fill: false,
        borderColor: '#f87979',
        backgroundColor: '#f87979',
        showLine: true,
        data: [
          {
            x: 0,
            y: 0
          },
          {
            x: props.adsr.attack,
            y: 1
          },
          {
            x: props.adsr.attack + props.adsr.decay,
            y: props.adsr.sustain
          },
          {
            x: props.adsr.attack + props.adsr.decay + props.adsr.release,
            y: 0
          }
        ]
      }
    ]
  }
})

const options = {
  responsive: true,
  maintainAspectRatio: false
}

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement)
</script>
