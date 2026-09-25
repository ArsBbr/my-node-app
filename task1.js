// Задание 1. Создание и чтение файлов (Вариант 1)
// Студент: Барбажинский Арсений, группа 478

const fs = require('fs').promises; // только асинхронные методы (async/await)
const path = require('path');      // модуль path для всех операций с путями

const VARIANT = 1;
const FILE_NAME = `student_${VARIANT}.txt`;
// Все пути относительные к текущей директории
const FILE_PATH = path.join(__dirname, FILE_NAME);

// Данные студента
const studentInfo = {
    name: 'Барбажинский Арсений',
    group: '478',
    variant: VARIANT,
    favorites: [
        'Остров проклятых',
        'Человек-паук',
        'Бэтмен',
        'Мстители',
        'Зеленая миля',
    ],
};

async function main() {
    try {
        // Формируем текущую дату и время в локальном формате
        const now = new Date();
        const dateStr = now.toLocaleString('ru-RU');

        // Строки, которые будем записывать в файл
        const lines = [
            `Студент: ${studentInfo.name}`,
            `Группа: ${studentInfo.group}`,
            `Вариант: ${studentInfo.variant}`,
            `Дата: ${dateStr}`,
            'Любимые книги и фильмы:',
        ];

        // Добавляем список любимых книг/фильмов с нумерацией
        studentInfo.favorites.forEach((title, index) => {
            lines.push(`${index + 1}. "${title}"`);
        });

        // Шаг 2: записываем содержимое в файл (создаст файл, если его нет)
        await fs.writeFile(FILE_PATH, lines.join('\n') + '\n', 'utf-8');

        // Шаг 3: добавляем в конец файла строку с количеством записей.
        // Количество записей = количество строк, которые уже записаны.
        const countLine = `Количество записей: ${lines.length}`;
        await fs.appendFile(FILE_PATH, countLine + '\n', 'utf-8');

        console.log(`Создан файл: ${FILE_NAME}`);

        // Шаг 4: читаем файл и выводим содержимое в отформатированном виде
        const content = await fs.readFile(FILE_PATH, 'utf-8');
        console.log('Содержимое файла:');
        console.log(content);
    } catch (error) {
        // Обработка всех возможных ошибок
        console.error(`Ошибка при работе с файлом: ${error.message}`);
        process.exitCode = 1;
    }
}

main();
