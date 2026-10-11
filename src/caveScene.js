import * as THREE from 'three';

export function createCave(host, items, onSelect, onReady, onError) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#100e0c');
  scene.fog = new THREE.FogExp2('#211910', .032);
  const camera = new THREE.PerspectiveCamera(65, 1, .05, 80);
  camera.position.set(.2, 1.7, 6);
  const destination=camera.position.clone();
  const heldKeys=new Set();let stride=0,bob=0;
  let yaw = 0, pitch = .05, frame, disposed = false, auto = false, audio = null, lastStep = 0;
  const materials = new Set(), geometries = new Set(), textures = new Set();
  function material(options) { const m = new THREE.MeshStandardMaterial(options); materials.add(m); return m; }
  function mesh(geometry, mat, position, rotation = [0, 0, 0]) {
    geometries.add(geometry);const object = new THREE.Mesh(geometry, mat);
    object.position.set(...position);object.rotation.set(...rotation);scene.add(object);return object;
  }

  let seed=1937;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#796650';ctx.fillRect(0,0,1024,1024);
  for(let i=0;i<2200;i++) {
    const x=random()*1024,y=random()*1024,r=5+random()*100;
    const grad=ctx.createRadialGradient(x,y,0,x,y,r);
    grad.addColorStop(0,i%3?'#bba07e25':'#302b2538');grad.addColorStop(1,'#79665000');
    ctx.fillStyle=grad;ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  for(let i=0;i<80000;i++){ctx.fillStyle=random()>.5?'#dec5a329':'#221e1833';ctx.fillRect(random()*1024,random()*1024,1+random()*3,1+random()*2);}
  for(let i=0;i<90;i++) {
    let x=random()*1024,y=random()*1024;ctx.beginPath();ctx.moveTo(x,y);
    for(let j=0;j<8;j++){x+=(random()-.5)*24;y+=random()*14;ctx.lineTo(x,y);}
    ctx.strokeStyle='#32281f35';ctx.lineWidth=.5+random()*1.5;ctx.stroke();
  }
  const stoneTexture=new THREE.CanvasTexture(canvas);stoneTexture.colorSpace=THREE.SRGBColorSpace;
  stoneTexture.wrapS=stoneTexture.wrapT=THREE.RepeatWrapping;stoneTexture.repeat.set(3,3);textures.add(stoneTexture);
  const stone=material({map:stoneTexture,bumpMap:stoneTexture,bumpScale:.12,roughness:1,side:THREE.DoubleSide});
  const floorMat=material({map:stoneTexture,bumpMap:stoneTexture,bumpScale:.07,color:'#938575',roughness:1});
  const darkStone=material({map:stoneTexture,color:'#5d4c3d',roughness:1,side:THREE.DoubleSide});
  function relief(theta,z){return .15*Math.sin(theta*9+z*1.8)+.075*Math.sin(theta*23-z*3.1)+.035*Math.cos(theta*43+z*5.7);}
  function widthAt(z){return 5.8+.27*Math.sin(z*.7)+.12*Math.cos(z*1.7);}
  function heightAt(z){return 6.8+.35*Math.sin(z*.55);}
  // A continuous eroded vault replaces separate rectangular walls and ceiling.
  function vault(start,end,width,height,main=false) {
    const vertices=[],uv=[],indices=[],colors=[];const across=64,along=Math.ceil((end-start)*5);
    for(let j=0;j<=along;j++) {
      const z=start+(end-start)*j/along;
      for(let i=0;i<=across;i++) {
        const theta=i/across*Math.PI,erode=relief(theta,z);
        vertices.push(Math.cos(theta)*((main?widthAt(z):width)+erode),Math.sin(theta)*((main?heightAt(z):height)+erode),z);
        uv.push(i/across,j/along);
        const tint=.79+.12*Math.sin(theta*7+z*2)+random()*.08;colors.push(tint,tint*.96,tint*.88);
        if(i<across&&j<along){const k=j*(across+1)+i;indices.push(k,k+1,k+across+1,k+1,k+across+2,k+across+1);}
      }
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
    const mat=stone.clone();mat.vertexColors=true;materials.add(mat);return mesh(g,mat,[0,0,0]);
  }
  vault(-8,8,0,0,true);vault(-11,-8,2.45,4.65);vault(8,17,1.7,3.5);
  function archPath(path,w,h){path.moveTo(-w,0);path.lineTo(w,0);for(let i=0;i<=48;i++){const t=i/48*Math.PI;path.lineTo(Math.cos(t)*w,Math.sin(t)*h);}path.closePath();}
  function endWall(z,holeWidth,holeHeight) {
    const shape=new THREE.Shape();archPath(shape,widthAt(z),heightAt(z));
    const hole=new THREE.Path();archPath(hole,holeWidth,holeHeight);shape.holes.push(hole);
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:.65,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.14,bevelThickness:.14,curveSegments:36});
    const pos=geometry.attributes.position;
    for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i);pos.setZ(i,pos.getZ(i)+.08*Math.sin(x*6+y*4));}
    geometry.computeVertexNormals();mesh(geometry,stone,[0,0,z]);
  }
  endWall(-8,2.45,4.65);endWall(8,1.7,3.5);
  const niche=new THREE.Shape();archPath(niche,2.45,4.65);mesh(new THREE.ShapeGeometry(niche),darkStone,[0,0,-11]);
  const exit=new THREE.Shape();archPath(exit,1.7,3.5);mesh(new THREE.ShapeGeometry(exit),darkStone,[0,0,17]);
  const floor=new THREE.PlaneGeometry(12,30,70,110);floor.rotateX(-Math.PI/2);
  const fp=floor.attributes.position;
  for(let i=0;i<fp.count;i++){const x=fp.getX(i),z=fp.getZ(i);fp.setY(i,.025+.015*Math.sin(x*3+z*2)+.015*Math.sin(z*5-x));}
  floor.computeVertexNormals();mesh(floor,floorMat,[0,0,3]);
  function rock(x,y,z,sx,sy,sz) {
    const g=new THREE.IcosahedronGeometry(1,2),pos=g.attributes.position;
    for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);const r=1+.10*Math.sin(x*19+y*13+z*11);pos.setXYZ(i,x*r,y*r,z*r);}g.computeVertexNormals();
    const object=mesh(g,stone,[x,y,z]);object.scale.set(sx,sy,sz);return object;
  }
  for(const z of [-7.9,7.8])for(const side of [-1,1]) {
    for(let j=0;j<5;j++)rock(side*(z<0?2.75:2.1),.55+j*.82,z,.52+random()*.22,.63,.65+random()*.35);
  }
  for(let i=0;i<28;i++) {
    const z=-7+random()*14,x=(i%2?1:-1)*(widthAt(z)-.4);
    rock(x,.10,z,.12+random()*.28,.08+random()*.14,.18+random()*.25);
  }
  rock(0,.05,-10.15,2.1,.27,.6);
  scene.add(new THREE.HemisphereLight('#c6b89e','#32251b',.42));
  const centralLight=new THREE.PointLight('#eec38b',24,17,2);centralLight.position.set(0,4,1);scene.add(centralLight);
  const entryLight=new THREE.PointLight('#a5bec4',16,15,2);entryLight.position.set(0,2.4,11);scene.add(entryLight);
  const placements=[
    {p:[0,2.9,-10.9],r:0,max:4.4},
    {p:[-5.2,2.8,-3.8],r:Math.PI/2,max:5.5},
    {p:[5.2,2.8,-3.8],r:-Math.PI/2,max:5.5},
    {p:[-5.2,2.8,3.2],r:Math.PI/2,max:5.5},
    {p:[5.2,2.8,3.2],r:-Math.PI/2,max:5.5},
  ];
  placements.forEach(({p,r})=>{
    const lamp=new THREE.PointLight('#ffd3a0',14,8,2);
    lamp.position.set(p[0]+Math.sin(r)*1.3,1.1,p[2]+Math.cos(r)*1.6);scene.add(lamp);
    const bowl=mesh(new THREE.SphereGeometry(.15,12,6,0,Math.PI*2,0,Math.PI/2),darkStone,[lamp.position.x,.18,lamp.position.z],[Math.PI,0,0]);
    const ember=material({color:'#f8c578',emissive:'#ff9e32',emissiveIntensity:2});mesh(new THREE.SphereGeometry(.025,8,6),ember,[bowl.position.x,.2,bowl.position.z]);
  });
  const targets=[];
  const versions=items.map(()=>0);
  const loader=new THREE.TextureLoader();
  function replaceArtwork(i,item) {
    const version=++versions[i];
    return new Promise((resolve,reject)=>loader.load(item.image, texture=>{
    if(disposed||version!==versions[i]){texture.dispose();reject(new Error('更换已取消'));return;}textures.add(texture);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    const {p,r,max}=placements[i],ratio=texture.image.width/texture.image.height;
    const w=Math.min(max,(i===0?2.9:3.7)*ratio),h=w/ratio;

    // Weathered pigment edges dissolve into the same curved rock profile.
    const alphaCanvas=document.createElement('canvas');alphaCanvas.width=alphaCanvas.height=256;
    const ac=alphaCanvas.getContext('2d'),pixels=ac.createImageData(256,256);
    for(let y=0;y<256;y++)for(let x=0;x<256;x++) {
      const edge=Math.min(x,255-x,y,255-y),wear=3*Math.sin(x*.24+y*.13)+2*Math.sin(y*.41);
      const a=THREE.MathUtils.clamp((edge-3-wear)/16,0,1),k=(y*256+x)*4;
      pixels.data[k]=pixels.data[k+1]=pixels.data[k+2]=Math.round(a*255);pixels.data[k+3]=255;
    }
    ac.putImageData(pixels,0,0);const alphaMap=new THREE.CanvasTexture(alphaCanvas);textures.add(alphaMap);
    const mat=material({map:texture,alphaMap,transparent:true,depthWrite:false,roughness:1,bumpMap:stoneTexture,bumpScale:.025,emissive:'#ffffff',emissiveMap:texture,emissiveIntensity:.12,side:THREE.DoubleSide});
    const geometry=new THREE.PlaneGeometry(w,h,64,40),pos=geometry.attributes.position;
    if(i>0) {
      for(let n=0;n<pos.count;n++) {
        const localX=pos.getX(n),y=p[1]+pos.getY(n),z=p[2]-Math.sin(r)*localX;
        let theta=i%2?Math.PI-Math.asin(y/heightAt(z)):Math.asin(y/heightAt(z));
        for(let iteration=0;iteration<5;iteration++) {
          const angle=Math.asin(y/(heightAt(z)+relief(theta,z)));
          theta=i%2?Math.PI-angle:angle;
        }
        const surfaceX=Math.cos(theta)*(widthAt(z)+relief(theta,z)),inward=i%2?.12:-.12;
        pos.setZ(n,(surfaceX+inward-p[0])/Math.sin(r));
      }
    }else for(let n=0;n<pos.count;n++)pos.setZ(n,.025*Math.sin(pos.getX(n)*5+pos.getY(n)*7));
    geometry.computeVertexNormals();const painting=mesh(geometry,mat,p,[0,r,0]);painting.userData.index=i;
    const oldIndex=targets.findIndex(target=>target.userData.index===i);
    if(oldIndex>=0){
      const old=targets[oldIndex];scene.remove(old);old.geometry.dispose();geometries.delete(old.geometry);
      for(const map of [old.material.map,old.material.alphaMap]){map.dispose();textures.delete(map);}
      old.material.dispose();materials.delete(old.material);targets[oldIndex]=painting;
    }else targets.push(painting);
    resolve();
  },undefined,()=>reject(new Error('壁画未能载入，原画已保留，请重试。'))));
  }
  Promise.all(items.map((item,i)=>replaceArtwork(i,item))).then(()=>{if(!disposed)onReady();}).catch(()=>{if(!disposed)onError('部分壁画未能载入，请刷新后重试。');});
  const dustGeometry=new THREE.BufferGeometry();const coords=[];
  for(let i=0;i<180;i++)coords.push(Math.sin(i*12.3)*5,1+(i%47)/8,Math.cos(i*8.7)*7);
  dustGeometry.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));geometries.add(dustGeometry);
  const dustMat=new THREE.PointsMaterial({color:'#e1c799',size:.018,transparent:true,opacity:.45});materials.add(dustMat);
  const dust=new THREE.Points(dustGeometry,dustMat);scene.add(dust);
  const raycaster=new THREE.Raycaster();let pointer=null;
  const down=e=>{pointer={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};host.setPointerCapture(e.pointerId);auto=false;host.focus({preventScroll:true});};
  const move=e=>{if(!pointer||e.pointerId!==pointer.id)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;yaw-=dx*.004;pitch=Math.max(-1.5,Math.min(1.5,pitch-dy*.004));pointer.moved ||= Math.hypot(e.clientX-pointer.startX,e.clientY-pointer.startY)>6;pointer.x=e.clientX;pointer.y=e.clientY;};
  const up=e=>{if(!pointer)return;if(!pointer.moved){const rect=host.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const hit=raycaster.intersectObjects(targets)[0];if(hit)onSelect(hit.object.userData.index);}pointer=null;if(host.hasPointerCapture(e.pointerId))host.releasePointerCapture(e.pointerId);};
  function advance(forward,side=0){
    auto=false;
    destination.x=THREE.MathUtils.clamp(destination.x-Math.sin(yaw)*forward+Math.cos(yaw)*side,-4.6,4.6);
    destination.z=THREE.MathUtils.clamp(destination.z-Math.cos(yaw)*forward-Math.sin(yaw)*side,-7.1,6.4);
  }
  const walk=amount=>advance(amount);
  const strafe=amount=>advance(0,amount);
  const wheel=e=>{
    e.preventDefault();
    const pixels=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?host.clientHeight:1);
    camera.fov=THREE.MathUtils.clamp(camera.fov+THREE.MathUtils.clamp(pixels,-100,100)*.04,30,85);
    camera.updateProjectionMatrix();
  };
  const movementKeys=['arrowleft','arrowright','arrowup','arrowdown','w','s','a','d'];
  const key=e=>{const key=e.key.toLowerCase();if(movementKeys.includes(key)){e.preventDefault();auto=false;heldKeys.add(key);}};
  const keyUp=e=>heldKeys.delete(e.key.toLowerCase());
  const blur=()=>{heldKeys.clear();destination.copy(camera.position);};
  host.addEventListener('keyup',keyUp);host.addEventListener('blur',blur);window.addEventListener('blur',blur);
  const cancel=()=>{pointer=null;};
  host.addEventListener('pointerdown',down);host.addEventListener('pointermove',move);host.addEventListener('pointerup',up);host.addEventListener('pointercancel',cancel);host.addEventListener('wheel',wheel,{passive:false});host.addEventListener('keydown',key);
  const resize=()=>{const {width,height}=host.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();};
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');let last=0;
  function render(time){
    const dt=Math.min((time-last)/1000,.05);last=time;
    const forward=Number(heldKeys.has('w')||heldKeys.has('arrowup'))-Number(heldKeys.has('s')||heldKeys.has('arrowdown'));
    const side=Number(heldKeys.has('d')||heldKeys.has('arrowright'))-Number(heldKeys.has('a')||heldKeys.has('arrowleft'));
    const directionLength=Math.hypot(forward,side);
    if(directionLength)advance(forward/directionLength*1.65*dt,side/directionLength*1.65*dt);
    const dx=destination.x-camera.position.x,dz=destination.z-camera.position.z,distance=Math.hypot(dx,dz);
    const step=Math.min(distance*(1-Math.exp(-9*dt)),1.8*dt);
    if(distance>.002){camera.position.x+=dx/distance*step;camera.position.z+=dz/distance*step;}
    else{camera.position.x=destination.x;camera.position.z=destination.z;}
    stride+=step*9;
    if(audio && step > .0001 && stride - lastStep > Math.PI * 2){ audio.step(); lastStep = stride; }
    const targetBob=!reduced.matches&&step>.0001?Math.sin(stride)*.018*Math.min(1,step/Math.max(dt,.001)):0;
    bob+=(targetBob-bob)*(1-Math.exp(-12*dt));camera.position.y=1.7+bob;
    if(auto)yaw+=dt*.1;camera.rotation.set(pitch,yaw,0,'YXZ');
    if(!reduced.matches)dust.rotation.y=time*.000012;
    renderer.render(scene,camera);frame=requestAnimationFrame(render);
  }frame=requestAnimationFrame(render);
  return {
    replaceArtwork, setAudio(engine){audio=engine;},
    walk, strafe, turn(amount){auto=false;yaw+=amount;}, toggleAuto(){auto=!auto;return auto;},
    reset(){camera.position.set(.2,1.7,6);destination.copy(camera.position);heldKeys.clear();bob=0;yaw=0;pitch=.05;auto=false;camera.fov=65;camera.updateProjectionMatrix();},
    focus(index){const {p,r}=placements[index];camera.position.set(p[0]+Math.sin(r)*3.8,1.7,p[2]+Math.cos(r)*3.8);destination.copy(camera.position);heldKeys.clear();bob=0;yaw=r;pitch=.22;auto=false;},
    dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();host.removeEventListener('keyup',keyUp);host.removeEventListener('blur',blur);window.removeEventListener('blur',blur);host.removeEventListener('pointerdown',down);host.removeEventListener('pointermove',move);host.removeEventListener('pointerup',up);host.removeEventListener('pointercancel',cancel);host.removeEventListener('wheel',wheel);host.removeEventListener('keydown',key);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();}
  };
}
