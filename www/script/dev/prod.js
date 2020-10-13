/* eslint-disable @typescript-eslint/no-var-requires */
const child_process = require('child_process');
const http = require('http');
const colors = require('colors');
const httpProxy = require('http-proxy');
const open = require('open');
const {
    onUncaughtException,
    killChild,
    createWatcher,
    setupWatcherEvents,
    closeWatcher,
} = require('./util');

/** @type {import('child_process').ChildProcess|undefined} */
let buildPublicChild;
/** @type {import('child_process').ChildProcess|undefined} */
let devServerChild;
/** @type {string|undefined} */
let proxyTarget;
/** @type {http.Server[]} */
let servers = [];
/** @type {Set<import('net').Socket>} */
const sockets = new Set();

onUncaughtException(exitError);

function exitError() {
    process.exitCode = 1;
    killChild(buildPublicChild);
    for (const server of servers) {
        if (server.listening) {
            const address = server.address();
            server.close((error) => {
                if (error) {
                    console.log('error closing server', error);
                    return;
                }
                console.log(
                    `closed server at ${
                        // eslint-disable-next-line max-len
                        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                        typeof address === 'object' && address != null
                            ? `${address.address} ${address.port}`
                            : address
                    } successfully`,
                );
            });
        }
    }
    if (sockets.size > 0) {
        process.nextTick(() => {
            for (const socket of sockets) {
                console.log('destroying socket');
                socket.destroy();
            }
        });
    }
    killChild(devServerChild);
    closeWatcher(watcher);
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
    /** @type {import('http').RequestListener} */
    const onRequest = (req, res) => {
        if (!proxyTarget) {
            console.log('unexpected: no target url');
            exitError();
            return;
        }
        const target = proxyTarget;
        if (req.url !== undefined) {
            console.log(`requesting ${colors.cyan(req.url)}`);
        }
        proxy.web(req, res, { target }, (error) => {
            console.log(`error proxying to ${target}`, error);
            res.writeHead(502);
            res.write('proxy error');
            res.end();
        });
    };
    function setupServerEvents(/** @type {http.Server} */ server) {
        server.on('connection', (socket) => {
            sockets.add(socket);
            socket.on('close', () => {
                sockets.delete(socket);
            });
        });
        server.on('error', (error) => {
            console.log('server error');
            console.log(error);
            exitError();
        });
    }
    const localServer = http.createServer(onRequest);
    setupServerEvents(localServer);
    const port = 8080;
    localServer.listen(port);
    const localServerUrl = `http://localhost:${port}`;
    console.log(`listening at ${colors.cyan(localServerUrl)}`);
    open(localServerUrl).catch((error) => {
        console.log(`error opening ${localServerUrl}`);
        console.log(error);
        exitError();
    });
    const networkInterfacesMap = require('os').networkInterfaces();
    /** @type {string|undefined} */
    let ipAddress;
    outer: for (const networkInterfaceInfos of Object.values(
        networkInterfacesMap,
    )) {
        if (!networkInterfaceInfos) {
            continue;
        }
        for (const { family, internal, address } of networkInterfaceInfos) {
            if (family === 'IPv4' && !internal) {
                ipAddress = address;
                break outer;
            }
        }
    }
    if (ipAddress !== undefined) {
        if (process.exitCode === 1) {
            return;
        }
        const localNetworkServer = http.createServer(onRequest);
        servers.push(localServer, localNetworkServer);
        setupServerEvents(localNetworkServer);
        localNetworkServer.listen(port, ipAddress);
        console.log(
            `listening on local network at ${colors.cyan(ipAddress)}:${port}`,
        );
    }
}

function updateDevServerProxy() {
    devServerChild = child_process.fork(`${__dirname}/startDevServer.js`, {
        stdio: 'inherit',
    });

    const child = devServerChild;
    child.on('message', (/** @type {import('net').AddressInfo} */ message) => {
        const { address, port } = message;
        proxyTarget = `http://${address}:${port}`;
        if (servers.length === 0) {
            setupServer();
        }
    });
    child.on('error', (error) => {
        console.log(error);
        exitError();
    });
    child.on('close', (code) => {
        if (child !== devServerChild) {
            return;
        }
        if (code !== 0) {
            exitError();
        }
    });
}

const watcher = createWatcher();

function buildPublicAndUpdateDevServerProxy() {
    killChild(devServerChild);
    devServerChild = undefined;
    buildPublic(updateDevServerProxy);
}

setupWatcherEvents(watcher, {
    onError: exitError,
    onChange: buildPublicAndUpdateDevServerProxy,
    onReady: buildPublicAndUpdateDevServerProxy,
});
