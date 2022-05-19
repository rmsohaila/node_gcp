/* routes here require user to be a Google Super Admin */
module.exports = saAuth;

async function saAuth(req, res, next) {
  //Look for micro-services
  if (req.path.startsWith("/customer") || req.path.startsWith("/analytics") || req.path.startsWith("/classroom")) {
    if (req.user.isAdmin || req.isAutomation) {
      return next();
    } else {
      res.status(500).json({ message: "This resource is only available for Google Super Admins" });
    }
  } else {
    return next();
  }
}
