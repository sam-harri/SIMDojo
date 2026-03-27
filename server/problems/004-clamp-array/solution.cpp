#include <immintrin.h>
#include <cstdint>

void clamp_array(int32_t* arr, int n, int32_t lo, int32_t hi) {
    __m256i vlo = _mm256_set1_epi32(lo);
    __m256i vhi = _mm256_set1_epi32(hi);

    for (int i = 0; i < n; i += 8) {
        __m256i v = _mm256_load_si256(reinterpret_cast<__m256i*>(arr + i));
        v = _mm256_max_epi32(v, vlo);
        v = _mm256_min_epi32(v, vhi);
        _mm256_store_si256(reinterpret_cast<__m256i*>(arr + i), v);
    }
}
