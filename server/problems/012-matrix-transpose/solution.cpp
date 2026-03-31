#include <immintrin.h>
#include <cstdint>

void transpose_8x8(int32_t* matrix) {
    // Load 8 rows
    __m256i r0 = _mm256_load_si256((__m256i*)(matrix + 0*8));
    __m256i r1 = _mm256_load_si256((__m256i*)(matrix + 1*8));
    __m256i r2 = _mm256_load_si256((__m256i*)(matrix + 2*8));
    __m256i r3 = _mm256_load_si256((__m256i*)(matrix + 3*8));
    __m256i r4 = _mm256_load_si256((__m256i*)(matrix + 4*8));
    __m256i r5 = _mm256_load_si256((__m256i*)(matrix + 5*8));
    __m256i r6 = _mm256_load_si256((__m256i*)(matrix + 6*8));
    __m256i r7 = _mm256_load_si256((__m256i*)(matrix + 7*8));

    // Phase 1: interleave 32-bit elements
    __m256i t0 = _mm256_unpacklo_epi32(r0, r1);
    __m256i t1 = _mm256_unpackhi_epi32(r0, r1);
    __m256i t2 = _mm256_unpacklo_epi32(r2, r3);
    __m256i t3 = _mm256_unpackhi_epi32(r2, r3);
    __m256i t4 = _mm256_unpacklo_epi32(r4, r5);
    __m256i t5 = _mm256_unpackhi_epi32(r4, r5);
    __m256i t6 = _mm256_unpacklo_epi32(r6, r7);
    __m256i t7 = _mm256_unpackhi_epi32(r6, r7);

    // Phase 2: interleave 64-bit elements
    r0 = _mm256_unpacklo_epi64(t0, t2);
    r1 = _mm256_unpackhi_epi64(t0, t2);
    r2 = _mm256_unpacklo_epi64(t1, t3);
    r3 = _mm256_unpackhi_epi64(t1, t3);
    r4 = _mm256_unpacklo_epi64(t4, t6);
    r5 = _mm256_unpackhi_epi64(t4, t6);
    r6 = _mm256_unpacklo_epi64(t5, t7);
    r7 = _mm256_unpackhi_epi64(t5, t7);

    // Phase 3: swap 128-bit lanes
    t0 = _mm256_permute2x128_si256(r0, r4, 0x20);
    t1 = _mm256_permute2x128_si256(r1, r5, 0x20);
    t2 = _mm256_permute2x128_si256(r2, r6, 0x20);
    t3 = _mm256_permute2x128_si256(r3, r7, 0x20);
    t4 = _mm256_permute2x128_si256(r0, r4, 0x31);
    t5 = _mm256_permute2x128_si256(r1, r5, 0x31);
    t6 = _mm256_permute2x128_si256(r2, r6, 0x31);
    t7 = _mm256_permute2x128_si256(r3, r7, 0x31);

    // Store 8 rows
    _mm256_store_si256((__m256i*)(matrix + 0*8), t0);
    _mm256_store_si256((__m256i*)(matrix + 1*8), t1);
    _mm256_store_si256((__m256i*)(matrix + 2*8), t2);
    _mm256_store_si256((__m256i*)(matrix + 3*8), t3);
    _mm256_store_si256((__m256i*)(matrix + 4*8), t4);
    _mm256_store_si256((__m256i*)(matrix + 5*8), t5);
    _mm256_store_si256((__m256i*)(matrix + 6*8), t6);
    _mm256_store_si256((__m256i*)(matrix + 7*8), t7);
}
