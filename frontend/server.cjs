const http = require('http');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');

const PORT = parseInt(process.env.X_ZOHO_CATALYST_LISTEN_PORT || '9001', 10);
const STATIC_DIR = path.join(__dirname, 'dist', 'client');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

async function startServer() {
  const handlerModule = await import('./dist/server/server.js');
  const fetchHandler = handlerModule.default.fetch;

  const server = http.createServer(async (req, res) => {
    try {
      // 1. Check if it's a static file request
      const urlPath = (req.url || '/').split('?')[0];
      const safePath = path.normalize(urlPath);
      const filePath = path.join(STATIC_DIR, safePath);
      
      if (urlPath !== '/' && filePath.startsWith(STATIC_DIR)) {
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
          fs.createReadStream(filePath).pipe(res);
          return;
        }
      }

      // 2. Otherwise pass to TanStack Start fetch handler
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host || 'localhost';
      const url = new URL(req.url, `${protocol}://${host}`);

      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (Array.isArray(value)) {
          value.forEach(v => headers.append(key, v));
        } else if (value) {
          headers.append(key, value);
        }
      }

      let body = undefined;
      if (!['GET', 'HEAD'].includes(req.method)) {
        body = new ReadableStream({
          start(controller) {
            req.on('data', chunk => controller.enqueue(chunk));
            req.on('end', () => controller.close());
            req.on('error', err => controller.error(err));
          }
        });
      }

      const webReq = new Request(url.href, {
        method: req.method,
        headers,
        body,
        duplex: 'half'
      });

      const webRes = await fetchHandler(webReq, process.env, { req, res });

      // Convert Web Response back to Node Response
      res.statusCode = webRes.status;
      webRes.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      if (webRes.body) {
        const stream = Readable.fromWeb(webRes.body);
        stream.pipe(res);
      } else {
        res.end();
      }

    } catch (err) {
      console.error("Server Error:", err);
      res.writeHead(500);
      res.end("Internal Server Error");
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
