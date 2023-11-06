<template>
  <div class="container">
    <div class="circle rotate" ref="circleRef">
      <div class="line"></div>
    </div>
    {{ currentValue }}
  </div>
</template>

<script lang="ts" setup>
import mapNumberToRange from '@/lib/mapToRange'
import { computed, onMounted, ref } from 'vue'

const props = defineProps<{
  modelValue: number
}>()

const circleRef = ref<HTMLElement | null>(null)

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

let currentAngle = ref(0)
const currentValue = ref(0)

const angleTransform = computed(() => {
  return currentAngle.value + 'deg'
})
const ANGLE_RANGE = 135

function dragDiffToAngle(dragDiff: number) {
  if (dragDiff < -ANGLE_RANGE) {
    return -ANGLE_RANGE
  } else if (dragDiff > ANGLE_RANGE) {
    return ANGLE_RANGE
  }
  return dragDiff
}

function mapValueToAngle(value: number) {
  return mapNumberToRange(value, 0, 100, -ANGLE_RANGE, ANGLE_RANGE)
}

onMounted(() => {
  currentValue.value = props.modelValue
  // console.log('current value', currentValue.value)
  // console.log('props', props.modelValue)
  if (circleRef.value === null) {
    throw new Error('Circle ref reference failed')
  } else {
    // setup
    currentAngle.value = mapValueToAngle(currentValue.value)
    let mousedownY: number | null = null

    // event listeners & handlers
    const mousemoveListener: EventListener = (event) => {
      if (mousedownY) {
        const mouseEvent = event as MouseEvent
        const angleDelta = dragDiffToAngle(mousedownY - mouseEvent.clientY)
        currentAngle.value = dragDiffToAngle(currentAngle.value + angleDelta)
        currentValue.value = Math.floor((100 / (ANGLE_RANGE * 2)) * currentAngle.value + 50)
        emit('update:modelValue', currentValue.value)
      }
    }

    circleRef.value.addEventListener('mousedown', (event: MouseEvent) => {
      mousedownY = event.clientY
      document.addEventListener('mousemove', mousemoveListener)
      document.addEventListener('mouseup', () => {
        document.removeEventListener('mousemove', mousemoveListener)
      })
    })
  }
})
</script>

<style>
.no-margins-no-padding {
  margin: 0px;
  padding: 0px;
}
.container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}
.circle {
  width: 60px;
  height: 60px;
  background-color: grey;
  border-radius: 100%;
}
.rotate {
  transform: rotate(v-bind(angleTransform));
}
.line {
  position: relative;
  left: 45%;
  width: 10%;
  height: 50%;
  background-color: black;
}
</style>
