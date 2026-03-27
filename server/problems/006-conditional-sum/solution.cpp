#include <immintrin.h>
#include <cstdint>

int32_t conditional_sum(const int32_t* arr, int n, int32_t threshold) {
    __m256i thresh = _mm256_set1_epi32(threshold);
    __m256i acc = _mm256_setzero_si256();

    for (int i = 0; i < n; i += 8) {
        __m256i x = _mm256_load_si256(reinterpret_cast<const __m256i*>(arr + i));
        // cmpgt(thresh, x) → all-ones where thresh > x, i.e. x < threshold
        __m256i mask = _mm256_cmpgt_epi32(thresh, x);
        // AND zeros out elements that don't qualify
        x = _mm256_and_si256(x, mask);
        acc = _mm256_add_epi32(acc, x);
    }

    __m128i lo = _mm256_castsi256_si128(acc);
    __m128i hi = _mm256_extracti128_si256(acc, 1);
    __m128i sum128 = _mm_add_epi32(lo, hi);
    sum128 = _mm_hadd_epi32(sum128, sum128);
    sum128 = _mm_hadd_epi32(sum128, sum128);
    return _mm_extract_epi32(sum128, 0);
}
