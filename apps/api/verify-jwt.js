const jwt = require("jsonwebtoken");

const token = process.env.TOKEN;
const secret = process.env.JWT_ACCESS_SECRET;

if (!token) {
  console.error("TOKEN env var missing");
  process.exit(1);
}
if (!secret) {
  console.error("JWT_ACCESS_SECRET env var missing");
  process.exit(1);
}

try {
  const payload = jwt.verify(token, secret);
  console.log("OK", payload);
} catch (e) {
  console.log("FAIL", e.message);
}
