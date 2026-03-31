export type Intrinsic = {
  name: string
  sig: string
  detail: string
  description: string
  operation: string
  instruction: string
  category: string
}

export type IsaExtension = {
  id: string
  label: string
  data: Intrinsic[]
  categories: string[]
}
