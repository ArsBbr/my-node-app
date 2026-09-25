const { FileManagerHybrid } = require('./fileOperationsHybrid');
const fm = new FileManagerHybrid('./test-data-hybrid');

console.log('=== ТЕСТИРОВАНИЕ ГИБРИДНОГО ПОДХОДА ===\n');

async function testPromises() {
    console.log('--- Стиль 1: промисы (async/await) ---');
    const filePath = await fm.createFile('hybrid1.txt', 'Контент через промис');
    console.log(`✅ Файл создан: ${filePath}`);

    const content = await fm.readFile('hybrid1.txt');
    console.log(`✅ Прочитано: "${content}"`);

    const stats = await fm.getFileStats('hybrid1.txt');
    console.log(`✅ Размер: ${stats.size} байт`);
}

function testCallbacks() {
    console.log('\n--- Стиль 2: колбэки ---');
    fm.createFile('hybrid2.txt', 'Контент через колбэк', (err, filePath) => {
        if (err) {
            console.error('❌ Ошибка создания:', err.message);
            return;
        }
        console.log(`✅ Файл создан: ${filePath}`);

        fm.readFile('hybrid2.txt', (err, content) => {
            if (err) {
                console.error('❌ Ошибка чтения:', err.message);
                return;
            }
            console.log(`✅ Прочитано: "${content}"`);

            fm.listFiles((err, files) => {
                if (err) {
                    console.error('❌ Ошибка списка:', err.message);
                    return;
                }
                console.log('✅ Файлы в директории:', files.join(', '));
            });
        });
    });
}

async function testErrors() {
    console.log('\n--- Стиль 3: обработка ошибок ---');
    try {
        await fm.readFile('no-such-file.txt');
    } catch (err) {
        console.log(`✅ Поймана ошибка (промис): ${err.code} — ${err.message}`);
    }

    fm.readFile('no-such-file.txt', (err) => {
        if (err) {
            console.log(`✅ Поймана ошибка (колбэк): ${err.code} — ${err.message}`);
        }
    });

    try {
        await fm.deleteFile('no-such-file.txt');
    } catch (err) {
        console.log(`✅ Поймана ошибка удаления: ${err.code} — ${err.message}`);
    }
}

async function cleanup() {
    console.log('\n--- Очистка ---');
    const files = await fm.listFiles();
    for (const file of files) {
        await fm.deleteFile(file);
        console.log(`✅ ${file} удалён`);
    }
    console.log('\n✅ Все операции завершены!');
    console.log('✨ Один модуль — два стиля: колбэк И промис!');
}

(async () => {
    await testPromises();
    testCallbacks();
    await testErrors();
    await new Promise(resolve => setTimeout(resolve, 200));
    await cleanup();
})();