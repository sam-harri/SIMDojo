Given two arrays of 32-bit signed integers `a` and `b`, compute their element-wise sum into output array `c` such that `c[i] = a[i] + b[i]` for all `i`.

## Function Signature

```cpp
#include <immintrin.h>
#include <cstdint>

void add_arrays(const int32_t* a, const int32_t* b, int32_t* c, int n);
```

**Parameters:**
- `a`: pointer to the first input array of `n` signed 32-bit integers, guaranteed 32-byte aligned
- `b`: pointer to the second input array of `n` signed 32-bit integers, guaranteed 32-byte aligned
- `c`: pointer to the output array of `n` signed 32-bit integers, guaranteed 32-byte aligned
- `n`: number of elements, guaranteed to be a multiple of 8 and at least 8

**Returns:** nothing; results are written to `c`

## Example

```
a = [1, 2, 3, 4, 5, 6, 7, 8]
b = [10, 20, 30, 40, 50, 60, 70, 80]
c = [11, 22, 33, 44, 55, 66, 77, 88]
```

## Constraints

- `8 ≤ n ≤ 1,000,000`
- `n` is always a multiple of 8
- All elements are in range `[-10000, 10000]`
- Results fit in `int32_t`
- `a`, `b`, and `c` are all 32-byte aligned

## Notes

Use AVX2 intrinsics to process 8 integers at a time: load a chunk from each input, add them, and store the result.

:::hint{title="Hint 1: Loading data"}
`_mm256_load_si256` loads 8 packed 32-bit integers from a 32-byte aligned address into a 256-bit register. Cast your pointer with `reinterpret_cast<const __m256i*>(ptr + i)`.
:::

:::hint{title="Hint 2: Adding vectors"}
`_mm256_add_epi32(a, b)` adds two `__m256i` registers element-wise (8 × int32 lanes).
:::

:::hint{title="Hint 3: Storing results"}
`_mm256_store_si256` writes a 256-bit register back to a 32-byte aligned address. Cast with `reinterpret_cast<__m256i*>(ptr + i)`.
:::

## Useful Intrinsics

| Intrinsic | Description |
|-----------|-------------|
| `_mm256_load_si256(ptr)` | Load 256 bits from aligned memory |
| `_mm256_add_epi32(a, b)` | Add packed 32-bit integers element-wise |
| `_mm256_store_si256(ptr, v)` | Store 256 bits to aligned memory |
