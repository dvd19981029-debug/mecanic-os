const https = require('https');

/**
 * Realiza una petición HTTPS utilizando el módulo nativo de Node.js con Promesas.
 * @param {string} url - URL de destino.
 * @param {string} method - Método HTTP (GET, POST, etc).
 * @param {object} headers - Cabeceras de la petición.
 * @param {string|null} body - Cuerpo de la petición (JSON stringificado).
 * @returns {Promise<{statusCode: number, body: string}>}
 */
function makeWompiRequest(url, method, headers, body) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const options = {
            method: method,
            hostname: u.hostname,
            path: u.pathname + u.search,
            headers: headers
        };
        const req = https.request(options, (res) => {
            let resBody = '';
            res.on('data', chunk => resBody += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    body: resBody
                });
            });
        });
        req.on('error', err => reject(err));
        if (body) {
            req.write(body);
        }
        req.end();
    });
}

module.exports = {
    makeWompiRequest
};
