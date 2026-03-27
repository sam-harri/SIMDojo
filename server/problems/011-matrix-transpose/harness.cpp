#include <cstdio>
#include <cstdlib>
#include <cstdint>
#include <cstring>
#include <ctime>
#include <immintrin.h>

// User's solution is included here
#include "solution.cpp"

static void scalar_transpose(int32_t* matrix) {
    for (int r = 0; r < 8; r++) {
        for (int c = r + 1; c < 8; c++) {
            int32_t tmp = matrix[r*8 + c];
            matrix[r*8 + c] = matrix[c*8 + r];
            matrix[c*8 + r] = tmp;
        }
    }
}

static int32_t* alloc_aligned(int n) {
    void* p = nullptr;
    if (posix_memalign(&p, 32, static_cast<size_t>(n) * sizeof(int32_t)) != 0) {
        fprintf(stderr, "alloc failed\n");
        exit(1);
    }
    return static_cast<int32_t*>(p);
}

static long long measure_ns(int32_t* scratch) {
    // Prepare a matrix in scratch, then transpose it 100 times.
    // Transposing twice restores original, so we re-init each pair.
    struct timespec start, end;

    // Warm up
    for (int i = 0; i < 64; i++) scratch[i] = i;
    transpose_8x8(scratch);

    clock_gettime(CLOCK_MONOTONIC, &start);
    for (int i = 0; i < 100; i++) {
        // Re-init each iteration so the function always does real work
        for (int j = 0; j < 64; j++) scratch[j] = j;
        transpose_8x8(scratch);
    }
    clock_gettime(CLOCK_MONOTONIC, &end);
    long long elapsed = (end.tv_sec - start.tv_sec) * 1000000000LL +
                        (end.tv_nsec - start.tv_nsec);
    return elapsed / 100;
}

struct Test {
    int32_t input[64];
    bool sample;
    const char* input_str;
};

struct TestResult {
    bool passed;
    long long time_ns;
    char expected_str[128];
    char actual_str[128];
    const char* input_str;
};

// Find first mismatch between two 8x8 matrices. Returns -1 if identical.
static int find_mismatch(const int32_t* a, const int32_t* b) {
    for (int i = 0; i < 64; i++) {
        if (a[i] != b[i]) return i;
    }
    return -1;
}

