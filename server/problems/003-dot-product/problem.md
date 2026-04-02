Given two arrays of 32-bit signed integers, compute and return their dot product using AVX2 intrinsics.

The dot product is the sum of element-wise products: `a[0]*b[0] + a[1]*b[1] + ... + a[n-1]*b[n-1]`.

## Function Signature

```cpp
#include <immintrin.h>
#include <cstdint>

int32_t dot_product(const int32_t* a, const int32_t* b, int n);
```

**Parameters:**
- `a`: pointer to the first array of `n` signed 32-bit integers, guaranteed 32-byte aligned
- `b`: pointer to the second array of `n` signed 32-bit integers, guaranteed 32-byte aligned
- `n`: number of elements, guaranteed to be a multiple of 8 and at least 8

**Returns:** the dot product of the two arrays (guaranteed to fit in `int32_t`)

## Example

```
Input:  a = [1, 2, 3, 4, 5, 6, 7, 8]
        b = [2, 2, 2, 2, 2, 2, 2, 2]
Output: 72
```

## Constraints

- `8 ≤ n ≤ 1,000,000`
- `n` is always a multiple of 8
- All elements are in range `[-1000, 1000]`
- The dot product fits in a 32-bit signed integer
- Both arrays are 32-byte aligned

## Notes

Multiply corresponding elements 8 at a time, accumulate the products, then reduce to a scalar at the end.

:::hint{title="Hint 1: Element-wise multiplication"}
`_mm256_mullo_epi32(a, b)` multiplies two vectors of 8 packed 32-bit integers element-wise, returning the low 32 bits of each product.
:::

:::hint{title="Hint 2: Accumulating products"}
Use an accumulator register initialized with `_mm256_setzero_si256()`. Each iteration, multiply a chunk from `a` with a chunk from `b`, then add the result to the accumulator with `_mm256_add_epi32`.
:::

:::hint{title="Hint 3: Horizontal reduction"}
After the loop, reduce the 8 partial sums to a scalar. Extract the high and low 128-bit lanes, add them, then use `_mm_hadd_epi32` twice to collapse to a single value.
:::

## Useful Intrinsics

| Intrinsic | Description |
|-----------|-------------|
| `_mm256_setzero_si256()` | Create a zero vector |
| `_mm256_load_si256(ptr)` | Load 256 bits from aligned memory |
| `_mm256_mullo_epi32(a, b)` | Multiply packed 32-bit integers, return low 32 bits |
| `_mm256_add_epi32(a, b)` | Add packed 32-bit integers |
| `_mm256_extracti128_si256(v, 1)` | Extract high 128-bit lane |
| `_mm256_castsi256_si128(v)` | Cast 256-bit to low 128-bit (free) |
| `_mm_hadd_epi32(a, b)` | Horizontal add of packed 32-bit integers |
| `_mm_extract_epi32(v, idx)` | Extract a 32-bit integer |
