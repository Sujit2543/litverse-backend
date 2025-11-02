import User from "../models/User.js";

export const getAllUsers = async (req, res) => {
  const users = await User.find({ role: "user" }).select("-password");
  res.json(users);
};

export const deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted successfully" });
};
