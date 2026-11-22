import dotenv from 'dotenv';
import { createApp } from './Backend/src/app.ts';
import { initDatabase } from './Backend/src/config/dbBootstrap.ts';

dotenv.config({ quiet: true });

const PORT = process.env.PORT || 3001;

initDatabase();
const app = createApp();

app.listen(Number(PORT) || 3001, '0.0.0.0', () => {
  console.log(`  ➜  API Server: http://localhost:${PORT}/`);

  const KEEP_ALIVE_INTERVAL_MS = 10 * 60 * 1000;
  setInterval(() => {
    const apiHost = process.env.VITE_API_URL || process.env.API_URL || `http://127.0.0.1:${PORT}`;
    const targetUrl = `${apiHost.replace(/\/$/, '')}/api/health`;
    fetch(targetUrl)
      .then((res) => {
        if (res.ok) console.log(`  ➜  Keep-Alive Heartbeat: Active (${new Date().toLocaleTimeString()})`);
      })
      .catch(() => { });
  }, KEEP_ALIVE_INTERVAL_MS);
});
