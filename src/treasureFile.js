// Both collection entry points must load the full asset into the repair upload.
export async function loadTreasureFile(item, signal) {
  const response = await fetch(item.image, { signal });
  if (!response.ok) throw new Error('壁画加载失败，请稍后重试或选择其他画作。');
  const blob = await response.blob();
  if (!['image/webp', 'image/jpeg', 'image/png'].includes(blob.type) || !blob.size || blob.size > 20 * 1024 * 1024) {
    throw new Error('这幅壁画暂时无法载入，请选择其他画作。');
  }
  const extension = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' }[blob.type];
  return new File([blob], `${item.title}.${extension}`, { type: blob.type });
}
