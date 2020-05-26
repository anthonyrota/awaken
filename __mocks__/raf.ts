import { RafMock } from '../test/mockTypes/raf';

let id = -23;
const rafMock: RafMock = Object.assign(
    jest.fn(() => {
        id += 23;
        return id;
    }),
    { cancel: jest.fn() },
);

export = rafMock;
