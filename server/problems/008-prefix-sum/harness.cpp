#include <cstdio>
#include <cstdlib>
#include <cstdint>
#include <cstring>
#include <ctime>
#include <immintrin.h>

#include "solution.cpp"

static void scalar_prefix_sum(const int32_t* input, int32_t* output, int n) {
    int32_t sum = 0;
    for (int i = 0; i < n; i++) {
        sum += input[i];
        output[i] = sum;
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

static long long measure_ns(const int32_t* input, int32_t* output, int n) {
    struct timespec start, end;
    prefix_sum(input, output, n);
    clock_gettime(CLOCK_MONOTONIC, &start);
    for (int i = 0; i < 100; i++) {
        prefix_sum(input, output, n);
    }
    clock_gettime(CLOCK_MONOTONIC, &end);
    long long elapsed = (end.tv_sec - start.tv_sec) * 1000000000LL +
                        (end.tv_nsec - start.tv_nsec);
    return elapsed / 100;
}

struct Test {
    const int32_t* data;
    int n;
    bool sample;
    const char* input;
};

struct TestResult {
    bool passed;
    long long time_ns;
    char expected[64];
    char actual[64];
    const char* input_str;
};

int main() {
    // Sample tests
    static const int32_t s1[] = {1, 2, 3, 4, 5, 6, 7, 8};
    static const int32_t s2[] = {1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1};
    static const int32_t s3[] = {-3, 5, -1, 2, 0, -4, 7, -6};

    // Hidden tests
    static int32_t h1[256];
    for (int i = 0; i < 256; i++) h1[i] = 1;

    static int32_t h2[256];
    for (int i = 0; i < 256; i++) h2[i] = (i % 2 == 0) ? 1 : -1;

    const int N_LARGE = 1000000;
    int32_t* h3 = alloc_aligned(N_LARGE);
    for (int i = 0; i < N_LARGE; i++) h3[i] = (i % 100) - 50;

    const int N_XLARGE = 4000000;
    int32_t* h4 = alloc_aligned(N_XLARGE);
    for (int i = 0; i < N_XLARGE; i++) h4[i] = (i % 7) - 3;

    Test tests[] = {
        { s1, 8,   true,  "input = [1, 2, 3, 4, 5, 6, 7, 8]" },
        { s2, 16,  true,  "input = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]" },
        { s3, 8,   true,  "input = [-3, 5, -1, 2, 0, -4, 7, -6]" },
        { h1, 256,      false, nullptr },
        { h2, 256,      false, nullptr },
        { h3, N_LARGE,  false, nullptr },
        { h4, N_XLARGE, false, nullptr },
    };
    const int num_tests = sizeof(tests) / sizeof(tests[0]);

    const char* mode = getenv("SIMDOJO_MODE");
    if (!mode) mode = "submit";
    bool is_run = (strcmp(mode, "run") == 0);

    TestResult results[32];
    int tests_run = 0;
    int total_passed = 0;

    for (int t = 0; t < num_tests; t++) {
        if (is_run && !tests[t].sample) continue;

        int n = tests[t].n;
        int32_t* expected_out = alloc_aligned(n);
        int32_t* actual_out = alloc_aligned(n);

        scalar_prefix_sum(tests[t].data, expected_out, n);
        prefix_sum(tests[t].data, actual_out, n);

        TestResult& r = results[tests_run];
        r.input_str = tests[t].input;
        r.time_ns = 0;

        int mismatch = -1;
        for (int i = 0; i < n; i++) {
            if (actual_out[i] != expected_out[i]) {
                mismatch = i;
                break;
            }
        }

        if (mismatch == -1) {
            r.passed = true;
            snprintf(r.expected, sizeof(r.expected), "correct");
            snprintf(r.actual, sizeof(r.actual), "correct");
            if (!is_run && n >= 1024) {
                r.time_ns = measure_ns(tests[t].data, actual_out, n);
            }
            total_passed++;
        } else {
            r.passed = false;
            snprintf(r.expected, sizeof(r.expected), "output[%d] = %d", mismatch, expected_out[mismatch]);
            snprintf(r.actual, sizeof(r.actual), "output[%d] = %d", mismatch, actual_out[mismatch]);
        }

        free(expected_out);
        free(actual_out);
        tests_run++;
    }

    FILE* f = fopen("__result.json", "w");
    if (!f) { fprintf(stderr, "failed to open __result.json\n"); return 1; }

    fprintf(f, "{\"mode\":\"%s\",\"tests_passed\":%d,\"tests_total\":%d", mode, total_passed, tests_run);

    if (is_run) {
        fprintf(f, ",\"results\":[");
        for (int i = 0; i < tests_run; i++) {
            if (i > 0) fprintf(f, ",");
            fprintf(f, "{\"passed\":%s,\"expected\":\"%s\",\"actual\":\"%s\"",
                results[i].passed ? "true" : "false",
                results[i].expected, results[i].actual);
            if (results[i].input_str)
                fprintf(f, ",\"input\":\"%s\"", results[i].input_str);
            fprintf(f, "}");
        }
        fprintf(f, "]");
    } else {
        fprintf(f, ",\"results\":[]");

        long long peak_time_ns = 0;
        for (int i = 0; i < tests_run; i++) {
            if (results[i].passed && results[i].time_ns > peak_time_ns)
                peak_time_ns = results[i].time_ns;
        }
        if (peak_time_ns > 0)
            fprintf(f, ",\"exec_time_ns\":%lld", peak_time_ns);

        for (int i = 0; i < tests_run; i++) {
            if (!results[i].passed) {
                fprintf(f, ",\"first_failure\":{\"expected\":\"%s\",\"actual\":\"%s\"}",
                    results[i].expected, results[i].actual);
                break;
            }
        }
    }

    fprintf(f, "}\n");
    fclose(f);

    free(h3);
    free(h4);
    return total_passed == tests_run ? 0 : 1;
}
