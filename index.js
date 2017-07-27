const v8 = require('./v8/v8-node');
const mocha = require('mocha');
const colors = require('colors');
const Spinner = require('cli-spinner').Spinner;
const Table = require('cli-table');
let startDate;
const _ = require('lodash');
const data = { };
const Console = console;

const Module = require('module').Module.prototype;
const orig = Module._compile;

/**
 * Obtain time difference with two dates
 *
 * @param  Number newest hrtime in ms
 * @param  Number oldest hrtime in ms
 * @return Float
 */
const timeDiff = function timeDiff(newest, oldest) {
    let diff = (parseFloat(newest) - parseFloat(oldest));
    if (diff < 0) {
        diff = ((10000 + parseFloat(newest)) - parseFloat(oldest));
    }
    return parseFloat(diff.toFixed(2));
};

/**
 * Populate the callCount and duration for a given function call
 *
 * @param  String funcUri  path of function
 * @param  Number argIndex
 * @param  Object duration
 */
const emitData = function emitData(funcUri, argIndex, duration) {
    data[funcUri].callCount++;
    data[funcUri].durations[argIndex] = data[funcUri].durations[argIndex] || [];
    data[funcUri].durations[argIndex].push(duration);
};

/**
 * Return a meaningful timestamp
 *
 * @return String hrtime
 */
const meaningfulTime = function meaningfulTime() {
    const parts = process.hrtime();
    return `${(((parts[0] * 1000) + (parts[1] / 1000000)) % 10000).toFixed(2)}ms`;
};

/**
 * Inject function with functions
 * to obtain performance data
 *
 * @param  Array item
 * @param  String prop key to array
 * @param  String funcUri  path to function
 */
const infectFunction = function infectFunction(item, prop, funcUri) {
    const original = item[prop];
    let callCount = 0;
    data[funcUri] = {
        path: funcUri,
        callCount: 0,
        optimized: [],
        durations: {},
    };

    item[prop] = function () {
        return (function () {
            const functionInvokedAt = meaningfulTime();
            const functionArgs = Array.prototype.slice.call(arguments);
            const self = this;

            if (callCount >= 0) {
                v8.optimizeFunctionOnNextCall(original);
            }

            const newFunctionArgs = functionArgs.map((arg) => {
                if (!(arg instanceof Function)) return arg;
                return function newFunctionArgsMapCallback() {
                    emitData(funcUri, `callback-${functionArgs.indexOf(arg)}`, timeDiff(meaningfulTime(), functionInvokedAt));
                    return arg.apply(this, Array.prototype.slice.call(arguments));
                };
            });

            const out = original.apply(self, newFunctionArgs);
            if (callCount >= 0) {
                switch (v8.getOptimizationStatus(original)) {
                    case 1: data[funcUri].optimized.push('Yes'); break;
                    case 3: data[funcUri].optimized.push('Always'); break;
                    case 2: data[funcUri].optimized.push('No'); break;
                    case 4: data[funcUri].optimized.push('Never'); break;
                    case 6: data[funcUri].optimized.push('Maybe'); break;
                    default: data[funcUri].optimized.push('?'); break;
                }
            }

            callCount++;
            emitData(funcUri, 'return', timeDiff(meaningfulTime(), functionInvokedAt));
            return out;
        }).apply(this, Array.prototype.slice.call(arguments));
    };

    const dependencies = original.toString().match(/^function .*?\((.*?)\)/);
    if (dependencies) {
        let newFunc = item[prop].toString();
        newFunc = `(function() { return ${newFunc.replace('function ()', `function (${dependencies[1]})`)}; })()`;
        try {
            item[prop] = eval(newFunc); // eslint-disable-line no-eval
        } catch (e) {
            // continue regardless of error
        }
    }

    item[prop].prototype = original.prototype;
};

const instrument = function instrument(path, obj) {
    _.forEach(obj, (item, key) => {
        if (typeof item === 'function') {
            infectFunction(obj, key, `${path}:exports.${key}`);
        }
    });
};

