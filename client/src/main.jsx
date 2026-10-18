import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CartProvider } from './lib/cart';
import { SearchProvider } from './lib/search';
import './styles/main.css';
createRoot(document.getElementById('root')).render(
  <BrowserRouter><CartProvider><SearchProvider><App /></SearchProvider></CartProvider></BrowserRouter>
);
