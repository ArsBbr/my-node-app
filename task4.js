// Задание 4. Потоковая обработка данных (Вариант 1-5: подсчет четных/нечетных чисел)
// Студент: Барбажинский Арсений, группа 478

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const readline = require('readline'); // построчное чтение из потока

const VARIANT = 1;
const LINES_COUNT = 100000;              // минимум 100 000 строк
const INPUT_FILE = path.join(__dirname, `data_${VARIANT}.txt`);       // data_1.txt
const OUTPUT_FILE = path.join(__dirname, `processed_${VARIANT}.txt`); // processed_1.txt
const CHUNK_SIZE = 64 * 1024;            // буфер 64 КБ для больших файлов (> 1 МБ)

// Генерация тестового файла: "номер,случайное число,Вариант 1"
async function generateFile() {
    console.log(`Генерация файла ${path.basename(INPUT_FILE)} (${LINES_COUNT} строк)...`);
    // Используем поток записи, чтобы не держать все строки в памяти
    const writeStream = fs.createWriteStream(INPUT_FILE);
    for (let i = 1; i <= LINES_COUNT; i++) {
        const randomNum = Math.floor(Math.random() * 1000) + 1; // 1..1000
        if (!writeStream.write(`${i},${randomNum},Вариант ${VARIANT}\n`)) {
            // Если буфер заполнен - ждем освобождения (backpressure)
            await new Promise((resolve) => writeStream.once('drain', resolve));
        }
    }
    writeStream.end();
    await new Promise((resolve) => writeStream.once('finish', resolve));
}

async function processFile() {
    const startTime = Date.now();

    // Статистика
    let lineCount = 0;
    let sum = 0;
    let max = -Infinity;
    let min = Infinity;
    let evenCount = 0;   // доп. условие варианта 1-5: четные числа
    let oddCount = 0;    // доп. условие варианта 1-5: нечетные числа
    let nextProgress = 10; // следующий порог прогресса (%)

    const fileStat = await fsp.stat(INPUT_FILE);
    console.log(`📊 Обработка файла: ${path.basename(INPUT_FILE)}`);
    console.log(`💾 Размер файла: ${(fileStat.size / (1024 * 1024)).toFixed(2)} МБ`);

    // Потоковое чтение с буфером 64 КБ (без загрузки всего файла в память)
    const readStream = fs.createReadStream(INPUT_FILE, { highWaterMark: CHUNK_SIZE });
    // readline обрабатывает поток построчно
    const rl = readline.createInterface({ input: readStream, crlfDelay: Infinity });

    const outputLines = []; // накапливаем результаты для записи в файл

    for await (const line of rl) {
        // Формат строки: "номер,число,Вариант 1"
        const parts = line.split(',');
        const num = parseInt(parts[1], 10);
        if (isNaN(num)) continue; // пропускаем битые строки

        // Обновляем статистику
        lineCount++;
        sum += num;
        if (num > max) max = num;
        if (num < min) min = num;
        if (num % 2 === 0) evenCount++; else oddCount++;

        // Вывод прогресса каждые 10%
        const progress = Math.floor((lineCount / LINES_COUNT) * 100);
        if (progress >= nextProgress) {
            console.log(`⏳ Прогресс: ${progress}% (${lineCount.toLocaleString('ru-RU')} строк обработано)`);
            nextProgress += 10;
        }
    }

    // Формируем результаты
    const avg = lineCount > 0 ? (sum / lineCount).toFixed(2) : 0;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    outputLines.push('📊 Результаты обработки:', '-'.repeat(40));
    outputLines.push(`Файл: ${path.basename(INPUT_FILE)}`);
    outputLines.push(`Всего строк: ${lineCount.toLocaleString('ru-RU')}`);
    outputLines.push(`Сумма чисел: ${sum.toLocaleString('ru-RU')}`);
    outputLines.push(`Среднее значение: ${avg}`);
    outputLines.push(`Максимальное число: ${max}`);
    outputLines.push(`Минимальное число: ${min}`);
    outputLines.push(`Четных чисел: ${evenCount.toLocaleString('ru-RU')}`);
    outputLines.push(`Нечетных чисел: ${oddCount.toLocaleString('ru-RU')}`);
    outputLines.push(`Время выполнения: ${elapsed} сек`);
    const resultsText = outputLines.join('\n');

    // Сохраняем результаты в processed_1.txt
    await fsp.writeFile(OUTPUT_FILE, resultsText + '\n', 'utf-8');

    // Выводим результаты в консоль
    console.log('✅ Обработка завершена!');
    console.log(resultsText);
    console.log(`💾 Результаты сохранены в: ${OUTPUT_FILE}`);
}

async function main() {
    try {
        // Генерируем файл, если он не существует
        try {
            await fsp.access(INPUT_FILE);
            console.log(`Файл ${path.basename(INPUT_FILE)} уже существует, пропускаем генерацию.`);
        } catch {
            await generateFile();
        }
        await processFile();
    } catch (error) {
        console.error(`Ошибка при обработке файла: ${error.message}`);
        process.exitCode = 1;
    }
}

main();
