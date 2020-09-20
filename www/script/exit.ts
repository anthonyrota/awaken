export function exit(message?: string): never {
    console.error('exiting...');
    if (message !== undefined) {
        console.log(message);
    }
    process.exit(1);
}
