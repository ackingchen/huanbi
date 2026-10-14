import { routePath, siteUrl } from '../siteUrl';
import { Component, createContext, Suspense, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, useTransition, ViewTransition } from 'react';
import ExhibitNav from './ExhibitNav';
import '../page-transitions.css';

const NavigationContext = createContext(null);
const publicPaths = new Set(['/', '/workbench', '/cave', '/damage-atlas', '/admin']);
const normalizePath = routePath;
const readLocation = revision => ({
  pathname: normalizePath(location.pathname), href: location.href,
  hash: location.hash, revision,
});
export const useSiteNavigation = () => useContext(NavigationContext);

function LoadingPage() {
  return <div className="site-loading" role="status"><span>焕 壁</span><p>正在展开千年丹青…</p></div>;
}

class RouteFailure extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <div className="exhibition-page exhibit-main site-route-error"><ExhibitNav /><main><h1>画卷暂未展开</h1><p>页面未能载入，请检查网络后重试。</p><button onClick={() => location.reload()}>重新载入</button><a href={siteUrl("/#archive")}>返回丹青长廊</a></main></div>;
  }
}

export default function SiteRouter({ Exhibition, Workbench, Cave, DamageAtlas, Admin, preloaders }) {
  const [route, setRoute] = useState(() => readLocation(0));
  const [pending, startTransition] = useTransition();
  const revision = useRef(0);
  const committed = useRef(route);
  const requested = useRef(route.href);
  const positions = useRef(new Map());
  const preload = useCallback(href => {
    const url = new URL(href, location.href);
    if (url.origin === location.origin) preloaders[normalizePath(url.pathname)]?.().catch(() => {});
  }, [preloaders]);

  const navigate = useCallback((href, { fromHistory = false } = {}) => {
    const destination = new URL(href, location.href);
    if (destination.origin !== location.origin || !publicPaths.has(normalizePath(destination.pathname))) return;
    // popstate and hashchange can describe the same history traversal.
    if (fromHistory && requested.current === destination.href && !document.documentElement.dataset.huanbiTurn) return;
    positions.current.set(committed.current.href, scrollY);
    const commit = () => {
      if (!fromHistory && committed.current.pathname === '/' && normalizePath(destination.pathname) === '/' && ['#archive', '#treasures'].includes(destination.hash)) {
        document.getElementById('exhibition')?.scrollIntoView({ behavior: 'instant' });
      }
      if (!fromHistory && destination.href !== location.href) history.pushState(null, '', destination.href);
      requested.current = destination.href;
      const next = { ...readLocation(++revision.current), fromHistory };
      startTransition(() => setRoute(next));
    };
    if (window.HuanbiTurn) window.HuanbiTurn.run(committed.current.href, destination.href, commit, () => preloaders[normalizePath(destination.pathname)]?.());
    else commit();
  }, [preloaders]);

  useEffect(() => {
    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    const linkFrom = event => {
      const anchor = event.target.closest?.('a[href]');
      if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return null;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin || !publicPaths.has(normalizePath(url.pathname))) return null;
      return anchor;
    };
    const click = event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = linkFrom(event);
      if (!link) return;
      event.preventDefault();
      navigate(link.href);
    };
    const intent = event => { const link = linkFrom(event); if (link) preload(link.href); };
    const sync = () => navigate(location.href, { fromHistory: true });
    document.addEventListener('click', click);
    document.addEventListener('pointerover', intent);
    document.addEventListener('focusin', intent);
    addEventListener('popstate', sync);
    addEventListener('hashchange', sync);
    return () => {
      history.scrollRestoration = previousRestoration;
      document.removeEventListener('click', click);
      document.removeEventListener('pointerover', intent);
      document.removeEventListener('focusin', intent);
      removeEventListener('popstate', sync);
      removeEventListener('hashchange', sync);
    };
  }, [navigate, preload]);

  useLayoutEffect(() => {
    const previous = committed.current;
    committed.current = route;
    if (route.pathname === '/admin') delete document.documentElement.dataset.siteShell;
    else document.documentElement.dataset.siteShell = 'true';
    if (route.pathname !== '/cave') {
      delete document.documentElement.dataset.caveEntry;
      document.getElementById('cave-boot-screen')?.remove();
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', route.pathname === '/admin' ? '#f5f1e8' : route.pathname === '/cave' ? '#12201a' : '#10292c');
    if (route.revision === 0) return;
    const savedPosition = route.fromHistory ? positions.current.get(route.href) : undefined;
    if (savedPosition !== undefined) scrollTo({ top: savedPosition, behavior: 'instant' });
    else if (route.pathname === '/' && ['#archive', '#treasures'].includes(route.hash)) {
      document.getElementById('exhibition')?.scrollIntoView({ behavior: 'instant' });
    } else if (route.hash && document.getElementById(route.hash.slice(1))) {
      document.getElementById(route.hash.slice(1)).scrollIntoView({ behavior: 'instant' });
    } else if (previous.pathname !== route.pathname || !route.hash) scrollTo({ top: 0, behavior: 'instant' });
    if (previous.pathname !== route.pathname) {
      document.querySelector('.exhibit-nav nav a[aria-current]')?.focus({ preventScroll: true });
    }
    window.HuanbiTurn?.settled(route.href);
  }, [route]);

  const Page = route.pathname === '/admin' ? Admin : route.pathname === '/workbench' ? Workbench : route.pathname === '/cave' ? Cave : route.pathname === '/damage-atlas' ? DamageAtlas : Exhibition;
  return <NavigationContext.Provider value={{ ...route, navigate, pending }}>
    <Suspense fallback={<LoadingPage />}>
      <RouteFailure key={route.pathname}>
        <ViewTransition key={route.pathname} name="huanbi-page" default="none" share="auto" enter="fade-in" exit="fade-out">
          <Page onSceneSettled={() => document.getElementById('cave-boot-screen')?.remove()} />
        </ViewTransition>
      </RouteFailure>
    </Suspense>
    {pending && <div className="site-navigation-pending" role="status"><span />正在展开画卷…</div>}
  </NavigationContext.Provider>;
}
