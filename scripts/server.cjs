const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.resolve(__dirname, '..');

const MIME = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.csv': 'text/csv; charset=UTF-8',
  '.tsv': 'text/tab-separated-values; charset=UTF-8',
  '.xml': 'application/xml',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel'
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  let reqUrl = (req.url || '/').split('?')[0];
  let reqPath = '/';
  try {
    reqPath = decodeURI(reqUrl);
  } catch (e) {
    reqPath = reqUrl;
  }
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  let filePath = path.join(ROOT_DIR, reqPath);

  // Guard against path traversal
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Friendly URL fallback (e.g. /control -> /control.html)
      const altHtml = filePath + '.html';
      if (fs.existsSync(altHtml) && fs.statSync(altHtml).isFile()) {
        filePath = altHtml;
      } else {
        const notFoundPath = path.join(ROOT_DIR, '404.html');
        if (fs.existsSync(notFoundPath)) {
          res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
          return fs.createReadStream(notFoundPath).pipe(res);
        }
        res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
        return res.end(`
          <!DOCTYPE html>
          <html>
          <head><title>404 - Not Found</title></head>
          <body style="font-family:sans-serif;background:#060f1e;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
            <div style="text-align:center;">
              <h1 style="color:#f59e0b;font-size:48px;margin-bottom:8px;">404</h1>
              <p style="color:#94a3b8;margin-bottom:20px;">Page or file not found.</p>
              <a href="/" style="color:#06b6d4;text-decoration:none;font-weight:bold;">← Return to Portal</a>
            </div>
          </body>
          </html>
        `);
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.on('error', (streamErr) => {
      console.warn('File stream warning:', streamErr.message);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Error');
      }
    });
    req.on('close', () => {
      stream.destroy();
    });
    stream.pipe(res);
  });
});

server.on('error', (err) => {
  console.error('Server error:', err.message);
});

process.on('uncaughtException', (err) => {
  console.warn('Handled uncaught exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.warn('Handled unhandled rejection:', reason);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 INNOVATION HACKS PORTAL RUNNING`);
  console.log(`🌐 Public Portal:   http://localhost:${PORT}/`);
  console.log(`📊 Admin Panel:     http://localhost:${PORT}/control.html`);
  console.log(`🏆 Winners Portal:  http://localhost:${PORT}/winner.html`);
  console.log(`⚖️ Judges Portal:   http://localhost:${PORT}/judges.html`);
  console.log(`=======================================================`);
});
