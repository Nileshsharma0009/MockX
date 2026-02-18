import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import genToken from '../config/token.js';



const isProd = process.env.NODE_ENV === 'production' || process.env.NODE_ENVIRONMENT === 'production';

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
    isVerified: true,
  });

  res.status(201).json({
    message: "Registration successful",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
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

    const user = await User.create({ name, email, phone, state, age, exam, imucetOption, password: hashPassword });
    const token = await genToken(user._id);


    const isProd = process.env.NODE_ENV === "production";


    res.cookie("token", token, {
      httpOnly: true,
      secure: isProd,      // REQUIRED on Vercel
      sameSite: isProd ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt, updatedAt: user.updatedAt },

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

    const token = await genToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    return res.status(200).json({
      user: { id: user._id, name: user.name, email: user.email }
    })


  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};


export const logout = async (req, res) => {
  try {
    const isProd = process.env.NODE_ENV === 'production' || process.env.NODE_ENVIRONMENT === 'production';
    res.clearCookie("token", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax"
    });
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: "Logout failed" });
  }
};


export const getMe = (req, res) => {
  res.status(200).json({ user: req.user });
};
