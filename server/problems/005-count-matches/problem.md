Count how many elements in an array are equal to a given target value using AVX2 intrinsics.

## Function Signature

```cpp
#include <immintrin.h>
#include <cstdint>

int count_matches(const int32_t* arr, int n, int32_t target);
```

**Parameters:**
- `arr`: pointer to an array of `n` signed 32-bit integers, guaranteed 32-byte aligned
- `n`: number of elements, guaranteed to be a multiple of 8 and at least 8
- `target`: the value to count

**Returns:** the number of elements equal to `target`

## Example

```
Input:  arr = [1, 2, 3, 2, 5, 2, 7, 2], target = 2
Output: 4
```

## Constraints

- `8 ≤ n ≤ 1,000,000`
- `n` is always a multiple of 8
- `arr` is 32-byte aligned

## Notes

Two common approaches:

1. **Movemask + popcount:** Compare, extract an 8-bit mask with `movemask`, and count bits with `__builtin_popcount`.
2. **Mask-as-minus-one:** `cmpeq` produces all-ones per matching lane, which is `-1` as a signed integer. Accumulate with `add_epi32`, then negate the final sum. This avoids the `movemask` bottleneck.

:::hint{title="Hint 1: Vectorized comparison"}
`_mm256_cmpeq_epi32(v, target_vec)` produces a mask where each 32-bit lane is all-ones (`0xFFFFFFFF`) if equal, or all-zeros if not.
:::

:::hint{title="Hint 2: Approach A — movemask"}
Cast the result to `__m256` and call `_mm256_movemask_ps` to get an 8-bit integer. `__builtin_popcount` counts its set bits. Accumulate into a scalar counter.
:::

:::hint{title="Hint 3: Approach B — mask arithmetic"}
All-ones in two's complement is `-1`. So `_mm256_add_epi32(acc, mask)` subtracts 1 from the accumulator per match. After the loop, horizontally sum the accumulator and negate.
:::

## Useful Intrinsics

| Intrinsic | Description |
|-----------|-------------|
| `_mm256_load_si256(ptr)` | Load 256 bits from aligned memory |
| `_mm256_set1_epi32(x)` | Broadcast a 32-bit integer to all lanes |
| `_mm256_cmpeq_epi32(a, b)` | Compare packed 32-bit integers for equality |
| `_mm256_movemask_ps(v)` | Extract the sign bit of each 32-bit float (8-bit mask) |
| `_mm256_add_epi32(a, b)` | Add packed 32-bit integers |
| `__builtin_popcount(x)` | Count set bits in an integer |
