"use client"

import { useState, useMemo, useCallback } from "react"
import { ISA_EXTENSIONS, getExtension } from "@/lib/intrinsics/registry"
import { CATEGORY_ORDER } from "@/lib/intrinsics/category-styles"
import { IsaTabs } from "@/components/reference/isa-tabs"
import { IntrinsicsSearch } from "@/components/reference/intrinsics-search"
import { CategoryFilter } from "@/components/reference/category-filter"
import { IntrinsicList } from "@/components/reference/intrinsic-list"

export default function ReferencePage() {
  const [selectedIsa, setSelectedIsa] = useState(ISA_EXTENSIONS[0]?.id ?? "avx2")
  const [search, setSearch] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [expandedName, setExpandedName] = useState<string | null>(null)

  const extension = getExtension(selectedIsa)
  const allIntrinsics = extension?.data ?? []

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const i of allIntrinsics) {
      counts[i.category] = (counts[i.category] ?? 0) + 1
    }
    return counts
  }, [allIntrinsics])

  const sortedCategories = useMemo(
    () => CATEGORY_ORDER.filter((c) => categoryCounts[c]),
    [categoryCounts],
  )

  const filtered = useMemo(() => {
    let result = allIntrinsics

    if (selectedCategories.length > 0) {
      result = result.filter((i) => selectedCategories.includes(i.category))
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.instruction.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q),
      )
    }

    return result
  }, [allIntrinsics, selectedCategories, search])

  const handleToggleCategory = useCallback((cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    )
  }, [])

  const handleToggleExpand = useCallback((name: string) => {
    setExpandedName((prev) => (prev === name ? null : name))
  }, [])

  const handleIsaChange = useCallback((id: string) => {
    setSelectedIsa(id)
    setSearch("")
    setSelectedCategories([])
    setExpandedName(null)
  }, [])

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-10 pb-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Intrinsics Reference</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Browse {extension?.label} SIMD intrinsics &mdash;{" "}
            <span className="font-mono text-foreground/70">{allIntrinsics.length}</span> functions
          </p>
        </div>
        <IsaTabs selectedIsa={selectedIsa} onSelect={handleIsaChange} />
      </div>

      <div className="mt-5">
        <IntrinsicsSearch value={search} onChange={setSearch} />
      </div>

      <div className="mt-3">
        <CategoryFilter
          categories={sortedCategories}
          categoryCounts={categoryCounts}
          selected={selectedCategories}
          onToggle={handleToggleCategory}
          onClear={() => setSelectedCategories([])}
        />
      </div>

      <div className="mt-4">
        <IntrinsicList
          intrinsics={filtered}
          totalCount={allIntrinsics.length}
          isSearching={search.trim().length > 0}
          expandedName={expandedName}
          onToggleExpand={handleToggleExpand}
        />
      </div>
    </div>
  )
}
