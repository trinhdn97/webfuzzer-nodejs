process.stdin.resume(); // so the program will not close instantly

function exitHandler(options, exitCode) {
    if (options.cleanup) console.log('clean');
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) process.exit();
}

// do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup: true }));

// catch Ctrl+C events
process.on('SIGINT', exitHandler.bind(null, { exit: true }));

// catch "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));

// catch uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));

// catch uncaught exceptions
process.on('unhandledRejection', exitHandler.bind(null, { exit: true }));