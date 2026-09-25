const fs = require('fs').promises; 
const path = require('path');      

const VARIANT = 1;
const PROJECT_DIR = path.join(__dirname, `project_${VARIANT}`); 


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
        for (const [relPath] of structure) {
            await fs.mkdir(path.join(PROJECT_DIR, relPath), { recursive: true });
        }

       
        for (let i = 1; i <= 3; i++) {
            await fs.mkdir(path.join(PROJECT_DIR, 'src', 'components', String(i)), { recursive: true });
        }

        for (const [relPath, description] of structure) {
            const infoPath = path.join(PROJECT_DIR, relPath, 'info.txt');
            await fs.writeFile(infoPath, `Папка: ${relPath}\nНазначение: ${description}\n`, 'utf-8');
        }

        console.log('Исходное дерево структуры ');
        console.log(path.basename(PROJECT_DIR) + '/');
        await printTree(PROJECT_DIR);

        await fs.rename(
            path.join(PROJECT_DIR, 'temp'),
            path.join(PROJECT_DIR, 'data', 'temp')
        );

        await fs.rename(
            path.join(PROJECT_DIR, 'data', 'output'),
            path.join(PROJECT_DIR, 'data', 'results')
        );

       
        await fs.rm(path.join(PROJECT_DIR, 'data', 'temp'), { recursive: true, force: true });

       
        console.log('\n Обновленное дерево структуры ');
        console.log(path.basename(PROJECT_DIR) + '/');
        await printTree(PROJECT_DIR);

        console.log('\n✅ Все операции с каталогами выполнены успешно!');
    } catch (error) {
        console.error(`Ошибка при работе с каталогами: ${error.message}`);
        process.exitCode = 1;
    }
}

main();
