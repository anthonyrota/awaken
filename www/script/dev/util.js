/* eslint-disable @typescript-eslint/no-var-requires */
const chokidar = require('chokidar');
const kill = require('tree-kill');

function onUncaughtException(/** @type {(error: Error) => void} */ callback) {
    process.on('uncaughtException', (error) => {
        console.log('uncaught exception');
        console.log(error);
        callback(error);
    });
}

function killChild(
    /** @type {import('child_process').ChildProcess|undefined} */ child,
) {
    if (child) {
        kill(child.pid);
    }
}

function createWatcher() {
    return chokidar.watch(['src', 'api', 'script/template']);
}

/**
 * @typedef {Object} SetupWatcherEventsCallbacks
 * @property {(error: Error) => void} onError
 * @property {() => void} onChange
 * @property {() => void} [onReady]
 */

function setupWatcherEvents(
    /** @type {chokidar.FSWatcher} */ watcher,
    /** @type {SetupWatcherEventsCallbacks} */ callbacks,
) {
    watcher.on('error', (error) => {
        console.log('watch error', error);
        callbacks.onError(error);
    });

    function setupWatchBuildEvents() {
        watcher
            .on('add', callbacks.onChange) // File added.
            .on('change', callbacks.onChange) // File changed.
            .on('unlink', callbacks.onChange) // File removed.
            .on('addDir', callbacks.onChange) // Directory added.
            .on('unlinkDir', callbacks.onChange); // Directory removed.
    }

    watcher.on('ready', () => {
        if (callbacks.onReady) callbacks.onReady();
        setupWatchBuildEvents();
    });
}

function closeWatcher(/** @type {chokidar.FSWatcher|undefined} */ watcher) {
    if (watcher) {
        watcher
            .close()
            .then(() => {
                console.log('closed watcher successfully');
            })
            .catch((error) => {
                console.log('error closing watcher', error);
            });
    }
}

module.exports = {
    onUncaughtException,
    killChild,
    createWatcher,
    setupWatcherEvents,
    closeWatcher,
};
