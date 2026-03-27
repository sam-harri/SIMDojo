#include <cstdio>
#include <cstdlib>
#include <cstdint>
#include <cstring>
#include <ctime>
#include <immintrin.h>

#include "solution.cpp"

static int64_t scalar_popcount(const uint32_t* arr, int n) {
    int64_t cnt = 0;
    for (int i = 0; i < n; i++) cnt += __builtin_popcount(arr[i]);
    return cnt;
}

static uint32_t* alloc_aligned(int n) {
    void* p = nullptr;
    if (posix_memalign(&p, 32, static_cast<size_t>(n) * sizeof(uint32_t)) != 0) {
        fprintf(stderr, "alloc failed\n");
        exit(1);
    }
    return static_cast<uint32_t*>(p);
}

static long long measure_ns(const uint32_t* arr, int n) {
    struct timespec start, end;
    volatile int64_t sink = population_count(arr, n);
    (void)sink;
    clock_gettime(CLOCK_MONOTONIC, &start);
    for (int i = 0; i < 100; i++) {
        volatile int64_t s = population_count(arr, n);
        (void)s;
    }
    clock_gettime(CLOCK_MONOTONIC, &end);
    long long elapsed = (end.tv_sec - start.tv_sec) * 1000000000LL +
                        (end.tv_nsec - start.tv_nsec);
    return elapsed / 100;
}

struct Test {
    const uint32_t* data;
    int n;
    bool sample;
    const char* input;
};

struct TestResult {
    bool passed;
    long long time_ns;
    int64_t expected;
    int64_t actual;
    const char* input;
};

int main() {
    // Sample tests
    static const uint32_t s1[] = {7, 0, 15, 1, 3, 255, 0, 8};      // 3+0+4+1+2+8+0+1 = 19
    static const uint32_t s2[] = {0xFFFFFFFF, 0, 0, 0, 0, 0, 0, 0}; // 32
    static const uint32_t s3[] = {1, 1, 1, 1, 1, 1, 1, 1};           // 8

    // Hidden tests
    static uint32_t h1[256];
    for (int i = 0; i < 256; i++) h1[i] = 0xFFFFFFFF;  // 256 * 32 = 8192

    static uint32_t h2[256];
    for (int i = 0; i < 256; i++) h2[i] = static_cast<uint32_t>(i);  // various

    const int N_LARGE = 1000000;
    uint32_t* h3 = alloc_aligned(N_LARGE);
    for (int i = 0; i < N_LARGE; i++) h3[i] = static_cast<uint32_t>(i) * 2654435761u;  // Knuth hash for variety

    const int N_XLARGE = 4000000;
    uint32_t* h4 = alloc_aligned(N_XLARGE);
    for (int i = 0; i < N_XLARGE; i++) h4[i] = static_cast<uint32_t>(i) * 1664525u + 1013904223u;

    Test tests[] = {
        { s1, 8,  true,  "arr = [7, 0, 15, 1, 3, 255, 0, 8]" },
        { s2, 8,  true,  "arr = [0xFFFFFFFF, 0, 0, 0, 0, 0, 0, 0]" },
        { s3, 8,  true,  "arr = [1, 1, 1, 1, 1, 1, 1, 1]" },
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

        int64_t expected = scalar_popcount(tests[t].data, tests[t].n);
        int64_t actual = population_count(tests[t].data, tests[t].n);

        TestResult& r = results[tests_run];
        r.expected = expected;
        r.actual = actual;
        r.input = tests[t].input;

        if (actual == expected) {
            r.passed = true;
            r.time_ns = (!is_run && tests[t].n >= 1024) ? measure_ns(tests[t].data, tests[t].n) : 0;
            total_passed++;
        } else {
            r.passed = false;
            r.time_ns = 0;
        }

        tests_run++;
    }

    FILE* f = fopen("__result.json", "w");
    if (!f) { fprintf(stderr, "failed to open __result.json\n"); return 1; }

    fprintf(f, "{\"mode\":\"%s\",\"tests_passed\":%d,\"tests_total\":%d", mode, total_passed, tests_run);

    if (is_run) {
        fprintf(f, ",\"results\":[");
        for (int i = 0; i < tests_run; i++) {
            if (i > 0) fprintf(f, ",");
            fprintf(f, "{\"passed\":%s,\"expected\":\"%lld\",\"actual\":\"%lld\"",
                results[i].passed ? "true" : "false",
                (long long)results[i].expected, (long long)results[i].actual);
            if (results[i].input)
                fprintf(f, ",\"input\":\"%s\"", results[i].input);
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
                fprintf(f, ",\"first_failure\":{\"expected\":\"%lld\",\"actual\":\"%lld\"}",
                    (long long)results[i].expected, (long long)results[i].actual);
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
