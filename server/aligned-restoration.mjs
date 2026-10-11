import sharp from 'sharp';
import { restoreImage } from './image-service.mjs';

export async function restoreAlignedImage(config, source, prompt, signal, generate = restoreImage) {
  const {data: oriented, info} = await sharp(source, {limitInputPixels:40000000}).rotate().png().toBuffer({resolveWithObject:true});
  const ratio = info.width / info.height;
  const [width,height] = ratio > 1.05 ? [1536,1024] : ratio < 1 / 1.05 ? [1024,1536] : [1024,1024];
  const scale = Math.min(width/info.width,height/info.height);
  const contentWidth = Math.max(1,Math.round(info.width*scale));
  const contentHeight = Math.max(1,Math.round(info.height*scale));
  const left = Math.floor((width-contentWidth)/2), top = Math.floor((height-contentHeight)/2);
  const canvas = await sharp(oriented).resize(contentWidth,contentHeight).extend({left,right:width-contentWidth-left,top,bottom:height-contentHeight-top,background:'#182623'}).png().toBuffer();
  const geometry = `\n强制构图约束：输出画布必须为 ${width}×${height}。原图完整位于左上角 (${left},${top})、宽 ${contentWidth}、高 ${contentHeight} 的矩形内；矩形外为辅助补边，不是壁画。保持补边和原图边界位置不变。禁止缩放、移动、旋转、裁剪原图内容；禁止改变人物和纹样的位置与比例，只在原有位置修复。原图区域必须满幅呈现，禁止新增白边、白色画框、留白、装裱或内边距；辅助补边必须保持原来的深色。`;
  const result = await generate({...config,size:`${width}x${height}`},canvas,prompt+geometry,signal);
  // Require inline bytes so validation and download use the same durable image.
  if (!result.startsWith('data:image/png;base64,')) {
    const error = new Error('图片服务返回了链接，无法校验叠加尺寸。请启用中转兼容模式，让服务返回 base64 图片。');
    error.code='IMAGE_GEOMETRY';throw error;
  }
  const bytes = Buffer.from(result.split(',')[1],'base64');
  const metadata = await sharp(bytes,{limitInputPixels:40000000}).metadata();
  if (!metadata.width || !metadata.height || Math.abs(metadata.width/metadata.height-width/height)/(width/height) > .005) {
    const error = new Error('图片服务未遵循原图画布比例，无法重合对比。请使用支持横竖尺寸的图片模型或中转服务。');
    error.code='IMAGE_GEOMETRY';throw error;
  }
  const fullCanvas = await sharp(bytes).resize(width,height).png().toBuffer();
  const content = await sharp(fullCanvas).extract({left,top,width:contentWidth,height:contentHeight}).png().toBuffer();
  const cleaned = await removeAddedWhiteFrame(content, oriented);
  const aligned = await sharp(cleaned).resize(info.width,info.height,{fit:'fill'}).png().toBuffer();
  return `data:image/png;base64,${aligned.toString('base64')}`;
}

// Conservative frame detection: require continuous, near-white borders on all
// four sides, limited to 8% per side. Never trim natural one-sided highlights.
async function whiteFrame(image) {
  const {data,info} = await sharp(image).flatten({background:'#182623'}).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const {width,height,channels}=info;
  const white=(x,y)=>{const i=(y*width+x)*channels;const rgb=[data[i],data[i+1],data[i+2]];return Math.min(...rgb)>=238 && Math.max(...rgb)-Math.min(...rgb)<=12;};
  const row=y=>{let n=0;for(let x=0;x<width;x++)if(white(x,y))n++;return n/width>=.995;};
  const col=x=>{let n=0;for(let y=0;y<height;y++)if(white(x,y))n++;return n/height>=.995;};
  const scan=(max,check)=>{let n=0;while(n<=max&&check(n))n++;return n;};
  const maxX=Math.floor(width*.08),maxY=Math.floor(height*.08);
  const left=scan(maxX,col),right=scan(maxX,x=>col(width-1-x));
  const top=scan(maxY,row),bottom=scan(maxY,y=>row(height-1-y));
  return {left,right,top,bottom,width,height,valid:left>=2&&right>=2&&top>=2&&bottom>=2&&left<=maxX&&right<=maxX&&top<=maxY&&bottom<=maxY};
}
export async function removeAddedWhiteFrame(generated,source) {
  const frame=await whiteFrame(generated);
  if(!frame.valid)return generated;
  const original=await whiteFrame(source);
  // A white source boundary may be intentional; preserve it conservatively.
  if(original.left||original.right||original.top||original.bottom)return generated;
  return sharp(generated).extract({left:frame.left,top:frame.top,width:frame.width-frame.left-frame.right,height:frame.height-frame.top-frame.bottom}).png().toBuffer();
}
