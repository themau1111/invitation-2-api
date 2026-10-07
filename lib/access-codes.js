const crypto = require("crypto");

function createAccessCode() {
  return crypto.randomInt(0, 10_000).toString().padStart(4, "0");
}

function hashAccessCode(code, secret) {
  return crypto.createHmac("sha256", secret).update(code).digest("hex");
}

module.exports = { createAccessCode, hashAccessCode };
