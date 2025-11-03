// --- server.js ---
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import session from "express-session";
import { OAuth2Client } from "google-auth-library";
import validator from "validator";
import emailValidator from "email-validator";
import NodeCache from "node-cache";

// Import models
import User from "./models/User.js";
import Book from "./models/Book.js";
import Purchase from "./models/Purchase.js";
import MockTest from "./models/MockTest.js";
import TestResult from "./models/TestResult.js";

// Import routes
import adminRoutes from "./routes/adminRoutes.js";
import { verifyAdmin } from "./middleware/adminAuth.js";

dotenv.config();

// --- Initialize App ---
const app = express();
app.use(express.json());
// ✅ CORS Configuration - Allow multiple frontend origins
app.use(cors({
  origin: [
    "http://localhost:5173", 
    "http://localhost:5174", 
    "http://localhost:5175", 
    "http://localhost:3000",
    "https://litverse-frontend.vercel.app", // Vercel deployment
    "https://litverse-onlinelib.netlify.app", // Netlify deployment
    /^http:\/\/192\.168\.\d+\.\d+:\d+$/ // Allow local network IPs
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));


// Session configuration
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Twilio Client (optional - only if credentials are provided)
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    const twilio = await import("twilio");
    twilioClient = twilio.default(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  } catch (error) {
    console.log("Twilio not configured - SMS will use demo mode");
  }
}

// Cache for OTP storage (expires in 10 minutes)
const otpCache = new NodeCache({ stdTTL: 600 });

// Email validation function
const isValidEmail = (email) => {
  // Basic format validation
  if (!validator.isEmail(email)) {
    return { valid: false, message: "Invalid email format" };
  }
  
  // Additional validation using email-validator
  if (!emailValidator.validate(email)) {
    return { valid: false, message: "Invalid email address" };
  }
  
  // Check for valid domains (common email providers)
  const validDomains = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com',
    'icloud.com', 'aol.com', 'protonmail.com', 'zoho.com', 'yandex.com',
    'mail.com', 'gmx.com', 'fastmail.com', 'tutanota.com'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  
  // Allow educational domains (.edu) and organization domains (.org)
  if (domain?.endsWith('.edu') || domain?.endsWith('.org') || domain?.endsWith('.gov')) {
    return { valid: true, message: "Valid email" };
  }
  
  // Check if it's a known valid domain
  if (!validDomains.includes(domain)) {
    return { 
      valid: false, 
      message: `Please use a valid email from providers like Gmail, Yahoo, Outlook, etc. Domain '${domain}' is not recognized.` 
    };
  }
  
  return { valid: true, message: "Valid email" };
};

// --- MongoDB Connection ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB connected successfully");
    
    // Create default admin if none exists
    try {
      const adminCount = await Admin.countDocuments();
      if (adminCount === 0) {
        const defaultAdminPassword = await bcrypt.hash("admin123", 10);
        const defaultAdmin = new Admin({
          firstName: "Admin",
          lastName: "User",
          email: "admin@gmail.com",
          password: defaultAdminPassword,
        });
        await defaultAdmin.save();
        console.log("✅ Default admin created: admin@gmail.com / admin123");
      }
    } catch (err) {
      console.error("❌ Error creating default admin:", err);
    }
  })
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

// Models are imported from separate files

// --- Admin Schema ---
const adminSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "admin" },
  createdAt: { type: Date, default: Date.now },
});

const Admin = mongoose.model("Admin", adminSchema);

// --- Passport Configuration ---
// Only configure Google OAuth if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ email: profile.emails[0].value });
      
      if (user) {
        return done(null, user);
      }
      
      // Create new user
      user = new User({
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        email: profile.emails[0].value,
        password: await bcrypt.hash(Math.random().toString(36), 10), // Random password for OAuth users
        googleId: profile.id
      });
      
      await user.save();
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// --- Facebook OAuth Strategy ---
// Only configure Facebook OAuth if credentials are provided
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "/auth/facebook/callback",
    profileFields: ['id', 'emails', 'name']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ email: profile.emails[0].value });
      
      if (user) {
        return done(null, user);
      }
      
      // Create new user
      user = new User({
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        email: profile.emails[0].value,
        password: await bcrypt.hash(Math.random().toString(36), 10), // Random password for OAuth users
        facebookId: profile.id
      });
      
      await user.save();
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

