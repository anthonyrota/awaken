/* eslint-disable @typescript-eslint/no-var-requires */
const child_process = require('child_process');
const http = require('http');
const chokidar = require('chokidar');
const colors = require('colors');
const httpProxy = require('http-proxy');
const open = require('open');
const kill = require('tree-kill');

/** @type {import('child_process').ChildProcess|undefined} */
let buildPublicChild;
/** @type {import('child_process').ChildProcess|undefined} */
let devServerChild;
/** @type {string|undefined} */
let proxyTarget;
/** @type {http.Server|undefined} */
let server;

function killChild(
    /** @type {import('child_process').ChildProcess|undefined} */ child,
) {
    if (child) {
        kill(child.pid);
    }
}

function exitError() {
    process.exitCode = 1;
    killChild(buildPublicChild);
    if (server) {
        server.close();
    }
    killChild(devServerChild);
    void watcher.close();
}

function buildPublic(/** @type {(() => void)|undefined} */ cb) {
    killChild(buildPublicChild);

    const child = child_process.spawn('npm', ['run', 'build:public'], {
        stdio: 'inherit',
    });

    buildPublicChild = child;
    child
        .on('error', (error) => {
            console.log(error);
            exitError();
        })
        .on('close', (code) => {
            if (child !== buildPublicChild) {
                return;
            }
            if (code !== 0) {
                console.log(`public build exited with code ${code}`);
                killChild(child);
                return;
            }
            console.log(colors.green('✓') + ' done build');
            if (cb) cb();
        });
}

const proxy = httpProxy.createProxyServer({});

function setupServer() {
    server = http.createServer((req, res) => {
        if (!proxyTarget) {
            console.log('unexpected: no target url');
            exitError();
            return;
        }
        proxy.web(req, res, { target: proxyTarget });
    });
    const port = 8080;
    server.listen(port);
    const url = `http://localhost:${port}`;
    open(url).catch((error) => {
        console.log(`error opening ${url}`);
        console.log(error);
        exitError();
    });
}

function updateDevServerProxy() {
    devServerChild = child_process.fork(`${__dirname}/startDevServer.js`, {
        stdio: 'inherit',
    });

    const child = devServerChild;
    child
        .on('message', (/** @type {import('net').AddressInfo} */ message) => {
            const { address, port } = message;
            proxyTarget = `http://${address}:${port}`;
            if (!server) {
                setupServer();
            }
        })
        .on('error', (error) => {
            console.log(error);
            exitError();
        })
        .on('close', (code) => {
            if (child !== devServerChild) {
                return;
            }
            if (code !== 0) {
                exitError();
            }
        });
}

const watcher = chokidar.watch([
    'src',
    'api/index.ts',
    'script/template',
    'script/generatePublic',
]);

watcher.on('error', (error) => {
    console.log(error);
    exitError();
});

const buildPublicAndUpdateDevServerProxy = () => {
    killChild(devServerChild);
    devServerChild = undefined;
    buildPublic(updateDevServerProxy);
};

function setupWatchBuildEvents() {
    watcher
        .on('add', buildPublicAndUpdateDevServerProxy) // File added.
        .on('change', buildPublicAndUpdateDevServerProxy) // File changed.
        .on('unlink', buildPublicAndUpdateDevServerProxy) // File removed.
        .on('addDir', buildPublicAndUpdateDevServerProxy) // Directory added.
        .on('unlinkDir', buildPublicAndUpdateDevServerProxy); // Directory removed.
}

watcher.on('ready', () => {
    buildPublicAndUpdateDevServerProxy();
    setupWatchBuildEvents();
});
