const { getEnvironment } = require("./env");

function requestId(req) {
  return req.headers["x-vercel-id"] || crypto.randomUUID();
}

function setCors(req, res, methods) {
  const { appOrigin } = getEnvironment();
  const origin = req.headers.origin;
  if (origin && origin !== appOrigin) return false;

  if (origin === appOrigin) {
    res.setHeader("Access-Control-Allow-Origin", appOrigin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", methods.join(", "));
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  }
  return true;
}

function sendError(res, status, code, message, id) {
  res.setHeader("X-Request-Id", id);
  return res.status(status).json({ error: { code, message }, requestId: id });
}

function methodNotAllowed(res, methods, id) {
  res.setHeader("Allow", methods.join(", "));
  return sendError(res, 405, "method_not_allowed", "Método no permitido.", id);
}

module.exports = { methodNotAllowed, requestId, sendError, setCors };
