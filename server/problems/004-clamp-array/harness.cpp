#include <cstdio>
#include <cstdlib>
#include <cstdint>
#include <cstring>
#include <ctime>
#include <immintrin.h>

#include "solution.cpp"

static void scalar_clamp(int32_t* arr, int n, int32_t lo, int32_t hi) {
    for (int i = 0; i < n; i++) {
        if (arr[i] < lo) arr[i] = lo;
        else if (arr[i] > hi) arr[i] = hi;
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

static long long measure_ns(int32_t* arr, int n, int32_t lo, int32_t hi, const int32_t* original) {
    struct timespec start, end;
    // Warm up
    memcpy(arr, original, static_cast<size_t>(n) * sizeof(int32_t));
    clamp_array(arr, n, lo, hi);
    clock_gettime(CLOCK_MONOTONIC, &start);
    for (int i = 0; i < 100; i++) {
        memcpy(arr, original, static_cast<size_t>(n) * sizeof(int32_t));
        clamp_array(arr, n, lo, hi);
    }
    clock_gettime(CLOCK_MONOTONIC, &end);
    long long elapsed = (end.tv_sec - start.tv_sec) * 1000000000LL +
                        (end.tv_nsec - start.tv_nsec);
    return elapsed / 100;
}

struct Test {
    const int32_t* data;
    int n;
    int32_t lo;
    int32_t hi;
    bool sample;
    const char* input;
};

struct TestResult {
    bool passed;
    long long time_ns;
    char expected[64];
    char actual[64];
    const char* input;
};

int main() {
    // Sample tests
    static const int32_t s1[] = {-5, 3, 10, 0, -2, 7, 15, 1};
    static const int32_t s2[] = {100, 200, 300, 400, 500, 600, 700, 800};
    static const int32_t s3[] = {-10, -20, -30, -40, 10, 20, 30, 40, 0, 0, 0, 0, 50, -50, 25, -25};

    // Hidden tests
    static int32_t h1[256];
    for (int i = 0; i < 256; i++) h1[i] = i - 128;

    static int32_t h2[256];
    for (int i = 0; i < 256; i++) h2[i] = (i % 2 == 0) ? 1000 : -1000;

    const int N_LARGE = 1000000;
    int32_t* h3 = alloc_aligned(N_LARGE);
    for (int i = 0; i < N_LARGE; i++) h3[i] = (i * 7 + 13) % 2000 - 1000;

    const int N_XLARGE = 4000000;
    int32_t* h4 = alloc_aligned(N_XLARGE);
    for (int i = 0; i < N_XLARGE; i++) h4[i] = (i * 13 + 7) % 2000 - 1000;

    Test tests[] = {
        { s1, 8,   0,   10,  true,  "arr = [-5,3,10,0,-2,7,15,1], lo=0, hi=10" },
        { s2, 8,   250, 650, true,  "arr = [100,200,300,400,500,600,700,800], lo=250, hi=650" },
        { s3, 16,  -15, 15,  true,  "arr = [-10,-20,-30,-40,10,20,30,40,0,0,0,0,50,-50,25,-25], lo=-15, hi=15" },
        { h1, 256,     -50,  50,  false, nullptr },
        { h2, 256,     -100, 100, false, nullptr },
        { h3, N_LARGE, -200, 200, false, nullptr },
        { h4, N_XLARGE, -500, 500, false, nullptr },
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
        int32_t* expected_arr = alloc_aligned(n);
        int32_t* actual_arr = alloc_aligned(n);

        memcpy(expected_arr, tests[t].data, static_cast<size_t>(n) * sizeof(int32_t));
        memcpy(actual_arr, tests[t].data, static_cast<size_t>(n) * sizeof(int32_t));

        scalar_clamp(expected_arr, n, tests[t].lo, tests[t].hi);
        clamp_array(actual_arr, n, tests[t].lo, tests[t].hi);

        TestResult& r = results[tests_run];
        r.input = tests[t].input;
        r.time_ns = 0;

        // Find first mismatch
        int mismatch = -1;
        for (int i = 0; i < n; i++) {
            if (actual_arr[i] != expected_arr[i]) {
                mismatch = i;
                break;
            }
        }

        if (mismatch == -1) {
            r.passed = true;
            snprintf(r.expected, sizeof(r.expected), "correct");
            snprintf(r.actual, sizeof(r.actual), "correct");
            if (!is_run && n >= 1024) {
                r.time_ns = measure_ns(actual_arr, n, tests[t].lo, tests[t].hi, tests[t].data);
            }
            total_passed++;
        } else {
            r.passed = false;
            snprintf(r.expected, sizeof(r.expected), "arr[%d] = %d", mismatch, expected_arr[mismatch]);
            snprintf(r.actual, sizeof(r.actual), "arr[%d] = %d", mismatch, actual_arr[mismatch]);
        }

        free(expected_arr);
        free(actual_arr);
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
