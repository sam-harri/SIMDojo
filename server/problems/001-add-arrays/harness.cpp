#include <cstdio>
#include <cstdlib>
#include <cstdint>
#include <cstring>
#include <ctime>
#include <immintrin.h>

// User's solution is included here
#include "solution.cpp"

static void scalar_add(const int32_t* a, const int32_t* b, int32_t* c, int n) {
    for (int i = 0; i < n; i++) c[i] = a[i] + b[i];
}

static int32_t* alloc_aligned(int n) {
    void* p = nullptr;
    if (posix_memalign(&p, 32, static_cast<size_t>(n) * sizeof(int32_t)) != 0) {
        fprintf(stderr, "alloc failed\n");
        exit(1);
    }
    return static_cast<int32_t*>(p);
}

static long long measure_ns(const int32_t* a, const int32_t* b, int32_t* c, int n) {
    struct timespec start, end;
    add_arrays(a, b, c, n);  // warm up
    clock_gettime(CLOCK_MONOTONIC, &start);
    for (int i = 0; i < 100; i++) {
        add_arrays(a, b, c, n);
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
    const char* input;  // human-readable (sample tests only)
};

struct TestResult {
    bool passed;
    long long time_ns;
    const char* input;
};

int main() {
    // ---- Sample tests ----
    static const int32_t sa1[] = {1, 2, 3, 4, 5, 6, 7, 8};
    static const int32_t sb1[] = {10, 20, 30, 40, 50, 60, 70, 80};

    static const int32_t sa2[] = {-1, -2, -3, -4, -5, -6, -7, -8};
    static const int32_t sb2[] = {1, 2, 3, 4, 5, 6, 7, 8};

    static const int32_t sa3[] = {0, 100, 200, 300, 400, 500, 600, 700,
                                   800, 900, 1000, 1100, 1200, 1300, 1400, 1500};
    static const int32_t sb3[] = {1, 1, 1, 1, 1, 1, 1, 1,
                                   1, 1, 1,    1,    1,    1,    1,    1};

    // ---- Hidden tests ----
    const int N_MED = 256;
    int32_t* ha1 = alloc_aligned(N_MED);
    int32_t* hb1 = alloc_aligned(N_MED);
    for (int i = 0; i < N_MED; i++) { ha1[i] = i; hb1[i] = N_MED - i; }

    const int N_MED2 = 256;
    int32_t* ha2 = alloc_aligned(N_MED2);
    int32_t* hb2 = alloc_aligned(N_MED2);
    for (int i = 0; i < N_MED2; i++) { ha2[i] = (i % 2 == 0) ? 1000 : -1000; hb2[i] = -ha2[i]; }

    const int N_LARGE = 1000000;
    int32_t* ha3 = alloc_aligned(N_LARGE);
    int32_t* hb3 = alloc_aligned(N_LARGE);
    for (int i = 0; i < N_LARGE; i++) { ha3[i] = 1; hb3[i] = 2; }

    const int N_XLARGE = 4000000;
    int32_t* ha4 = alloc_aligned(N_XLARGE);
    int32_t* hb4 = alloc_aligned(N_XLARGE);
    for (int i = 0; i < N_XLARGE; i++) { ha4[i] = i % 100; hb4[i] = 100 - (i % 100); }

    // Output buffers (large enough for all tests)
    int32_t* c_actual   = alloc_aligned(N_XLARGE);
    int32_t* c_expected = alloc_aligned(N_XLARGE);

    Test tests[] = {
        // Samples
        { sa1, sb1, 8,  true,  "a = [1,2,3,4,5,6,7,8], b = [10,20,30,40,50,60,70,80]" },
        { sa2, sb2, 8,  true,  "a = [-1,-2,-3,-4,-5,-6,-7,-8], b = [1,2,3,4,5,6,7,8]" },
        { sa3, sb3, 16, true,  "a = [0,100,...,1500], b = [1,1,...,1]" },
        // Hidden
        { ha1, hb1, N_MED,    false, nullptr },
        { ha2, hb2, N_MED2,   false, nullptr },
        { ha3, hb3, N_LARGE,  false, nullptr },
        { ha4, hb4, N_XLARGE, false, nullptr },
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
        scalar_add(tests[t].a, tests[t].b, c_expected, n);
        add_arrays(tests[t].a, tests[t].b, c_actual, n);

        bool passed = (memcmp(c_actual, c_expected, static_cast<size_t>(n) * sizeof(int32_t)) == 0);

        TestResult& r = results[tests_run];
        r.passed = passed;
        r.input = tests[t].input;

        if (passed) {
            r.time_ns = (!is_run && n >= 1024) ? measure_ns(tests[t].a, tests[t].b, c_actual, n) : 0;
            total_passed++;
        } else {
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
            fprintf(f, "{\"passed\":%s", results[i].passed ? "true" : "false");
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
    }

    fprintf(f, "}\n");
    fclose(f);

    free(ha1); free(hb1);
    free(ha2); free(hb2);
    free(ha3); free(hb3);
    free(ha4); free(hb4);
    free(c_actual);
    free(c_expected);
    return total_passed == tests_run ? 0 : 1;
}
