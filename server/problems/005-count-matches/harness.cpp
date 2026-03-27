#include <cstdio>
#include <cstdlib>
#include <cstdint>
#include <cstring>
#include <ctime>
#include <immintrin.h>

#include "solution.cpp"

static int scalar_count(const int32_t* arr, int n, int32_t target) {
    int cnt = 0;
    for (int i = 0; i < n; i++) cnt += (arr[i] == target);
    return cnt;
}

static int32_t* alloc_aligned(int n) {
    void* p = nullptr;
    if (posix_memalign(&p, 32, static_cast<size_t>(n) * sizeof(int32_t)) != 0) {
        fprintf(stderr, "alloc failed\n");
        exit(1);
    }
    return static_cast<int32_t*>(p);
}

static long long measure_ns(const int32_t* arr, int n, int32_t target) {
    struct timespec start, end;
    volatile int sink = count_matches(arr, n, target);
    (void)sink;
    clock_gettime(CLOCK_MONOTONIC, &start);
    for (int i = 0; i < 100; i++) {
        volatile int s = count_matches(arr, n, target);
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
    int32_t target;
    bool sample;
    const char* input;
};

struct TestResult {
    bool passed;
    long long time_ns;
    int expected;
    int actual;
    const char* input;
};

int main() {
    // Sample tests
    static const int32_t s1[] = {1, 2, 3, 2, 5, 2, 7, 2};          // target=2, count=4
    static const int32_t s2[] = {7, 7, 7, 7, 7, 7, 7, 7};          // target=7, count=8
    static const int32_t s3[] = {1, 2, 3, 4, 5, 6, 7, 8};          // target=99, count=0

    // Hidden tests
    static int32_t h1[256];
    for (int i = 0; i < 256; i++) h1[i] = (i % 5 == 0) ? 42 : i;  // target=42

    static int32_t h2[256];
    for (int i = 0; i < 256; i++) h2[i] = 0;                       // target=0, count=256

    const int N_LARGE = 1000000;
    int32_t* h3 = alloc_aligned(N_LARGE);
    for (int i = 0; i < N_LARGE; i++) h3[i] = i % 100;             // target=0, count=10000

    const int N_XLARGE = 4000000;
    int32_t* h4 = alloc_aligned(N_XLARGE);
    for (int i = 0; i < N_XLARGE; i++) h4[i] = (i % 3 == 0) ? 5 : i;  // target=5

    Test tests[] = {
        { s1, 8,  2,  true,  "arr = [1,2,3,2,5,2,7,2], target = 2" },
        { s2, 8,  7,  true,  "arr = [7,7,7,7,7,7,7,7], target = 7" },
        { s3, 8,  99, true,  "arr = [1,2,3,4,5,6,7,8], target = 99" },
        { h1, 256,     42, false, nullptr },
        { h2, 256,     0,  false, nullptr },
        { h3, N_LARGE, 0,  false, nullptr },
        { h4, N_XLARGE, 5, false, nullptr },
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

        int expected = scalar_count(tests[t].data, tests[t].n, tests[t].target);
        int actual = count_matches(tests[t].data, tests[t].n, tests[t].target);

        TestResult& r = results[tests_run];
        r.expected = expected;
        r.actual = actual;
        r.input = tests[t].input;

        if (actual == expected) {
            r.passed = true;
            r.time_ns = (!is_run && tests[t].n >= 1024) ? measure_ns(tests[t].data, tests[t].n, tests[t].target) : 0;
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
