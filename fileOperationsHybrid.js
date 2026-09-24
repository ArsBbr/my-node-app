const fs = require('fs');
const path = require('path');
const util = require('util');

// Промисифицированные версии методов fs
const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const unlinkAsync = util.promisify(fs.unlink);
const statAsync = util.promisify(fs.stat);
const readdirAsync = util.promisify(fs.readdir);

/**
 * Кастомная ошибка с кодом файловой операции
 */
class FileOperationError extends Error {
    constructor(message, code, filename) {
        super(message);
        this.name = 'FileOperationError';
        this.code = code;
        this.filename = filename;
    }
}

/**
 * Преобразование системной ошибки fs в понятную FileOperationError
 */
function normalizeError(err, filename) {
    switch (err.code) {
        case 'ENOENT':
            return new FileOperationError(`Файл не найден: ${filename}`, 'FILE_NOT_FOUND', filename);
        case 'EACCES':
        case 'EPERM':
            return new FileOperationError(`Нет доступа к файлу: ${filename}`, 'PERMISSION_DENIED', filename);
        case 'EISDIR':
            return new FileOperationError(`Ожидался файл, а найдена директория: ${filename}`, 'IS_DIRECTORY', filename);
        default:
            return new FileOperationError(`Ошибка файловой операции (${err.code}): ${err.message}`, err.code, filename);
    }
}

/**
 * Гибридный класс: каждый метод поддерживает И промисы, И колбэки.
 * Если передан callback последним аргументом — работаем через колбэк,
 * иначе возвращаем Promise.
 */
class FileManagerHybrid {
    constructor(baseDir = './data-hybrid') {
        this.baseDir = baseDir;
        if (!fs.existsSync(baseDir)) {
            fs.mkdirSync(baseDir, { recursive: true });
            console.log(`Создана директория: ${baseDir}`);
        }
    }

    /**
     * Вспомогательный метод: отделяет колбэк от аргументов
     */
    _extractCallback(args) {
        const list = [...args];
        const last = list[list.length - 1];
        if (typeof last === 'function') {
            return { args: list.slice(0, -1), callback: last };
        }
        return { args: list, callback: null };
    }

    /**
     * Вспомогательный метод: либо вызывает колбэк, либо возвращает промис
     */
    _execute(promiseFn, callback) {
        if (callback) {
            promiseFn()
                .then((result) => callback(null, result))
                .catch((err) => callback(err));
            return undefined;
        }
        return promiseFn();
    }

    /**
     * Создание файла (промис или колбэк)
     * createFile(filename, content[, callback])
     */
    createFile(...args) {
        const { args: [filename, content], callback } = this._extractCallback(args);
        return this._execute(async () => {
            try {
                const filePath = path.join(this.baseDir, filename);
                await writeFileAsync(filePath, content, 'utf8');
                return filePath;
            } catch (err) {
                throw normalizeError(err, filename);
            }
        }, callback);
    }

    /**
     * Чтение файла (промис или колбэк)
     * readFile(filename[, callback])
     */
    readFile(...args) {
        const { args: [filename], callback } = this._extractCallback(args);
        return this._execute(async () => {
            try {
                const filePath = path.join(this.baseDir, filename);
                return await readFileAsync(filePath, 'utf8');
            } catch (err) {
                throw normalizeError(err, filename);
            }
        }, callback);
    }

    /**
     * Статистика файла (промис или колбэк)
     * getFileStats(filename[, callback])
     */
    getFileStats(...args) {
        const { args: [filename], callback } = this._extractCallback(args);
        return this._execute(async () => {
            try {
                const filePath = path.join(this.baseDir, filename);
                const stats = await statAsync(filePath);
                return {
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime,
                    isFile: stats.isFile()
                };
            } catch (err) {
                throw normalizeError(err, filename);
            }
        }, callback);
    }

    /**
     * Удаление файла (промис или колбэк)
     * deleteFile(filename[, callback])
     */
    deleteFile(...args) {
        const { args: [filename], callback } = this._extractCallback(args);
        return this._execute(async () => {
            try {
                const filePath = path.join(this.baseDir, filename);
                await unlinkAsync(filePath);
            } catch (err) {
                throw normalizeError(err, filename);
            }
        }, callback);
    }

    /**
     * Список файлов (промис или колбэк)
     * listFiles([callback])
     */
    listFiles(...args) {
        const { callback } = this._extractCallback(args);
        return this._execute(async () => {
            try {
                const files = await readdirAsync(this.baseDir);
                const fileStats = await Promise.all(
                    files.map(async (file) => {
                        const stats = await statAsync(path.join(this.baseDir, file));
                        return { name: file, isFile: stats.isFile() };
                    })
                );
                return fileStats.filter((f) => f.isFile).map((f) => f.name);
            } catch (err) {
                throw normalizeError(err, this.baseDir);
            }
        }, callback);
    }
}

module.exports = { FileManagerHybrid, FileOperationError };