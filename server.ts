import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs/promises';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const examplesPath = path.resolve(process.cwd(), 'src/data/examples.json');

  // API routes
  app.get('/api/examples', async (req, res) => {
    try {
      const data = await fs.readFile(examplesPath, 'utf-8');
      res.json(JSON.parse(data));
    } catch (error) {
      console.error('Error reading examples:', error);
      res.status(500).json({ error: 'Failed to read examples' });
    }
  });

  app.post('/api/examples', async (req, res) => {
    try {
      const newExample = req.body;
      const data = await fs.readFile(examplesPath, 'utf-8');
      const examples = JSON.parse(data);
      
      examples.push(newExample);
      
      await fs.writeFile(examplesPath, JSON.stringify(examples, null, 2));
      res.status(201).json(newExample);
    } catch (error) {
      console.error('Error saving example:', error);
      res.status(500).json({ error: 'Failed to save example' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
