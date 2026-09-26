const fs = require('fs').promises;
const path = require('path');

const VARIANT = 1;
const MAX_FILE_SIZE = 10 * 1024 * 1024; 
const REPORT_FILE = path.join(__dirname, `report_${VARIANT}.json`);


function formatSize(bytes) {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} МБ (${bytes} байт)`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} КБ (${bytes} байт)`;
    return `${bytes} байт`;
}


async function scanDir(dir) {
    const files = [];   
    let folderCount = 0; 

    async function walk(currentDir) {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
                folderCount++; 
                await walk(fullPath);
            } else if (entry.isFile()) {
                const stat = await fs.stat(fullPath);
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
        const inputDir = process.argv[2] ? path.resolve(process.argv[2]) : __dirname;
        console.log(` Анализ директории: ${inputDir}`);

        const { files, folderCount } = await scanDir(inputDir);

        const totalSize = files.reduce((sum, f) => sum + f.size, 0);
        const totalFiles = files.length;

   
        const byExt = {};
        for (const f of files) {
            const ext = path.extname(f.name).toLowerCase() || '(без расширения)';
            if (!byExt[ext]) byExt[ext] = { count: 0, size: 0 };
            byExt[ext].count++;
            byExt[ext].size += f.size;
        }


        const sortedBySize = [...files].sort((a, b) => b.size - a.size);
        const top5Big = sortedBySize.slice(0, 5);
        const top5Small = sortedBySize.slice(-5).reverse();

        console.log(` Общее количество папок: ${folderCount}`);
        console.log(` Общее количество файлов: ${totalFiles}`);
        console.log(` Общий размер: ${formatSize(totalSize)}`);
        console.log(' Расширения файлов:');
        for (const [ext, info] of Object.entries(byExt)) {
            console.log(`   ${ext}: ${info.count} файлов (${formatSize(info.size)})`);
        }
        console.log(' Топ-5 самых больших файлов:');
        top5Big.forEach((f, i) => console.log(`   ${i + 1}. ${f.name} (${formatSize(f.size)}) - ${f.path}`));
        console.log(' Топ-5 самых маленьких файлов:');
        top5Small.forEach((f, i) => console.log(`   ${i + 1}. ${f.name} (${formatSize(f.size)}) - ${f.path}`));

        
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
        console.log(` Отчет сохранен: ${REPORT_FILE}`);
    } catch (error) {
        console.error(`Ошибка при анализе директории: ${error.message}`);
        process.exitCode = 1;
    }
}

main();
