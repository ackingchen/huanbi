const DB_NAME = 'huanbi-restoration-history';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('images', { keyPath: 'id', autoIncrement: true });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transaction(mode, operation) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('images', mode);
    let result;
    tx.oncomplete = () => { db.close(); resolve(result); };
    tx.onabort = tx.onerror = () => { db.close(); reject(tx.error || new Error('缓存写入失败')); };
    operation(tx.objectStore('images'), value => { result = value; });
  });
}

export function listHistory() {
  return transaction('readonly', (store, done) => {
    store.getAll().onsuccess = event => done(event.target.result.reverse());
  });
}

export async function saveHistory(imageUrl, name) {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error('无法读取修复图片');
  const blob = await response.blob();
  if (!blob.size || !blob.type.startsWith('image/')) throw new Error('修复图片格式无效');
  // Persist actual image bytes; provider URLs and object URLs may expire.
  await transaction('readwrite', store => {
    store.add({ blob, name, createdAt: Date.now() });
    store.getAllKeys().onsuccess = event => {
      const keys = event.target.result;
      keys.slice(0, Math.max(0, keys.length - 5)).forEach(key => store.delete(key));
    };
  });
}

export function deleteHistory(id) {
  return transaction('readwrite', store => store.delete(id));
}
