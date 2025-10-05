import { useState } from 'react'
import './App.css'
import { DebateContainer } from './components/DebateContainer'
import Debate from './debate'

function App() {
  const [showNewDebate, setShowNewDebate] = useState<boolean>(false);

  return (
    <>
      {showNewDebate ? (
        <DebateContainer />
      ) : (
        <div className="m-0 p-0 w-full min-h-screen">
          <div className="p-4">
            <button 
              onClick={() => setShowNewDebate(true)}
              className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Switch to New Debate Interface
            </button>
          </div>
          <Debate />
        </div>
      )}
    </>
  )
}

export default App