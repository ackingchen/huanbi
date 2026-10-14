import "dotenv/config";
import express from "express";
import multer from "multer";
import { restoreAlignedImage } from "./aligned-restoration.mjs";
import sharp from "sharp";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { makePrompt } from "./prompt.mjs";
import { admin } from "./admin.mjs";
import { readConfig } from "./config.mjs";
const app = express();
app.use("/api/admin", express.json({ limit: "32kb" }), admin);
const dir = path.dirname(fileURLToPath(import.meta.url));
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1, fields: 3 },
  fileFilter: (_req, file, cb) =>
    cb(null, ["image/png", "image/jpeg", "image/webp"].includes(file.mimetype)),
});
app.disable("x-powered-by");
app.get("/api/health", (_req, res) =>
  res.json({ ready: Boolean(readConfig().apiKey) }),
);
app.use(
  "/api/restore",
  rateLimit({
    windowMs: 60000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "操作频繁，请一分钟后再试。" },
  }),
);
app.post("/api/restore", upload.single("image"), async (req, res) => {
  res.set("Cache-Control", "no-store");
  if (!req.file)
    return res.status(400).json({ error: "请上传 JPG、PNG 或 WEBP 图片。" });
  const config = readConfig();
  let prompt;
  try {
    prompt = makePrompt(req.body) + "\n管理员补充修复规范：" + config.prompt;
  } catch {
    return res.status(400).json({ error: "修复参数无效，请重新选择。" });
  }
  let normalized;
  try {
    normalized = await sharp(req.file.buffer, { limitInputPixels: 40000000 })
      .rotate()
      .png()
      .toBuffer();
  } catch {
    return res
      .status(400)
      .json({ error: "图片损坏或像素过大，请换一张图片。" });
  }
  if (!config.apiKey)
    return res.status(503).json({
      error: "尚未配置图片生成密钥。请前往管理后台配置中转站地址和 Key。",
    });
  try {
    const controller = new AbortController();
    const abort = () => { if (!res.writableEnded) controller.abort(); };
    res.on('close', abort);
    try {
      const imageUrl = await restoreAlignedImage(config, normalized, prompt, controller.signal);
      if (!res.destroyed) res.json({ imageUrl });
    } finally {
      res.off('close', abort);
    }
  } catch (error) {
    if (res.destroyed) return;
    console.error("Image edit failed", error.status || error.name);
    res.status(502).json({
      error:
        error.code === "IMAGE_GEOMETRY"
          ? error.message
          : error.code === "INVALID_API_ENDPOINT"
          ? "接口返回了网页，请检查 API 基础地址是否包含 /v1。"
          : error.name === "APIConnectionTimeoutError"
          ? "图片生成超时，请稍后重试。"
          : error.status === 401
          ? "图片服务认证失败，请检查服务器密钥。"
          : error.status === 429
            ? "图片服务额度不足或限流，请稍后重试。"
            : "图片生成失败，请检查模型权限、服务地址或稍后重试。",
    });
  }
});
app.use("/api", (_req, res) => res.status(404).json({ error: "接口不存在" }));
app.use((err, _req, res, next) => {
  if (!err) return next();
  res.status(400).json({
    error:
      err.code === "LIMIT_FILE_SIZE"
        ? "图片不能超过 20MB。"
        : "上传失败，请检查文件格式和大小。",
  });
});
app.use(express.static(path.join(dir, "../dist")));
app.get("/{*path}", (_req, res) =>
  res.sendFile(path.join(dir, "../dist/index.html")),
);
app.listen(process.env.PORT || 8787, "127.0.0.1", () =>
  console.log(`焕壁 http://127.0.0.1:${process.env.PORT || 8787}`),
);
