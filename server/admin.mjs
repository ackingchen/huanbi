import { Router } from "express";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import rateLimit from "express-rate-limit";
import { readConfig, saveConfig, publicConfig } from "./config.mjs";
export const admin = Router();
const sessions = new Map();
admin.use((req, res, next) => {
  let host;
  try {
    host = new URL("http://" + req.headers.host).hostname;
  } catch {}
  if (!["localhost", "127.0.0.1", "[::1]"].includes(host))
    return res.status(403).json({ error: "当前管理后台仅允许本机访问。" });
  next();
});
admin.use((_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
admin.use((req, res, next) => {
  if (!["GET", "HEAD"].includes(req.method)) {
    let origin;
    try {
      origin = new URL(req.headers.origin).host;
    } catch {
      return res
        .status(403)
        .json({ error: "请求来源无效，请从管理页面操作。" });
    }
    if (origin !== req.headers.host)
      return res.status(403).json({ error: "请求来源不匹配。" });
  }
  next();
});
function token(req) {
  return /(?:^|; )huanbi_admin=([a-f0-9]+)/.exec(req.headers.cookie || "")?.[1];
}
function authorized(req) {
  const id = token(req),
    expiry = sessions.get(id);
  if (expiry > Date.now()) return true;
  sessions.delete(id);
  return false;
}
admin.get("/session", (req, res) =>
  res.json({
    setupRequired: !readConfig().passwordHash,
    authenticated: authorized(req),
  }),
);
const limiter = rateLimit({
  windowMs: 15 * 60000,
  limit: 15,
  message: { error: "尝试次数过多，请稍后再试。" },
});
admin.post("/login", limiter, (req, res) => {
  const c = readConfig(),
    password = req.body.password;
  if (
    typeof password !== "string" ||
    password.length < 10 ||
    password.length > 128
  )
    return res.status(400).json({ error: "管理员密码需 10–128 个字符。" });
  if (!c.passwordHash) {
    const salt = randomBytes(16).toString("hex");
    saveConfig({
      passwordSalt: salt,
      passwordHash: scryptSync(password, salt, 64).toString("hex"),
    });
  } else if (
    !timingSafeEqual(
      Buffer.from(c.passwordHash, "hex"),
      scryptSync(password, c.passwordSalt, 64),
    )
  )
    return res.status(401).json({ error: "密码不正确。" });
  for (const [id, expiry] of sessions)
    if (expiry < Date.now()) sessions.delete(id);
  const id = randomBytes(32).toString("hex");
  sessions.set(id, Date.now() + 8 * 3600000);
  res.cookie("huanbi_admin", id, {
    httpOnly: true,
    sameSite: "strict",
    secure: req.secure,
    maxAge: 8 * 3600000,
    path: "/api/admin",
  });
  res.json({ ok: true });
});
admin.use((req, res, next) =>
  authorized(req)
    ? next()
    : res.status(401).json({ error: "请先登录管理后台。" }),
);
admin.post("/logout", (req, res) => {
  sessions.delete(token(req));
  res.clearCookie("huanbi_admin", { path: "/api/admin" });
  res.json({ ok: true });
});
admin.get("/config", (_req, res) => res.json(publicConfig(readConfig())));
admin.put("/config", (req, res) => {
  try {
    const { baseURL, model, size, quality, prompt, apiKey, clearKey, apiMode, imagesCompat, textModel } =
      req.body;
    if (apiKey && clearKey) throw Error("请勿同时填写和清除 Key。");
    const patch = {
      baseURL:
        typeof baseURL === "string"
          ? baseURL.trim().replace(/\/+$/, "")
          : baseURL,
      model,
      size,
      quality,
      prompt,
      ...(apiMode !== undefined ? { apiMode } : {}),
      ...(imagesCompat !== undefined ? { imagesCompat } : {}),
      ...(textModel !== undefined ? { textModel: typeof textModel === 'string' ? textModel.trim() : textModel } : {}),
    };
    if (clearKey === true) patch.apiKey = "";
    else if (typeof apiKey === "string" && apiKey.trim())
      patch.apiKey = apiKey.trim();
    res.json(saveConfig(patch));
  } catch (e) {
    res.status(400).json({ error: e.message || "保存失败" });
  }
});
