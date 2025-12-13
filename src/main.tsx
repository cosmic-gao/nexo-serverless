import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Functions from './pages/Functions'
import FunctionEditor from './pages/FunctionEditor'
import AICodeGenerator from './pages/AICodeGenerator'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="functions" element={<Functions />} />
          <Route path="functions/new" element={<FunctionEditor />} />
          <Route path="functions/:id" element={<FunctionEditor />} />
          <Route path="ai-generator" element={<AICodeGenerator />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
