// src/pages/LoginPage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { SERVER_URL } from "../lib/constants";
import bingoImage from "../../assets/bingo-splash.png"; // ✅ Save the image locally or import from a URL

const LoginPage = ({ onValidated }) => {
  const [employeeId, setEmployeeId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true); // 🔄 Splash loading

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // 3 seconds
    return () => clearTimeout(timeout);
  }, []);

  const handleValidate = async () => {
    setError("");

    if (!employeeId) {
      setError("Please enter your Employee ID.");
      return;
    }

    try {
      // ✅ Check if game has started from memory (via API)
      const { data } = await axios.get(`${SERVER_URL}/api/gameStarted`);
      if (data.hasStarted && employeeId !== "CMXBINGOADMIN") {
        setError("Game has already started. You cannot join at this time.");
        return;
      }

      // ✅ Check if already won
      const winCheck = await axios.get(
        `${SERVER_URL}/api/hasWon/${employeeId}`
      );

      if (winCheck.data.hasWon && employeeId !== "CMXBINGOADMIN") {
        setError("You have already won this game.");
        return;
      }

      // ✅ Admin shortcut
      if (employeeId === "CMXBINGOADMIN") {
        onValidated({
          EMPLOYEEID: "CMXBINGOADMIN",
          FULLNAME: "ADMIN",
          DEPARTMENT: "ADMIN",
        });
        return;
      }

      // ✅ Validate user
      const res = await axios.get(
        `${SERVER_URL}/api/validateEmail/${employeeId}`
      );
      if (res.data.exists) {
        onValidated(res.data.employee);
      } else {
        setError("Invalid or inactive Employee ID.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Server error. Please try again.");
    }
  };

  // 🔄 Splash screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <img
          src={bingoImage}
          alt="Callmax Bingo Game"
          className="w-auto h-auto animate-fadeInOut"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-custom-gradient2 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white text-black p-6 rounded-lg shadow-lg">
        {/* Updated Header Container */}
        <div className="mb-6 bg-blue-50 border border-blue-200 text-center rounded-md p-4 shadow-sm">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-700">
            🎉 Welcome to Callmax Solutions' Bingo Day 🎉
          </h1>
        </div>

        <p className="text-left mb-4">Enter your Employee ID:</p>

        <input
          type="text"
          placeholder=""
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          className="w-full mb-4 px-4 py-2 border rounded"
        />

        <button
          onClick={handleValidate}
          className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700"
        >
          Validate
        </button>

        {error && <p className="mt-3 text-red-500 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default LoginPage;
