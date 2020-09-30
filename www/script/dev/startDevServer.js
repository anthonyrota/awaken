/* eslint-disable */
// @ts-nocheck

process.env.VERCEL_DEV_ENTRYPOINT = 'api/index.ts';
const oldObjectAssign = Object.assign;
Object.assign = function (...args) {
    const result = oldObjectAssign.call(this, ...args);
    // Vercel dev server overrides esModuleInterop to true.
    // https://github.com/vercel/vercel/blob/56c8af51b23aa8f4a457743a0762b303361d5cfe/packages/now-node/src/dev-server.ts#L18
    // https://github.com/vercel/vercel/blob/56c8af5/packages/now-node/src/typescript.ts#L398
    if (result.esModuleInterop) {
        result.esModuleInterop = false;
    }
    return result;
};
require('@vercel/node/dist/dev-server');
