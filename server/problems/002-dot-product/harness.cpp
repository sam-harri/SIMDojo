#include <cstdio>
#include <cstdlib>
#include <cstdint>
#include <cstring>
#include <ctime>
#include <immintrin.h>

#include "solution.cpp"

static int32_t scalar_dot(const int32_t* a, const int32_t* b, int n) {
    int32_t sum = 0;
    for (int i = 0; i < n; i++) sum += a[i] * b[i];
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

static long long measure_ns(const int32_t* a, const int32_t* b, int n) {
    struct timespec start, end;
    volatile int32_t sink = dot_product(a, b, n);
    (void)sink;
    clock_gettime(CLOCK_MONOTONIC, &start);
    for (int i = 0; i < 100; i++) {
        volatile int32_t s = dot_product(a, b, n);
        (void)s;
    }
    clock_gettime(CLOCK_MONOTONIC, &end);
    long long elapsed = (end.tv_sec - start.tv_sec) * 1000000000LL +
                        (end.tv_nsec - start.tv_nsec);
    return elapsed / 100;
}

struct Test {
    const int32_t* a;
    const int32_t* b;
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
    static const int32_t s1a[] = {1, 2, 3, 4, 5, 6, 7, 8};
    static const int32_t s1b[] = {2, 2, 2, 2, 2, 2, 2, 2};  // dot = 72

    static const int32_t s2a[] = {1, -1, 1, -1, 1, -1, 1, -1};
    static const int32_t s2b[] = {1, 1, 1, 1, 1, 1, 1, 1};   // dot = 0

    static const int32_t s3a[] = {0, 0, 0, 0, 0, 0, 0, 0, 10, 20, 30, 40, 50, 60, 70, 80};
    static const int32_t s3b[] = {1, 1, 1, 1, 1, 1, 1, 1, 1,  1,  1,  1,  1,  1,  1,  1};  // dot = 360

    // Hidden tests
    static int32_t h1a[256], h1b[256];
    for (int i = 0; i < 256; i++) { h1a[i] = 1; h1b[i] = 1; }  // dot = 256

    static int32_t h2a[256], h2b[256];
    for (int i = 0; i < 256; i++) { h2a[i] = (i % 2 == 0) ? 3 : -3; h2b[i] = 2; }  // dot = 0

    const int N_LARGE = 1000000;
    int32_t* h3a = alloc_aligned(N_LARGE);
    int32_t* h3b = alloc_aligned(N_LARGE);
    for (int i = 0; i < N_LARGE; i++) { h3a[i] = 1; h3b[i] = 1; }  // dot = 1000000

    const int N_XLARGE = 4000000;
    int32_t* h4a = alloc_aligned(N_XLARGE);
    int32_t* h4b = alloc_aligned(N_XLARGE);
    for (int i = 0; i < N_XLARGE; i++) { h4a[i] = (i % 2 == 0) ? 1 : -1; h4b[i] = 1; }  // dot = 0

    Test tests[] = {
        { s1a, s1b, 8,  true,  "a = [1,2,3,4,5,6,7,8], b = [2,2,2,2,2,2,2,2]" },
        { s2a, s2b, 8,  true,  "a = [1,-1,1,-1,1,-1,1,-1], b = [1,1,1,1,1,1,1,1]" },
        { s3a, s3b, 16, true,  "a = [0,..,0,10,20,..,80], b = [1,1,..,1]" },
        { h1a, h1b, 256,     false, nullptr },
        { h2a, h2b, 256,     false, nullptr },
        { h3a, h3b, N_LARGE, false, nullptr },
        { h4a, h4b, N_XLARGE, false, nullptr },
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

        int32_t expected = scalar_dot(tests[t].a, tests[t].b, tests[t].n);
        int32_t actual = dot_product(tests[t].a, tests[t].b, tests[t].n);

        TestResult& r = results[tests_run];
        r.expected = expected;
        r.actual = actual;
        r.input = tests[t].input;

        if (actual == expected) {
            r.passed = true;
            r.time_ns = (!is_run && tests[t].n >= 1024) ? measure_ns(tests[t].a, tests[t].b, tests[t].n) : 0;
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

    free(h3a); free(h3b);
    free(h4a); free(h4b);
    return total_passed == tests_run ? 0 : 1;
}
