import React from 'react';
import { BrowserRouter as Router, Routes, Route, BrowserRouter } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ResumeList from './components/resumelist';
import JobFormStep1 from './components/JobFormStep1';

ReactDOM.createRoot(document.getElementById('root')).render(

    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/resumes" element={<ResumeList />} />
        <Route path="/jobform" element={<JobFormStep1 />} />
      </Routes>
    </BrowserRouter>

);