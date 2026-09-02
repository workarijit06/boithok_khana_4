const { getCustomers } = require('./customers');
const { checkAuth } = require('./auth');

async function handleExport(req, res) {
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

    try {
        const customers = await getCustomers();

        // UTF-8 BOM (\uFEFF) ensures Excel correctly renders UTF-8 Bengali characters and columns
        let csv = '\uFEFFID,Name,Birth Date,Phone Number,Registration Date\n';

        customers.forEach(c => {
            const dob = c.dob || c.birth_date || '';
            const reg = c.registeredAt || c.registration_date;
            const cleanId = `"${(c.id || '').replace(/"/g, '""')}"`;
            const cleanName = `"${(c.name || '').replace(/"/g, '""')}"`;
            const cleanDob = `"${(dob || '').replace(/"/g, '""')}"`;
            const cleanPhone = `="${(c.phone || '').replace(/"/g, '""')}"`;
            const regDate = reg ? `"${new Date(reg).toLocaleString('en-IN')}"` : '""';

            csv += `${cleanId},${cleanName},${cleanDob},${cleanPhone},${regDate}\n`;
        });

        res.writeHead(200, {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="boithok_khana_customers.csv"'
        });
        res.end(csv);
    } catch (err) {
        console.error('Export error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: err.message || 'Failed to export customer records from database' }));
    }
}

module.exports = handleExport;
module.exports.handleExport = handleExport;
