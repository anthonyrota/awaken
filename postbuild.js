const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

const cwd = process.cwd();

[
    {
        from: ['dist', 'awakening.module.js'],
        to: ['dist', 'awakening.mjs'],
    },
    {
        from: ['testing', 'dist', 'testing.module.js'],
        to: ['testing', 'dist', 'testing.mjs'],
    },
].forEach(({ from, to }) => {
    fs.writeFileSync(
        path.join(cwd, ...to),
        fs.readFileSync(path.join(cwd, ...from)),
    );
    const fromStart = from.slice(0, from.length - 1);
    const fromEnd = from[from.length - 1];
    const toStart = to.slice(0, to.length - 1);
    const toEnd = to[to.length - 1];
    const mapSource = JSON.parse(
        fs.readFileSync(
            path.join(cwd, ...fromStart, fromEnd + '.map'),
            'utf-8',
        ),
    );
    mapSource.file = toEnd;
    fs.writeFileSync(
        path.join(cwd, ...toStart, toEnd + '.map'),
        JSON.stringify(mapSource),
        'utf-8',
    );
});

[
    ['dist', 'src'],
    ['dist', 'test'],
    ['dist', 'testing'],
    ['testing', 'dist', 'src'],
    ['testing', 'dist', 'test'],
    ['testing', 'dist', 'testing'],
].forEach((path_) => {
    console.log(path.join(cwd, ...path_));
    rimraf.sync(path.join(cwd, ...path_));
});
