import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const directory =
  process.env.HUANBI_DATA_DIR ||
  fileURLToPath(new URL("../data/", import.meta.url));
const filename = path.join(directory, "settings.json");
export const defaultPrompt =
  "保留原始构图、线描、笔触、颜料颗粒、人物身份与历史痕迹。只修复剥落、裂纹、褪色和缺失区域。禁止新增现代物件、文字、水印或相框。输出一张平面档案影像。";
let stored = fs.existsSync(filename)
  ? JSON.parse(fs.readFileSync(filename, "utf8"))
  : {};
export function readConfig() {
  const config = {
    baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
    apiMode: process.env.OPENAI_IMAGE_API_MODE || "images",
    imagesCompat: process.env.OPENAI_IMAGES_COMPAT === "true",
    textModel: process.env.OPENAI_TEXT_MODEL || "gpt-5.5",
    size: "1024x1024",
    quality: "high",
    prompt: defaultPrompt,
    ...stored,
  };
  config.baseURL = normalizeBaseURL(config.baseURL);
  return config;
}
export function normalizeBaseURL(value) {
  const url = new URL(value);
  if (url.pathname === '/') url.pathname = '/v1';
  return url.href.replace(/\/+$/, '');
}
export function publicConfig(c) {
  const { apiKey, passwordHash, passwordSalt, ...safe } = c;
  return { ...safe, hasKey: Boolean(apiKey) };
}
export function validateConfig(c) {
  if (c.apiMode !== undefined && !["images", "responses"].includes(c.apiMode)) throw Error("请求协议无效。");
  if (c.imagesCompat !== undefined && typeof c.imagesCompat !== "boolean") throw Error("中转兼容设置无效。");
  if (c.textModel !== undefined && (typeof c.textModel !== "string" || !c.textModel.trim() || c.textModel.length > 150)) throw Error("文本模型名称无效。");
  const url = new URL(c.baseURL);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    /\/(images\/(edits|generations)|responses)\/?$/.test(url.pathname)
  )
    throw Error(
      "请填写 API 基础地址（通常以 /v1 结尾），不要填写 /images/edits。",
    );
  if (typeof c.model !== "string" || !c.model.trim() || c.model.length > 150)
    throw Error("请输入有效模型名称。");
  if (!["1024x1024", "1536x1024", "1024x1536", "auto"].includes(c.size))
    throw Error("尺寸无效。");
  if (!["auto", "low", "medium", "high"].includes(c.quality))
    throw Error("质量无效。");
  if (
    typeof c.prompt !== "string" ||
    c.prompt.length < 5 ||
    c.prompt.length > 10000
  )
    throw Error("提示词须为 5–10000 字符。");
  if (typeof c.apiKey !== "string" || c.apiKey.length > 4096)
    throw Error("Key 无效。");
}
export function saveConfig(patch) {
  const next = { ...readConfig(), ...patch };
  validateConfig(next);
  next.baseURL = normalizeBaseURL(next.baseURL);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(filename + ".tmp", JSON.stringify(next, null, 2), {
    mode: 0o600,
  });
  fs.renameSync(filename + ".tmp", filename);
  stored = next;
  return publicConfig(next);
}
