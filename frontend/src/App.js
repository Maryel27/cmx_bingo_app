// src/App.js
import React, { useState } from "react";

import BingoGame from "./components/LandingPage/BingoGame";
import LoginPage from "./components/common/LoginPage";
function App() {
  const [employee, setEmployee] = useState(null);

  return (
    <>
      {!employee ? (
        <LoginPage onValidated={(emp) => setEmployee(emp)} />
      ) : (
        <BingoGame employee={employee} />
      )}
    </>
  );
}

export default App;
