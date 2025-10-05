import { useState } from 'react'
import './App.css'
import { Input } from './components/ui/input'
import { Button } from "@/components/ui/button"
import Debate from './debate'


function App() {
  const [prompt, setPrompt] = useState<string>("");


  const handleButtonClick = () => {
    if (!prompt || prompt.trim() === "") {
      alert("Please enter something first!");
      return;
    }

    else{
      // handle API
      console.log(prompt);
    }

  }


  return (
    <>
     <div className="m-0 p-0 w-full min-h-screen">
      <div className="sticky top-0 z-50 bg-white p-4 border-b border-gray-200 shadow-sm w-full m-0">
        <p className="mb-4 mt-0">
          Enter in a topic on your mind, our AI agents will use your scanned articles and videos to give you nothing but the facts.
        </p>
        <div className="flex w-full max-w-sm items-center gap-2">
          <Input 
            type="text" 
            placeholder="Whats on your mind?" 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <Button 
            type="button" 
            variant="outline"
            onClick={handleButtonClick}
          >
            Enter
          </Button>
        </div>
      </div>
      <Debate />
      </div>
    </>
  )
}

export default App
