Count the total number of set bits across an entire array of 32-bit unsigned integers using the AVX2 shuffle-based nibble lookup technique.

## Function Signature

```cpp
#include <immintrin.h>
#include <cstdint>

int64_t population_count(const uint32_t* arr, int n);
```

**Parameters:**
- `arr`: pointer to an array of `n` unsigned 32-bit integers, guaranteed 32-byte aligned
- `n`: number of elements, guaranteed to be a multiple of 8 and at least 8

**Returns:** the total number of set bits across all elements (as `int64_t`)

## Example

```
Input:  [7, 0, 15, 1, 3, 255, 0, 8]
Output: 19

Explanation: popcount of each: 3+0+4+1+2+8+0+1 = 19
```

## Constraints

- `8 ≤ n ≤ 4,000,000`
- `n` is always a multiple of 8
- `arr` is 32-byte aligned
- The total popcount fits in `int64_t`

## Notes

A nibble (4 bits) has only 16 possible values, so its popcount fits in a 16-entry table. `_mm256_shuffle_epi8` acts as a parallel lookup — it uses each byte of the index vector to select from a 16-byte table (within each 128-bit lane).

Split each byte into its low and high nibbles, look up both, and add. Accumulate in 8-bit counters (which overflow after ~31 iterations), then periodically widen to 64-bit using `_mm256_sad_epu8`.

:::hint{title="Hint 1: The nibble LUT"}
Create a 16-byte lookup table (replicated for both lanes) with the popcount of values 0–15: `{0,1,1,2,1,2,2,3,1,2,2,3,2,3,3,4}`. Load with `_mm256_setr_epi8`.
:::

:::hint{title="Hint 2: Splitting nibbles"}
For each 32-byte chunk: `AND` with `0x0F` extracts low nibbles. Shift right by 4 (`_mm256_srli_epi16(x, 4)`) then `AND` with `0x0F` extracts high nibbles. Use `shuffle_epi8` to look up both.
:::

:::hint{title="Hint 3: Avoiding overflow"}
Byte accumulators max out at 255. Each iteration adds at most 8 per byte (two nibble lookups, max 4 each). After 31 iterations, reduce to 64-bit with `_mm256_sad_epu8(acc, zero)` — this sums groups of 8 bytes into 64-bit integers.
:::

## Useful Intrinsics

| Intrinsic | Description |
|-----------|-------------|
| `_mm256_load_si256(ptr)` | Load 256 bits from aligned memory |
| `_mm256_setr_epi8(...)` | Set 32 individual bytes |
| `_mm256_set1_epi8(x)` | Broadcast a byte to all 32 positions |
| `_mm256_shuffle_epi8(table, idx)` | Parallel byte lookup (per 128-bit lane) |
| `_mm256_and_si256(a, b)` | Bitwise AND |
| `_mm256_srli_epi16(v, n)` | Shift each 16-bit element right by `n` bits |
| `_mm256_add_epi8(a, b)` | Add packed 8-bit integers |
| `_mm256_sad_epu8(a, b)` | Sum absolute differences of bytes, result in 64-bit |
| `_mm256_add_epi64(a, b)` | Add packed 64-bit integers |
