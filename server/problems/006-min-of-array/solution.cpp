#include <immintrin.h>
#include <cstdint>

int32_t array_min(const int32_t* arr, int n) {
    __m256i vmin = _mm256_load_si256(reinterpret_cast<const __m256i*>(arr));

    for (int i = 8; i < n; i += 8) {
        __m256i v = _mm256_load_si256(reinterpret_cast<const __m256i*>(arr + i));
        vmin = _mm256_min_epi32(vmin, v);
    }

    // Horizontal min: reduce 8 → 1
    __m128i lo = _mm256_castsi256_si128(vmin);
    __m128i hi = _mm256_extracti128_si256(vmin, 1);
    __m128i m = _mm_min_epi32(lo, hi);                    // 4 elements
    m = _mm_min_epi32(m, _mm_shuffle_epi32(m, 0x4E));     // 0x4E = swap hi/lo 64-bit halves
    m = _mm_min_epi32(m, _mm_shuffle_epi32(m, 0xB1));     // 0xB1 = swap adjacent 32-bit
    return _mm_extract_epi32(m, 0);
}
