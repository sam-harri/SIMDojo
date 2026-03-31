import type { Intrinsic, IsaExtension } from "./types"
import avx2Data from "@/components/editor/avx2_intrinsics.json.json"

function buildExtension(id: string, label: string, data: Intrinsic[]): IsaExtension {
  const categories = [...new Set(data.map((i) => i.category))].sort()
  return { id, label, data, categories }
}

export const ISA_EXTENSIONS: IsaExtension[] = [
  buildExtension("avx2", "AVX2", avx2Data as Intrinsic[]),
  // To add AVX-512: import json, add buildExtension("avx512", "AVX-512", avx512Data)
]

export function getExtension(id: string): IsaExtension | undefined {
  return ISA_EXTENSIONS.find((ext) => ext.id === id)
}

export { avx2Data }
export type { Intrinsic, IsaExtension }
