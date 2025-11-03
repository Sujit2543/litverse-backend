import jwt from "jsonwebtoken";

export const verifyAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(403).json({ message: "Access token required" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(403).json({ message: "Access token required" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
      }

      if (decoded.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(500).json({ message: "Server error" });
  }
};