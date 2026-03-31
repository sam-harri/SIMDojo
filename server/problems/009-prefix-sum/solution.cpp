#include <immintrin.h>
#include <cstdint>

void prefix_sum(const int32_t* input, int32_t* output, int n) {
    int32_t running = 0;

    for (int i = 0; i < n; i += 8) {
        __m256i x = _mm256_load_si256(reinterpret_cast<const __m256i*>(input + i));

        // In-lane prefix sum (each 128-bit lane independently)
        // Step 1: shift by 1 element (4 bytes) within each lane, add
        x = _mm256_add_epi32(x, _mm256_slli_si256(x, 4));
        // Step 2: shift by 2 elements (8 bytes) within each lane, add
        x = _mm256_add_epi32(x, _mm256_slli_si256(x, 8));

        // Cross-lane: add last element of low lane to entire high lane
        // Broadcast low lane into both lanes
        __m256i cross = _mm256_permute2x128_si256(x, x, 0x00);
        // Broadcast element [3] (last of low lane) to all positions
        cross = _mm256_shuffle_epi32(cross, 0xFF);
        // Zero out the low lane, keep fix in high lane
        __m256i zero = _mm256_setzero_si256();
        cross = _mm256_permute2x128_si256(zero, cross, 0x20);
        x = _mm256_add_epi32(x, cross);

        // Add running total from previous block
        __m256i run_vec = _mm256_set1_epi32(running);
        x = _mm256_add_epi32(x, run_vec);

        _mm256_store_si256(reinterpret_cast<__m256i*>(output + i), x);

        // Update running total: last element of this block
        // Extract element [7] — last element of high lane
        running = _mm_extract_epi32(_mm256_extracti128_si256(x, 1), 3);
    }
}
