const { checkAuth, parseBody } = require('./auth');
const { getSql, ensureTable } = require('./db');
const crypto = require('crypto');

function generateCustomerId() {
    const hex = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `CUST-${hex}`;
}

function formatDateStr(val) {
    if (!val) return '';
    if (typeof val === 'string') return val.split('T')[0];
    if (val instanceof Date) return val.toISOString().split('T')[0];
    return String(val).split('T')[0];
}

async function fetchAllCustomers() {
    const sql = getSql();
    if (!sql) {
        throw new Error('DATABASE_URL environment variable is missing');
    }
    await ensureTable(sql);

    const rows = await sql`
        SELECT
            id,
            name,
            birth_date,
            phone,
            registration_date
        FROM customers
        ORDER BY registration_date DESC;
    `;

    return rows.map(r => ({
        id: r.id,
        name: r.name,
        birth_date: formatDateStr(r.birth_date),
        dob: formatDateStr(r.birth_date),
        phone: r.phone,
        registration_date: r.registration_date,
        registeredAt: r.registration_date
    }));
}

async function handleCustomers(req, res) {
    // GET CUSTOMERS (Protected - Admin only)
    if (req.method === 'GET') {
        if (!checkAuth(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Unauthorized access. Please login.' }));
            return;
        }

        try {
            const customers = await fetchAllCustomers();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, count: customers.length, data: customers }));
        } catch (error) {
            console.error('Fetch customers error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: error.message || 'Failed to fetch customers from database' }));
        }
        return;
    }

    // ADD CUSTOMER (Public - Customer Registration)
    if (req.method === 'POST') {
        try {
            const body = await parseBody(req);
            const { name, dob, phone } = body;

            if (!name || !dob || !phone) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Name, birth date and phone number are required.' }));
                return;
            }

            const cleanName = String(name).trim();
            const cleanDob = String(dob).trim();
            const cleanPhone = String(phone).trim();

            if (!cleanName || cleanName.length > 100) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Please provide a valid name.' }));
                return;
            }

            if (!cleanDob || isNaN(Date.parse(cleanDob))) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Please provide a valid birth date.' }));
                return;
            }

            if (!cleanPhone || cleanPhone.length < 7 || cleanPhone.length > 20) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Please provide a valid phone number.' }));
                return;
            }

            const sql = getSql();
            if (!sql) {
                console.error('DATABASE_URL environment variable is missing');
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'DATABASE_URL environment variable is missing' }));
                return;
            }

            await ensureTable(sql);

            const custId = generateCustomerId();

            const result = await sql`
                INSERT INTO customers
                    (id, name, birth_date, phone)
                VALUES
                    (${custId}, ${cleanName}, ${cleanDob}, ${cleanPhone})
                RETURNING
                    id,
                    name,
                    birth_date,
                    phone,
                    registration_date;
            `;

            if (!result || result.length === 0) {
                throw new Error('Database insert returned no records.');
            }

            const inserted = result[0];
            const formattedCustomer = {
                id: inserted.id,
                name: inserted.name,
                birth_date: formatDateStr(inserted.birth_date),
                dob: formatDateStr(inserted.birth_date),
                phone: inserted.phone,
                registration_date: inserted.registration_date,
                registeredAt: inserted.registration_date
            };

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Customer registered successfully',
                customer: formattedCustomer
            }));
        } catch (error) {
            console.error('Insert customer error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: error.message || 'Failed to save customer record to database' }));
        }
        return;
    }

    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, message: 'Method not allowed' }));
}

module.exports = handleCustomers;
module.exports.handleCustomers = handleCustomers;
module.exports.getCustomers = fetchAllCustomers;
