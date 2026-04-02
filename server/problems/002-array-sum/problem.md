Given an array of 32-bit signed integers, compute and return their sum using AVX2 intrinsics.

## Function Signature

```cpp
#include <immintrin.h>
#include <cstdint>

int32_t array_sum(const int32_t* arr, int n);
```

**Parameters:**
- `arr`: pointer to an array of `n` signed 32-bit integers, guaranteed 32-byte aligned
- `n`: number of elements, guaranteed to be a multiple of 8 and at least 8

**Returns:** the sum of all elements in the array (guaranteed to fit in `int32_t`)

## Example

```
Input:  [1, 2, 3, 4, 5, 6, 7, 8]
Output: 36
```

## Constraints

- `8 ≤ n ≤ 1,000,000`
- `n` is always a multiple of 8
- All elements are in range `[-1000, 1000]`
- The total sum fits in a 32-bit signed integer
- `arr` is 32-byte aligned

## Notes

Process 8 integers at a time using an accumulator register. After the loop, horizontally reduce the vector accumulator to a scalar.

:::hint{title="Hint 1: Loading data"}
`_mm256_load_si256` loads 8 packed 32-bit integers from a 32-byte aligned address into a 256-bit register.
:::

:::hint{title="Hint 2: Accumulating a sum"}
`_mm256_add_epi32` adds two vectors of 8 packed 32-bit integers element-wise. Use an accumulator register initialized with `_mm256_setzero_si256()`.
:::

:::hint{title="Hint 3: Horizontal reduction"}
After the loop, you have 8 partial sums in one register. Extract the high and low 128-bit lanes with `_mm256_extracti128_si256`, add them with `_mm_add_epi32`, then use `_mm_hadd_epi32` twice to reduce to a single scalar.
:::

## Useful Intrinsics

| Intrinsic | Description |
|-----------|-------------|
| `_mm256_setzero_si256()` | Create a zero vector |
| `_mm256_load_si256(ptr)` | Load 256 bits from aligned memory |
| `_mm256_add_epi32(a, b)` | Add packed 32-bit integers |
| `_mm256_extracti128_si256(v, 1)` | Extract high 128-bit lane |
| `_mm256_castsi256_si128(v)` | Cast 256-bit to low 128-bit (free) |
| `_mm_add_epi32(a, b)` | Add packed 32-bit integers (128-bit) |
| `_mm_hadd_epi32(a, b)` | Horizontal add of packed 32-bit integers |
| `_mm_extract_epi32(v, idx)` | Extract a 32-bit integer |
