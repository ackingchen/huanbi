export default function ExhibitNav({ active, onSelect }) {
  const inExhibition = Boolean(onSelect);
  return <header className="exhibit-nav exhibit-width" style={{ viewTransitionName: 'persistent-nav' }}>
    <a className="exhibit-brand" href={inExhibition ? '#top' : '/'}>焕 壁 <span>敦煌意象 · 数字艺术展</span></a>
    <nav aria-label="展览导航">
      {[['archive', '丹青长廊'], ['treasures', '千壁藏珍']].map(([id, label]) => <a key={id} href={`${inExhibition ? '' : '/'}#${id}`} aria-current={active === id ? 'true' : undefined} onClick={inExhibition ? event => onSelect(event, id) : undefined}>{label}</a>)}
      <a className="exhibit-workbench" href="/workbench" aria-current={active === 'workbench' ? 'page' : undefined}>焕新之意</a>
      <a href="/cave" aria-current={active === 'cave' ? 'page' : undefined}>沉浸洞窟</a>
      <a href="/damage-atlas" aria-current={active === 'damage-atlas' ? 'page' : undefined}>病害图鉴</a>
    </nav>
  </header>;
}
