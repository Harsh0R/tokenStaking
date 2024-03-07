import { useState } from 'react'
import './App.css'
import { StakeTokenProvider } from './Context/StakeTokenContext'
import Home from './Pages/Home/Home'

function App() {
  const [count, setCount] = useState(0)

  return (
    <StakeTokenProvider>
      <Home></Home>
    </StakeTokenProvider>
  )
}

export default App
