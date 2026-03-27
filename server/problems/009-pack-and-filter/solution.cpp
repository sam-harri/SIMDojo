#include <immintrin.h>
#include <cstdint>

struct PermTable {
    alignas(32) int permutation[256][8];

    constexpr PermTable() : permutation{} {
        for (int m = 0; m < 256; m++) {
            int k = 0;
            for (int i = 0; i < 8; i++)
                if ((m >> i) & 1)
                    permutation[m][k++] = i;
            // Remaining slots don't matter (trailing garbage)
        }
    }
};

static constexpr PermTable PERM = {};

int pack_and_filter(const int32_t* input, int32_t* output, int n, int32_t threshold) {
    __m256i thresh = _mm256_set1_epi32(threshold);
    int k = 0;

    for (int i = 0; i < n; i += 8) {
        __m256i x = _mm256_load_si256(reinterpret_cast<const __m256i*>(input + i));
        __m256i cmp = _mm256_cmpgt_epi32(thresh, x);  // thresh > x → x < threshold
        int mask = _mm256_movemask_ps(_mm256_castsi256_ps(cmp));

        __m256i perm = _mm256_load_si256(reinterpret_cast<const __m256i*>(PERM.permutation[mask]));
        x = _mm256_permutevar8x32_epi32(x, perm);
        _mm256_storeu_si256(reinterpret_cast<__m256i*>(output + k), x);

        k += __builtin_popcount(mask);
    }

    return k;
}
