import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [generatedWord, setGeneratedWord] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [currentGuess, setCurrentGuess] = useState(Array(5).fill(""));
  const [guesses, setGuesses] = useState(Array(6).fill().map(() => Array(5).fill("")));
  const [guessColors, setGuessColors] = useState(Array(6).fill().map(() => Array(5).fill("#ffffff")));
  const [activeRow, setActiveRow] = useState(0);
  const [letterStatus, setLetterStatus] = useState({});
  const [showCheck, setShowCheck] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState("playing"); // "playing", "won", "lost"

  // Fetch a random word
  const fetchRandomWord = async () => {
    try {
      const response = await fetch("https://random-word-api.herokuapp.com/word?length=5");
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const data = await response.json();
      const word = data[0].toUpperCase();
      setGeneratedWord(word);
      console.log("Generated word:", word);
      resetGame();
      setGameStarted(true);
      alert("Your word has been generated!!");
    } catch (error) {
      console.error("Error:", error.message);
    }
  };

  // Reset game state
  const resetGame = () => {
    setAttempts(0);
    setGuesses(Array(6).fill().map(() => Array(5).fill("")));
    setGuessColors(Array(6).fill().map(() => Array(5).fill("#ffffff")));
    setActiveRow(0);
    setLetterStatus({});
    setShowCheck(false);
    setGameState("playing");
  };

  // Add letter to the current guess
  const addLetter = (letter) => {
    if (gameState !== "playing" || !gameStarted) return;
    
    const newGuess = [...currentGuess];
    for (let i = 0; i < newGuess.length; i++) {
      if (newGuess[i] === "") {
        newGuess[i] = letter.toUpperCase();
        break;
      }
    }
    
    setCurrentGuess(newGuess);
    updateGuesses(newGuess);
    
    // Check if row is filled to show check button
    if (!newGuess.includes("")) {
      setShowCheck(true);
    }
  };

  // Update guesses array with current guess
  const updateGuesses = (newGuess) => {
    const newGuesses = [...guesses];
    newGuesses[activeRow] = newGuess;
    setGuesses(newGuesses);
  };

  // Clear current row
  const clearRow = () => {
    if (gameState !== "playing" || !gameStarted) return;
    
    const newGuess = Array(5).fill("");
    setCurrentGuess(newGuess);
    updateGuesses(newGuess);
    setShowCheck(false);
  };

  // Check the current word
  const checkWord = async () => {
    if (gameState !== "playing" || !gameStarted) return;
    
    const word = currentGuess.join("");
    
    // Check if word exists in dictionary
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
      if (!response.ok) {
        alert("Not a valid word");
        return;
      }
      
      // Word is valid, proceed with checking
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      let greenCount = 0;
      const newColors = [...guessColors];
      const newLetterStatus = { ...letterStatus };
      
      // Check letters against generated word
      for (let i = 0; i < word.length; i++) {
        setTimeout(() => {
          if (word[i] === generatedWord[i]) {
            // Correct letter in correct position - turn box green
            newColors[activeRow][i] = "#28a745";
            newLetterStatus[word[i]] = "correct";
            greenCount++;
          } else if (generatedWord.includes(word[i])) {
            // Letter is present but in wrong position - turn box yellow
            newColors[activeRow][i] = "yellow";
            if (newLetterStatus[word[i]] !== "correct") {
              newLetterStatus[word[i]] = "present";
            }
          } else {
            // Letter is not present - turn box grey
            newColors[activeRow][i] = "grey";
            if (!newLetterStatus[word[i]]) {
              newLetterStatus[word[i]] = "absent";
            }
          }
          
          setGuessColors([...newColors]);
          setLetterStatus({ ...newLetterStatus });
          
          // Check win condition
          if (greenCount === 5) {
            setTimeout(() => {
              setGameState("won");
              alert("Congratulations! You Won!!!");
              alert("New Game will start. Best of Luck");
              fetchRandomWord();
            }, 1000);
          }
        }, i * 500);
      }
      
      // Move to next row or end game if max attempts reached
      if (newAttempts === 6 && greenCount !== 5) {
        setTimeout(() => {
          setGameState("lost");
          alert(`Oops! Maximum attempts reached. The word was ${generatedWord}`);
          fetchRandomWord();
        }, 3000);
      } else if (greenCount !== 5) {
        setTimeout(() => {
          setActiveRow(activeRow + 1);
          setCurrentGuess(Array(5).fill(""));
          setShowCheck(false);
        }, 2500);
      }
      
    } catch (error) {
      console.error("Error checking word:", error);
    }
  };

  // Get keyboard button color based on letter status
  const getKeyboardButtonColor = (letter) => {
    if (!letterStatus[letter]) return "#007bff";
    
    switch (letterStatus[letter]) {
      case "correct":
        return "#28a745";
      case "present":
        return "yellow";
      case "absent":
        return "grey";
      default:
        return "#007bff";
    }
  };

  // Generate the alphabet buttons
  const renderAlphabet = () => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    return (
      <div className="alphabet-container">
        {alphabet.map((letter) => (
          <button
            key={letter}
            onClick={() => addLetter(letter)}
            className="alphabet-btn"
            style={{ backgroundColor: getKeyboardButtonColor(letter) }}
            disabled={gameState !== "playing" || !gameStarted}
          >
            {letter}
          </button>
        ))}
      </div>
    );
  };

  // Render game grid
  const renderGrid = () => {
    return (
      <div className="grid">
        {guesses.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="row">
            {row.map((letter, colIndex) => (
              <div
                key={`box-${rowIndex}-${colIndex}`}
                className="box"
                style={{ backgroundColor: guessColors[rowIndex][colIndex] }}
              >
                {letter}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="App">
      <button 
        id="new-word" 
        onClick={fetchRandomWord}
        className="new-word-btn"
      >
        {gameStarted ? "New Word" : "Start Game"}
      </button>
      
      <div className="container">
        <h2>Wordle</h2>
        <h4>Get 6 chances to guess a 5-letter word.</h4>
        
        {renderGrid()}
        
        {showCheck && (
          <button
            className="check-btn"
            onClick={checkWord}
          >
            Check
          </button>
        )}
        
        {gameStarted && gameState === "playing" && (
          <button
            className="clear-btn"
            onClick={clearRow}
            style={{ marginTop: "10px", backgroundColor: "#dc3545" }}
          >
            Clear Row
          </button>
        )}
        {renderAlphabet()}
      </div>
    </div>
  );
}

export default App;