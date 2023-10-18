export default function mapNumberToRange(
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
  // scale up by the desired length
  out = (targetEnd - targetStart) * out
  // shift the left endpoint
  return out + targetStart
}
