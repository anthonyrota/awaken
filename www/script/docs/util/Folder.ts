import * as path from 'path';
import { Readable } from 'stream';
import { promisify } from 'util';
import * as fs from 'fs-extra';
import * as rimraf from 'rimraf';

const rimrafP = promisify(rimraf);

export type File = string | Buffer | Readable;
export type Folder = Map<string, File | Folder>;

export function Folder(): Folder {
    return new Map<string, File | Folder>();
}

export function getNestedFolderAtPath(
    folder: Folder,
    folderPath: string,
    assertExists?: boolean,
): Folder {
    if (folderPath === '') {
        return folder;
    }

    let currentFolder = folder;

    for (const folderName of folderPath.split('/')) {
        let nestedFolder = currentFolder.get(folderName);

        if (nestedFolder !== undefined && !(nestedFolder instanceof Map)) {
            throw new Error(`No folder at path ${folderPath}`);
        }

        if (!nestedFolder) {
            if (assertExists) {
                throw new Error(`No folder at path ${folderPath}`);
            }
            nestedFolder = Folder();
            currentFolder.set(folderName, nestedFolder);
        }

        currentFolder = nestedFolder;
    }

    return currentFolder;
}

export function getNestedFolderAndFileNameAtPath(
    folder: Folder,
    filePath: string,
    assertExists?: boolean,
): [Folder, string] {
    const folderPath = filePath.split('/');
    const fileName = folderPath.pop();

    if (!fileName) {
        throw new Error(`Empty path.`);
    }

    const nestedFolder = getNestedFolderAtPath(
        folder,
        folderPath.join('/'),
        assertExists,
    );
    const file = nestedFolder.get(fileName);

    if (file === undefined) {
        if (assertExists) {
            throw new Error(`No file exists at path ${filePath}`);
        }
    } else if (typeof file !== 'string') {
        throw new Error(`Path ${filePath} contains a folder not a file`);
    }

    return [nestedFolder, fileName];
}

export function addFileToFolder(
    folder: Folder,
    filePath: string,
    file: File,
): void {
    const [nestedFolder, fileName] = getNestedFolderAndFileNameAtPath(
        folder,
        filePath,
    );

    if (nestedFolder.has(fileName)) {
        throw new Error(`Duplicate path ${filePath}.`);
    }

    nestedFolder.set(fileName, file);
}

export function removeFileFromFolder(folder: Folder, filePath: string): void {
    const [nestedFolder, fileName] = getNestedFolderAndFileNameAtPath(
        folder,
        filePath,
        true,
    );

    nestedFolder.delete(fileName);
}

export function getFileInFolder(folder: Folder, filePath: string): File {
    const [nestedFolder, fileName] = getNestedFolderAndFileNameAtPath(
        folder,
        filePath,
        true,
    );

    return nestedFolder.get(fileName) as File;
}

export function moveFileInFolder(
    folder: Folder,
    oldFilePath: string,
    newFilePath: string,
): void {
    const fileText = getFileInFolder(folder, oldFilePath);
    removeFileFromFolder(folder, oldFilePath);
    addFileToFolder(folder, newFilePath, fileText);
}

export function copyFolder(to: Folder, from: Folder): void {
    for (const [path, thing] of from) {
        to.set(path, thing);
    }
}

export async function writeFolderToDirectoryPath(
    folder: Folder,
    directoryPath: string,
): Promise<void> {
    await fs.ensureDir(directoryPath);
    await Promise.all(
        Array.from(folder, async ([fileOrFolderPath, fileOrFolder]) => {
            if (fileOrFolderPath === '') {
                throw new Error(
                    'Empty string as file or folder path not allowed.',
                );
            }

            const writePath = path.join(directoryPath, fileOrFolderPath);

            if (fileOrFolder instanceof Map) {
                return writeFolderToDirectoryPath(fileOrFolder, writePath);
            }

            if (fs.existsSync(writePath)) {
                const stats = fs.lstatSync(writePath);

                if (stats.isDirectory()) {
                    await rimrafP(writePath);
                } else if (!stats.isFile()) {
                    throw new Error(`${writePath} is not a file or directory`);
                }
            }

            if (fileOrFolder instanceof Readable) {
                return new Promise((resolve, reject) => {
                    const writeStream = fs.createWriteStream(writePath);

                    writeStream.on('finish', resolve);
                    writeStream.on('error', reject);

                    fileOrFolder.pipe(writeStream);
                });
            }

            return fs.writeFile(writePath, fileOrFolder, 'utf-8');
        }),
    );
}
