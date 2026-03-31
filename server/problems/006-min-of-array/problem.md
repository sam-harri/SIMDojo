Given an array of 32-bit signed integers, find and return the minimum value using AVX2 intrinsics.

## Function Signature

```cpp
#include <immintrin.h>
#include <cstdint>

int32_t array_min(const int32_t* arr, int n);
```

**Parameters:**
- `arr` — pointer to an array of `n` signed 32-bit integers, guaranteed 32-byte aligned
- `n` — number of elements, guaranteed to be a multiple of 8 and at least 8

**Returns:** the minimum element in the array

## Example

```
Input:  [3, 1, 4, 1, 5, 9, 2, 6]
Output: 1
```

## Constraints

- `8 ≤ n ≤ 1,000,000`
- `n` is always a multiple of 8
- All elements are in range `[-1,000,000, 1,000,000]`
- `arr` is 32-byte aligned

## Notes

Your solution should use AVX2 intrinsics to compare 8 integers at a time. Unlike a sum reduction, you cannot use `_mm_hadd` for the final horizontal step — you need a shuffle-and-min pattern instead.

:::hint{title="Hint 1: Vertical reduction"}
`_mm256_min_epi32(a, b)` compares two vectors element-wise and keeps the smaller value in each lane. Use this to reduce the entire array down to a single vector of 8 minimums.
:::

:::hint{title="Hint 2: Cross-lane reduction"}
Extract the high and low 128-bit lanes with `_mm256_extracti128_si256` and `_mm256_castsi256_si128`, then `_mm_min_epi32` them together to get 4 candidates.
:::

:::hint{title="Hint 3: Final reduction to scalar"}
Use `_mm_shuffle_epi32` to rearrange elements within the 128-bit register and `_mm_min_epi32` again. Two rounds of shuffle+min reduces 4 elements to 1. Use shuffle controls `0x4E` (swap 64-bit halves) and `0xB1` (swap adjacent 32-bit elements).
:::

## Useful Intrinsics

| Intrinsic | Description |
|-----------|-------------|
| `_mm256_load_si256(ptr)` | Load 256 bits from aligned memory |
| `_mm256_min_epi32(a, b)` | Packed 32-bit integer minimum |
| `_mm256_extracti128_si256(v, 1)` | Extract high 128-bit lane |
| `_mm256_castsi256_si128(v)` | Cast to low 128-bit lane (free) |
| `_mm_min_epi32(a, b)` | Packed 32-bit integer minimum (128-bit) |
| `_mm_shuffle_epi32(v, imm)` | Shuffle 32-bit elements within 128-bit register |
| `_mm_extract_epi32(v, idx)` | Extract a 32-bit integer |
