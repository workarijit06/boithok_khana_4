const { neon } = require('@neondatabase/serverless');

function getSql() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('DATABASE_URL environment variable is missing');
        return null;
    }
    try {
        return neon(dbUrl);
    } catch (err) {
        console.error('Neon DB connection initialization error:', err);
        return null;
    }
}

async function ensureTable(sql) {
    if (!sql) return;
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS customers (
                id VARCHAR(50) PRIMARY KEY,
                name TEXT NOT NULL,
                birth_date DATE NOT NULL,
                phone VARCHAR(20) NOT NULL,
                registration_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `;
        await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS id VARCHAR(50);`;
        await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS name TEXT;`;
        await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS birth_date DATE;`;
        await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone VARCHAR(20);`;
        await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS registration_date TIMESTAMPTZ DEFAULT NOW();`;
    } catch (err) {
        console.error('Error ensuring customers table exists:', err);
        throw err;
    }
}

module.exports = {
    getSql,
    ensureTable
};
