import { ArrowUpRight } from 'lucide-react';
import '../huanbi-series-explore.css';

const pages = [
  { id: 'archive', name: '丹青长廊', word: '画', eyebrow: '经典壁画 / ARCHIVE', poem: '一幅一停留，一眼一千年。', description: '走近散花飞天、九色鹿等五幅经典壁画，展开画卷，细赏构图与故事。', href: '/#archive', button: '走进丹青长廊', symbol: 'scroll' },
  { id: 'treasures', name: '千壁藏珍', word: '藏', eyebrow: '图像珍藏 / COLLECTION', poem: '循飞天衣带，拾壁上繁花。', description: '按五类主题浏览 150 幅珍藏壁画，打开大图细赏，也可选入数字修复工作台。', href: '/#treasures', button: '翻阅千壁藏珍', symbol: 'scroll' },
  { id: 'workbench', name: '焕新之意', word: '新', eyebrow: '数字修复 / RESTORATION', poem: '让岁月留痕，让丹青新生。', description: '上传壁画或选用珍藏，尝试数字补色与补图，并对比生成前后的画面。', href: '/workbench', button: '开启数字修复', symbol: 'brush' },
  { id: 'cave', name: '沉浸洞窟', word: '窟', eyebrow: '意象空间 / GROTTO', poem: '循一束微光，入丹青深处。', description: '走进敦煌意象空间，转动视角、移步观赏，在岩壁之间遇见千年丹青。', href: '/cave', button: '走进沉浸洞窟', symbol: 'atlas' },
  { id: 'damage-atlas', name: '病害图鉴', word: '鉴', eyebrow: '观察与保护 / CONSERVATION', poem: '知其美，也知其脆弱。', description: '认识褪色、裂隙、起甲等六类常见病害，从观察画面走向理解壁画保护。', href: '/damage-atlas', button: '翻开病害图鉴', symbol: 'atlas' },
];

export default function SeriesExplore({ active = 'archive' }) {
  return <section id={active === 'archive' || active === 'treasures' ? 'method' : 'continue-exploring'} className="series-explore exhibit-width" aria-labelledby="series-explore-title" data-current={active}>
    <div className="series-explore-heading">
      <p className="series-explore-kicker">画卷有尽 · 探索未完</p>
      <h2 id="series-explore-title">沿着丹青，再启一程。</h2>
      <p className="series-explore-intro">观画、拾珍、入窟、焕新，循着你感兴趣的方向，继续走近壁上千年。</p>
    </div>
    <div className="series-explore-grid">{pages.filter(item => item.id !== active).map(item => <article className="series-explore-card" data-page={item.id} key={item.id}>
      <p className="series-explore-meta">{item.eyebrow}</p>
      <span className="series-explore-seal" aria-hidden="true">{item.word}</span>
      <h3>{item.name}</h3>
      <p className="series-explore-poem">{item.poem}</p>
      <p className="series-explore-description">{item.description}</p>
      <a className="series-explore-link" href={item.href} data-symbol={item.symbol}>{item.button}<ArrowUpRight size={18} aria-hidden="true" /></a>
    </article>)}</div>
  </section>;
}
