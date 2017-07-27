(function nativeDummy(_global) {
    const v8 = {
        isNative() {
            return false;
        },
    };


    // Returns a value; so we return 0
    v8.getOptimizationCount = v8.getHeapUsage = () => 0;

    // Needs to return a string
    v8.getV8Version = v8.functionGetName = () => 'N/A';

    // Returns nothing
    v8.optimizeFunctionOnNextCall = () => {};
    v8.clearFunctionTypeFeedback = () => {};
    v8.deoptimizeNow = () => {};
    v8.debugTrace = () => {};
    v8.debugPrint = () => {};
    v8.deoptimizeFunction = () => {};
    v8.neverOptimizeFunction = () => {};
    v8.collectGarbage = () => {};

    // Returns booleans, so we return false
    v8.getOptimizationStatus = false;
    v8.hasFastProperties = false;
    v8.hasFastSmiElements = false;
    v8.hasFastObjectElements = false;
    v8.hasFastDoubleElements = false;
    v8.hasDictionaryElements = false;
    v8.hasFastHoleyElements = false;
    v8.haveSameMap = false;
    v8.isValidSmi = false;
    v8.isSmi = false;
    v8.hasFastSmiOrObjectElements = false;
    v8.hasSloppyArgumentsElements = false;
    v8.traceEnter = false;
    v8.traceExit = false;
    v8.setFlags = false;
    v8.isNative = false;

    _global.v8 = v8;
}(typeof exports === 'undefined' ? this : exports));
