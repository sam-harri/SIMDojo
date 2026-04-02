Sum all elements in an array that are strictly less than a given threshold using AVX2 masking.

## Function Signature

```cpp
#include <immintrin.h>
#include <cstdint>

int32_t conditional_sum(const int32_t* arr, int n, int32_t threshold);
```

**Parameters:**
- `arr`: pointer to an array of `n` signed 32-bit integers, guaranteed 32-byte aligned
- `n`: number of elements, guaranteed to be a multiple of 8 and at least 8
- `threshold`: sum only elements strictly less than this value

**Returns:** the sum of all elements where `arr[i] < threshold` (guaranteed to fit in `int32_t`)

## Example

```
Input:  arr = [1, 5, 3, 8, 2, 7, 4, 6], threshold = 5
Output: 10  (1 + 3 + 2 + 4)
```

## Constraints

- `8 ≤ n ≤ 1,000,000`
- `n` is always a multiple of 8
- All elements are in range `[-1000, 1000]`
- The conditional sum fits in a 32-bit signed integer
- `arr` is 32-byte aligned

## Notes

AVX2 has no `cmplt` instruction. Use `_mm256_cmpgt_epi32` with arguments swapped: `cmpgt(threshold, x)` gives a mask where `x < threshold`.

Since one branch of the predication is zero (you either add the element or nothing), use bitwise AND with the mask instead of a blend.

:::hint{title="Hint 1: Comparison mask"}
`_mm256_cmpgt_epi32(thresh_vec, x)` produces all-ones in lanes where `x < threshold`. There is no `cmplt` — swap the operand order.
:::

:::hint{title="Hint 2: Zeroing non-qualifying elements"}
`_mm256_and_si256(x, mask)` keeps `x` where the mask is all-ones and produces zero elsewhere.
:::

:::hint{title="Hint 3: Accumulate and reduce"}
Add the masked values to an accumulator with `_mm256_add_epi32`. After the loop, reduce the 8 partial sums with the standard horizontal reduction (extract lanes, hadd).
:::

## Useful Intrinsics

| Intrinsic | Description |
|-----------|-------------|
| `_mm256_load_si256(ptr)` | Load 256 bits from aligned memory |
| `_mm256_set1_epi32(x)` | Broadcast a 32-bit integer to all lanes |
| `_mm256_cmpgt_epi32(a, b)` | Compare: all-ones where `a > b`, all-zeros otherwise |
| `_mm256_and_si256(a, b)` | Bitwise AND |
| `_mm256_add_epi32(a, b)` | Add packed 32-bit integers |
| `_mm256_blendv_epi8(a, b, mask)` | Blend bytes based on mask (alternative to AND) |
