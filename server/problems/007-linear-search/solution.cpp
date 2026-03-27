#include <immintrin.h>
#include <cstdint>

int linear_search(const int32_t* arr, int n, int32_t target) {
    __m256i x = _mm256_set1_epi32(target);

    for (int i = 0; i < n; i += 8) {
        __m256i y = _mm256_load_si256(reinterpret_cast<const __m256i*>(arr + i));
        __m256i m = _mm256_cmpeq_epi32(x, y);
        int mask = _mm256_movemask_ps(_mm256_castsi256_ps(m));
        if (mask != 0)
            return i + __builtin_ctz(mask);
    }

    return -1;
}
