---
title: What is SIMD?
description: An introduction to Single Instruction Multiple Data and why it's the key to high-performance computing.
---

**SIMD** stands for **Single Instruction, Multiple Data**. It's a form of parallel processing where one CPU instruction operates on multiple data elements simultaneously.

## Scalar vs. SIMD

Consider adding two arrays of 8 integers. In scalar code, you'd loop 8 times:

```c
for (int i = 0; i < 8; i++) {
    result[i] = a[i] + b[i];
}
```

With AVX2 SIMD, you do it in **one instruction**:

```c
__m256i va = _mm256_loadu_si256((__m256i*)a);
__m256i vb = _mm256_loadu_si256((__m256i*)b);
__m256i vr = _mm256_add_epi32(va, vb);
_mm256_storeu_si256((__m256i*)result, vr);
```

Both produce the same result, but the SIMD version processes all 8 additions in a single clock cycle.

## Why SIMD Matters

SIMD isn't niche -- it's everywhere:

- **Image processing**: every pixel operation
- **Audio/video codecs**: signal processing, transforms
- **Scientific computing**: matrix operations, simulations
- **Game engines**: physics, collision detection
- **Machine learning**: inference, tensor operations
- **Databases**: filtering, aggregation, string matching

Modern CPUs spend a significant portion of their die area on SIMD units. Not using them means leaving performance on the table.

## The AVX2 Instruction Set

**AVX2** (Advanced Vector Extensions 2) was introduced by Intel in 2013 with the Haswell architecture. It provides:

- **256-bit wide** registers (process 8 ints or 4 doubles at once)
- **Integer operations** that AVX1 lacked
- **Gather instructions** for non-contiguous memory access
- Available on virtually all modern x86-64 CPUs

This is what we'll be working with on SIMDojo.
