import React, { useState, useEffect } from "react";
import { io } from "socket.io-client"; // use Socket.IO Client to connect to the backend.
import axios from "axios";
import { SERVER_URL } from "../lib/constants";

const BingoGame = ({ employee }) => {
  // 🔐 State: validation, card, and game status
  const [isValidated, setIsValidated] = useState(false);
  const [card, setCard] = useState(null);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [currentBall, setCurrentBall] = useState(null);
  const [hasWon, setHasWon] = useState(false);
  const [gamePattern, setGamePattern] = useState("");
  const [savedPattern, setSavedPattern] = useState("");
  const [winningCells, setWinningCells] = useState([]);
  const [socket, setSocket] = useState(null);
  // const [winnerId, setWinnerId] = useState(null);
  const [showNoBallsModal, setShowNoBallsModal] = useState(false);

  //Connects to the backend WebSocket server on mount.
  useEffect(() => {
    const newSocket = io(SERVER_URL); // auto-connects
    //Saves the socket instance in state.
    setSocket(newSocket);

    // On cleanup or on unmount, it disconnects cleanly.
    return () => newSocket.disconnect();
  }, []);

  //All user from player to admin receives the updated called number
  useEffect(() => {
    if (!socket) return;

    //Whenever the server emits update-called-numbers, the client:
    socket.on("update-called-numbers", (numbers) => {
      //Updates calledNumbers state.
      setCalledNumbers(numbers);
      //Sets the newest currentBall
      setCurrentBall(numbers[numbers.length - 1] || null);
      //Calls checkWin() to see if the user wins.
      // checkWin(numbers); // ✅ await now valid
    });

    // ✅ NEW: Listen for pattern update
    socket.on("update-pattern", (pattern) => {
      console.log("📡 Received updated pattern from server:", pattern);
      setSavedPattern(pattern);
      setGamePattern(pattern); // sync dropdown
    });

    // socket.on("game-winner", (winner) => {
    //   console.log("🎉 Winner declared:", winner);
    //   setWinnerId(winner);
    // });

    return () => {
      socket.off("update-called-numbers");
      socket.off("update-pattern"); // clean up
      // socket.off("game-winner");
    };
  }, [socket]);

  //Sync pattern to admin dropdown
  useEffect(() => {
    if (employee?.EMPLOYEEID === "CMXBINGOADMIN" && savedPattern) {
      setGamePattern(savedPattern);
      console.log(
        "🟢 Synced gamePattern dropdown to savedPattern:",
        savedPattern,
      );
    }
  }, [savedPattern, employee]);

  // 🔁 Re-check win if pattern changes and numbers are already present
  // useEffect(() => {
  //   if (calledNumbers.length > 0 && savedPattern) {
  //     console.log("🔁 Re-checking win after pattern change...");
  //     checkWin(calledNumbers);
  //   }
  // }, [savedPattern]);

  // const fetchWinner = async () => {
  //   try {
  //     const res = await axios.get(`${SERVER_URL}/api/getWinner`);
  //     if (res.data.winnerId) {
  //       setWinnerId(res.data.winnerId);
  //     }
  //   } catch (e) {
  //     console.error("❌ Failed to fetch winner:", e);
  //   }
  // };

  // fetchWinner();

  // 🧠 Seeded RNG for deterministic cards
  const mulberry32 = (a) => {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // 🎴 Card Generator
  const generateBingoCard = (empId) => {
    const seed = parseInt(empId.replace(/\D/g, ""), 10);
    const rng = mulberry32(seed);

    const ranges = {
      B: [1, 15],
      I: [16, 30],
      N: [31, 45],
      G: [46, 60],
      O: [61, 75],
    };

    const card = {};
    Object.entries(ranges).forEach(([letter, [min, max]]) => {
      const nums = Array.from({ length: max - min + 1 }, (_, i) => i + min);
      nums.sort(() => rng() - 0.5);
      card[letter] = nums.slice(0, 5);
    });

    card.N[2] = "FREE";
    return card;
  };

  // 🧩 Pattern Checker
  // const checkWin = (called) => {
  //   if (hasWon || winnerId) return; // 🛑 Already won by anyone? Don’t check

  //   // ⛔ Prevent ADMIN from being marked as winner
  //   if (employee?.EMPLOYEEID === "CMXBINGOADMIN") return;

  //   const letters = ["B", "I", "N", "G", "O"];
  //   const isCalled = (letter, row) => {
  //     const value = card[letter][row];
  //     return value === "FREE" || called.includes(`${letter}${value}`);
  //   };

  //   const winPatterns = {
  //     "forward-slash": () => {
  //       const cells1 = [];
  //       const cells2 = [];
  //       let forwardWin = true;
  //       let backwardWin = true;

  //       // Check forward slash (bottom-left to top-right)
  //       for (let i = 0; i < 5; i++) {
  //         const l = letters[i];
  //         const r = 4 - i;
  //         if (!isCalled(l, r)) forwardWin = false;
  //         else cells1.push({ letter: l, row: r });
  //       }

  //       // Check backslash (top-left to bottom-right)
  //       for (let i = 0; i < 5; i++) {
  //         const l = letters[i];
  //         const r = i;
  //         if (!isCalled(l, r)) backwardWin = false;
  //         else cells2.push({ letter: l, row: r });
  //       }

  //       if (forwardWin) {
  //         setWinningCells(cells1);
  //         return true;
  //       } else if (backwardWin) {
  //         setWinningCells(cells2);
  //         return true;
  //       }

  //       return false;
  //     },

  //     "tic-tac-toe": () => {
  //       const cells = [
  //         { letter: "B", row: 0 },
  //         { letter: "N", row: 0 },
  //         { letter: "O", row: 0 },
  //         { letter: "B", row: 2 },
  //         { letter: "O", row: 2 },
  //         { letter: "B", row: 4 },
  //         { letter: "N", row: 4 },
  //         { letter: "O", row: 4 },
  //       ];

  //       const isPatternComplete = cells.every(({ letter, row }) =>
  //         isCalled(letter, row),
  //       );

  //       if (isPatternComplete) {
  //         setWinningCells(cells);
  //         return true;
  //       }

  //       return false;
  //     },

  //     plus: () => {
  //       const cells = [];
  //       const rowIndex = 2;
  //       const colIndex = 2;
  //       const rowFilled = letters.every((l) => {
  //         const valid = isCalled(l, rowIndex);
  //         if (valid) cells.push({ letter: l, row: rowIndex });
  //         return valid;
  //       });
  //       const colFilled = [0, 1, 2, 3, 4].every((r) => {
  //         const l = letters[colIndex];
  //         const valid = isCalled(l, r);
  //         if (valid) cells.push({ letter: l, row: r });
  //         return valid;
  //       });
  //       if (rowFilled && colFilled) {
  //         setWinningCells(cells);
  //         return true;
  //       }
  //       return false;
  //     },
  //     corners: () => {
  //       const corners = [
  //         { letter: "B", row: 0 },
  //         { letter: "O", row: 0 },
  //         { letter: "B", row: 4 },
  //         { letter: "O", row: 4 },
  //       ];
  //       const valid = corners.every(({ letter, row }) => isCalled(letter, row));
  //       if (valid) {
  //         setWinningCells(corners); // ✅ This is missing!
  //         return true;
  //       }
  //       return false;
  //     },

  //     "letter-h": () => {
  //       const cells = [];
  //       const left = [0, 1, 2, 3, 4].every((r) => {
  //         const valid = isCalled("B", r);
  //         if (valid) cells.push({ letter: "B", row: r });
  //         return valid;
  //       });
  //       const right = [0, 1, 2, 3, 4].every((r) => {
  //         const valid = isCalled("O", r);
  //         if (valid) cells.push({ letter: "O", row: r });
  //         return valid;
  //       });
  //       const middle = letters.every((l) => {
  //         const valid = isCalled(l, 2);
  //         if (valid) cells.push({ letter: l, row: 2 });
  //         return valid;
  //       });
  //       if (left && right && middle) {
  //         setWinningCells(cells);
  //         return true;
  //       }
  //       return false;
  //     },
  //     blackout: () => {
  //       const cells = [];
  //       const all = letters.every((l) =>
  //         [0, 1, 2, 3, 4].every((r) => {
  //           const valid = isCalled(l, r);
  //           if (valid) cells.push({ letter: l, row: r });
  //           return valid;
  //         }),
  //       );
  //       if (all) {
  //         setWinningCells(cells);
  //         return true;
  //       }
  //       return false;
  //     },
  //   };

  //   if (winPatterns[savedPattern] && winPatterns[savedPattern]()) {
  //     setHasWon(true);
  //     try {
  //       axios.post(`${SERVER_URL}/api/setWinner`, {
  //         winnerId: employee.EMPLOYEEID,
  //         pattern: savedPattern,
  //       });
  //     } catch (e) {
  //       console.error("❌ Failed to set winner:", e);
  //     }
  //   }
  // };

  // useEffect(() => {
  //   fetchWinner();
  // }, []);

  // useEffect(() => {
  //   const checkWinner = async () => {
  //     try {
  //       const res = await axios.get(`${SERVER_URL}/api/getWinner`);
  //       const currentWinnerId = res.data?.winnerId;
  //       setWinnerId(currentWinnerId);

  //       if (
  //         currentWinnerId &&
  //         employee?.EMPLOYEEID &&
  //         employee.EMPLOYEEID === currentWinnerId &&
  //         employee.EMPLOYEEID !== "CMXBINGOADMIN"
  //       ) {
  //         setHasWon(true); // Triggers the win modal immediately
  //       }
  //     } catch (e) {
  //       console.error("❌ Failed to fetch winner:", e);
  //     }
  //   };

  //   checkWinner();
  // }, [employee]);

  // 🧠 Re-check win when card is ready
  // useEffect(() => {
  //   if (card && calledNumbers.length > 0 && savedPattern) {
  //     console.log("🔁 Rechecking win after card generation...");
  //     checkWin(calledNumbers);
  //   }
  // }, [card, calledNumbers, savedPattern]);

  // 🔁 Ball Drawer
  const getNewBall = (called) => {
    const letters = ["B", "I", "N", "G", "O"];
    const allBalls = [];
    for (let i = 1; i <= 75; i++) {
      const letter = letters[Math.floor((i - 1) / 15)];
      allBalls.push(`${letter}${i}`);
    }
    const remaining = allBalls.filter((b) => !called.includes(b));
    if (remaining.length === 0) return null;
    return remaining[Math.floor(Math.random() * remaining.length)];
  };

  //triggers this when clicking “Draw Random Ball”.
  const drawRandomBall = async () => {
    // if (hasWon || winnerId) return; // ⛔ Prevent drawing if already won or there's a winner
    if (!savedPattern) {
      alert("Please set a winning pattern before drawing a ball.");
      return;
    }

    const newBall = getNewBall(calledNumbers);
    console.log("Called:", calledNumbers.length);
    console.log("New Ball:", newBall);
    console.log("Called Numbers:", calledNumbers);

    if (!newBall) {
      console.log("❌ No more balls available.");
      setShowNoBallsModal(true);
      return;
    }

    try {
      // 🟢 Admin sends new ball to backend
      await axios.post(`${SERVER_URL}/api/calledNumbers`, { ball: newBall });

      // ⛔ No need to set local state — WebSocket will handle it
    } catch (err) {
      console.error("❌ Failed to draw ball:", err);
    }
  };

  const drawBallByLetter = (letter) => {
    // if (hasWon || winnerId) return; // ⛔ Prevent drawing if already won or there's a winner
    const ranges = {
      B: [1, 15],
      I: [16, 30],
      N: [31, 45],
      G: [46, 60],
      O: [61, 75],
    };
    const [min, max] = ranges[letter];
    const options = [];
    for (let i = min; i <= max; i++) {
      const ball = `${letter}${i}`;
      if (!calledNumbers.includes(ball)) {
        options.push(ball);
      }
    }
    if (options.length === 0) return;
    const randomBall = options[Math.floor(Math.random() * options.length)];
    setCalledNumbers((prev) => {
      const updated = [...prev, randomBall];
      // checkWin(updated);
      return updated;
    });
    setCurrentBall(randomBall);
  };

  const getBallColor = (letter) => {
    switch (letter) {
      case "B":
        return "bg-yellow-400";
      case "I":
        return "bg-green-500";
      case "N":
        return "bg-red-600";
      case "G":
        return "bg-purple-500";
      case "O":
        return "bg-blue-600";
      default:
        return "bg-gray-600";
    }
  };

  // 🧠 Generate card on employee change
  useEffect(() => {
    if (employee) {
      const bingoCard = generateBingoCard(employee.EMPLOYEEID);
      setCard(bingoCard);
    }
  }, [employee]);

  // 🛑 Loading fallback
  if (!card) {
    return (
      <div className="min-h-screen bg-blue-900 text-white flex items-center justify-center">
        <p className="text-xl text-yellow-400 font-semibold">
          Generating Bingo Card...
        </p>
      </div>
    );
  }

  const getPatternGuide = (pattern) => {
    const grid = Array.from({ length: 5 }, () =>
      Array.from({ length: 5 }, () => false),
    );

    switch (pattern) {
      case "forward-slash":
        for (let i = 0; i < 5; i++) grid[4 - i][i] = true;
        break;

      //   case "tic-tac-toe":
      //     [0, 2, 4].forEach((row) => {
      //       grid[row][0] = true; // B column
      //       grid[row][2] = true; // N column
      //       grid[row][4] = true; // O column
      //     });
      //     break;

      case "tic-tac-toe":
        // Clear all cells first
        grid[0][0] = true; // B0
        grid[0][2] = true; // N0
        grid[0][4] = true; // O0
        grid[2][0] = true; // B2
        grid[2][4] = true; // O2
        grid[4][0] = true; // B4
        grid[4][2] = true; // N4
        grid[4][4] = true; // O4
        break;

      case "plus":
        [0, 1, 2, 3, 4].forEach((i) => {
          grid[2][i] = true; // center row
          grid[i][2] = true; // center column
        });
        break;

      case "corners":
        grid[0][0] = true;
        grid[0][4] = true;
        grid[4][0] = true;
        grid[4][4] = true;
        break;

      case "letter-h":
        for (let i = 0; i < 5; i++) {
          grid[i][0] = true; // B
          grid[i][4] = true; // O
          grid[2][i] = true; // middle row
        }
        break;

      case "blackout":
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 5; c++) {
            grid[r][c] = true;
          }
        }
        break;

      default:
        break;
    }

    return grid;
  };

  // ✅ Render JSX
  return (
    <div className="min-h-screen bg-custom-gradient2 text-white flex flex-col items-center justify-center p-6">
      <div className="text-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">
            Welcome, {employee.FULLNAME}!
          </h2>
          {/* Show ID only if not admin */}
          {employee.EMPLOYEEID !== "CMXBINGOADMIN" && (
            <p className="text-sm text-blue-200 mb-4">
              Employee ID:{" "}
              <span className="font-semibold">{employee.EMPLOYEEID}</span>
            </p>
          )}
        </div>

        {currentBall && (
          <div className="mb-6 flex justify-center">
            <div className="bg-white mt-2 p-4 rounded-lg shadow-lg">
              <p className="text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                Current Number:
              </p>
              <div
                className={`relative w-32 h-32 rounded-full flex items-center justify-center ${getBallColor(
                  currentBall[0],
                )}`}
              >
                <div className="absolute w-24 h-24 rounded-full border-4 border-white flex flex-col items-center justify-center text-white font-bold">
                  <span className="text-sm">{currentBall[0]}</span>
                  <span className="text-2xl">{currentBall.slice(1)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BINGO CARD (Only for non-admin players) */}
        {employee.EMPLOYEEID !== "CMXBINGOADMIN" && (
          <table className="table-auto border-collapse mx-auto text-black bg-white rounded-lg overflow-hidden shadow-md">
            <thead>
              <tr>
                {["B", "I", "N", "G", "O"].map((letter) => (
                  <th key={letter} className="px-4 py-2 bg-yellow-300 text-lg">
                    {letter}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {["B", "I", "N", "G", "O"].map((letter) => {
                    const num = card[letter][rowIndex];
                    const isCalled = calledNumbers.includes(`${letter}${num}`);
                    const isFree = num === "FREE";
                    return (
                      <td
                        key={`${letter}-${rowIndex}`}
                        className={`w-16 h-16 text-center align-middle font-bold border ${
                          isFree || isCalled
                            ? "bg-yellow-400 text-black line-through"
                            : "bg-white"
                        }`}
                      >
                        {num}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ADMIN PANEL */}
        {employee.EMPLOYEEID === "CMXBINGOADMIN" && (
          <div className="mt-10 bg-blue-50 border border-blue-200 text-black p-6 rounded-md shadow-lg w-full max-w-lg">
            <h2 className="text-2xl font-bold text-center text-blue-700 mb-6">
              Admin Control Panel
            </h2>

            {/* Draw Ball Button */}
            <div className="mb-6 flex justify-center">
              <button
                onClick={() => {
                  console.log("🟢 BUTTON PRESSED");
                  drawRandomBall();
                }}
                className="bg-blue-600 text-white text-xl px-10 py-5 rounded-lg hover:bg-blue-500 font-bold shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!savedPattern}
              >
                🔵 Draw Bingo Ball
              </button>
            </div>

            {/* Winner Already Declared Warning */}
            {/* {winnerId && (
              <div className="mb-6 p-4 rounded bg-red-100 text-red-800 border border-red-400 text-sm">
                🎉 A winner has already been declared:{" "}
                <strong>{winnerId}</strong>.<br />
                You must reset the game before drawing more balls.
              </div>
            )} */}

            {/* Current Pattern Info */}
            <div className="mb-6 bg-white text-black px-4 py-3 rounded shadow-sm text-center">
              <p className="font-bold mb-1">🎯 Current Winning Pattern:</p>
              <p className="capitalize text-blue-800 font-semibold">
                {savedPattern.replace("-", " ") || "Not set"}
              </p>
            </div>

            {/* Pattern Selection */}
            <div className="mb-4">
              <label className="block mb-2 font-medium text-left text-sm">
                Select Winning Pattern
              </label>
              <select
                value={gamePattern}
                onChange={(e) => setGamePattern(e.target.value)}
                className="w-full px-3 py-2 border rounded mb-4"
              >
                <option value="">Select Pattern</option>
                <option value="forward-slash">Forward / Back Slash</option>
                <option value="tic-tac-toe">Tic Tac Toe</option>
                <option value="plus">Plus (+)</option>
                <option value="corners">Four Corners</option>
                <option value="letter-h">Letter H</option>
                <option value="blackout">Blackout</option>
              </select>

              {/* Buttons Section */}
              <div className="flex flex-col sm:flex-row sm:gap-4 gap-2">
                <button
                  onClick={async () => {
                    try {
                      await axios.post(`${SERVER_URL}/api/setPattern`, {
                        pattern: gamePattern,
                      });
                      console.log("✅ Pattern sent to backend:", gamePattern);
                    } catch (e) {
                      console.error("❌ Failed to update pattern:", e);
                    }
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500 w-full sm:w-auto"
                >
                  ✅ Save Pattern
                </button>

                <button
                  onClick={async () => {
                    try {
                      await axios.post(`${SERVER_URL}/api/resetGame`);
                    } catch (err) {
                      console.error("❌ Failed to reset game:", err);
                    }
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500 w-full sm:w-auto"
                >
                  🔁 Reset Game
                </button>
              </div>
            </div>
          </div>
        )}

        {employee.EMPLOYEEID !== "CMXBINGOADMIN" && savedPattern && (
          <div className="mt-6 bg-white text-black px-6 py-4 rounded shadow-md flex flex-col items-center">
            <p className="text-lg font-bold mb-2 text-center">
              🎯 Current Winning Pattern
            </p>
            <p className="capitalize mb-4 text-blue-800 font-semibold text-center">
              {savedPattern.replace("-", " ")}
            </p>

            <p className="mb-2 font-semibold text-left text-gray-700">
              Pattern Guide:
            </p>
            <div className="bg-white p-4 rounded shadow-sm">
              <table className="table-fixed border border-black">
                <tbody>
                  {getPatternGuide(savedPattern).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, colIndex) => (
                        <td
                          key={colIndex}
                          className={`w-10 h-10 border border-black ${
                            cell ? "bg-yellow-400" : "bg-white"
                          }`}
                        ></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showNoBallsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white text-black rounded-lg p-6 max-w-md mx-4 text-center shadow-xl">
              <h2 className="text-2xl font-bold text-red-600 mb-3">
                🚫 No Balls Available
              </h2>

              <p className="mb-6">
                All Bingo balls have already been drawn.
                <br />
                Kindly reset the game to start a new round.
              </p>

              <button
                onClick={() => setShowNoBallsModal(false)}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-500"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Only show Play Again button to Admin */}
        {/* {employee.EMPLOYEEID === "CMXBINGOADMIN" ? (
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
            onClick={async () => {
              try {
                await axios.post(`${SERVER_URL}/api/resetGame`);
                window.location.reload(); // Admin resets game
              } catch (err) {
                console.error("❌ Failed to reset game:", err);
              }
            }}
          >
            Play Again
          </button>
        ) : (
          <p className="text-sm text-gray-700">
            Please wait for the admin to start a new game.
          </p>
        )} */}
      </div>
    </div>
  );
};

export default BingoGame;
