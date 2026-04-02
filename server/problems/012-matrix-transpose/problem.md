Transpose an 8x8 matrix of 32-bit signed integers in place using AVX2 intrinsics.

## Function Signature

```cpp
#include <immintrin.h>
#include <cstdint>

void transpose_8x8(int32_t* matrix);
```

**Parameters:**
- `matrix`: pointer to 64 contiguous `int32_t` values representing an 8x8 matrix in row-major order, guaranteed 32-byte aligned

The matrix is stored as 64 elements: row 0 occupies indices `[0..7]`, row 1 occupies indices `[8..15]`, and so on.

After the function returns, `matrix[r*8 + c]` must equal the original `matrix[c*8 + r]` for all `r, c` in `[0, 7]`.

## Example

```
Input (row-major):
  Row 0: [ 0,  1,  2,  3,  4,  5,  6,  7]
  Row 1: [ 8,  9, 10, 11, 12, 13, 14, 15]
  Row 2: [16, 17, 18, 19, 20, 21, 22, 23]
  ...
  Row 7: [56, 57, 58, 59, 60, 61, 62, 63]

Output (transposed):
  Row 0: [ 0,  8, 16, 24, 32, 40, 48, 56]
  Row 1: [ 1,  9, 17, 25, 33, 41, 49, 57]
  Row 2: [ 2, 10, 18, 26, 34, 42, 50, 58]
  ...
  Row 7: [ 7, 15, 23, 31, 39, 47, 55, 63]
```

## Constraints

- The matrix is always exactly 8x8 (64 elements)
- `matrix` is 32-byte aligned
- Elements are stored in row-major order
- Element values are in range `[-1,000,000, 1,000,000]`

## Notes

An 8x8 transpose can be decomposed into three phases of pairwise operations on 256-bit registers, avoiding any scalar element shuffling.

:::hint{title="Hint 1: Load each row into its own register"}
Use `_mm256_load_si256` to load each of the 8 rows into its own `__m256i` register.
:::

:::hint{title="Hint 2: Interleave with unpacklo/hi"}
Use `_mm256_unpacklo_epi32` and `_mm256_unpackhi_epi32` to interleave adjacent pairs of rows at 32-bit granularity. Then use `_mm256_unpacklo_epi64` and `_mm256_unpackhi_epi64` to interleave pairs at 64-bit granularity. This performs the transpose within each 128-bit lane.
:::

:::hint{title="Hint 3: Swap 128-bit halves with permute2x128"}
Use `_mm256_permute2x128_si256` with control values `0x20` (select both low halves) and `0x31` (select both high halves) to exchange the 128-bit lanes between register pairs, completing the full 8x8 transpose.
:::

## Useful Intrinsics

| Intrinsic | Description |
|-----------|-------------|
| `_mm256_load_si256(ptr)` | Load 256 bits from 32-byte aligned memory |
| `_mm256_store_si256(ptr, v)` | Store 256 bits to 32-byte aligned memory |
| `_mm256_unpacklo_epi32(a, b)` | Interleave low 32-bit integers from each 128-bit lane |
| `_mm256_unpackhi_epi32(a, b)` | Interleave high 32-bit integers from each 128-bit lane |
| `_mm256_unpacklo_epi64(a, b)` | Interleave low 64-bit integers from each 128-bit lane |
| `_mm256_unpackhi_epi64(a, b)` | Interleave high 64-bit integers from each 128-bit lane |
| `_mm256_permute2x128_si256(a, b, imm)` | Select 128-bit lanes from two sources (`0x20` = both low, `0x31` = both high) |
