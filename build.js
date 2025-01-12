import { readFile, writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function build() {
    // Создаем директорию dist если её нет
    await mkdir(join(__dirname, 'dist'), { recursive: true });

    // Читаем исходный файл
    const source = await readFile(join(__dirname, 'index.js'), 'utf8');

    // ES Module версия (просто копируем исходный файл)
    await writeFile(join(__dirname, 'dist', 'index.mjs'), source);

    // CommonJS версия
    const cjsContent = source
        .replace('import axios from \'axios\';', 'const axios = require(\'axios\');')
        .replace('import axiosRetry from \'axios-retry\';', 'const axiosRetry = require(\'axios-retry\');')
        .replace('export class', 'class')
        .replace('export default ArshinParser;', 'module.exports = ArshinParser;');

    await writeFile(join(__dirname, 'dist', 'index.cjs'), cjsContent);
}

build().catch(console.error);
