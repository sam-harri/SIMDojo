#include <cstdio>
#include <cstdlib>
#include <cstdint>
#include <cstring>
#include <ctime>
#include <immintrin.h>

#include "solution.cpp"

static int scalar_search(const int32_t* arr, int n, int32_t target) {
    for (int i = 0; i < n; i++)
        if (arr[i] == target) return i;
    return -1;
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
    volatile int sink = linear_search(arr, n, target);
    (void)sink;
    clock_gettime(CLOCK_MONOTONIC, &start);
    for (int i = 0; i < 100; i++) {
        volatile int s = linear_search(arr, n, target);
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
    static const int32_t s1[] = {10, 20, 30, 40, 50, 60, 70, 80};   // target=50, idx=4
    static const int32_t s2[] = {99, 1, 2, 3, 4, 5, 6, 7};          // target=99, idx=0
    static const int32_t s3[] = {1, 2, 3, 4, 5, 6, 7, 8};           // target=42, idx=-1

    // Hidden tests
    static int32_t h1[256];
    for (int i = 0; i < 256; i++) h1[i] = i;
    // target=200, idx=200

    static int32_t h2[256];
    for (int i = 0; i < 256; i++) h2[i] = i * 2;
    // target=99 (odd, not present), idx=-1

    const int N_LARGE = 1000000;
    int32_t* h3 = alloc_aligned(N_LARGE);
    for (int i = 0; i < N_LARGE; i++) h3[i] = i + 1;
    // target=999990 (near end)

    const int N_XLARGE = 4000000;
    int32_t* h4 = alloc_aligned(N_XLARGE);
    for (int i = 0; i < N_XLARGE; i++) h4[i] = i;
    // target=-1 (not present), idx=-1

    Test tests[] = {
        { s1, 8,  50, true,  "arr = [10,20,30,40,50,60,70,80], target = 50" },
        { s2, 8,  99, true,  "arr = [99,1,2,3,4,5,6,7], target = 99" },
        { s3, 8,  42, true,  "arr = [1,2,3,4,5,6,7,8], target = 42" },
        { h1, 256,     200,    false, nullptr },
        { h2, 256,     99,     false, nullptr },
        { h3, N_LARGE, 999990, false, nullptr },
        { h4, N_XLARGE, -1,    false, nullptr },
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

        int expected = scalar_search(tests[t].data, tests[t].n, tests[t].target);
        int actual = linear_search(tests[t].data, tests[t].n, tests[t].target);

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
