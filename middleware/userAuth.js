const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {

  const authHeader = req.headers.authorization;

  console.log("AUTH HEADER =", authHeader);

  if (!authHeader) {
    return res.status(401).json({
      error: "No token provided"
    });
  }

  try {

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      "antra_secret_key"
    );

    console.log("DECODED =", decoded);

    req.user = decoded;

    next();

  } catch (err) {

    console.error(err);

    return res.status(401).json({
      error: "Invalid token"
    });
  }
};