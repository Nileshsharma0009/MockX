import Institute from "../models/institute.model.js";

/**
 * Check if the authenticated user has one of the allowed roles.
 * SUPER_ADMIN access is granted only to users with the SUPER_ADMIN role.
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());
    const userRole = (req.user.role || "").toUpperCase();

    if (normalizedAllowed.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      message: `Access denied. Requires one of roles: ${allowedRoles.join(", ")}`,
    });
  };
};

/**
 * Ensures the authenticated user belongs to an existing and active Institute.
 * Never trust instituteId from request payload or query parameters.
 */
export const requireInstitute = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Super admin bypassing institute check if explicitly provided in context,
    // but for institute admin endpoints, user must have instituteId
    const instituteId = req.user.instituteId;

    if (!instituteId) {
      return res.status(403).json({
        message: "Access denied. No institute associated with your account.",
      });
    }

    const institute = await Institute.findById(instituteId);

    if (!institute) {
      return res.status(404).json({ message: "Associated institute not found." });
    }

    if (institute.status === "SUSPENDED") {
      return res.status(403).json({
        message: "Your institute account is currently suspended. Please contact support.",
      });
    }

    req.institute = institute;
    next();
  } catch (err) {
    console.error("requireInstitute error:", err);
    return res.status(500).json({ message: "Failed to verify institute access" });
  }
};
