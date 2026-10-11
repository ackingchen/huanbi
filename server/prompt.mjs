const contexts = new Set([
  "敦煌 · 莫高窟",
  "永乐宫 · 三清殿",
  "法海寺 · 大雄宝殿",
]);
export function validateSettings({ mode, strength, context }) {
  if (!["考据修复", "艺术焕新"].includes(mode)) throw new Error("Invalid mode");
  if (
    !Number.isFinite(Number(strength)) ||
    Number(strength) < 20 ||
    Number(strength) > 100
  )
    throw new Error("Invalid strength");
  if (!contexts.has(context)) throw new Error("Invalid context");
}
export function makePrompt({ mode, strength, context }) {
  validateSettings({ mode, strength, context });
  const rule =
    mode === "考据修复"
      ? "以考据为先，保持缺失区域克制留白，严格遵循已有线描与历史色彩。"
      : "允许在原有线描和色彩谱系内进行克制的艺术推演，但不能改变构图与时代特征。";
  return `你是中国古代壁画数字修复助手。文化语境：${context}。${rule}修复强度：${strength}%。只修复剥落、裂纹、褪色与缺失区域；保留原始构图、线描、笔触、颜料颗粒、人物身份与历史痕迹。禁止新增现代物件、文字、水印、相框或摄影化细节。输出一张平面档案影像。`;
}
