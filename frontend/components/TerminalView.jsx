import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const TerminalView = () => {
  const terminalRef = useRef(null);
  const [term, setTerm] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    if (!terminalRef.current || term) {
      return;
    }

    const newTerm = new Terminal();
    const fitAddon = new FitAddon();
    newTerm.loadAddon(fitAddon);
    newTerm.open(terminalRef.current);
    fitAddon.fit();
    setTerm(newTerm);

    return () => {
      newTerm.dispose();
    };
  }, [term]);

  const createNewShell = async () => {
    try {
      const res = await fetch('/api/session', { method: 'POST' });
      const data = await res.json();
      setSessionId(data.sessionId);
    } catch (error) {
      console.error('Error creating new shell:', error);
    }
  };

  useEffect(() => {
    if (!sessionId || !term) {
      return;
    }

    const ws = new WebSocket(`ws://${window.location.hostname}:4000/term?sessionId=${sessionId}`);

    ws.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.onmessage = event => {
      const message = JSON.parse(event.data);
      if (message.type === 'data') {
        term.write(message.data);
      }
    };

    ws.onerror = error => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    term.onData(data => {
      ws.send(JSON.stringify({ type: 'input', data }));
    });

    return () => {
      ws.close();
    };
  }, [sessionId, term]);

  return (
    <div>
      <button onClick={createNewShell}>New Shell</button>
      <div ref={terminalRef} style={{ height: '100vh', width: '100vw' }} />
    </div>
  );
};

export default TerminalView;
