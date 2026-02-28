import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`\n🚀 Medicine Dispenser API started`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://172.20.164.180:${PORT}`);
    console.log(`   Health:  http://localhost:${PORT}/api/health\n`);
});
