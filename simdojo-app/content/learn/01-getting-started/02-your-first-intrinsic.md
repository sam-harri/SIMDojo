---
title: Your First Intrinsic
description: Write your first AVX2 SIMD code using intrinsics.
---

intrinsics are C functions that map directly to SIMD assembly instructions.

## The Intrinsic Naming Convention

Most AVX2 intrinsics follow this pattern:

```
_mm256_<operation>_<type>
```

- `_mm256` -- 256-bit operation (use `_mm` for 128-bit)
- `<operation>` -- what it does: `add`, `sub`, `mul`, `load`, `store`, etc.
- `<type>` -- element type: `epi32` (32-bit int), `ps` (float), `pd` (double)

## meow

meow meow meow 

## meow again

meow meow