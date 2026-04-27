import http from 'http';
import https from 'https';

const SUPABASE_URL = 'fzamcjefnyjhptazoiah.supabase.co';
const SECRET_KEY = 'sb_secret_cMiPz1XvYaFsp099KDMYAQ_sB1x7f-p';
const PORT = 4001;

const server = http.createServer((req, res) => {
  console.log(`[Proxy] ${req.method} ${req.url}`);

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const options = {
    hostname: SUPABASE_URL,
    port: 443,
    path: req.url,
    method: req.method,
    headers: {
      'host': SUPABASE_URL,
      'apikey': SECRET_KEY,
      'Authorization': `Bearer ${SECRET_KEY}`,
      'Accept': '*/*',
      'Content-Type': 'application/json',
      'User-Agent': 'Node.js/18.0.0' // Explicitly set a non-browser user agent
    }
  };

  // Only pass through necessary headers if it's a POST/PATCH
  if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
    options.headers['Content-Length'] = req.headers['content-length'];
  }

  const proxyReq = https.request(options, (proxyRes) => {
    console.log(`[Supabase] ${proxyRes.statusCode}`);
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (e) => {
    console.error('Proxy error:', e);
    res.writeHead(500);
    res.end();
  });

  req.pipe(proxyReq);
});

server.listen(PORT, () => {
  console.log(`Supabase Proxy running on http://localhost:${PORT}`);
});
