Clamp every element of an array to the range `[lo, hi]` in place using AVX2 intrinsics.

Each element should be replaced with `lo` if it is below `lo`, `hi` if it is above `hi`, or left unchanged otherwise.

## Function Signature

```cpp
#include <immintrin.h>
#include <cstdint>

void clamp_array(int32_t* arr, int n, int32_t lo, int32_t hi);
```

**Parameters:**
- `arr`: pointer to an array of `n` signed 32-bit integers, guaranteed 32-byte aligned (modified in place)
- `n`: number of elements, guaranteed to be a multiple of 8 and at least 8
- `lo`: lower bound of the clamp range
- `hi`: upper bound of the clamp range (guaranteed `lo ≤ hi`)

**Returns:** nothing (array is modified in place)

## Example

```
Input:  arr = [-5, 3, 10, 0, -2, 7, 15, 1], lo = 0, hi = 10
Output: arr = [ 0, 3, 10, 0,  0, 7, 10, 1]
```

## Constraints

- `8 ≤ n ≤ 1,000,000`
- `n` is always a multiple of 8
- All elements are in range `[-1,000,000, 1,000,000]`
- `lo ≤ hi`
- `arr` is 32-byte aligned

## Notes

Clamping is `max(lo, min(hi, x))`. With AVX2, each operation maps to a single intrinsic.

:::hint{title="Hint 1: Broadcasting bounds"}
Use `_mm256_set1_epi32(lo)` and `_mm256_set1_epi32(hi)` to broadcast the clamp bounds into 256-bit registers.
:::

:::hint{title="Hint 2: Lower bound"}
`_mm256_max_epi32(v, lo_vec)` replaces any element below `lo` with `lo`.
:::

:::hint{title="Hint 3: Upper bound"}
`_mm256_min_epi32(v, hi_vec)` caps any element above `hi` to `hi`. Apply this after the lower bound to complete the clamp. Store the result back with `_mm256_store_si256`.
:::

## Useful Intrinsics

| Intrinsic | Description |
|-----------|-------------|
| `_mm256_load_si256(ptr)` | Load 256 bits from aligned memory |
| `_mm256_store_si256(ptr, v)` | Store 256 bits to aligned memory |
| `_mm256_set1_epi32(x)` | Broadcast a 32-bit integer to all 8 lanes |
| `_mm256_min_epi32(a, b)` | Packed 32-bit integer minimum |
| `_mm256_max_epi32(a, b)` | Packed 32-bit integer maximum |
