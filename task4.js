const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const readline = require('readline'); 

const VARIANT = 1;
const LINES_COUNT = 100000;             
const INPUT_FILE = path.join(__dirname, `data_${VARIANT}.txt`);      
const OUTPUT_FILE = path.join(__dirname, `processed_${VARIANT}.txt`);
const CHUNK_SIZE = 64 * 1024;           


async function generateFile() {
    console.log(`Генерация файла ${path.basename(INPUT_FILE)} (${LINES_COUNT} строк)...`);
    const writeStream = fs.createWriteStream(INPUT_FILE);
    for (let i = 1; i <= LINES_COUNT; i++) {
        const randomNum = Math.floor(Math.random() * 1000) + 1; 
        if (!writeStream.write(`${i},${randomNum},Вариант ${VARIANT}\n`)) {
            await new Promise((resolve) => writeStream.once('drain', resolve));
        }
    }
    writeStream.end();
    await new Promise((resolve) => writeStream.once('finish', resolve));
}

async function processFile() {
    const startTime = Date.now();

  
    let lineCount = 0;
    let sum = 0;
    let max = -Infinity;
    let min = Infinity;
    let evenCount = 0;  
    let oddCount = 0;   
    let nextProgress = 10; 

    const fileStat = await fsp.stat(INPUT_FILE);
    console.log(` Обработка файла: ${path.basename(INPUT_FILE)}`);
    console.log(` Размер файла: ${(fileStat.size / (1024 * 1024)).toFixed(2)} МБ`);

    
    const readStream = fs.createReadStream(INPUT_FILE, { highWaterMark: CHUNK_SIZE });
  
    const rl = readline.createInterface({ input: readStream, crlfDelay: Infinity });

    const outputLines = []; 

    for await (const line of rl) {
    
        const parts = line.split(',');
        const num = parseInt(parts[1], 10);
        if (isNaN(num)) continue; 

     
        lineCount++;
        sum += num;
        if (num > max) max = num;
        if (num < min) min = num;
        if (num % 2 === 0) evenCount++; else oddCount++;

        
        const progress = Math.floor((lineCount / LINES_COUNT) * 100);
        if (progress >= nextProgress) {
            console.log(` Прогресс: ${progress}% (${lineCount.toLocaleString('ru-RU')} строк обработано)`);
            nextProgress += 10;
        }
    }

  
    const avg = lineCount > 0 ? (sum / lineCount).toFixed(2) : 0;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    outputLines.push(' Результаты обработки:', '-'.repeat(40));
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

  
    await fsp.writeFile(OUTPUT_FILE, resultsText + '\n', 'utf-8');

   
    console.log(' Обработка завершена!');
    console.log(resultsText);
    console.log(` Результаты сохранены в: ${OUTPUT_FILE}`);
}

async function main() {
    try {
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
