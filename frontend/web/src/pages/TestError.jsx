import React from "react";

const TestError = () => {
  // This will intentionally throw a runtime error during the render phase
  // which will be caught by the React Error Boundary
  throw new Error("This is an intentional test error triggered to demonstrate the Error Boundary UI!");
  
  return null;
};

export default TestError;
