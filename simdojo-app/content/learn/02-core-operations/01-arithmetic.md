---
title: Arithmetic Operations
description: Addition, subtraction, multiplication, and more.
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

## meowwwwwww

asdasdasdasd