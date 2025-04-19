// файл: bff-service/src/index.ts

import * as http from 'http';
import * as url from 'url';
import * as https from 'https';
import * as dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

interface CacheEntry {
    data: any;
    timestamp: number;
}

const CACHE_TTL = 2 * 60 * 1000;

const requestCache = new Map<string, CacheEntry>();

// HTTP server
const server = http.createServer(async (req, res) => {
    try {
        if (!req.url) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid request' }));
            return;
        }

        const parsedUrl = url.parse(req.url, true);
        const pathSegments = parsedUrl.pathname?.split('/').filter(Boolean) || [];

        // Получаем имя целевого сервиса (первый сегмент пути)
        const serviceRoute = pathSegments[0];

        if (!serviceRoute) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Recipient service name is required' }));
            return;
        }

        const recipientURL = process.env[`${serviceRoute.toUpperCase()}_SERVICE_URL`];

        if (!recipientURL) {
            res.statusCode = 502;
            res.end(JSON.stringify({ error: 'Cannot process request' }));
            return;
        }

        const remainingPath = pathSegments.slice(1).join('/');

        const targetUrl = new URL(recipientURL);
        targetUrl.pathname = remainingPath ? `/${remainingPath}` : '/';

        Object.entries(parsedUrl.query).forEach(([key, value]) => {
            if (value) {
                targetUrl.searchParams.append(key, Array.isArray(value) ? value[0] : value.toString());
            }
        });

        const isGetProductsList =
            serviceRoute.toLowerCase() === 'product' &&
            (remainingPath === 'products' || remainingPath === 'products/') &&
            req.method === 'GET';

        if (isGetProductsList) {
            // Обрабатываем запрос с кэшированием
            await handleCachedRequest(req, res, targetUrl.toString());
        } else {
            // Перенаправляем обычный запрос
            await redirectRequest(req, res, targetUrl.toString());
        }

    } catch (error) {
        console.error('Error processing request:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
});

interface RequestOptions {
    method: string;
    headers: http.IncomingHttpHeaders;
}

/**
 * Обрабатывает запрос с кэшированием
 */
async function handleCachedRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    targetUrl: string
): Promise<void> {
    const cacheKey = getCacheKey(targetUrl, req.headers);
    const now = Date.now();
    const cachedResponse = requestCache.get(cacheKey);

    // Проверяем наличие кэша и его актуальность
    if (cachedResponse && (now - cachedResponse.timestamp) < CACHE_TTL) {
        console.log(`[Cache] Using cached response for: ${targetUrl}`);

        // Возвращаем кэшированный ответ
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-Cache', 'HIT');
        res.end(JSON.stringify(cachedResponse.data));
        return;
    }

    // Если кэш отсутствует или устарел, делаем запрос к сервису
    console.log(`[Cache] Cache miss for: ${targetUrl}`);

    const responseData = await makeRequest(targetUrl, {
        method: req.method || 'GET',
        headers: { ...req.headers }
    });

    // Кэшируем результат
    requestCache.set(cacheKey, {
        data: responseData.data,
        timestamp: now
    });

    // Отправляем ответ
    res.statusCode = responseData.statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Cache', 'MISS');
    res.end(JSON.stringify(responseData.data));
}

/**
 * Генерирует ключ для кэша
 */
function getCacheKey(url: string, headers: http.IncomingHttpHeaders): string {
    // В простейшем случае используем только URL в качестве ключа
    // В более сложных сценариях можно добавить заголовки авторизации и другие параметры
    return url;
}

/**
 * Выполняет HTTP запрос и возвращает результат
 */
async function makeRequest(
    targetUrl: string,
    options: RequestOptions
): Promise<{ statusCode: number, data: any }> {
    return new Promise((resolve, reject) => {
        const url = new URL(targetUrl);
        const request = url.protocol === 'https:' ? https.request : http.request;

        // Удаляем заголовок host, чтобы он был установлен автоматически
        delete options.headers.host;

        const proxyReq = request(targetUrl, options, (proxyRes) => {
            let responseData = '';

            proxyRes.on('data', (chunk) => {
                responseData += chunk;
            });

            proxyRes.on('end', () => {
                try {
                    const data = responseData ? JSON.parse(responseData) : null;
                    resolve({
                        statusCode: proxyRes.statusCode || 500,
                        data
                    });
                } catch (error) {
                    resolve({
                        statusCode: proxyRes.statusCode || 500,
                        data: responseData
                    });
                }
            });
        });

        proxyReq.on('error', (error) => {
            console.error('Error making request:', error);
            reject(error);
        });

        proxyReq.end();
    });
}

/**
 * Перенаправляет запрос на указанный URL и возвращает ответ
 */
async function redirectRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    targetUrl: string
): Promise<void> {
    return new Promise((resolve) => {
        const url = new URL(targetUrl);
        const protocol = url.protocol === 'https:' ? https : http;

        const options: RequestOptions = {
            method: req.method || 'GET',
            headers: { ...req.headers }
        };

        // Удаляем заголовок host, чтобы он был установлен автоматически
        delete options.headers.host;

        const proxyReq = protocol.request(targetUrl, options, (proxyRes) => {
            // Копируем статус и заголовки из ответа целевого сервиса
            res.statusCode = proxyRes.statusCode || 500;

            Object.entries(proxyRes.headers).forEach(([key, value]) => {
                if (value) {
                    res.setHeader(key, value);
                }
            });

            // Передаем данные ответа клиенту
            proxyRes.on('data', (chunk) => {
                res.write(chunk);
            });

            proxyRes.on('end', () => {
                res.end();
                resolve();
            });
        });

        // Обрабатываем ошибки
        proxyReq.on('error', (error) => {
            console.error('Error forwarding request:', error);
            res.statusCode = 502;
            res.end(JSON.stringify({ error: 'Cannot process request' }));
            resolve();
        });

        // Передаем тело запроса, если оно есть
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            req.on('data', (chunk) => {
                proxyReq.write(chunk);
            });

            req.on('end', () => {
                proxyReq.end();
            });
        } else {
            proxyReq.end();
        }
    });
}

// Запускаем сервер
server.listen(PORT, () => {
    console.log(`BFF Service запущен на порту ${PORT}`);
    console.log(`Время жизни кэша: ${CACHE_TTL / 1000} секунд`);
});

// Обрабатываем остановку сервера
process.on('SIGINT', () => {
    console.log('Останавливаем BFF Service');
    server.close(() => {
        process.exit(0);
    });
});

// Периодическая очистка устаревших кэшей
setInterval(() => {
    const now = Date.now();
    let expiredCount = 0;

    requestCache.forEach((entry, key) => {
        if ((now - entry.timestamp) > CACHE_TTL) {
            requestCache.delete(key);
            expiredCount++;
        }
    });

    if (expiredCount > 0) {
        console.log(`[Cache] Очищено ${expiredCount} устаревших кэшей. Размер кэша: ${requestCache.size}`);
    }
}, 60000); // Проверка каждую минуту