// ========================= 🧩 ADMIN LOGIN =========================
app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find admin in database
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        adminId: admin._id, 
        email: admin.email, 
        role: "admin",
        firstName: admin.firstName 
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.status(200).json({
      message: "Admin login successful",
      token,
      admin: {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role
      },
      redirectTo: "/admin/dashboard",
    });
  } catch (err) {
    console.error("❌ Error during admin login:", err);
    res.status(500).json({ message: "Server error during admin login" });
  }
});
// =================================================================

// ========================= 🧩 ADMIN REGISTER =========================
app.post("/api/admin/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !email || !password) {
      return res.status(400).json({ message: "First name, email, and password are required" });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin with this email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const newAdmin = new Admin({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    await newAdmin.save();

    res.status(201).json({ 
      message: "Admin registered successfully",
      admin: {
        id: newAdmin._id,
        firstName: newAdmin.firstName,
        lastName: newAdmin.lastName,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });
  } catch (err) {
    console.error("❌ Error during admin registration:", err);
    res.status(500).json({ message: "Server error during admin registration" });
  }
});
// =================================================================

// ========================= 🧩 GOOGLE OAUTH ROUTES =========================
// Google OAuth login
app.get('/auth/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(400).json({ message: "Google OAuth not configured" });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// Google OAuth callback
app.get('/auth/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect('http://localhost:5175?error=google_not_configured');
  }
  
  passport.authenticate('google', { failureRedirect: '/login' }, (err, user) => {
    if (err) {
      console.error("Google OAuth error:", err);
      return res.redirect('http://localhost:5175?error=google_auth_failed');
    }
    
    if (!user) {
      return res.redirect('http://localhost:5175?error=google_auth_failed');
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        firstName: user.firstName 
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );
    
    // Redirect to frontend with token
    res.redirect(`http://localhost:5175?token=${token}&user=${encodeURIComponent(JSON.stringify({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    }))}`);
  })(req, res, next);
});

// Google token verification (for frontend Google Sign-In)
app.post('/auth/google/verify', async (req, res) => {
  try {
    const { token } = req.body;
    
    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { email, given_name, family_name, sub: googleId } = payload;
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user
      user = new User({
        firstName: given_name,
        lastName: family_name || '',
        email: email,
        password: await bcrypt.hash(Math.random().toString(36), 10), // Random password for OAuth users
        googleId: googleId,
        isActive: true
      });
      await user.save();
    }
    
    // Generate JWT token
    const jwtToken = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        firstName: user.firstName 
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );
    
    res.json({
      message: "Google login successful",
      token: jwtToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error("Google verification error:", error);
    res.status(400).json({ message: "Invalid Google token" });
  }
});
// =================================================================

// ========================= 🧩 FACEBOOK OAUTH ROUTES =========================
// Facebook OAuth login
app.get('/auth/facebook', (req, res, next) => {
  if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
    return res.status(400).json({ message: "Facebook OAuth not configured" });
  }
  passport.authenticate('facebook', { scope: ['email'] })(req, res, next);
});

// Facebook OAuth callback
app.get('/auth/facebook/callback', (req, res, next) => {
  if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
    return res.redirect('http://localhost:5175?error=facebook_not_configured');
  }
  
  passport.authenticate('facebook', { failureRedirect: '/login' }, (err, user) => {
    if (err) {
      console.error("Facebook OAuth error:", err);
      return res.redirect('http://localhost:5175?error=facebook_auth_failed');
    }
    
    if (!user) {
      return res.redirect('http://localhost:5175?error=facebook_auth_failed');
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        firstName: user.firstName 
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );
    
    // Redirect to frontend with token
    res.redirect(`http://localhost:5175?token=${token}&user=${encodeURIComponent(JSON.stringify({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    }))}`);
  })(req, res, next);
});