int main() {
    // ---- Sample tests ----

    // S1: sequential matrix row*8+col
    Test s1;
    s1.sample = true;
    s1.input_str = "matrix[r][c] = r*8 + c (sequential 0..63)";
    for (int i = 0; i < 64; i++) s1.input[i] = i;

    // S2: all zeros
    Test s2;
    s2.sample = true;
    s2.input_str = "matrix = all zeros";
    for (int i = 0; i < 64; i++) s2.input[i] = 0;

    // S3: identity-like diagonal
    Test s3;
    s3.sample = true;
    s3.input_str = "matrix[r][c] = (r == c) ? 1 : 0 (identity)";
    for (int r = 0; r < 8; r++)
        for (int c = 0; c < 8; c++)
            s3.input[r*8 + c] = (r == c) ? 1 : 0;

    // ---- Hidden tests ----

    // H1: negative sequential
    Test h1;
    h1.sample = false;
    h1.input_str = nullptr;
    for (int i = 0; i < 64; i++) h1.input[i] = -(i + 1);

    // H2: row-constant (each row is filled with its row index)
    Test h2;
    h2.sample = false;
    h2.input_str = nullptr;
    for (int r = 0; r < 8; r++)
        for (int c = 0; c < 8; c++)
            h2.input[r*8 + c] = r;

    // H3: column-constant (each column is filled with its column index)
    Test h3;
    h3.sample = false;
    h3.input_str = nullptr;
    for (int r = 0; r < 8; r++)
        for (int c = 0; c < 8; c++)
            h3.input[r*8 + c] = c;

    // H4: random-ish pattern
    Test h4;
    h4.sample = false;
    h4.input_str = nullptr;
    for (int i = 0; i < 64; i++) h4.input[i] = (i * 137 + 42) % 1000 - 500;

    // H5: double transpose = identity (verify transpose is its own inverse)
    Test h5;
    h5.sample = false;
    h5.input_str = nullptr;
    for (int i = 0; i < 64; i++) h5.input[i] = i * 3 - 100;

    // H6: large values
    Test h6;
    h6.sample = false;
    h6.input_str = nullptr;
    for (int i = 0; i < 64; i++) h6.input[i] = (i % 2 == 0) ? 999999 : -999999;

    Test tests[] = { s1, s2, s3, h1, h2, h3, h4, h5, h6 };
    const int num_tests = sizeof(tests) / sizeof(tests[0]);

    // Determine mode
    const char* mode = getenv("SIMDOJO_MODE");
    if (!mode) mode = "submit";
    bool is_run = (strcmp(mode, "run") == 0);

    // Aligned scratch buffers
    int32_t* user_buf = alloc_aligned(64);
    int32_t* ref_buf = alloc_aligned(64);
    int32_t* perf_buf = alloc_aligned(64);

    TestResult results[32];
    int tests_run = 0;
    int total_passed = 0;

    for (int t = 0; t < num_tests; t++) {
        if (is_run && !tests[t].sample) continue;

        // Special handling for h5: double-transpose test
        bool is_double_transpose = (!is_run && t == 7); // h5 is index 7

        // Prepare reference: scalar transpose of a copy
        memcpy(ref_buf, tests[t].input, 64 * sizeof(int32_t));
        scalar_transpose(ref_buf);

        // Prepare user buffer: copy input, call user function
        memcpy(user_buf, tests[t].input, 64 * sizeof(int32_t));
        transpose_8x8(user_buf);

        TestResult& r = results[tests_run];
        r.input_str = tests[t].input_str;

        if (is_double_transpose) {
            // For the double transpose test, transpose again and check against original
            int32_t double_buf[64];
            memcpy(double_buf, user_buf, 64 * sizeof(int32_t));
            // Copy to aligned buffer for second transpose
            memcpy(user_buf, double_buf, 64 * sizeof(int32_t));
            transpose_8x8(user_buf);
            int mismatch = find_mismatch(tests[t].input, user_buf);
            if (mismatch < 0) {
                r.passed = true;
                r.time_ns = 0;
                snprintf(r.expected_str, sizeof(r.expected_str), "double transpose = original");
                snprintf(r.actual_str, sizeof(r.actual_str), "double transpose = original");
                total_passed++;
            } else {
                r.passed = false;
                r.time_ns = 0;
                int row = mismatch / 8, col = mismatch % 8;
                snprintf(r.expected_str, sizeof(r.expected_str),
                    "matrix[%d][%d]: %d (original)", row, col, tests[t].input[mismatch]);
                snprintf(r.actual_str, sizeof(r.actual_str),
                    "matrix[%d][%d]: %d (after double transpose)", row, col, user_buf[mismatch]);
            }
        } else {
            int mismatch = find_mismatch(ref_buf, user_buf);
            if (mismatch < 0) {
                r.passed = true;
                r.time_ns = 0;
                snprintf(r.expected_str, sizeof(r.expected_str), "correct");
                snprintf(r.actual_str, sizeof(r.actual_str), "correct");
                total_passed++;
            } else {
                r.passed = false;
                r.time_ns = 0;
                int row = mismatch / 8, col = mismatch % 8;
                snprintf(r.expected_str, sizeof(r.expected_str),
                    "matrix[%d][%d]: %d", row, col, ref_buf[mismatch]);
                snprintf(r.actual_str, sizeof(r.actual_str),
                    "matrix[%d][%d]: %d", row, col, user_buf[mismatch]);
            }
        }

        tests_run++;
    }

    // Performance measurement (submit mode only)
    long long peak_time_ns = 0;
    if (!is_run) {
        peak_time_ns = measure_ns(perf_buf);
    }

    // Write results to file
    FILE* f = fopen("__result.json", "w");
    if (!f) { fprintf(stderr, "failed to open __result.json\n"); return 1; }

    fprintf(f, "{\"mode\":\"%s\",\"tests_passed\":%d,\"tests_total\":%d", mode, total_passed, tests_run);

    if (is_run) {
        fprintf(f, ",\"results\":[");
        for (int i = 0; i < tests_run; i++) {
            if (i > 0) fprintf(f, ",");
            fprintf(f, "{\"passed\":%s,\"expected\":\"%s\",\"actual\":\"%s\"",
                results[i].passed ? "true" : "false",
                results[i].expected_str, results[i].actual_str);
            if (results[i].input_str)
                fprintf(f, ",\"input\":\"%s\"", results[i].input_str);
            fprintf(f, "}");
        }
        fprintf(f, "]");
    } else {
        fprintf(f, ",\"results\":[]");

        if (peak_time_ns > 0)
            fprintf(f, ",\"exec_time_ns\":%lld", peak_time_ns);

        for (int i = 0; i < tests_run; i++) {
            if (!results[i].passed) {
                fprintf(f, ",\"first_failure\":{\"expected\":\"%s\",\"actual\":\"%s\"}",
                    results[i].expected_str, results[i].actual_str);
                break;
            }
        }
    }

    fprintf(f, "}\n");
    fclose(f);

    free(user_buf);
    free(ref_buf);
    free(perf_buf);
    return total_passed == tests_run ? 0 : 1;
}
