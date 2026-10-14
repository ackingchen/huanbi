import { isStaticHosting, siteUrl } from './siteUrl';
import { useEffect, useState } from "react";
import { Button } from "./components/Button";
import { Settings, ShieldCheck, LogOut, Save, KeyRound } from "lucide-react";
async function request(path, options = {}) {
  if (isStaticHosting) throw new Error("在线展示版未连接后台服务，暂不支持管理配置。");
  const response = await fetch("/api/admin/" + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await response.json();
  if (!response.ok)
    throw Object.assign(new Error(data.error || "请求失败"), {
      status: response.status,
    });
  return data;
}
export default function Admin() {
  const [session, setSession] = useState(null),
    [config, setConfig] = useState(null),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [apiKey, setApiKey] = useState(""),
    [clearKey, setClearKey] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  async function load() {
    try {
      const s = await request("session");
      setSession(s);
      if (s.authenticated) setConfig(await request("config"));
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function login(e) {
    e.preventDefault();
    setError("");
    if (session.setupRequired && password !== confirm) {
      setError("两次输入的密码不一致。");
      return;
    }
    setBusy(true);
    try {
      await request("login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setPassword("");
      setConfirm("");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const updated = await request("config", {
        method: "PUT",
        body: JSON.stringify({ ...config, apiKey, clearKey }),
      });
      setConfig(updated);
      setApiKey("");
      setClearKey(false);
      setMessage("已保存，下一次修复请求将使用新配置。");
    } catch (e) {
      setError(e.message);
      if (e.status === 401) {
        setConfig(null);
        await load();
      }
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    try {
      await request("logout", { method: "POST" });
      setConfig(null);
      setApiKey("");
      setMessage("");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const update = (field, value) => {
    setConfig((c) => ({ ...c, [field]: value }));
    setMessage("");
  };
  return (
    <div className="app admin-app">
      <header>
        <a className="brand" href={siteUrl("/")}>
          <b>焕</b>焕壁<small>管理工作室</small>
        </a>
        <a className="nav-cta" href={siteUrl("/workbench")}>
          返回修复工作台 ↗
        </a>
      </header>
      <main className="admin-main">
        <div className="heading">
          <div>
            <p className="eyebrow">HUANBI / ADMINISTRATION</p>
            <h1 className="admin-title">
              丹青有序，<i>配置随心。</i>
            </h1>
            <p className="admin-sub">
              在这里连接你的影像服务，设定每一次修复的起点。
            </p>
          </div>
          {config && (
            <Button disabled={busy} variant="outline" onClick={logout}>
              <LogOut size={16} />
              退出登录
            </Button>
          )}
        </div>
        {error && (
          <p className="admin-alert" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="admin-success" role="status">
            {message}
          </p>
        )}
        {!session ? (
          <p role="status">{error ? '后台服务未连接' : '正在连接后台…'}</p>
        ) : !session.authenticated ? (
          <form className="card login-card" onSubmit={login}>
            <KeyRound />
            <h2>{session.setupRequired ? "建立管理员账号" : "登录管理后台"}</h2>
            <p>
              {session.setupRequired
                ? "首次使用请设置管理员密码，之后使用此密码登录。"
                : "请输入你的管理员密码。"}
            </p>
            <label>
              管理员密码
              <input
                type="password"
                autoComplete={
                  session.setupRequired ? "new-password" : "current-password"
                }
                required
                minLength={10}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {session.setupRequired && (
              <label>
                再次输入密码
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={10}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </label>
            )}
            <small>10–128 个字符</small>
            <Button disabled={busy} type="submit">
              {busy
                ? "请稍候…"
                : session.setupRequired
                  ? "设置密码并进入"
                  : "登录"}
            </Button>
          </form>
        ) : config ? (
          <form onSubmit={save}>
            <fieldset disabled={busy} className="admin-fields">
              <div className="admin-layout">
                <aside className="admin-aside">
                  <Settings size={24} />
                  <h2>服务配置</h2>
                  <p>支持 OpenAI 兼容的图片编辑接口。</p>
                  <span className="key-status">
                    <ShieldCheck size={16} />
                    {config.hasKey ? "已保存 API Key" : "尚未配置 API Key"}
                  </span>
                  <p>
                    基础地址示例：
                    <br />
                    <code>https://你的域名/v1</code>
                  </p>
                  <p>
                    服务将自动追加 <code>/images/edits</code>
                    。如果中转站要求其他路径，请填写对应的基础前缀。
                  </p>
                </aside>
                <div className="admin-cards">
                  <section className="card">
                    <p className="eyebrow">01 / CONNECTION</p>
                    <h2>中转站连接</h2>
                    <label>
                      API 基础地址
                      <input
                        type="url"
                        required
                        value={config.baseURL}
                        onChange={(e) => update("baseURL", e.target.value)}
                        placeholder="https://api.example.com/v1"
                      />
                    </label>
                    <label>
                      API Key
                      <input
                        type="password"
                        autoComplete="off"
                        maxLength={4096}
                        value={apiKey}
                        disabled={clearKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={
                          config.hasKey
                            ? "已保存 · 留空保留原 Key"
                            : "请输入中转站 API Key"
                        }
                      />
                    </label>
                    <p className="help">
                      Key 只提交到后端，页面不会回显已保存的密钥。
                    </p>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={clearKey}
                        onChange={(e) => {
                          setClearKey(e.target.checked);
                          setApiKey("");
                        }}
                      />
                      清除已保存的 Key（停止生成）
                    </label>
                    <label>
                      请求协议
                      <select value={config.apiMode || 'images'} onChange={e => update('apiMode', e.target.value)}>
                        <option value="images">Images API · 图片编辑</option>
                        <option value="responses">Responses API · 图像工具</option>
                      </select>
                    </label>
                    {config.apiMode === 'responses' ? <label>
                      Responses 文本模型
                      <input required maxLength={150} value={config.textModel || ''} onChange={e => update('textModel', e.target.value)} placeholder="gpt-5.5" />
                      <span className="help">文本模型负责调用图像工具；下方填写实际绘图模型。</span>
                    </label> : <label className="checkbox-label">
                      <input type="checkbox" checked={Boolean(config.imagesCompat)} onChange={e => update('imagesCompat', e.target.checked)} />
                      中转兼容模式（额外请求 b64_json 返回）
                    </label>}
                    <label>
                      模型名称
                      <input
                        required
                        maxLength={150}
                        value={config.model}
                        onChange={(e) => update("model", e.target.value)}
                        placeholder="gpt-image-2"
                      />
                    </label>
                  </section>
                  <section className="card">
                    <p className="eyebrow">02 / IMAGE SETTINGS</p>
                    <h2>出图与修复规范</h2>
                    <div className="admin-row">
                      <label>
                        生成画布（修复时按原图自动匹配）
                        <select disabled value="source">
                          <option value="source">跟随原图比例 · 下载保持原图尺寸</option>
                        </select>
                      </label>
                      <label>
                        输出质量
                        <select
                          value={config.quality}
                          onChange={(e) => update("quality", e.target.value)}
                        >
                          {["high", "medium", "low", "auto"].map((v) => (
                            <option key={v}>{v}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <p className="help">
                      可用模型、尺寸和质量以你的中转站支持情况为准。
                    </p>
                    <label>
                      补充修复提示词
                      <textarea
                        required
                        minLength={5}
                        maxLength={10000}
                        rows={8}
                        value={config.prompt}
                        onChange={(e) => update("prompt", e.target.value)}
                      />
                    </label>
                    <p className="help">
                      会附加在基础修复提示词后；原有文化语境、模式和强度继续生效。
                    </p>
                  </section>
                  <div className="admin-save">
                    <span>保存后即时生效，无需重启</span>
                    <Button type="submit" disabled={busy}>
                      <Save size={16} />
                      {busy ? "保存中…" : "保存配置"}
                    </Button>
                  </div>
                </div>
              </div>
            </fieldset>
          </form>
        ) : (
          <p>正在读取配置…</p>
        )}
      </main>
      <footer>焕壁 · 数字文保实验室 / 管理工作室</footer>
    </div>
  );
}
