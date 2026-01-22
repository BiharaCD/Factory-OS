import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// REGISTER
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user with pending approval status
    const newUser = await User.create({ 
      name, 
      email, 
      password: hashedPassword,
      approved: false
    });

    res.status(201).json({ 
      message: "User registered successfully. Please wait for approval from an existing user.",
      user: { id: newUser._id, name: newUser.name, email: newUser.email, approved: newUser.approved }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// LOGIN
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Auto-approve existing users who don't have approval status set
    // This allows previously registered users to login
    if (user.approved === false || user.approved === undefined || user.approved === null) {
      user.approved = true;
      await user.save();
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // create JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, approved: user.approved } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET PROFILE
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET PENDING USERS (awaiting approval)
export const getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({ approved: false })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(pendingUsers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ALL APPROVED USERS
export const getApprovedUsers = async (req, res) => {
  try {
    const approvedUsers = await User.find({ approved: true })
      .select("-password")
      .populate("approvedBy", "name email")
      .sort({ approvedAt: -1 });
    res.json(approvedUsers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// APPROVE USER
export const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const approverId = req.userId; // Current logged-in user

    // Verify approver is an approved user
    const approver = await User.findById(approverId);
    if (!approver || !approver.approved) {
      return res.status(403).json({ message: "You are not authorized to approve users" });
    }

    // Find user to approve
    const userToApprove = await User.findById(userId);
    if (!userToApprove) {
      return res.status(404).json({ message: "User not found" });
    }

    if (userToApprove.approved) {
      return res.status(400).json({ message: "User is already approved" });
    }

    // Approve the user
    userToApprove.approved = true;
    userToApprove.approvedBy = approverId;
    userToApprove.approvedAt = new Date();
    await userToApprove.save();

    res.json({
      message: "User approved successfully",
      user: {
        id: userToApprove._id,
        name: userToApprove.name,
        email: userToApprove.email,
        approved: userToApprove.approved,
        approvedAt: userToApprove.approvedAt
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// REJECT USER
export const rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const approverId = req.userId; // Current logged-in user

    // Verify approver is an approved user
    const approver = await User.findById(approverId);
    if (!approver || !approver.approved) {
      return res.status(403).json({ message: "You are not authorized to reject users" });
    }

    // Find and delete the user
    const userToReject = await User.findByIdAndDelete(userId);
    if (!userToReject) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User rejected and removed successfully",
      user: {
        id: userToReject._id,
        name: userToReject.name,
        email: userToReject.email
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
