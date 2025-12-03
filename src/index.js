import React from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0fdf4', color: '#166534', fontFamily: 'sans-serif' }}>
      <h1>✅ O Sistema está a funcionar!</h1>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
