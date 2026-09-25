// Задание 2. Работа с каталогами (Вариант 1 - нечетный)
// Студент: Барбажинский Арсений, группа 478
// Доп. условие (нечетный вариант): в src/components создать 3 вложенные папки с номерами 1-3

const fs = require('fs').promises; // только асинхронные методы
const path = require('path');      // модуль path для всех операций с путями

const VARIANT = 1;
const PROJECT_DIR = path.join(__dirname, `project_${VARIANT}`); // project_1

// Описание структуры: [путь, назначение папки]
const structure = [
    ['src', 'Исходный код проекта'],
    ['src/modules', 'Модули приложения'],
    ['src/components', 'Компоненты интерфейса'],
    ['src/utils', 'Вспомогательные утилиты'],
    ['data', 'Данные проекта'],
    ['data/input', 'Входные данные'],
    ['data/output', 'Выходные данные'],
    ['temp', 'Временные файлы'],
];

// Рекурсивно выводит дерево каталога (аналог команды tree)
async function printTree(dir, prefix = '') {
    let entries;
    try {
        entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
        console.log(`${prefix}[недоступно: ${dir}]`);
        return;
    }
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const isLast = i === entries.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        console.log(prefix + connector + entry.name);
        if (entry.isDirectory()) {
            const extension = isLast ? '    ' : '│   ';
            await printTree(path.join(dir, entry.name), prefix + extension);
        }
    }
}

async function main() {
    try {
        // --- Шаг 1: создаем структуру каталогов ---
        for (const [relPath] of structure) {
            await fs.mkdir(path.join(PROJECT_DIR, relPath), { recursive: true });
        }

        // Доп. условие для нечетного варианта: 3 вложенные папки 1, 2, 3 в src/components
        for (let i = 1; i <= 3; i++) {
            await fs.mkdir(path.join(PROJECT_DIR, 'src', 'components', String(i)), { recursive: true });
        }

        // --- Шаг 2: в каждой папке создаем файл info.txt с описанием назначения ---
        for (const [relPath, description] of structure) {
            const infoPath = path.join(PROJECT_DIR, relPath, 'info.txt');
            await fs.writeFile(infoPath, `Папка: ${relPath}\nНазначение: ${description}\n`, 'utf-8');
        }

        // --- Шаг 3: выводим полное дерево созданной структуры ---
        console.log('=== Исходное дерево структуры ===');
        console.log(path.basename(PROJECT_DIR) + '/');
        await printTree(PROJECT_DIR);

        // --- Шаг 4: перемещаем папку temp внутрь папки data ---
        await fs.rename(
            path.join(PROJECT_DIR, 'temp'),
            path.join(PROJECT_DIR, 'data', 'temp')
        );

        // --- Шаг 5: переименовываем data/output в data/results ---
        await fs.rename(
            path.join(PROJECT_DIR, 'data', 'output'),
            path.join(PROJECT_DIR, 'data', 'results')
        );

        // --- Шаг 6: удаляем папку temp со всем содержимым (рекурсивно) ---
        await fs.rm(path.join(PROJECT_DIR, 'data', 'temp'), { recursive: true, force: true });

        // --- Шаг 7: выводим обновленное дерево ---
        console.log('\n=== Обновленное дерево структуры ===');
        console.log(path.basename(PROJECT_DIR) + '/');
        await printTree(PROJECT_DIR);

        console.log('\n✅ Все операции с каталогами выполнены успешно!');
    } catch (error) {
        // Обработка всех возможных ошибок
        console.error(`Ошибка при работе с каталогами: ${error.message}`);
        process.exitCode = 1;
    }
}

main();
