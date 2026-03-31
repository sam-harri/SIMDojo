#include <cstdio>
#include <cstdlib>
#include <cstdint>
#include <cstring>
#include <ctime>
#include <immintrin.h>

// User's solution is included here
#include "solution.cpp"

static int32_t scalar_sum(const int32_t* arr, int n) {
    int32_t sum = 0;
    for (int i = 0; i < n; i++) sum += arr[i];
    return sum;
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
    volatile int32_t sink = array_sum(arr, n);
    (void)sink;
    clock_gettime(CLOCK_MONOTONIC, &start);
    for (int i = 0; i < 100; i++) {
        volatile int32_t s = array_sum(arr, n);
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
    const char* input;  // human-readable input string (sample tests only)
};

struct TestResult {
    bool passed;
    long long time_ns;
    int32_t expected;
    int32_t actual;
    const char* input;
};

int main() {
    // ---- Sample tests: small, deterministic, shown in Run Tests ----
    static const int32_t s1[] = {1, 2, 3, 4, 5, 6, 7, 8};                         // sum = 36
    static const int32_t s2[] = {-1, -2, -3, -4, -5, -6, -7, -8};                  // sum = -36
    static const int32_t s3[] = {0, 0, 0, 0, 0, 0, 0, 0, 10, 20, 30, 40, 50, 60, 70, 80}; // sum = 360

    // ---- Hidden tests: longer, used only in Submit ----
    // 256 elements, all 1s → sum = 256
    static int32_t h1[256];
    for (int i = 0; i < 256; i++) h1[i] = 1;

    // 256 elements, alternating +100 / -100 → sum = 0
    static int32_t h2[256];
    for (int i = 0; i < 256; i++) h2[i] = (i % 2 == 0) ? 100 : -100;

    // 1M elements, all 1s → sum = 1000000 (performance)
    const int N_LARGE = 1000000;
    int32_t* h3 = alloc_aligned(N_LARGE);
    for (int i = 0; i < N_LARGE; i++) h3[i] = 1;

    // 4M elements, alternating 1/-1 → sum = 0 (larger performance)
    const int N_XLARGE = 4000000;
    int32_t* h4 = alloc_aligned(N_XLARGE);
    for (int i = 0; i < N_XLARGE; i++) h4[i] = (i % 2 == 0) ? 1 : -1;

    Test tests[] = {
        // Samples
        { s1, 8,   true,  "arr = [1, 2, 3, 4, 5, 6, 7, 8]" },
        { s2, 8,   true,  "arr = [-1, -2, -3, -4, -5, -6, -7, -8]" },
        { s3, 16,  true,  "arr = [0, 0, 0, 0, 0, 0, 0, 0, 10, 20, 30, 40, 50, 60, 70, 80]" },
        // Hidden
        { h1, 256,      false, nullptr },
        { h2, 256,      false, nullptr },
        { h3, N_LARGE,  false, nullptr },
        { h4, N_XLARGE, false, nullptr },
    };
    const int num_tests = sizeof(tests) / sizeof(tests[0]);

    // Determine mode
    const char* mode = getenv("SIMDOJO_MODE");
    if (!mode) mode = "submit";
    bool is_run = (strcmp(mode, "run") == 0);

    // Run relevant tests
    TestResult results[32];
    int tests_run = 0;
    int total_passed = 0;

    for (int t = 0; t < num_tests; t++) {
        if (is_run && !tests[t].sample) continue;

        int32_t expected = scalar_sum(tests[t].data, tests[t].n);
        int32_t actual = array_sum(tests[t].data, tests[t].n);

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

    // Write results to file
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
