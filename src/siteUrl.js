const base = import.meta.env.BASE_URL;

export function siteUrl(path) {
  return path.startsWith('/') && !path.startsWith('//')
    ? base + path.slice(1)
    : path;
}

export function routePath(pathname) {
  const prefix = base.replace(/\/$/, '');
  const path = prefix && (pathname === prefix || pathname.startsWith(prefix + '/'))
    ? pathname.slice(prefix.length)
    : pathname;
  return path.replace(/\/$/, '') || '/';
}

export const isStaticHosting = import.meta.env.MODE === 'pages';
