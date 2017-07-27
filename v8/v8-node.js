const v8Dummy = require('./v8-native-dummy').v8;
const v8Native = require('./v8-native-calls').v8;
const Console = console;
/*
 --------------------------------------
 (c)2014-2017, Nathanael Anderson.
 Repository: https://github.com/Nathanaela/v8-Natives
 --------------------------------------
 v8-Natives is under The MIT License (MIT)

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

 // Notes:
 // The reason we are calling the functions twice before running optimizeFunctionOnNextCall, is
 // because 2 calls are needed to go from uninitialized -> pre-monomorphic -> monomorphic

const v8 = (process.execArgv.indexOf('--allow-natives-syntax') >= 0) ? v8Native : v8Dummy;

const printStatus = function printStatus(fn, fName) {
    const optStatus = v8.getOptimizationStatus(fn);
    if (fName == null || fName === '') {
        fName = v8.functionGetName(fn);
    }
    switch (optStatus) {
        case -1:
            Console.log('Function', fName, 'status is unknown as Native functions are disabled.');
            break;
        case 1:
            Console.log('Function', fName, 'is optimized');
            break;
        case 2:
            Console.log('Function', fName, 'is not optimized');
            break;
        case 3:
            Console.log('Function', fName, 'is always optimized');
            break;
        case 4:
            Console.log('Function', fName, 'is never optimized');
            break;
        case 6:
            Console.log('Function', fName, 'is maybe deoptimized');
            break;
        case 7:
            Console.log('Function', fName, 'is TurboFan optimized');
            break;
        default:
            Console.log('Function', fName, 'has unknown status', optStatus);
            break;
    }
    return (optStatus);
};

const testOptimization = function testOptimization(f, fname) {
    let i;
    let j;
    let keys;
    if (Array.isArray(f)) {
        f[0]();
        f[0](); // Have to Run this Twice now in v8 (See notes above)
        for (i = 0; i < f.length; i++) {
            v8.optimizeFunctionOnNextCall(f[i]);

            // Check for Class Functions
            keys = Object.keys(f[i]);
            for (j = 0; j < keys.length; j++) {
                v8.optimizeFunctionOnNextCall(f[i][keys[j]]);
            }
        }
        f[0]();
        for (i = 0; i < f.length; i++) {
            printStatus(f[i], fname[i]);

            keys = Object.keys(f[i]);
            for (j = 0; j < keys.length; j++) {
                v8.optimizeFunctionOnNextCall(f[i][keys[j]]);
            }
        }
    } else {
        f();
        f(); // Have to Run this Twice now in v8 (See notes above)
        v8.optimizeFunctionOnNextCall(f);
        f();
        printStatus(f, fname);
    }
};

const benchmarkParams = function benchmarkParams(itter, f, params) {
    v8.collectGarbage();
    const startTime = process.hrtime();
    let i = 0;
    for (; i < itter; ++i) f(params);
    const endTime = process.hrtime(startTime);
    return (endTime[0] * 1e9 + endTime[1]);
};

const benchmarkNoParams = function benchmarkNoParams(itter, f) {
    v8.collectGarbage();
    let i = 0;
    const startTime = process.hrtime();
    for (; i < itter; ++i) f();
    const endTime = process.hrtime(startTime);
    return (endTime[0] * 1e9 + endTime[1]);
};

const benchmark = function benchmark(count, f, params) {
    if (f === null || count < 1) return -1;
    const cnt = parseInt(count, 10);
    if (typeof params === 'undefined') {
        // Prime both Functions for Optimization
        benchmarkNoParams(1, f);
        benchmarkNoParams(1, f);  // Have to Run this Twice now in v8 (See notes above)
        // Have the V8 engine tag them for optimization
        v8.optimizeFunctionOnNextCall(f);
        v8.optimizeFunctionOnNextCall(benchmarkNoParams);
        // Have the V8 Engine actually do the optimization
        benchmarkNoParams(1, f);

        // Prime the Engine so that it can do the benchmark as fast as possible
        benchmarkNoParams(cnt, f);

        // Run the benchmark and return the time
        return benchmarkNoParams(cnt, f);
    }

    // Prime both Functions for Optimization
    benchmarkParams(1, f, params);
    benchmarkParams(1, f, params); // Have to Run this Twice now in v8 (See notes above)
    // Have the V8 engine tag them for optimization
    v8.optimizeFunctionOnNextCall(f);
    v8.optimizeFunctionOnNextCall(benchmarkParams);
    // Have the V8 Engine actually do the optimization
    benchmarkParams(1, f, params);

    // Prime the Engine so that it can do the benchmark as fast as possible
    benchmarkParams(cnt, f, params);

    // Run the benchmark and return the time
    return benchmarkParams(cnt, f, params);
};

v8.helpers = { printStatus, testOptimization, benchmark };
module.exports = v8;
