#include <immintrin.h>
#include <cstdint>

int count_matches(const int32_t* arr, int n, int32_t target) {
    __m256i tgt = _mm256_set1_epi32(target);
    __m256i acc = _mm256_setzero_si256();

    for (int i = 0; i < n; i += 8) {
        __m256i v = _mm256_load_si256(reinterpret_cast<const __m256i*>(arr + i));
        __m256i mask = _mm256_cmpeq_epi32(v, tgt);
        // mask is all-ones (-1) per matching lane, 0 otherwise
        // Accumulate: adding -1 per match, negate at the end
        acc = _mm256_add_epi32(acc, mask);
    }

    // Horizontal sum then negate
    __m128i lo = _mm256_castsi256_si128(acc);
    __m128i hi = _mm256_extracti128_si256(acc, 1);
    __m128i sum128 = _mm_add_epi32(lo, hi);
    sum128 = _mm_hadd_epi32(sum128, sum128);
    sum128 = _mm_hadd_epi32(sum128, sum128);
    return -_mm_extract_epi32(sum128, 0);
}
