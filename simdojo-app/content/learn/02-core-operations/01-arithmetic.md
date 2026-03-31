---
title: Arithmetic Operations
description: Addition, subtraction, multiplication, and more -- the building blocks of SIMD computation.
---

AVX2 provides a full set of arithmetic operations for packed integers and floating-point values.

## Integer Addition & Subtraction

```c
__m256i sum  = _mm256_add_epi32(a, b);   // a + b (32-bit)
__m256i diff = _mm256_sub_epi32(a, b);   // a - b (32-bit)
```

These are available for all integer widths: `epi8`, `epi16`, `epi32`, `epi64`.

## Saturating Arithmetic

Normal addition wraps on overflow. **Saturating** variants clamp to the min/max value instead:

```c
// Unsigned: clamps to [0, 255] instead of wrapping
__m256i sat = _mm256_adds_epu8(a, b);

// Signed: clamps to [-128, 127]
__m256i sat = _mm256_adds_epi8(a, b);
```

This is essential for image processing where pixel values must stay in range.

## Multiplication

Integer multiplication is trickier because multiplying two 32-bit values produces a 64-bit result:

```c
// Low 32 bits of each 32-bit multiplication
__m256i lo = _mm256_mullo_epi32(a, b);

// Multiply-add: (a[i]*b[i]) + (a[i+1]*b[i+1]) for 16-bit inputs
__m256i mac = _mm256_madd_epi16(a, b);
```

## Min & Max

```c
__m256i mn = _mm256_min_epi32(a, b);  // element-wise min
__m256i mx = _mm256_max_epi32(a, b);  // element-wise max
```

## Absolute Value

```c
__m256i abs_val = _mm256_abs_epi32(a);
```

Available for `epi8`, `epi16`, and `epi32` (not 64-bit).
