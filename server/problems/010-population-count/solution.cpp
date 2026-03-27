#include <immintrin.h>
#include <cstdint>

int64_t population_count(const uint32_t* arr, int n) {
    const __m256i lookup = _mm256_setr_epi8(
        0,1,1,2,1,2,2,3,1,2,2,3,2,3,3,4,
        0,1,1,2,1,2,2,3,1,2,2,3,2,3,3,4
    );
    const __m256i low_mask = _mm256_set1_epi8(0x0f);

    __m256i total = _mm256_setzero_si256();

    int i = 0;
    while (i < n) {
        __m256i acc = _mm256_setzero_si256();
        // Each byte accumulator gets at most 8 per iteration (4 bits max per nibble lookup × 2 nibbles)
        // 255 / 8 = 31 safe iterations before overflow
        int limit = i + 31 * 8;
        if (limit > n) limit = n;

        for (; i < limit; i += 8) {
            __m256i x = _mm256_load_si256(reinterpret_cast<const __m256i*>(arr + i));

            __m256i lo = _mm256_and_si256(x, low_mask);
            __m256i hi = _mm256_and_si256(_mm256_srli_epi16(x, 4), low_mask);

            acc = _mm256_add_epi8(acc, _mm256_shuffle_epi8(lookup, lo));
            acc = _mm256_add_epi8(acc, _mm256_shuffle_epi8(lookup, hi));
        }

        // Reduce byte accumulators to 64-bit with sad
        total = _mm256_add_epi64(total, _mm256_sad_epu8(acc, _mm256_setzero_si256()));
    }

    // Horizontal sum of 4 × 64-bit values
    __m128i lo128 = _mm256_castsi256_si128(total);
    __m128i hi128 = _mm256_extracti128_si256(total, 1);
    __m128i sum128 = _mm_add_epi64(lo128, hi128);
    __m128i hi64 = _mm_unpackhi_epi64(sum128, sum128);
    sum128 = _mm_add_epi64(sum128, hi64);
    return _mm_cvtsi128_si64(sum128);
}
