import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { getValidatedJwtSecret, JWT_ALGORITHM } from "../config/token.js";

const optionalAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, getValidatedJwtSecret(), { algorithms: [JWT_ALGORITHM] });
    const user = await User.findById(decoded.id);

    req.user = user || null;
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};

export default optionalAuth;
