import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AuthRoutes from './routes/AuthRoutes';

function App() {
  return (
    <BrowserRouter>
      <AuthRoutes />
    </BrowserRouter>
  );
}

export default App;
