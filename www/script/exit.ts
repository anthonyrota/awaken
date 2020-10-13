export function exit(error?: unknown): never {
    if (error != null) {
        console.error(error);
    }
    console.error('exiting...');
    process.exit(1);
}
