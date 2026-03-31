Compute the inclusive prefix sum of an array using AVX2 intrinsics.

The prefix sum (also called scan) of an array is a new array where each element is the sum of all elements up to and including that position: `output[i] = input[0] + input[1] + ... + input[i]`.

Prefix sum is inherently sequential — each output depends on all previous inputs. The SIMD challenge is to compute it faster despite this dependency.

## Function Signature

```cpp
#include <immintrin.h>
#include <cstdint>

void prefix_sum(const int32_t* input, int32_t* output, int n);
```

**Parameters:**
- `input` — pointer to the input array, guaranteed 32-byte aligned
- `output` — pointer to the output array, guaranteed 32-byte aligned
- `n` — number of elements, guaranteed to be a multiple of 8 and at least 8

**Returns:** nothing (result is written to `output`)

## Example

```
Input:  [1, 2, 3, 4, 5, 6, 7, 8]
Output: [1, 3, 6, 10, 15, 21, 28, 36]
```

## Constraints

- `8 ≤ n ≤ 4,000,000`
- `n` is always a multiple of 8
- All elements are in range `[-100, 100]`
- All prefix sums fit in a 32-bit signed integer
- Both arrays are 32-byte aligned

## Notes

The standard approach computes a prefix sum within each 8-element block using shifts and adds, then propagates the block total to the next block as a running offset.

The tricky part is that `_mm256_slli_si256` shifts within each 128-bit lane independently — it does **not** shift across the lane boundary. You need a separate cross-lane fix-up step.

:::hint{title="Hint 1: In-lane prefix sum"}
`_mm256_slli_si256(x, 4)` shifts each 128-bit lane left by 4 bytes (one int32). Add this to `x` to get 2-wide prefix sums. Repeat with a shift of 8 bytes for 4-wide prefix sums. Each 128-bit lane now has its own independent prefix sum.
:::

:::hint{title="Hint 2: Cross-lane fix-up"}
The high lane needs the total from the low lane added to it. Use `_mm256_permute2x128_si256(x, x, 0x00)` to broadcast the low lane, `_mm256_shuffle_epi32(..., 0xFF)` to broadcast element [3] (last of low lane), then `_mm256_permute2x128_si256(zero, fix, 0x20)` to place it in only the high lane.
:::

:::hint{title="Hint 3: Block-to-block propagation"}
After computing each block's prefix sum, add a `running_total` (broadcast with `set1`). Update `running_total` to the last element of the current block using `_mm256_extracti128_si256` + `_mm_extract_epi32`.
:::

## Useful Intrinsics

| Intrinsic | Description |
|-----------|-------------|
| `_mm256_load_si256(ptr)` | Load 256 bits from aligned memory |
| `_mm256_store_si256(ptr, v)` | Store 256 bits to aligned memory |
| `_mm256_slli_si256(v, n)` | Shift each 128-bit lane left by `n` bytes (zero fill) |
| `_mm256_add_epi32(a, b)` | Add packed 32-bit integers |
| `_mm256_set1_epi32(x)` | Broadcast a 32-bit integer |
| `_mm256_shuffle_epi32(v, imm)` | Shuffle 32-bit elements within each 128-bit lane |
| `_mm256_permute2x128_si256(a, b, imm)` | Select 128-bit lanes from two registers |
| `_mm256_extracti128_si256(v, 1)` | Extract high 128-bit lane |
| `_mm_extract_epi32(v, idx)` | Extract a 32-bit element from 128-bit register |
