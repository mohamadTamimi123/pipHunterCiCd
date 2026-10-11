import app from './app';
import { config } from './config';
import { initDb } from './db';
import { seed } from './db/seed';
import { startRulesEngine } from './services/challenges';
import { connectRedis } from './services/redis';

async function main() {
    await initDb();
    await connectRedis();
    await seed();
    if (process.env.RULES_ENGINE !== 'false') await startRulesEngine();

    app.listen(config.port, () => {
        console.log(`PipHunter API listening on port ${config.port} (${config.env})`);
    });
}

main().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
