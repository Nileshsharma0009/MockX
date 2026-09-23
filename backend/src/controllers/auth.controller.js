import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import genToken from '../config/token.js';
import { getAuthCookieOptions, getClearAuthCookieOptions } from "../config/authCookie.js";



const toSafeUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  instituteId: user.instituteId ?? null,
  batch: user.batch ?? null,
  studentRollNo: user.studentRollNo ?? null,
  status: user.status ?? "ACTIVE",
  hasPaid: Boolean(user.hasPaid),
  purchasedExams: Array.isArray(user.purchasedExams) ? user.purchasedExams : [],
  age: user.age,
  phone: user.phone,
  state: user.state,
  exam: user.exam,
  imucetOption: user.imucetOption,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const register = async (req, res) => {
  const { name, email, password, phone, state, age, exam, imucetOption } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const emailExists = await User.findOne({ email });
  if (emailExists) {
    return res.status(400).json({ message: "Email already registered" });
  }


  const hashPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    phone,
    state,
    age,
    exam,
    imucetOption,
    password: hashPassword,
    role: "user",
    isVerified: false,
  });

  res.status(201).json({
    message: "Registration successful",
    user: toSafeUser(user),
  });
};


export const signup = async (req, res) => {
  try {
    const { name, email, password, phone, state, age, exam, imucetOption } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, phone, state, age, exam, imucetOption, password: hashPassword, role: "user", isVerified: false });
    const token = await genToken(user._id);


    res.cookie("token", token, getAuthCookieOptions());
    const userResponse = toSafeUser(user);

    res.status(201).json({
      user: userResponse
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Signup failed' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status === "SUSPENDED" || user.status === "DISABLED") {
      return res.status(403).json({ message: "Your account is disabled. Please contact your administrator." });
    }

    const token = await genToken(user._id);
    res.cookie("token", token, getAuthCookieOptions())

    const userResponse = toSafeUser(user);

    return res.status(200).json({
      user: userResponse
    });


  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};


export const logout = async (req, res) => {
  try {
    res.clearCookie("token", getClearAuthCookieOptions());
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: "Logout failed" });
  }
};


export const getMe = (req, res) => {
  res.status(200).json({ user: toSafeUser(req.user) });
};

export const getAllUsers = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied. Super Admins only." });
    }
    const users = await User.find({}, "name email role phone purchasedExams createdAt")
      .sort({ createdAt: -1 });
    return res.status(200).json(users);
  } catch (error) {
    console.error("Get all users error:", error);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};
