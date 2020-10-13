import * as crypto from 'crypto';

export function computeFileHash(file: string | Buffer): string {
    // Why eight hex characters chosen to represent the hash? Because parcel
    // does it too.
    // eslint-disable-next-line max-len
    // How good are eight hex characters? Well, according to https://everydayinternetstuff.com/2015/04/hash-collision-probability-calculator/,
    // these are the probabilities of collision given `n` hashes
    // | number of hashes | probability of collision |
    // | ---------------- | ------------------------ |
    // | 5000             | 0.0029055716014250166    |
    // | 10000            | 0.01157288105708909      |
    // | 20000            | 0.04549633911131801      |
    // | 40000            | 0.16994213048124074      |
    // | 80000            | 0.5252888411157739       |
    // | 160000           | 0.9492180149513215       |
    return crypto.createHash('md5').update(file).digest('hex').slice(-8);
}
