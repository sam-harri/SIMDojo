Given an array of 32-bit integers, write out only the elements that are strictly less than a threshold value, preserving their original order. Return the number of elements written.

This is a fundamental data processing primitive — the vectorized equivalent of a filter. The challenge is that the number of qualifying elements varies per SIMD block, so the output is variable-length.

## Function Signature

```cpp
#include <immintrin.h>
#include <cstdint>

int pack_and_filter(const int32_t* input, int32_t* output, int n, int32_t threshold);
```

**Parameters:**
- `input` — pointer to the input array, guaranteed 32-byte aligned
- `output` — pointer to the output array, guaranteed 32-byte aligned, with space for at least `n + 8` elements
- `n` — number of elements, guaranteed to be a multiple of 8 and at least 8
- `threshold` — keep only elements strictly less than this

**Returns:** the number of elements written to `output`

## Example

```
Input:  input = [1, 8, 3, 7, 2, 9, 4, 6], threshold = 5
Output: output = [1, 3, 2, 4], return 4
```

## Constraints

- `8 ≤ n ≤ 4,000,000`
- `n` is always a multiple of 8
- `input` is 32-byte aligned
- `output` has at least `n + 8` elements of space (the extra 8 account for trailing writes)
- Output elements must appear in the same relative order as in the input

## Notes

The standard AVX2 approach uses a **permutation lookup table**:

1. Compare 8 elements against the threshold to get a mask
2. `movemask` converts it to an 8-bit integer (256 possible values)
3. A precomputed LUT maps each mask to a permutation that moves qualifying elements to the front
4. `_mm256_permutevar8x32_epi32` applies the permutation
5. Store the result (trailing garbage is fine since we track the count)
6. Advance the output pointer by `popcount(mask)`

The LUT can be built at compile time with `constexpr`.

:::hint{title="Hint 1: Building the permutation table"}
For each 8-bit mask (0–255), compute which bit positions are set. These become the permutation indices. For mask `0b00001101` (bits 0, 2, 3): the permutation is `{0, 2, 3, ...}`. The remaining positions don't matter.
:::

:::hint{title="Hint 2: Applying the permutation"}
`_mm256_permutevar8x32_epi32(data, perm)` selects elements from `data` using indices in `perm`. Unlike most AVX2 operations, this permutes across the full 256-bit register (not per-lane).
:::

:::hint{title="Hint 3: Advancing the output pointer"}
`__builtin_popcount(mask)` gives the number of qualifying elements in this block — that's how far to advance the output write position.
:::

## Useful Intrinsics

| Intrinsic | Description |
|-----------|-------------|
| `_mm256_load_si256(ptr)` | Load 256 bits from aligned memory |
| `_mm256_storeu_si256(ptr, v)` | Store 256 bits to memory (unaligned OK) |
| `_mm256_set1_epi32(x)` | Broadcast a 32-bit integer |
| `_mm256_cmpgt_epi32(a, b)` | Compare: all-ones where `a > b` |
| `_mm256_castsi256_ps(v)` | Reinterpret as float vector (free) |
| `_mm256_movemask_ps(v)` | Extract sign bits into 8-bit mask |
| `_mm256_permutevar8x32_epi32(v, idx)` | Full cross-lane 32-bit permute using index vector |
| `__builtin_popcount(x)` | Count set bits |
