#include <cstdio>
#include <cstdlib>
#include <cstdint>
#include <cstring>
#include <ctime>
#include <immintrin.h>

#include "solution.cpp"

static int32_t scalar_min(const int32_t* arr, int n) {
    int32_t m = arr[0];
    for (int i = 1; i < n; i++) if (arr[i] < m) m = arr[i];
    return m;
}

static int32_t* alloc_aligned(int n) {
    void* p = nullptr;
    if (posix_memalign(&p, 32, static_cast<size_t>(n) * sizeof(int32_t)) != 0) {
        fprintf(stderr, "alloc failed\n");
        exit(1);
    }
    return static_cast<int32_t*>(p);
}

static long long measure_ns(const int32_t* arr, int n) {
    struct timespec start, end;
    volatile int32_t sink = array_min(arr, n);
    (void)sink;
    clock_gettime(CLOCK_MONOTONIC, &start);
    for (int i = 0; i < 100; i++) {
        volatile int32_t s = array_min(arr, n);
        (void)s;
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
    int32_t expected;
    int32_t actual;
    const char* input;
};

int main() {
    // Sample tests
    static const int32_t s1[] = {3, 1, 4, 1, 5, 9, 2, 6};            // min = 1
    static const int32_t s2[] = {-5, -3, -8, -1, -7, -2, -4, -6};    // min = -8
    static const int32_t s3[] = {42, 42, 42, 42, 42, 42, 42, 42};    // min = 42

    // Hidden tests
    static int32_t h1[256];
    for (int i = 0; i < 256; i++) h1[i] = 100;
    h1[200] = -999;  // min buried near end

    static int32_t h2[256];
    for (int i = 0; i < 256; i++) h2[i] = i - 128;  // min = -128 at index 0

    const int N_LARGE = 1000000;
    int32_t* h3 = alloc_aligned(N_LARGE);
    for (int i = 0; i < N_LARGE; i++) h3[i] = (i * 7 + 13) % 1000;
    h3[N_LARGE - 3] = -500000;

    const int N_XLARGE = 4000000;
    int32_t* h4 = alloc_aligned(N_XLARGE);
    for (int i = 0; i < N_XLARGE; i++) h4[i] = (i * 13 + 7) % 2000 - 1000;
    h4[N_XLARGE / 2] = -999999;

    Test tests[] = {
        { s1, 8,  true,  "arr = [3, 1, 4, 1, 5, 9, 2, 6]" },
        { s2, 8,  true,  "arr = [-5, -3, -8, -1, -7, -2, -4, -6]" },
        { s3, 8,  true,  "arr = [42, 42, 42, 42, 42, 42, 42, 42]" },
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

        int32_t expected = scalar_min(tests[t].data, tests[t].n);
        int32_t actual = array_min(tests[t].data, tests[t].n);

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
            fprintf(f, "{\"passed\":%s,\"expected\":\"%d\",\"actual\":\"%d\"",
                results[i].passed ? "true" : "false",
                results[i].expected, results[i].actual);
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
                fprintf(f, ",\"first_failure\":{\"expected\":\"%d\",\"actual\":\"%d\"}",
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
