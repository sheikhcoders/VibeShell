const express = require('express');
const http = require('http');
const expressWs = require('express-ws');
const pty = require('node-pty');

const app = express();
const server = http.createServer(app);
const wss = expressWs(app, server);

const terminals = {};

app.post('/api/session', (req, res) => {
  const term = pty.spawn(process.platform === 'win32' ? 'powershell.exe' : 'bash', [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env
  });

  const sessionId = term.pid.toString();
  terminals[sessionId] = term;

  console.log(`New session created with ID: ${sessionId}`);
  res.send({ sessionId });

  term.on('exit', () => {
    delete terminals[sessionId];
    console.log(`Session ${sessionId} closed.`);
  });
});

app.ws('/term', (ws, req) => {
  const sessionId = req.query.sessionId;
  const term = terminals[sessionId];

  if (!term) {
    ws.send(JSON.stringify({ type: 'error', data: 'Session not found' }));
    ws.close();
    return;
  }

  term.onData(data => {
    try {
      ws.send(JSON.stringify({ type: 'data', data }));
    } catch (e) {
      console.error(e);
    }
  });

  ws.on('message', msg => {
    const message = JSON.parse(msg);
    if (message.type === 'input') {
      term.write(message.data);
    }
  });

  ws.on('close', () => {
    term.kill();
  });
});

const port = process.env.PORT || 4000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
