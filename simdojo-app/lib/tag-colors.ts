export const TAG_STYLES: Record<string, { classes: string; selectedClasses: string }> = {
  arithmetic: {
    classes: "bg-[#6e8f56]/10 text-[#6e8f56] ring-[#6e8f56]/20 dark:bg-[#92b577]/12 dark:text-[#92b577] dark:ring-[#92b577]/20",
    selectedClasses: "bg-[#6e8f56]/30 text-[#6e8f56] ring-[#6e8f56]/60 dark:bg-[#92b577]/35 dark:text-[#92b577] dark:ring-[#92b577]/60",
  },
  comparison: {
    classes: "bg-[#2563eb]/10 text-[#2563eb] ring-[#2563eb]/20 dark:bg-[#60a5fa]/12 dark:text-[#60a5fa] dark:ring-[#60a5fa]/20",
    selectedClasses: "bg-[#2563eb]/30 text-[#2563eb] ring-[#2563eb]/60 dark:bg-[#60a5fa]/35 dark:text-[#60a5fa] dark:ring-[#60a5fa]/60",
  },
  "load-store": {
    classes: "bg-[#9333ea]/10 text-[#9333ea] ring-[#9333ea]/20 dark:bg-[#a78bfa]/12 dark:text-[#a78bfa] dark:ring-[#a78bfa]/20",
    selectedClasses: "bg-[#9333ea]/30 text-[#9333ea] ring-[#9333ea]/60 dark:bg-[#a78bfa]/35 dark:text-[#a78bfa] dark:ring-[#a78bfa]/60",
  },
  shuffle: {
    classes: "bg-[#d97706]/10 text-[#d97706] ring-[#d97706]/20 dark:bg-[#f0b040]/12 dark:text-[#f0b040] dark:ring-[#f0b040]/20",
    selectedClasses: "bg-[#d97706]/30 text-[#d97706] ring-[#d97706]/60 dark:bg-[#f0b040]/35 dark:text-[#f0b040] dark:ring-[#f0b040]/60",
  },
  masking: {
    classes: "bg-[#0891b2]/10 text-[#0891b2] ring-[#0891b2]/20 dark:bg-[#22d3ee]/12 dark:text-[#22d3ee] dark:ring-[#22d3ee]/20",
    selectedClasses: "bg-[#0891b2]/30 text-[#0891b2] ring-[#0891b2]/60 dark:bg-[#22d3ee]/35 dark:text-[#22d3ee] dark:ring-[#22d3ee]/60",
  },
  reduction: {
    classes: "bg-[#dc2626]/10 text-[#dc2626] ring-[#dc2626]/20 dark:bg-[#f87171]/12 dark:text-[#f87171] dark:ring-[#f87171]/20",
    selectedClasses: "bg-[#dc2626]/30 text-[#dc2626] ring-[#dc2626]/60 dark:bg-[#f87171]/35 dark:text-[#f87171] dark:ring-[#f87171]/60",
  },
  bitwise: {
    classes: "bg-[#6d28d9]/10 text-[#6d28d9] ring-[#6d28d9]/20 dark:bg-[#8b5cf6]/12 dark:text-[#8b5cf6] dark:ring-[#8b5cf6]/20",
    selectedClasses: "bg-[#6d28d9]/30 text-[#6d28d9] ring-[#6d28d9]/60 dark:bg-[#8b5cf6]/35 dark:text-[#8b5cf6] dark:ring-[#8b5cf6]/60",
  },
  branchless: {
    classes: "bg-[#059669]/10 text-[#059669] ring-[#059669]/20 dark:bg-[#34d399]/12 dark:text-[#34d399] dark:ring-[#34d399]/20",
    selectedClasses: "bg-[#059669]/30 text-[#059669] ring-[#059669]/60 dark:bg-[#34d399]/35 dark:text-[#34d399] dark:ring-[#34d399]/60",
  },
}

export const VALID_TAGS = Object.keys(TAG_STYLES)
