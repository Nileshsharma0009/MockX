import jwt from 'jsonwebtoken';

const genToken = async (userId) => {
  try {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  } catch (error) {
    console.error('Token error', error);
    throw error;
  }
};

export default genToken;