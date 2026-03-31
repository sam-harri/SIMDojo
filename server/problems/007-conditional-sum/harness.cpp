#include <cstdio>
#include <cstdlib>
#include <cstdint>
#include <cstring>
#include <ctime>
#include <immintrin.h>

#include "solution.cpp"

static int32_t scalar_cond_sum(const int32_t* arr, int n, int32_t threshold) {
    int32_t sum = 0;
    for (int i = 0; i < n; i++)
        if (arr[i] < threshold) sum += arr[i];
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

static long long measure_ns(const int32_t* arr, int n, int32_t threshold) {
    struct timespec start, end;
    volatile int32_t sink = conditional_sum(arr, n, threshold);
    (void)sink;
    clock_gettime(CLOCK_MONOTONIC, &start);
    for (int i = 0; i < 100; i++) {
        volatile int32_t s = conditional_sum(arr, n, threshold);
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
    int32_t threshold;
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
    static const int32_t s1[] = {1, 5, 3, 8, 2, 7, 4, 6};           // threshold=5, sum=1+3+2+4=10
    static const int32_t s2[] = {-3, -1, 0, 2, -5, 4, 1, -2};       // threshold=0, sum=-3+-1+-5+-2=-11
    static const int32_t s3[] = {10, 20, 30, 40, 50, 60, 70, 80};   // threshold=100, sum=360 (all qualify)

    // Hidden tests
    static int32_t h1[256];
    for (int i = 0; i < 256; i++) h1[i] = i - 128;  // threshold=0

    static int32_t h2[256];
    for (int i = 0; i < 256; i++) h2[i] = (i % 2 == 0) ? 100 : -100;  // threshold=50

    const int N_LARGE = 1000000;
    int32_t* h3 = alloc_aligned(N_LARGE);
    for (int i = 0; i < N_LARGE; i++) h3[i] = (i % 100) - 50;  // threshold=0

    const int N_XLARGE = 4000000;
    int32_t* h4 = alloc_aligned(N_XLARGE);
    for (int i = 0; i < N_XLARGE; i++) h4[i] = (i % 200) - 100;  // threshold=50

    Test tests[] = {
        { s1, 8,  5,   true,  "arr = [1,5,3,8,2,7,4,6], threshold = 5" },
        { s2, 8,  0,   true,  "arr = [-3,-1,0,2,-5,4,1,-2], threshold = 0" },
        { s3, 8,  100, true,  "arr = [10,20,30,40,50,60,70,80], threshold = 100" },
        { h1, 256,     0,   false, nullptr },
        { h2, 256,     50,  false, nullptr },
        { h3, N_LARGE, 0,   false, nullptr },
        { h4, N_XLARGE, 50, false, nullptr },
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

        int32_t expected = scalar_cond_sum(tests[t].data, tests[t].n, tests[t].threshold);
        int32_t actual = conditional_sum(tests[t].data, tests[t].n, tests[t].threshold);

        TestResult& r = results[tests_run];
        r.expected = expected;
        r.actual = actual;
        r.input = tests[t].input;

        if (actual == expected) {
            r.passed = true;
            r.time_ns = (!is_run && tests[t].n >= 1024) ? measure_ns(tests[t].data, tests[t].n, tests[t].threshold) : 0;
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
