const { checkAuth } = require('./auth');
const { getSql, ensureTable } = require('./db');

async function handleDeleteCustomer(req, res, pathname) {
    if (!checkAuth(req)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Unauthorized access. Please login.' }));
        return;
    }

    if (req.method !== 'DELETE') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Method Not Allowed' }));
        return;
    }

    const currentPath = pathname || req.url || '';
    const id = currentPath
        .replace(/^\/api\/delete-customer\//, '')
        .replace(/^\/api\/customers\//, '')
        .split('?')[0]
        .trim();

    if (!id || id === '/api/delete-customer' || id === '/api/customers') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Customer ID is required' }));
        return;
    }

    const sql = getSql();
    if (!sql) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'DATABASE_URL environment variable is missing' }));
        return;
    }

    try {
        await ensureTable(sql);

        const result = await sql`
            DELETE FROM customers
            WHERE id = ${id}
            RETURNING id;
        `;

        if (!result || result.length === 0) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Customer record not found in database' }));
            return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Customer deleted successfully from database' }));
    } catch (err) {
        console.error('Neon DB Delete error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: err.message || 'Failed to delete customer from database' }));
    }
}

module.exports = (req, res) => handleDeleteCustomer(req, res, req.url);
module.exports.handleDeleteCustomer = handleDeleteCustomer;
