import axios from 'axios';
import axiosRetry from 'axios-retry';

export class ArshinParser {
    constructor(options = {}) {
        this.chunkSize = options.chunkSize || 100;
        this.maxRetry = options.maxRetry || 10;
        this.timeout = 5000; // Устанавливаем таймаут 5 секунд
        
        // Создаем экземпляр axios с настройками
        this.client = axios.create({
            timeout: this.timeout
        });

        // Настраиваем retry логику
        axiosRetry(this.client, {
            retries: this.maxRetry,
            retryDelay: axiosRetry.exponentialDelay,
            retryCondition: (error) => {
                // Добавляем специальную проверку на таймаут
                return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
                       error.code === 'ECONNABORTED' ||
                       error.code === 'ETIMEDOUT';
            },
            shouldResetTimeout: true // Сбрасываем таймер при повторной попытке
        });
    }

    async getRecordByGlobalID(globalID) {
        if (!globalID) {
            throw new Error('Параметр globalID является обязательным');
        }

        const url = `https://fgis.gost.ru/fundmetrology/cm/iaux/vri/1-${globalID}?nonpub=1`;

        try {
            const response = await this.client.get(url, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data;
        } catch (error) {
            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                throw new Error('Превышено время ожидания ответа от сервера (5 секунд)');
            } else if (error.response) {
                throw new Error(`Запрос завершился с ошибкой ${error.response.status}: ${error.response.data}`);
            } else if (error.request) {
                throw new Error('Сервер не ответил на запрос');
            } else {
                throw new Error(`Ошибка при выполнении запроса: ${error.message}`);
            }
        }
    }
    
    async getRecordsByGlobalIDs(globalIDs) {
        if (!Array.isArray(globalIDs)) {
            throw new Error('Параметр globalIDs должен быть массивом');
        }

        // Разбиваем массив на чанки
        const chunks = [];
        for (let i = 0; i < globalIDs.length; i += this.chunkSize) {
            chunks.push(globalIDs.slice(i, i + this.chunkSize));
        }

        const results = [];
        const errors = [];

        // Обрабатываем каждый чанк
        for (const chunk of chunks) {
            const chunkPromises = chunk.map(async (globalID) => {
                try {
                    const result = await this.getRecordByGlobalID(globalID);
                    results.push({ globalID, data: result, success: true });
                } catch (error) {
                    errors.push({ globalID, error: error.message, success: false });
                }
            });

            // Ждем завершения всех запросов в чанке перед переходом к следующему
            await Promise.all(chunkPromises);
        }

        return {
            results: results,
            errors: errors,
            totalProcessed: globalIDs.length,
            successCount: results.length,
            errorCount: errors.length
        };
    }
}

export default ArshinParser;

// Поддержка CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ArshinParser;
    module.exports.ArshinParser = ArshinParser;
}
