export async function requireAdmin(req, res, next) {
  const userAddress = req.user.address;
  const isAdmin = await accessControl.hasRole(MASTER_ADMIN_ROLE, userAddress);
  if (!isAdmin) return res.status(403).json({ error: "Admin only" });
  next();
}