// Facebook token verification (for frontend Facebook Login)
app.post('/auth/facebook/verify', async (req, res) => {
  try {
    const { accessToken, userID, email, name } = req.body;
    
    // Verify Facebook token (in production, verify with Facebook Graph API)
    // For now, we'll trust the frontend verification
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user
      user = new User({
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || '',
        email: email,
        password: await bcrypt.hash(Math.random().toString(36), 10), // Random password for OAuth users
        facebookId: userID,
        isActive: true
      });
      await user.save();
    }
    
    // Generate JWT token
    const jwtToken = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        firstName: user.firstName 
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );
    
    res.json({
      message: "Facebook login successful",
      token: jwtToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error("Facebook verification error:", error);
    res.status(400).json({ message: "Invalid Facebook token" });
  }
});
// =================================================================

// ========================= 📱 MOBILE OTP ROUTES =========================
// Send OTP to mobile number
app.post('/auth/mobile/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    // Validate phone number format (international format)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ 
        message: "Please enter a valid phone number with country code (e.g., +1234567890)" 
      });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in cache with phone number as key
    otpCache.set(phoneNumber, otp);
    
    try {
      if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
        // Send SMS using Twilio
        await twilioClient.messages.create({
          body: `Your LitVerse verification code is: ${otp}. This code will expire in 10 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phoneNumber
        });
        
        res.json({ 
          message: "OTP sent successfully to your mobile number",
          success: true 
        });
      } else {
        // Demo mode - return OTP for testing
        res.json({ 
          message: `Demo mode - Your OTP is: ${otp}`,
          success: true,
          otp: otp // For testing purposes
        });
      }
    } catch (twilioError) {
      console.error("Twilio error:", twilioError);
      // Fallback to demo mode
      res.json({ 
        message: `Demo mode - Your OTP is: ${otp}`,
        success: true,
        otp: otp // For testing purposes
      });
    }
    
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({ message: "Server error sending OTP" });
  }
});

// Verify OTP and login/register
app.post('/auth/mobile/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp, firstName, lastName } = req.body;
    
    // Get stored OTP from cache
    const storedOtp = otpCache.get(phoneNumber);
    
    if (!storedOtp) {
      return res.status(400).json({ message: "OTP expired or not found. Please request a new one." });
    }
    
    if (storedOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }
    
    // OTP is valid, remove from cache
    otpCache.del(phoneNumber);
    
    // Check if user exists with this phone number
    let user = await User.findOne({ phone: phoneNumber });
    
    if (!user) {
      // Create new user
      if (!firstName) {
        return res.status(400).json({ message: "First name is required for new users" });
      }
      
      user = new User({
        firstName,
        lastName: lastName || '',
        phone: phoneNumber,
        email: `${phoneNumber.replace('+', '')}@mobile.litverse.com`, // Temporary email
        password: await bcrypt.hash(Math.random().toString(36), 10), // Random password
        isActive: true
      });
      await user.save();
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        phone: user.phone,
        firstName: user.firstName 
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );
    
    res.json({
      message: "Mobile verification successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone
      }
    });
    
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ message: "Server error verifying OTP" });
  }
});

// Send OTP to email
app.post('/auth/email/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate email
    const emailValidation = isValidEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ message: emailValidation.message });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in cache with email as key
    otpCache.set(email, otp);
    
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        // Send email using nodemailer
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        await transporter.sendMail({
          to: email,
          subject: "LitVerse - Email Verification Code",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">LitVerse Email Verification</h2>
              <p>Your verification code is:</p>
              <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
                ${otp}
              </div>
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't request this code, please ignore this email.</p>
            </div>
          `,
        });
        
        res.json({ 
          message: "OTP sent successfully to your email",
          success: true 
        });
      } else {
        // Demo mode - return OTP for testing
        res.json({ 
          message: `Demo mode - Your OTP is: ${otp}`,
          success: true,
          otp: otp // For testing purposes
        });
      }
    } catch (emailError) {
      console.error("Email error:", emailError);
      // Fallback to demo mode
      res.json({ 
        message: `Demo mode - Your OTP is: ${otp}`,
        success: true,
        otp: otp // For testing purposes
      });
    }
    
  } catch (error) {
    console.error("Send email OTP error:", error);
    res.status(500).json({ message: "Server error sending OTP" });
  }
});