const minMaxAverage = function minMaxAverage(list) {
    let min = 999999;
    let max = 0;
    let sum = 0;
    let color = 'green';

    list.forEach((i) => {
        if (i < min) min = i;
        if (i > max) max = i;
        sum += i;
    });

    const average = sum / list.length;
    if (average.toFixed(2) >= 1.00) {
        color = 'red';
    } else if (average.toFixed(2) > 0.50) {
        color = 'yellow';
    }

    return {
        min: min.toFixed(2),
        average: average.toFixed(2),
        averageColor: color,
        max: max.toFixed(2),
        totalTime: sum.toFixed(2),
    };
};

const uniq = function uniq(list) {
    return list.reduce((all, item) => {
        all[item] = all[item] || 0;
        all[item]++;
        return all;
    }, { });
};

Module._compile = function _compile(code, filePath) {
    orig.call(this, code, filePath);
    filePath = filePath.split(process.cwd()).pop();
    if (filePath.indexOf('node_modules') !== -1) return;
    instrument(filePath, this.exports);
};

module.exports = function MyReporter(runner) {
    mocha.reporters.Base.call(this, runner);

    // Define table columns headers and sizes
    const table = new Table({
        head: ['#', 'Fnc Name', 'Total', 'Avg'],
        colWidths: [7, 70, 10, 10],
    });

    // Add some animation to the progress notifications
    const spinner = new Spinner({
        text: 'processing.. %s',
        stream: process.stderr,
        onTick(msg) {
            this.clearLine(this.stream);
            this.stream.write(msg);
        },
    });
    spinner.setSpinnerString('|/-\\');
    spinner.start();

    // ensure that set a startTime to
    // capture complete time and also
    // ensure we have v8 native flag
    runner.on('start', () => {
        startDate = new Date();
        if (!v8.isNative()) {
            Console.log('Execution Stopped');
            Console.warn('Notice: node needs to be started with the --allow-natives-syntax flag');
            process.exit();
        }
    });

    // stop proces on any failed tests
    runner.on('fail', (test, err) => {
        console.log(test);
        spinner.stop();
        spinner.clearLine();
        Console.log();
        Console.log('Errors - Aborting performance test');
        Console.log(test.fullTitle());
        Console.log(err.message);
        Console.log(err.actual, err.expected);
        process.exit();
    });

    // filter data and output table
    // upon completion of runner
    runner.on('end', () => {
        const totalTime = (new Date()) - startDate;
        const functions = Object.keys(data)
        .map((path) => {
            const record = data[path];
            return {
                path: record.path,
                callCount: record.callCount,
                optimized: uniq(record.optimized),
                durations: Object.keys(record.durations).reduce((durations, i) => {
                    durations[i] = minMaxAverage(record.durations[i]);
                    return durations;
                }, {}),
            };
        })
        .filter(a => a.callCount).sort((a, b) => (b.callCount - a.callCount))
        .slice(0, 20);

        functions.forEach((fnc) => {
            const paths = [];
            const optimizedCount = (fnc.optimized.Yes) ? fnc.optimized.Yes : 0;
            const notOptimizedCount = (fnc.optimized.No) ? fnc.optimized.No : 0;
            const unknownCount = fnc.callCount - optimizedCount - notOptimizedCount;
            const optimizedString = (fnc.optimized.Yes) ? `${colors.dim('Optimized:')}${fnc.optimized.Yes}` : '';
            const notOptimizedString = (fnc.optimized.No) ? `${colors.red.dim('Not-Optimized:')}${fnc.optimized.No}` : '';
            const unknownString = (unknownCount) ? `${colors.yellow.dim('Unknown:')}${unknownCount}` : '';
            const notOptimizedStringSpacing = (optimizedString === '') ? '' : '  ';
            const unknownStringSpacing = (optimizedString === '' && notOptimizedString === '') ? '' : '  ';
            if (_.includes(paths, fnc.path) || paths.length === 0) {
                table.push([fnc.callCount,
                    `${fnc.path.replace('exports.', '')}
------------
${optimizedString}${notOptimizedStringSpacing}${notOptimizedString}${unknownStringSpacing}${unknownString}`,
                    `${fnc.durations.return.totalTime}ms`,
                    colors[fnc.durations.return.averageColor](`${fnc.durations.return.average}ms`)]);
            }
        });

        Console.log();
        Console.log(`Total Time: ${totalTime / 10}ms`.bold.green);
        // Console.log(JSON.stringify(functions, null, 2));
        Console.log(table.toString());
        process.exit();
    });
};
