export const CATEGORY_STYLES: Record<string, { classes: string; selectedClasses: string; dot: string }> = {
  Arithmetic: {
    classes: "bg-[#6e8f56]/10 text-[#6e8f56] ring-[#6e8f56]/20 dark:bg-[#92b577]/12 dark:text-[#92b577] dark:ring-[#92b577]/20",
    selectedClasses: "bg-[#6e8f56]/30 text-[#6e8f56] ring-[#6e8f56]/60 dark:bg-[#92b577]/35 dark:text-[#92b577] dark:ring-[#92b577]/60",
    dot: "bg-[#6e8f56] dark:bg-[#92b577]",
  },
  Compare: {
    classes: "bg-[#2563eb]/10 text-[#2563eb] ring-[#2563eb]/20 dark:bg-[#60a5fa]/12 dark:text-[#60a5fa] dark:ring-[#60a5fa]/20",
    selectedClasses: "bg-[#2563eb]/30 text-[#2563eb] ring-[#2563eb]/60 dark:bg-[#60a5fa]/35 dark:text-[#60a5fa] dark:ring-[#60a5fa]/60",
    dot: "bg-[#2563eb] dark:bg-[#60a5fa]",
  },
  Convert: {
    classes: "bg-[#0891b2]/10 text-[#0891b2] ring-[#0891b2]/20 dark:bg-[#22d3ee]/12 dark:text-[#22d3ee] dark:ring-[#22d3ee]/20",
    selectedClasses: "bg-[#0891b2]/30 text-[#0891b2] ring-[#0891b2]/60 dark:bg-[#22d3ee]/35 dark:text-[#22d3ee] dark:ring-[#22d3ee]/60",
    dot: "bg-[#0891b2] dark:bg-[#22d3ee]",
  },
  Load: {
    classes: "bg-[#9333ea]/10 text-[#9333ea] ring-[#9333ea]/20 dark:bg-[#a78bfa]/12 dark:text-[#a78bfa] dark:ring-[#a78bfa]/20",
    selectedClasses: "bg-[#9333ea]/30 text-[#9333ea] ring-[#9333ea]/60 dark:bg-[#a78bfa]/35 dark:text-[#a78bfa] dark:ring-[#a78bfa]/60",
    dot: "bg-[#9333ea] dark:bg-[#a78bfa]",
  },
  Logical: {
    classes: "bg-[#6d28d9]/10 text-[#6d28d9] ring-[#6d28d9]/20 dark:bg-[#8b5cf6]/12 dark:text-[#8b5cf6] dark:ring-[#8b5cf6]/20",
    selectedClasses: "bg-[#6d28d9]/30 text-[#6d28d9] ring-[#6d28d9]/60 dark:bg-[#8b5cf6]/35 dark:text-[#8b5cf6] dark:ring-[#8b5cf6]/60",
    dot: "bg-[#6d28d9] dark:bg-[#8b5cf6]",
  },
  Miscellaneous: {
    classes: "bg-[#78756e]/10 text-[#78756e] ring-[#78756e]/20 dark:bg-[#908e88]/12 dark:text-[#908e88] dark:ring-[#908e88]/20",
    selectedClasses: "bg-[#78756e]/30 text-[#78756e] ring-[#78756e]/60 dark:bg-[#908e88]/35 dark:text-[#908e88] dark:ring-[#908e88]/60",
    dot: "bg-[#78756e] dark:bg-[#908e88]",
  },
  Shift: {
    classes: "bg-[#d97706]/10 text-[#d97706] ring-[#d97706]/20 dark:bg-[#f0b040]/12 dark:text-[#f0b040] dark:ring-[#f0b040]/20",
    selectedClasses: "bg-[#d97706]/30 text-[#d97706] ring-[#d97706]/60 dark:bg-[#f0b040]/35 dark:text-[#f0b040] dark:ring-[#f0b040]/60",
    dot: "bg-[#d97706] dark:bg-[#f0b040]",
  },
  "Special Math Functions": {
    classes: "bg-[#059669]/10 text-[#059669] ring-[#059669]/20 dark:bg-[#34d399]/12 dark:text-[#34d399] dark:ring-[#34d399]/20",
    selectedClasses: "bg-[#059669]/30 text-[#059669] ring-[#059669]/60 dark:bg-[#34d399]/35 dark:text-[#34d399] dark:ring-[#34d399]/60",
    dot: "bg-[#059669] dark:bg-[#34d399]",
  },
  Store: {
    classes: "bg-[#e11d48]/10 text-[#e11d48] ring-[#e11d48]/20 dark:bg-[#fb7185]/12 dark:text-[#fb7185] dark:ring-[#fb7185]/20",
    selectedClasses: "bg-[#e11d48]/30 text-[#e11d48] ring-[#e11d48]/60 dark:bg-[#fb7185]/35 dark:text-[#fb7185] dark:ring-[#fb7185]/60",
    dot: "bg-[#e11d48] dark:bg-[#fb7185]",
  },
  Swizzle: {
    classes: "bg-[#ea580c]/10 text-[#ea580c] ring-[#ea580c]/20 dark:bg-[#fb923c]/12 dark:text-[#fb923c] dark:ring-[#fb923c]/20",
    selectedClasses: "bg-[#ea580c]/30 text-[#ea580c] ring-[#ea580c]/60 dark:bg-[#fb923c]/35 dark:text-[#fb923c] dark:ring-[#fb923c]/60",
    dot: "bg-[#ea580c] dark:bg-[#fb923c]",
  },
  "Probability/Statistics": {
    classes: "bg-[#dc2626]/10 text-[#dc2626] ring-[#dc2626]/20 dark:bg-[#f87171]/12 dark:text-[#f87171] dark:ring-[#f87171]/20",
    selectedClasses: "bg-[#dc2626]/30 text-[#dc2626] ring-[#dc2626]/60 dark:bg-[#f87171]/35 dark:text-[#f87171] dark:ring-[#f87171]/60",
    dot: "bg-[#dc2626] dark:bg-[#f87171]",
  },
}

export const CATEGORY_ORDER = [
  "Arithmetic",
  "Swizzle",
  "Load",
  "Shift",
  "Special Math Functions",
  "Convert",
  "Compare",
  "Miscellaneous",
  "Store",
  "Logical",
  "Probability/Statistics",
]
