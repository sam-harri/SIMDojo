#include <immintrin.h>
#include <cstdint>

int32_t array_sum(const int32_t* arr, int n) {
    __m256i acc = _mm256_setzero_si256();

    for (int i = 0; i < n; i += 8) {
        __m256i v = _mm256_load_si256(reinterpret_cast<const __m256i*>(arr + i));
        acc = _mm256_add_epi32(acc, v);
    }

    // Horizontal reduction: 8 → 4 → 2 → 1
    __m128i lo = _mm256_castsi256_si128(acc);
    __m128i hi = _mm256_extracti128_si256(acc, 1);
    __m128i sum128 = _mm_add_epi32(lo, hi);
    sum128 = _mm_hadd_epi32(sum128, sum128);
    sum128 = _mm_hadd_epi32(sum128, sum128);
    return _mm_extract_epi32(sum128, 0);
}
