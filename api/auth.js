const crypto = require('crypto');

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Arijitboithok26';
const SECRET_KEY = process.env.SESSION_SECRET || ADMIN_PASS || 'boithok_khana_secret_key_2026';

function generateToken(username) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
        user: username,
        exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    })).toString('base64url');

    const signature = crypto
        .createHmac('sha256', SECRET_KEY)
        .update(`${header}.${payload}`)
        .digest('base64url');

    return `${header}.${payload}.${signature}`;
}

function verifyToken(token) {
    if (!token) return false;
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
    const parts = cleanToken.split('.');
    if (parts.length !== 3) return false;

    const [header, payload, signature] = parts;
    const expectedSig = crypto
        .createHmac('sha256', SECRET_KEY)
        .update(`${header}.${payload}`)
        .digest('base64url');

    if (signature !== expectedSig) return false;

    try {
        const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        if (!decoded.exp || Date.now() > decoded.exp) return false;
        return true;
    } catch (e) {
        return false;
    }
}

async function parseBody(req) {
    if (req.body) {
        if (typeof req.body === 'object') return req.body;
        if (typeof req.body === 'string') {
            try {
                return JSON.parse(req.body);
            } catch (e) {
                return {};
            }
        }
    }
    return new Promise((resolve) => {
        let body = '';
        let resolved = false;

        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            if (resolved) return;
            resolved = true;
            try {
                resolve(JSON.parse(body || '{}'));
            } catch (err) {
                resolve({});
            }
        });

        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                try {
                    resolve(JSON.parse(body || '{}'));
                } catch (e) {
                    resolve({});
                }
            }
        }, 500);
    });
}

async function handleLogin(req, res) {
    if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Method Not Allowed' }));
        return;
    }

    try {
        const { username, password } = await parseBody(req);

        if (username === ADMIN_USER && password === ADMIN_PASS) {
            const token = generateToken(username);
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Set-Cookie': `admin_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
            });
            res.end(JSON.stringify({ success: true, message: 'Login successful', token }));
        } else {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Invalid username or password' }));
        }
    } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Internal server error during login' }));
    }
}

function checkAuth(req) {
    const authHeader = req.headers['authorization'];
    if (authHeader && verifyToken(authHeader)) {
        return true;
    }

    const cookies = req.headers['cookie'];
    if (cookies) {
        const match = cookies.match(/admin_token=([^;]+)/);
        if (match && verifyToken(match[1])) {
            return true;
        }
    }

    return false;
}

module.exports = {
    handleLogin,
    checkAuth,
    verifyToken,
    generateToken,
    parseBody
};
