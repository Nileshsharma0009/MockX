// context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/api.js"; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔁 restore session on refresh
  // useEffect(() => {
  //   const loadUser = async () => {
  //     try {
  //       const res = await axios.get(
  //         "http://localhost:5000/api/auth/me",
  //         { withCredentials: true }
  //       );
  //       setUser(res.data.user);
  //     } catch {
  //       setUser(null);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   loadUser();
  // }, []);

useEffect(() => {
  const loadUser = async () => {
    try {
      const res = await api.get("/auth/me", {
        withCredentials: true,
      });

      setUser(res.data.user);
    } catch (err) {
      // ✅ Expected when user is not logged in
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  loadUser();
}, []);

  // ✅ THIS IS THE FIX
const login = async (email, password) => {
  try {
    const res = await api.post("/auth/login", {
      email,
      password,
    });

    setUser(res.data.user); // 🔥 IMMEDIATE UI UPDATE
    return res.data.user;
  } catch (error) {
    throw error; // Re-throw for error handling in components
  }
};

  const logout = async () => {
  await api.post("/auth/logout");
  setUser(null);
};
  

  // const logout = async () => {
  //   await axios.post(
  //     "http://localhost:5000/api/auth/logout",
  //     {},
  //     { withCredentials: true }
  //   );
  //   setUser(null);
  // };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
