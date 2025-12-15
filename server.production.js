import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Serve static files from dist/public
app.use(express.static(join(__dirname, 'dist', 'public')));

// Import your server
await import('./dist/index.js');