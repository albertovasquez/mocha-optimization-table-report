(function nativeValls(_global) {
// v8 Functions are located in v8/lib/runtime.cc & runtime.h
// SMI = SMall Integer

_global.v8 = {
    isNative: function() { return true },
    getOptimizationStatus: function(fun) {
      return %GetOptimizationStatus(fun);
    },
    getOptimizationCount: function(fun) {
       return %GetOptimizationCount(fun);
    },
    optimizeFunctionOnNextCall: function(fun) {
        return %OptimizeFunctionOnNextCall(fun);
    },
    deoptimizeFunction: function(fun) {
        return %DeoptimizeFunction(fun);
    },
    deoptimizeNow: function() {
        return %DeoptimizeNow();
    },
    clearFunctionTypeFeedback: function(fun) {
        return %ClearFunctionTypeFeedback(fun);
    },
    debugPrint: function(data) {
        return %DebugPrint(data);
    },
    debugTrace: function() {
        return %DebugTrace();
    },
    collectGarbage: function() {
        return %CollectGarbage(null);
    },
    getHeapUsage: function() {
        return %GetHeapUsage();
    },
    hasFastProperties: function(data) {
        return %HasFastProperties(data);
    },
    hasFastSmiElements: function(data) {
        return %HasFastSmiElements(data);
    },
    hasFastObjectElements: function(data) {
        return %HasFastObjectElements(data);
    },
    hasFastDoubleElements: function(data) {
        return %HasFastDoubleElements(data);
    },
    hasDictionaryElements: function(data) {
        return %HasDictionaryElements(data);
    },
    hasFastHoleyElements: function(data) {
        return %HasFastHoleyElements(data);
    },
    hasFastSmiOrObjectElements: function(data) {
        return %HasFastSmiOrObjectElements(data);
    },
    hasSloppyArgumentsElements: function(data) {
        return %HasSloppyArgumentsElements(data);
    },
    haveSameMap: function(data1, data2) {
        return %HaveSameMap(data1, data2);
    },
    functionGetName: function(func) {
        return %FunctionGetName(func);
    },
    isSmi: function(data) {
        return %_IsSmi(data);
    },
    isValidSmi: function(data) {
       return %IsValidSmi(data);
    },
    neverOptimizeFunction: function(func) {
        return %NeverOptimizeFunction(func);
    },
    getV8Version: function() {
        return %GetV8Version();
    },
    setFlags: function(flag) {
        return %SetFlags(flag);
    },
    traceEnter: function() {
        return %TraceEnter();
    },
    traceExit: function(val) {
        return %TraceExit(val);
    },
};

}(typeof exports === 'undefined' ? this : exports));
