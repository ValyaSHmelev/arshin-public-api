# arshin-public-api

API клиент для работы с ФГИС «АРШИН»

## Установка

```bash
npm install arshin-public-api
```

## Использование

```javascript
import ArshinParser from 'arshin-public-api';

const parser = new ArshinParser({
    chunkSize: 100, // размер чанка (по умолчанию 100)
    maxRetry: 10    // максимальное количество повторных попыток (по умолчанию 10)
});

// Получение записи по глобальному ID
async function getRecord() {
    try {
        const record = await parser.getRecordByGlobalID('YOUR_GLOBAL_ID');
        console.log(record);
    } catch (error) {
        console.error(error);
    }
}

## Опции

- `chunkSize` - размер чанка для запросов (по умолчанию 100)
- `maxRetry` - максимальное количество повторных попыток при ошибках (по умолчанию 10)

## Лицензия

MIT
