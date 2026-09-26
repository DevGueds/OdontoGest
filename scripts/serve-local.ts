// Single-process local use, serving the compiled frontend and API at the requested address.
process.env.PORT = '3000';
process.env.HOST = '127.0.0.1';
await import('../src/server/server.js');
