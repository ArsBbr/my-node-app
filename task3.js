// Задание 3. Поиск и фильтрация файлов (Вариант 1-5: игнорировать файлы > 10 МБ)
// Студент: Барбажинский Арсений, группа 478

const fs = require('fs').promises;
const path = require('path');

const VARIANT = 1;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 МБ - файлы больше игнорируются
const REPORT_FILE = path.join(__dirname, `report_${VARIANT}.json`);

// Форматирование размера: байты -> КБ / МБ
function formatSize(bytes) {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} МБ (${bytes} байт)`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} КБ (${bytes} байт)`;
    return `${bytes} байт`;
}

// Рекурсивное сканирование директории
async function scanDir(dir) {
    const files = [];   // список найденных файлов {name, path, size}
    let folderCount = 0; // количество папок

    async function walk(currentDir) {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
                folderCount++; // учитываем папку
                await walk(fullPath); // рекурсия в подпапку
            } else if (entry.isFile()) {
                const stat = await fs.stat(fullPath);
                // Доп. условие варианта 1-5: игнорируем файлы больше 10 МБ
                if (stat.size > MAX_FILE_SIZE) continue;
                files.push({ name: entry.name, path: fullPath, size: stat.size });
            }
        }
    }

    await walk(dir);
    return { files, folderCount };
}

async function main() {
    try {
        // Шаг 1: путь к директории из аргументов командной строки,
        // если не указан - используется текущая
        const inputDir = process.argv[2] ? path.resolve(process.argv[2]) : __dirname;
        console.log(`📊 Анализ директории: ${inputDir}`);

        // Шаг 2-3: рекурсивное сканирование и сбор статистики
        const { files, folderCount } = await scanDir(inputDir);

        const totalSize = files.reduce((sum, f) => sum + f.size, 0);
        const totalFiles = files.length;

        // Группировка файлов по расширениям
        const byExt = {};
        for (const f of files) {
            const ext = path.extname(f.name).toLowerCase() || '(без расширения)';
            if (!byExt[ext]) byExt[ext] = { count: 0, size: 0 };
            byExt[ext].count++;
            byExt[ext].size += f.size;
        }

        // Топ-5 самых больших и самых маленьких файлов
        const sortedBySize = [...files].sort((a, b) => b.size - a.size);
        const top5Big = sortedBySize.slice(0, 5);
        const top5Small = sortedBySize.slice(-5).reverse();

        // Вывод статистики в консоль
        console.log(`📁 Общее количество папок: ${folderCount}`);
        console.log(`📄 Общее количество файлов: ${totalFiles}`);
        console.log(`💾 Общий размер: ${formatSize(totalSize)}`);
        console.log('📂 Расширения файлов:');
        for (const [ext, info] of Object.entries(byExt)) {
            console.log(`   ${ext}: ${info.count} файлов (${formatSize(info.size)})`);
        }
        console.log('🏆 Топ-5 самых больших файлов:');
        top5Big.forEach((f, i) => console.log(`   ${i + 1}. ${f.name} (${formatSize(f.size)}) - ${f.path}`));
        console.log('🔹 Топ-5 самых маленьких файлов:');
        top5Small.forEach((f, i) => console.log(`   ${i + 1}. ${f.name} (${formatSize(f.size)}) - ${f.path}`));

        // Шаг 4: сохраняем отчет в report_1.json
        const report = {
            directory: inputDir,
            totalFolders: folderCount,
            totalFiles,
            totalSizeBytes: totalSize,
            extensions: byExt,
            top5Largest: top5Big,
            top5Smallest: top5Small,
            generatedAt: new Date().toISOString(),
        };
        await fs.writeFile(REPORT_FILE, JSON.stringify(report, null, 2), 'utf-8');
        console.log(`📄 Отчет сохранен: ${REPORT_FILE}`);
    } catch (error) {
        console.error(`Ошибка при анализе директории: ${error.message}`);
        process.exitCode = 1;
    }
}

main();
