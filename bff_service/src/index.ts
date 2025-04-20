import * as http from 'http';
import * as url from 'url';
import * as https from 'https';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const PORT = process.env.PORT || 3000;

/*
*   --== Cache ==--
*/
interface CacheData {
    statusCode: number;
    headers: http.IncomingHttpHeaders;
    body: any;
} 
interface CacheEntry {
    data: CacheData;
    timestamp: number;
}

const CACHE_TTL = 2 * 60 * 1000;

const isCacheble = (method: string, service: string): boolean => {
    // Only GET requests to the 'products' route are cacheable
    return method == 'GET' && service === 'products';
};

const requestsCache = new Map<string, CacheEntry>();

const getCache = (key: string): CacheData | undefined => {
    const entry = requestsCache.get(key);
    if (!entry) return undefined;

    const now = Date.now();
    if (now - entry.timestamp > CACHE_TTL) {
        requestsCache.delete(key);
        return undefined;
    }

    return entry.data;
};


/*
* --== HTTP server ==--
*/
const server = http.createServer(async (req, res) => {
    try {
        if (!req.url) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid request' }));
            return;
        }

        const parsedUrl = url.parse(req.url, true);
        const pathSegments = parsedUrl.pathname?.split('/').filter(Boolean) || [];
        const service = pathSegments[0];

        if (!service) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Recipient service name is required' }));
            return;
        }

        const recipientURL = process.env[`${service.toUpperCase()}_SERVICE_URL`];

        if (!recipientURL) {
            res.statusCode = 502;
            res.end(JSON.stringify({ error: 'Cannot process request' }));
            return;
        }

        const remainingPath = pathSegments.slice(1).join('/');

        const targetUrl = new URL(recipientURL);
        targetUrl.pathname += remainingPath ? `/${remainingPath}` : '/';

        Object.entries(parsedUrl.query).forEach(([key, value]) => {
            if (value) {
                if (Array.isArray(value)) {
                    value.forEach(item => {
                        targetUrl.searchParams.append(key, item);
                    });
                } else {
                    targetUrl.searchParams.append(key, value.toString());
                }
            }
        });

        const cachedResponse: CacheData | undefined = getCache(targetUrl.toString());
        if (cachedResponse) {
            res.writeHead(
                cachedResponse.statusCode, 
                { ...cachedResponse.headers, 'X-App-Cache': 'HIT' }
            );
            // res.end(JSON.stringify(cachedResponse.body));
            res.end(cachedResponse.body);
            return;
        }

        const isHttps = targetUrl.protocol === 'https:';

        const options = {
            method: req.method || 'GET',
            headers: { 
                ...req.headers,
                ...(isHttps
                    ? {
                        'X-Forwarded-Proto': 'https',
                        'X-Forwarded-Port': '443',
                        'X-Forwarded-For': req.socket.remoteAddress,
                    }
                    : {}),
            }
        }

        const request = targetUrl.protocol === 'https:' ? https.request : http.request;

        delete options.headers.host;

        const proxyReq = request(targetUrl, options, (proxyRes) => {
            const responseHeaders = { ...proxyRes.headers, 'X-App-Cache': 'MISS' };

            if (isCacheble(req.method || 'GET', service)) {
                let responseBody = Buffer.from([]);

                proxyRes.on('data', (chunk) => {
                    responseBody = Buffer.concat([responseBody, chunk]);
                });

                proxyRes.on('end', () => {
                    if (proxyRes.statusCode && proxyRes.statusCode >= 200 && proxyRes.statusCode < 300) {
                        requestsCache.set(targetUrl.toString(), {
                            data: {
                                statusCode: proxyRes.statusCode,
                                headers: proxyRes.headers,
                                body: responseBody
                            },
                            timestamp: Date.now()
                        });
                    }
                });

            }

            res.writeHead(proxyRes.statusCode || 200, responseHeaders);

            proxyRes.pipe(res);
        });

        proxyReq.on('error', (err) => {
            console.error('Error making request:', err);
            res.writeHead(500);
            res.end('BFF error: ' + err.message);
        });

        req.pipe(proxyReq);

    } catch (error) {
        console.error('Error processing request:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
});


// Start the server
server.listen(PORT, () => {
    console.log(`BFF Service запущен на порту ${PORT}`);
    console.log(`Время жизни кэша: ${CACHE_TTL / 1000} секунд`);
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
    console.log('Останавливаем BFF Service');
    server.close(() => {
        process.exit(0);
    });
});

// Cache cleanup
setInterval(() => {
    const now = Date.now();
    let expiredCount = 0;

    requestsCache.forEach((entry, key) => {
        if ((now - entry.timestamp) > CACHE_TTL) {
            requestsCache.delete(key);
            expiredCount++;
        }
    });

    if (expiredCount > 0) {
        console.log(`[Cache] Очищено ${expiredCount} устаревших кэшей. Размер кэша: ${requestsCache.size}`);
    }
}, 2*60*1000);
