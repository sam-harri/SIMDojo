#include <immintrin.h>
#include <cstdint>

int32_t dot_product(const int32_t* a, const int32_t* b, int n) {
    __m256i acc = _mm256_setzero_si256();

    for (int i = 0; i < n; i += 8) {
        __m256i va = _mm256_load_si256(reinterpret_cast<const __m256i*>(a + i));
        __m256i vb = _mm256_load_si256(reinterpret_cast<const __m256i*>(b + i));
        __m256i prod = _mm256_mullo_epi32(va, vb);
        acc = _mm256_add_epi32(acc, prod);
    }

    __m128i lo = _mm256_castsi256_si128(acc);
    __m128i hi = _mm256_extracti128_si256(acc, 1);
    __m128i sum128 = _mm_add_epi32(lo, hi);
    sum128 = _mm_hadd_epi32(sum128, sum128);
    sum128 = _mm_hadd_epi32(sum128, sum128);
    return _mm_extract_epi32(sum128, 0);
}