// Verify email OTP and login/register
app.post('/auth/email/verify-otp', async (req, res) => {
  try {
    const { email, otp, firstName, lastName } = req.body;
    
    // Get stored OTP from cache
    const storedOtp = otpCache.get(email);
    
    if (!storedOtp) {
      return res.status(400).json({ message: "OTP expired or not found. Please request a new one." });
    }
    
    if (storedOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }
    
    // OTP is valid, remove from cache
    otpCache.del(email);
    
    // Check if user exists with this email
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user
      if (!firstName) {
        return res.status(400).json({ message: "First name is required for new users" });
      }
      
      user = new User({
        firstName,
        lastName: lastName || '',
        email,
        password: await bcrypt.hash(Math.random().toString(36), 10), // Random password
        isActive: true
      });
      await user.save();
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        firstName: user.firstName 
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );
    
    res.json({
      message: "Email verification successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error("Verify email OTP error:", error);
    res.status(500).json({ message: "Server error verifying OTP" });
  }
});
// =================================================================

// --- Register API (Step 1: Send OTP for Email Verification) ---
app.post("/register/send-otp", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !email || !password) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    // Validate email format and domain (allow any domain now)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Validate password strength
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^+=_])[A-Za-z\d@$!%*?&#^+=_]{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      return res.status(400).json({ 
        message: "Password must be at least 8 characters with uppercase, lowercase, number, and special character" 
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store registration data temporarily with OTP
    const registrationData = {
      firstName,
      lastName,
      email,
      password: await bcrypt.hash(password, 10),
      otp,
      timestamp: Date.now()
    };
    
    otpCache.set(`register_${email}`, registrationData);

    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        // Send real email
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        await transporter.sendMail({
          to: email,
          subject: "📚 LitVerse - Verify Your Email Address",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2563eb; margin: 0;">📚 LitVerse</h1>
                <p style="color: #666; margin: 5px 0;">Online Library Platform</p>
              </div>
              
              <div style="background: #f8fafc; padding: 30px; border-radius: 10px; margin: 20px 0;">
                <h2 style="color: #1e293b; margin-top: 0;">Welcome ${firstName}!</h2>
                <p style="color: #475569; font-size: 16px; line-height: 1.5;">
                  Thank you for joining LitVerse! To complete your registration, please verify your email address using the code below:
                </p>
                
                <div style="background: white; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0; border: 2px dashed #e2e8f0;">
                  <p style="color: #64748b; margin: 0 0 10px 0; font-size: 14px;">Your Verification Code</p>
                  <div style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px; font-family: monospace;">
                    ${otp}
                  </div>
                </div>
                
                <p style="color: #64748b; font-size: 14px; margin: 20px 0 0 0;">
                  ⏰ This code will expire in 10 minutes<br>
                  🔒 Keep this code secure and don't share it with anyone
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                  If you didn't request this verification, please ignore this email.
                </p>
              </div>
            </div>
          `,
        });
        
        res.json({ 
          message: "Verification code sent to your email address",
          success: true 
        });
      } else {
        // Demo mode - return OTP for testing
        res.json({ 
          message: `Demo mode - Your verification code is: ${otp}`,
          success: true,
          otp: otp // Only in development
        });
      }
    } catch (emailError) {
      console.error("Email error:", emailError);
      // Fallback to demo mode
      res.json({ 
        message: `Demo mode - Your verification code is: ${otp}`,
        success: true,
        otp: otp // For testing purposes
      });
    }
    
  } catch (err) {
    console.error("❌ Error during registration OTP:", err);
    res.status(500).json({ message: "Server error sending verification code" });
  }
});

// --- Register API (Step 2: Verify OTP and Complete Registration) ---
app.post("/register/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and verification code are required" });
    }

    // Get stored registration data
    const registrationData = otpCache.get(`register_${email}`);
    
    if (!registrationData) {
      return res.status(400).json({ message: "Verification code expired or not found. Please request a new one." });
    }

    if (registrationData.otp !== otp) {
      return res.status(400).json({ message: "Invalid verification code. Please try again." });
    }

    // Check if registration data is not too old (10 minutes)
    if (Date.now() - registrationData.timestamp > 600000) {
      otpCache.del(`register_${email}`);
      return res.status(400).json({ message: "Verification code expired. Please request a new one." });
    }

    // OTP is valid, create user account
    const newUser = new User({
      firstName: registrationData.firstName,
      lastName: registrationData.lastName,
      email: registrationData.email,
      password: registrationData.password,
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: new Date()
    });

    await newUser.save();
    
    // Remove registration data from cache
    otpCache.del(`register_${email}`);

    // Generate JWT token for immediate login
    const token = jwt.sign(
      { 
        userId: newUser._id, 
        email: newUser.email,
        firstName: newUser.firstName 
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(201).json({ 
      message: "Email verified successfully! Account created.",
      token,
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email
      }
    });
    
  } catch (err) {
    console.error("❌ Error during registration verification:", err);
    res.status(500).json({ message: "Server error during verification" });
  }
});

// --- Legacy Register API (Deprecated - redirects to OTP flow) ---
app.post("/register", async (req, res) => {
  res.status(400).json({ 
    message: "Email verification required. Please use the new registration flow with OTP verification.",
    useOTPFlow: true
  });
});

// --- Login API ---
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required" });

    // Validate email format
    const emailValidation = isValidEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      },
      redirectTo: "/home",
    });
  } catch (err) {
    console.error("❌ Error during login:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Forgot Password API ---
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "No user found with that email." });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetLink = `http://localhost:3000/reset-password/${token}`;

    await transporter.sendMail({
      to: email,
      subject: "Password Reset Request - BookPoint",
      html: `
        <p>Hello ${user.firstName || "User"},</p>
        <p>You requested to reset your password. Click the link below:</p>
        <a href="${resetLink}" target="_blank">${resetLink}</a>
        <p>This link will expire in 1 hour.</p>
      `,
    });

    res.json({ message: "✅ Password reset link sent successfully." });
  } catch (err) {
    console.error("❌ Error in forgot-password:", err);
    res.status(500).json({ message: "Error sending reset email." });
  }
});

