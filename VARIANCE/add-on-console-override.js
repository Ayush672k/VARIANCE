// Console override for Adobe Express Add-on
// This script provides console logging functionality in the add-on environment

(function () {
    'use strict';

    // Store original console methods
    const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info,
        debug: console.debug
    };

    // Override console methods to ensure they work in add-on context
    const createConsoleMethod = (type) => {
        return function (...args) {
            try {
                originalConsole[type].apply(console, args);
            } catch (e) {
                // Silently fail if console is not available
            }
        };
    };

    console.log = createConsoleMethod('log');
    console.warn = createConsoleMethod('warn');
    console.error = createConsoleMethod('error');
    console.info = createConsoleMethod('info');
    console.debug = createConsoleMethod('debug');
})();
