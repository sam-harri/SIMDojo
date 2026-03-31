---
title: Your First Intrinsic
description: Write your first AVX2 SIMD code using Intel intrinsics -- loading, adding, and storing vectors.
---

Intel **intrinsics** are C functions that map directly to SIMD assembly instructions. They give you the power of assembly with the convenience of C.

## The Intrinsic Naming Convention

Most AVX2 intrinsics follow this pattern:

```
_mm256_<operation>_<type>
```

- `_mm256` -- 256-bit operation (use `_mm` for 128-bit)
- `<operation>` -- what it does: `add`, `sub`, `mul`, `load`, `store`, etc.
- `<type>` -- element type: `epi32` (32-bit int), `ps` (float), `pd` (double)

## Load, Add, Store

The most basic SIMD pattern:

```c
#include <immintrin.h>

void add_arrays(int* a, int* b, int* result, int n) {
    for (int i = 0; i < n; i += 8) {
        // Load 8 ints from each array
        __m256i va = _mm256_loadu_si256((__m256i*)(a + i));
        __m256i vb = _mm256_loadu_si256((__m256i*)(b + i));

        // Add them (8 additions in one instruction)
        __m256i vr = _mm256_add_epi32(va, vb);

        // Store the result
        _mm256_storeu_si256((__m256i*)(result + i), vr);
    }
}
```

## Key Intrinsics Used

| Intrinsic | Instruction | What it does |
|-----------|------------|--------------|
| `_mm256_loadu_si256` | `VMOVDQU` | Load 256 bits from memory (unaligned) |
| `_mm256_add_epi32` | `VPADDD` | Add 8 packed 32-bit integers |
| `_mm256_storeu_si256` | `VMOVDQU` | Store 256 bits to memory (unaligned) |

## Try It

Head to the [Problems](/problems) page and try the introductory challenges to practice this pattern!
