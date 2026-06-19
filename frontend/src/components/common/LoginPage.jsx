// src/pages/LoginPage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { SERVER_URL } from "../lib/constants";
import bingoImage from "../../assets/bingo-splash.png"; // ✅ Save the image locally or import from a URL
import mdayBanner from "../../assets/mother's_day_banner.png";
import mdaySplash from "../../assets/mother's_day_splash.png";
import fdayBanner from "../../assets/father's_day_banner.png";
import fdaySplash from "../../assets/father's_day_splash.png";

const LoginPage = ({ onValidated }) => {
  const [employeeId, setEmployeeId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true); // 🔄 Splash loading

  // inside your component
  const [showMday, setShowMday] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const endTimer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => {
      clearTimeout(endTimer);
    };
  }, []);

  // 🔄 Splash screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <img
          src={bingoImage}
          alt="Splash Screen"
          className="w-auto h-auto animate-fadeInOut"
        />
      </div>
    );
  }

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
      // const winCheck = await axios.get(
      //   `${SERVER_URL}/api/hasWon/${employeeId}`,
      // );

      // if (winCheck.data.hasWon && employeeId !== "CMXBINGOADMIN") {
      //   setError("You have already won this game.");
      //   return;
      // }

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
        `${SERVER_URL}/api/validateEmail/${employeeId}`,
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

  return (
    <div className="min-h-screen bg-custom-gradient2 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white text-black p-6 rounded-lg shadow-lg">
        {/* Updated Header Container */}
        <div className="mb-6 bg-blue-50 border border-blue-200 text-center rounded-md p-4 shadow-sm">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-700">
            🎉 Welcome to Callmax Solutions' Bingo Day 🎉
          </h1>
        </div>

        {/* ✅ Father's Day Banner */}
        {/* <img
          src={fdayBanner}
          alt="Father's Day Banner"
          className="w-full mb-4 rounded-md"
        /> */}

        <div className="flex items-center justify-between mb-4">
          <p className="text-left">Enter your Employee ID:</p>
        </div>

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

        <div
          onClick={() => setShowInstructions(true)}
          className="mt-3 cursor-pointer p-1 text-center"
        >
          <span className="font-semibold text-blue-700">
            {" "}
            ℹ️ Quick Start Guide{" "}
          </span>
        </div>

        {error && <p className="mt-3 text-red-500 text-center">{error}</p>}
      </div>

      {showInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-3xl rounded-3xl bg-[#f8f4eb] shadow-2xl border border-gray-300 overflow-hidden">
            {/* Close */}
            {/* <button
              type="button"
              onClick={() => setShowInstructions(false)}
              className="absolute top-4 right-5 text-3xl font-bold text-gray-600 hover:text-red-600 z-10"
            >
              ×
            </button> */}

            {/* Header */}
            <div className="bg-blue-700 text-white px-6 py-3 flex items-center gap-3">
              <span className="text-yellow-300 text-2xl">⭐</span>
              <h2 className="text-2xl font-extrabold tracking-wide">
                MECHANICS:
              </h2>
            </div>

            {/* Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {[
                {
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="white"
                      className="w-7 h-7"
                    >
                      <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z" />
                    </svg>
                  ),
                  text: (
                    <>
                      Log in using your{" "}
                      <b className="text-blue-700">EMPLOYEE ID</b> to join the
                      game
                    </>
                  ),
                },

                {
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="white"
                      className="w-7 h-7"
                    >
                      <path d="M3 3h18v18H3V3zm2 2v4h4V5H5zm6 0v4h8V5h-8zM5 11v8h4v-8H5zm6 0v8h8v-8h-8z" />
                    </svg>
                  ),
                  text: (
                    <>
                      The system will automatically assign{" "}
                      <b className="text-blue-700">one Bingo card</b> per
                      participant
                    </>
                  ),
                },

                {
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="white"
                      className="w-7 h-7"
                    >
                      <path d="M12 5c-5 0-9 5-9 7s4 7 9 7 9-5 9-7-4-7-9-7zm0 11a4 4 0 110-8 4 4 0 010 8z" />
                    </svg>
                  ),
                  text: (
                    <>
                      Please note: the system will no longer automatically
                      identify winners, so{" "}
                      <b className="text-blue-700">stay alert</b> and{" "}
                      <b className="text-blue-700">watch your card closely</b>{" "}
                      for the winning pattern!
                    </>
                  ),
                },

                {
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="white"
                      className="w-7 h-7"
                    >
                      <path d="M7 2h10a2 2 0 012 2v16a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2zm5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    </svg>
                  ),
                  text: (
                    <>
                      Once you complete a winning pattern, take a screenshot
                      immediately and send it to the{" "}
                      <b className="text-blue-700">Engagement GC</b> for
                      verification and visibility
                    </>
                  ),
                },

                {
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="white"
                      className="w-7 h-7"
                    >
                      <path d="M7 4V2h10v2h3v4c0 3-2 5-5 5a4 4 0 01-6 0c-3 0-5-2-5-5V4h3zm5 10l2 3h3l-2.5 2 1 3L12 20l-3.5 2 1-3L7 17h3l2-3z" />
                    </svg>
                  ),
                  text: (
                    <>
                      The first winning entry seen by the admins will be
                      declared the{" "}
                      <b className="text-blue-700">official winner</b>
                    </>
                  ),
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex gap-5 py-4 border-b border-dashed border-gray-300 last:border-none"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-700">
                    {item.icon}
                  </div>

                  <div className="text-base md:text-lg leading-relaxed text-gray-800">
                    {item.text}
                  </div>
                </div>
              ))}
              {/* Footer */}
              <div className="flex justify-end px-6 py-4 ">
                <button
                  type="button"
                  onClick={() => setShowInstructions(false)}
                  className="px-6 py-2 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-800 transition"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
