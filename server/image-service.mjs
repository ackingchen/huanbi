import OpenAI from 'openai';

// Protocol adapted from Image-Studio's Images API and Responses request models.
// Requests are not retried automatically, to avoid duplicate image-generation charges.
export async function restoreImage(config, image, prompt, signal) {
  const client = new OpenAI({apiKey:config.apiKey,baseURL:config.baseURL.replace(/\/+$/, ''),timeout:480000,maxRetries:0});
  if (config.apiMode === 'responses') {
    const stream = await client.responses.create({
      model: config.textModel || 'gpt-5.5',
      input: [{role:'user',content:[{type:'input_text',text:prompt},{type:'input_image',image_url:`data:image/png;base64,${image.toString('base64')}`}]}],
      tools: [{type:'image_generation',model:config.model,action:'edit',size:config.size,quality:config.quality,output_format:'png'}],
      tool_choice: {type:'image_generation'}, store:false, stream:true,
    }, {signal});
    let encoded;
    for await (const event of stream) {
      if (event.type === 'response.output_item.done' && event.item?.type === 'image_generation_call') encoded = event.item.result || encoded;
      if (event.type === 'response.completed') encoded = event.response?.output?.find(item => item.type === 'image_generation_call' && item.result)?.result || encoded;
      if (['error','response.failed','response.incomplete'].includes(event.type)) throw new Error('图片服务未完成生成，请检查模型权限或稍后重试。');
    }
    return imageResult({b64_json:encoded});
  }
  const output = await client.images.edit({
    model:config.model,
    image:new File([image],'mural.png',{type:'image/png'}),
    prompt,size:config.size,quality:config.quality,n:1,output_format:'png',
    ...(config.imagesCompat ? {response_format:'b64_json'} : {}),
  }, {signal});
  if (typeof output === 'string' && /<(!doctype|html)/i.test(output)) {
    const error = new Error('接口返回了网页，请检查 API 基础地址是否包含 /v1。');
    error.code = 'INVALID_API_ENDPOINT';
    throw error;
  }
  return imageResult(output.data?.[0]);
}

function imageResult(item) {
  if (typeof item?.b64_json === 'string' && item.b64_json.trim()) {
    const encoded = item.b64_json.trim();
    if (/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return `data:image/png;base64,${encoded}`;
  }
  if (typeof item?.url === 'string') {
    try {
      const url = new URL(item.url);
      if (url.protocol === 'https:' && !url.username && !url.password) return url.href;
    } catch { /* Reject malformed or executable URLs. */ }
  }
  throw new Error('接口未返回有效图片，请检查模型和请求协议。');
}
