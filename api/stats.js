const { checkAuth } = require('./auth');
const { getSql, ensureTable } = require('./db');

async function handleStats(req, res) {
    if (!checkAuth(req)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Unauthorized access. Please login.' }));
        return;
    }

    if (req.method !== 'GET') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Method Not Allowed' }));
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

        const rows = await sql`
            SELECT
                COUNT(*)::int AS "totalCustomers",
                COUNT(CASE WHEN (registration_date AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date THEN 1 END)::int AS "todayRegistrations",
                COUNT(CASE WHEN EXTRACT(MONTH FROM birth_date) = EXTRACT(MONTH FROM (NOW() AT TIME ZONE 'Asia/Kolkata')) THEN 1 END)::int AS "birthdaysThisMonth"
            FROM customers;
        `;

        const statRow = rows[0] || { totalCustomers: 0, todayRegistrations: 0, birthdaysThisMonth: 0 };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            stats: {
                totalCustomers: parseInt(statRow.totalCustomers || 0, 10),
                todayRegistrations: parseInt(statRow.todayRegistrations || 0, 10),
                birthdaysThisMonth: parseInt(statRow.birthdaysThisMonth || 0, 10)
            }
        }));
    } catch (err) {
        console.error('Stats computation error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: err.message || 'Failed to compute stats from database' }));
    }
}

module.exports = handleStats;
module.exports.handleStats = handleStats;
