import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

// Helper function: Generate a signed JWT token
export const generateToken = (userId: string, role: string): string => {
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign({ id: userId, role }, secret, { expiresIn: expiresIn as any });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Basic validation
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    // 2. Security: Public registration defaults to 'student' (or 'parent' if selected)
    // Prevents public users from assigning themselves 'admin' or 'teacher'
    let assignedRole: 'student' | 'parent' = 'student';
    if (role === 'parent') {
      assignedRole = 'parent';
    }

    // 3. Check if user already exists
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      res.status(409).json({ error: 'A user with this email already exists' });
      return;
    }

    // 4. Hash password securely (10 salt rounds)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Create user in PostgreSQL
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: assignedRole,
      isActive: true,
    });

    // 6. Generate login token
    const token = generateToken(newUser.id, newUser.role);

    // 7. Send back response (NEVER send the password back!)
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.avatar,
      },
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
};


// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // 1. Validation: Ensure both fields are provided
    if (!email || !password) {
      res.status(400).json({ error: 'Please provide both email and password' });
      return;
    }

    // 2. Find user by email
    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    // 3. Check if user exists AND password matches
    // Note: We use a generic error message so hackers cannot guess which emails exist!
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // 4. Check if the account is active
    if (!user.isActive) {
      res.status(403).json({ error: 'Your account has been deactivated. Please contact an admin.' });
      return;
    }

    // 5. Generate fresh JWT token
    const token = generateToken(user.id, user.role);

    // 6. Return response with user data (excluding password)
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
};


// @desc    Get currently logged-in user profile
// @route   GET /api/auth/me
// @access  Private (Protected by token)
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // req.user was already verified and attached by the protect middleware!
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error('GetMe Error:', error);
    res.status(500).json({ error: 'Server error retrieving user profile' });
  }
};
