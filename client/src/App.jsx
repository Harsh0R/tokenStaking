import { useState } from 'react'
import './App.css'
import { StakeTokenProvider } from './Context/StakeTokenContext'
import Home from './Pages/Home/Home'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Admin from './Pages/Admin/Admin';

function App() {

  return (
    <StakeTokenProvider>
      <Router>
          <Routes>
            <Route exact path="/" element={<Home />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Router>
    </StakeTokenProvider>
  )
}

export default App
