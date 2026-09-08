const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    
   
    const fio = "Барбажинский Арсений Леонидович";
    const group = "Группа 478";
    
        const piValue = (() => { 
        let p = 0; 
        for (let i = 0; i < 100; i++) p += (i % 2 ? -1 : 1) / (i * 2 + 1); 
        return (p * 4).toFixed(1); 
    })();

    
    res.end(`
        <p>${fio}</p>
        <p>${group}</p>
        <p>${piValue}</p>
    `);
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
