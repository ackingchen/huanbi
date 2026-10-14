import collection from './treasures.json';
import { siteUrl } from './siteUrl';

export default collection.map(item => ({
  ...item,
  image: siteUrl(item.image),
  thumbnail: siteUrl(item.thumbnail),
}));
