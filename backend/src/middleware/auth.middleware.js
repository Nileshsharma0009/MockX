import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { getValidatedJwtSecret, JWT_ALGORITHM } from "../config/token.js";

const protect = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, getValidatedJwtSecret(), { algorithms: [JWT_ALGORITHM] });

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (req.user.status === "SUSPENDED") {
      return res.status(403).json({ message: "Your account is suspended. Please contact your administrator." });
    }

    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ message: "Not authorized" });
  }
};

export default protect;
