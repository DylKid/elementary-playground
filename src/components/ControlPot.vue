<template>
  <div class="container">
    <h3 class="no-margins-no-padding">{{ label }}</h3>
    <div class="circle rotate" ref="circleRef">
      <div class="line"></div>
    </div>
    {{ currentValue }}
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'

const props = defineProps<{
  modelValue: number
  label: string
}>()

const circleRef = ref<HTMLElement | null>(null)

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

let currentAngle = ref(0)
const currentValue = ref(props.modelValue)

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

function mapNumberToRange(
  input: number,
  sourceStart: number,
  sourceEnd: number,
  targetStart: number,
  targetEnd: number
) {
  // apply the map input-> input - sourceStart so the left endpoint shifts to the origin.
  let out = input - sourceStart
  // scale the interval to unit length by dividing by its length
  out = (1 / (sourceEnd - sourceStart)) * out
  // (3) Scale up by the desired length
  out = (targetEnd - targetStart) * out
  // (4) Finally shift the left endpoint
  return out + targetStart
}

function mapValueToAngle(value: number) {
  return mapNumberToRange(value, 0, 100, -ANGLE_RANGE, ANGLE_RANGE)
}

onMounted(() => {
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
