#include <immintrin.h>
#include <cstdint>

void add_arrays(const int32_t* a, const int32_t* b, int32_t* c, int n) {
    for (int i = 0; i < n; i += 8) {
        __m256i va = _mm256_load_si256(reinterpret_cast<const __m256i*>(a + i));
        __m256i vb = _mm256_load_si256(reinterpret_cast<const __m256i*>(b + i));
        __m256i vc = _mm256_add_epi32(va, vb);
        _mm256_store_si256(reinterpret_cast<__m256i*>(c + i), vc);
    }
}
