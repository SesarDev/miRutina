/** Catalogue exercise (local only; custom ones sync as `custom_exercises`). */
export type Exercise = {
  id: string
  /** Dataset name, English. */
  name: string
  nameEs: string
  bodyPart: string
  equipment: string
  target: string
  secondaryMuscles: string[]
  stepsEs: string[]
  /** Public URL, e.g. /exercises/images/0001-xxx.jpg */
  image: string
  gif: string
  isCustom: boolean
}
