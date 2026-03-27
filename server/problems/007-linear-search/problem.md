Find the index of the first occurrence of a target value in an array using AVX2.

Return the index of the first element equal to `target`, or `-1` if not found. This is the vectorized equivalent of `std::find`.

## Function Signature

```cpp
#include <immintrin.h>
#include <cstdint>

int linear_search(const int32_t* arr, int n, int32_t target);
```

**Parameters:**
- `arr` — pointer to an array of `n` signed 32-bit integers, guaranteed 32-byte aligned
- `n` — number of elements, guaranteed to be a multiple of 8 and at least 8
- `target` — the value to search for

**Returns:** the index of the first occurrence of `target`, or `-1` if not found

## Example

```
Input:  arr = [10, 20, 30, 40, 50, 60, 70, 80], target = 50
Output: 4
```

## Constraints

- `8 ≤ n ≤ 4,000,000`
- `n` is always a multiple of 8
- `arr` is 32-byte aligned
- There may be zero, one, or multiple occurrences of `target`

## Notes

The key advantage of SIMD search is comparing 8 elements at once. When a match is found in a block, you need to determine *which* lane matched — this is where `movemask` and `ctz` (count trailing zeros) come in.

Unlike sum-based problems, search benefits from early exit: you can return as soon as the first match is found.

:::hint{title="Hint 1: Broadcast and compare"}
Broadcast the target with `_mm256_set1_epi32(target)`, then compare each 8-element block with `_mm256_cmpeq_epi32`. This produces all-ones in matching lanes.
:::

:::hint{title="Hint 2: Extract a scalar mask"}
Cast the comparison result to `__m256` with `_mm256_castsi256_ps`, then `_mm256_movemask_ps` extracts the sign bit of each 32-bit element into an 8-bit integer. Non-zero means at least one match.
:::

:::hint{title="Hint 3: Find which lane matched"}
`__builtin_ctz(mask)` returns the index of the lowest set bit — which corresponds to the first matching lane. Add the block offset `i` to get the array index.
:::

## Useful Intrinsics

| Intrinsic | Description |
|-----------|-------------|
| `_mm256_load_si256(ptr)` | Load 256 bits from aligned memory |
| `_mm256_set1_epi32(x)` | Broadcast a 32-bit integer to all lanes |
| `_mm256_cmpeq_epi32(a, b)` | Compare packed 32-bit integers for equality |
| `_mm256_castsi256_ps(v)` | Reinterpret integer vector as float (free, no conversion) |
| `_mm256_movemask_ps(v)` | Extract sign bits into an 8-bit mask |
| `__builtin_ctz(x)` | Count trailing zeros (index of lowest set bit) |
