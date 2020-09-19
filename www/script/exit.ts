export function exit(): never {
    console.error('exiting...');
    process.exit(1);
}
