const http = require('http');
const fs = require('fs');
const path = require('path');

// Parse .env file for local development if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    try {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...val] = trimmed.split('=');
                if (key && val.length > 0 && !process.env[key.trim()]) {
                    process.env[key.trim()] = val.join('=').trim().replace(/^["']|["']$/g, '');
                }
            }
        });
    } catch (e) {
        console.error('Error loading local .env:', e);
    }
}

const { handleCustomers } = require('./api/customers');
const { handleStats } = require('./api/stats');
const { handleDeleteCustomer } = require('./api/delete-customer');
const { handleExport } = require('./api/export');
const { handleLogin } = require('./api/auth');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    let pathname = parsedUrl.pathname;

    // Route Aliases
    if (pathname === '/admin') {
        pathname = '/admin.html';
    }

    // API Routing
    if (pathname === '/api/login') {
        return handleLogin(req, res);
    }
    if (pathname === '/api/customers') {
        return handleCustomers(req, res);
    }
    if (pathname === '/api/stats') {
        return handleStats(req, res);
    }
    if (pathname.startsWith('/api/delete-customer/') || (req.method === 'DELETE' && pathname.startsWith('/api/customers/'))) {
        return handleDeleteCustomer(req, res, pathname);
    }
    if (pathname === '/api/export') {
        return handleExport(req, res);
    }

    // Static File Serving
    let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Access Denied');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
            res.end('<h1>404 Not Found</h1>');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`================================================`);
    console.log(`🚀 BOITHOK KHANA 3 Server Running on Port ${PORT}`);
    console.log(`📝 Customer Entry: http://localhost:${PORT}/customer-entry.html`);
    console.log(`🔐 Admin Page:    http://localhost:${PORT}/admin`);
    console.log(`================================================`);
});