// --- Reset Password API ---
app.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired reset token." });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();
    res.json({ message: "✅ Password reset successful." });
  } catch (err) {
    console.error("❌ Error in reset-password:", err);
    res.status(500).json({ message: "Server error resetting password." });
  }
});

// --- Middleware: Verify JWT ---
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res.status(403).json({ message: "Token required" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err)
      return res.status(403).json({ message: "Invalid or expired token" });
    req.user = decoded;
    next();
  });
};

// ========================= 🧩 ADMIN PROFILE =========================
app.get("/api/admin/profile", verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const admin = await Admin.findById(req.user.adminId).select("-password");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json({
      admin: {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt
      }
    });
  } catch (err) {
    console.error("❌ Error fetching admin profile:", err);
    res.status(500).json({ message: "Server error fetching admin profile" });
  }
});
// =================================================================

// Admin Routes
app.use("/api/admin", verifyAdmin, adminRoutes);

// Public Routes
app.get("/", (req, res) => {
  res.send("📚 Online Library Backend is running!");
});

// Books API for users
app.get("/api/books", async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    
    const query = { isActive: true };
    if (category && category !== "all") {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } }
      ];
    }

    const books = await Book.find(query)
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Book.countDocuments(query);
    const categories = await Book.distinct("category", { isActive: true });

    res.json({
      books,
      categories,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Mock Tests API for users
app.get("/api/mock-tests", async (req, res) => {
  try {
    const { category, difficulty, page = 1, limit = 10 } = req.query;
    
    const query = { isActive: true };
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;

    const tests = await MockTest.find(query)
      .select("-questions") // Don't send questions in list
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await MockTest.countDocuments(query);

    res.json({
      tests,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error("Error fetching mock tests:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Protected Route
app.get("/home", verifyToken, (req, res) => {
  res.json({
    message: "Welcome to Online Library!",
    user: req.user,
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
