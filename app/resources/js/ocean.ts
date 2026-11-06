// @ts-nocheck
// Animated 3D deep-sea scene (tuna, jellyfish, lanternfish) drawn into the
// site's fixed .background element, underneath the existing CSS bubbles and light rays.
// three.js (npm package, copied to /resources/js/lib/ by the build) is loaded on demand.
declare const THREE: any;

const THREE_URL = '/resources/js/lib/three.min.js';

function loadThree() {
  return new Promise<void>((resolve, reject) => {
    if ((window as any).THREE) return resolve();
    const s = document.createElement('script');
    s.src = THREE_URL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('three.js failed to load'));
    document.head.appendChild(s);
  });
}

function startOcean(host) {

const small=matchMedia('(max-width:700px)').matches;
const canvas=document.createElement('canvas');
canvas.className='ocean';canvas.setAttribute('aria-hidden','true');
host.prepend(canvas);
let VW=host.clientWidth||innerWidth,VH=host.clientHeight||innerHeight;
const renderer=new THREE.WebGLRenderer({canvas,antialias:!small,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,small?1.5:2));
const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0x0a2030,0.04);
const camera=new THREE.PerspectiveCamera(45,1,0.1,150);
scene.add(new THREE.HemisphereLight(0x7fb0e8,0x061428,0.55));
const sun=new THREE.DirectionalLight(0x9cc4ff,0.8);sun.position.set(2,8,3);scene.add(sun);
const rim=new THREE.PointLight(0x3a7bd5,0.6,20);rim.position.set(-4,2,-4);scene.add(rim);

/* ---------- skin texture ---------- */
function skinTexture(){
  const W=1024,H=512,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  const stops=[[1,'#0a1d3a'],[.9,'#133560'],[.78,'#2b5f8c'],[.7,'#9db9c6'],[.64,'#d4c25a'],[.58,'#c6d4dc'],[.45,'#dde5e9'],[0,'#f2f1ea']];
  const g=x.createLinearGradient(0,0,0,H);
  stops.forEach(s=>g.addColorStop((1-s[0])/2,s[1]));
  stops.slice().reverse().forEach(s=>g.addColorStop((1+s[0])/2,s[1]));
  x.fillStyle=g;x.fillRect(0,0,W,H);
  // spots
  for(let i=0;i<0;i++){
    const px=W*(0.2+Math.random()*0.8),d=0.5+Math.random()*0.5,sg=Math.random()<.5?-1:1,py=H*(0.5+sg*d/2);
    x.fillStyle='rgba(20,32,26,'+(0.35+Math.random()*0.4)+')';
    x.beginPath();x.ellipse(px,py,1.5+Math.random()*2.5,1.5+Math.random()*2.5,0,0,7);x.fill();
  }
  // scales
  const s=15;
  for(let r=0;r*s*.75<H+s;r++)for(let q=-1;q*s<W+s;q++){
    const px=q*s+(r%2)*s/2,py=r*s*.75;
    x.strokeStyle='rgba(15,25,25,.06)';x.lineWidth=1;x.beginPath();x.arc(px,py,s*.62,.15*Math.PI,.85*Math.PI);x.stroke();
    x.strokeStyle='rgba(255,255,255,.05)';x.beginPath();x.arc(px,py-1.5,s*.62,.2*Math.PI,.8*Math.PI);x.stroke();
  }
  // lateral line and gill cover
  x.lineWidth=2;x.strokeStyle='rgba(60,70,70,.2)';
  [.2,.8].forEach(v=>{x.beginPath();for(let i=0;i<=40;i++){const px=W*(.2+.78*i/40);const py=H*v+Math.sin(i*.3)*2;i?x.lineTo(px,py):x.moveTo(px,py)}x.stroke()});
  x.lineWidth=3;x.strokeStyle='rgba(30,35,35,.5)';
  [[.18,.42],[.82,.58]].forEach(a=>{x.beginPath();x.moveTo(W*.19,H*a[0]);x.quadraticCurveTo(W*.23,H*(a[0]+a[1])/2,W*.19,H*a[1]);x.stroke()});
  // darker head
  const hg=x.createLinearGradient(0,0,W*.22,0);hg.addColorStop(0,'rgba(20,35,28,.35)');hg.addColorStop(1,'rgba(20,35,28,0)');
  x.fillStyle=hg;x.fillRect(0,0,W*.22,H);
  const t=new THREE.CanvasTexture(c);t.anisotropy=4;return t;
}
function finTexture(){
  const c=document.createElement('canvas');c.width=256;c.height=128;const x=c.getContext('2d');
  x.fillStyle='rgba(255,255,255,.62)';x.fillRect(0,0,256,128);
  const g=x.createLinearGradient(0,128,0,0);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,255,255,.7)');
  x.strokeStyle=g;x.lineWidth=2;
  for(let i=0;i<=36;i++){x.beginPath();x.moveTo(i*256/36,128);x.lineTo(i*256/36,0);x.stroke()}
  return new THREE.CanvasTexture(c);
}

/* ---------- body ---------- */
const X0=2.2,L=4.4;
const hf=u=>0.06*u+0.64*Math.pow(Math.sin(Math.PI*Math.pow(u,0.75)),0.9);
const hAt=x=>hf(Math.min(1,Math.max(0,(X0-x)/L)));
// the body is built at two levels of detail; the coarse one is used while the tuna is far from the camera
function buildBody(NS,NR){
  const bp=[],buv=[],bi=[];
  for(let i=0;i<=NS;i++){const u=i/NS,h=hf(u),w=h*0.78;
    for(let j=0;j<=NR;j++){const th=j/NR*Math.PI*2;let y=Math.cos(th)*h;if(y<0)y*=0.85;
      bp.push(X0-L*u,y,Math.sin(th)*w);buv.push(u,j/NR);}}
  for(let i=0;i<NS;i++)for(let j=0;j<NR;j++){const a=i*(NR+1)+j,b=a+NR+1;bi.push(a,b,a+1,b,b+1,a+1)}
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(bp,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(buv,2));
  g.setIndex(bi);g.computeVertexNormals();
  return{geo:g,base:Float32Array.from(bp)};
}
const bodyHi=buildBody(90,36),bodyLo=buildBody(40,16);
const skin=skinTexture();
const fish=new THREE.Group();scene.add(fish);
const bodyMesh=new THREE.Mesh(bodyHi.geo,new THREE.MeshPhysicalMaterial({map:skin,bumpMap:skin,bumpScale:.5,roughness:0.38,metalness:0.05,clearcoat:0.8,clearcoatRoughness:0.25}));
fish.add(bodyMesh);
let tunaLod='hi';
const deform=[{geo:bodyHi.geo,base:bodyHi.base,body:true,lod:'hi'},{geo:bodyLo.geo,base:bodyLo.base,body:true,lod:'lo'}];

/* ---------- fins ---------- */
const FIN={p:[],uv:[],c:[],i:[]};
function makeFin(B,T,col,ns=16,nt=6){
  const o=FIN.p.length/3,rgb=col.split(',').map(v=>v/255);
  for(let j=0;j<=nt;j++)for(let i=0;i<=ns;i++){const s=i/ns,t=j/nt,b=B(s),e=T(s);
    FIN.p.push(b[0]+(e[0]-b[0])*t,b[1]+(e[1]-b[1])*t,b[2]+(e[2]-b[2])*t);FIN.uv.push(s,t);FIN.c.push(rgb[0],rgb[1],rgb[2])}
  for(let j=0;j<nt;j++)for(let i=0;i<ns;i++){const a=o+j*(ns+1)+i,b=a+ns+1;FIN.i.push(a,b,a+1,b,b+1,a+1)}
}
// all fins share one geometry, texture and draw call
function finishFins(){
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(FIN.p,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(FIN.uv,2));
  g.setAttribute('color',new THREE.Float32BufferAttribute(FIN.c,3));
  g.setIndex(FIN.i);g.computeVertexNormals();
  fish.add(new THREE.Mesh(g,new THREE.MeshLambertMaterial({map:finTexture(),vertexColors:true,transparent:true,side:THREE.DoubleSide,depthWrite:false})));
  deform.push({geo:g,base:Float32Array.from(FIN.p)});
}
const lerp=(a,b,t)=>a+(b-a)*t;
// tail (forked)
makeFin(s=>[-2.12,lerp(-.07,.07,s),0],s=>{const e=Math.abs(2*s-1);return[-2.45-1.05*Math.pow(e,1.6),lerp(-1.05,1.05,s),0]},'38,62,100',24);
// dorsal
makeFin(s=>{const x=lerp(.9,.1,s);return[x,hAt(x)*.97,0]},s=>{const x=lerp(.9,.1,s)-.3*s;return[x,hAt(lerp(.9,.1,s))+.6*(1-.55*s),0]},'45,75,110');
// adipose
makeFin(s=>{const x=lerp(-.3,-1.0,s);return[x,hAt(x)*.97,0]},s=>{const x=lerp(-.3,-1.0,s)-.25*s-.1;return[x,hAt(lerp(-.3,-1.0,s))+.36*(1-.4*s),0]},'60,85,110',10,3);
for(let k=0;k<7;k++){const x0=-1.15-k*.14;
  [1,-1].forEach(sg=>makeFin(s=>{const x=lerp(x0,x0-.1,s);return[x,sg*hAt(x)*.92,0]},s=>{const x=lerp(x0,x0-.1,s)-.12;return[x,sg*(hAt(x0)*.92+.12),0]},'230,200,60',3,1));}
// anal
makeFin(s=>{const x=lerp(-.85,-1.5,s);return[x,-hAt(x)*.85,0]},s=>{const x=lerp(-.85,-1.5,s)-.3*s-.05;return[x,-hAt(lerp(-.85,-1.5,s))*.85-.46*(1-.5*s),0]},'170,170,150');
// pelvic + pectoral (both sides)
[-1,1].forEach(sg=>{
  makeFin(s=>{const x=lerp(.35,.05,s);return[x,-hAt(x)*.82,sg*.08]},s=>{const x=lerp(.35,.05,s)-.3;return[x,-hAt(lerp(.35,.05,s))*.82-.38,sg*.28]},'120,130,140',8,4);
  makeFin(s=>[1.25-.05*s,lerp(-.02,-.2,s),sg*.2],s=>[.3-.1*s,lerp(-.2,-.65,s),sg*.55],'48,78,120',8,4);
});

finishFins();

/* ---------- eyes ---------- */
[-1,1].forEach(sg=>{
  const e=new THREE.Mesh(new THREE.SphereGeometry(.07,20,16),new THREE.MeshPhysicalMaterial({color:0xd8c27c,roughness:.2,clearcoat:1}));
  e.position.set(1.85,.12,sg*.22);fish.add(e);
  const p=new THREE.Mesh(new THREE.SphereGeometry(.043,16,12),new THREE.MeshBasicMaterial({color:0x020202}));
  p.position.set(1.9,.12,sg*.27);fish.add(p);
});

/* ---------- deep-sea creatures ---------- */
const rnd=(a,b)=>a+Math.random()*(b-a);
const glowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.3,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
function glowSprite(col,s,op){const m=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:col,transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false}));m.scale.setScalar(s);return m}

// jellyfish
function makeBell(radial,seg){
  const prof=[];for(let i=0;i<=seg;i++){const a=i/seg*Math.PI/2;prof.push(new THREE.Vector2(Math.sin(a)*.85,Math.cos(a)*.6))}
  prof.push(new THREE.Vector2(.8,-.04),new THREE.Vector2(.74,-.1));
  const g=new THREE.LatheGeometry(prof,radial),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    if(y<.22){const an=Math.atan2(z,x),w=(.22-y)/.32,k=1+.045*w*Math.sin(an*16);p.setXYZ(i,x*k,y+.03*w*Math.cos(an*16),z*k)}}
  g.computeVertexNormals();return g}
const bellLo=makeBell(48,16),bellHi=makeBell(192,56); // bellHi is used when a jellyfish is close to the camera
const bellVS='varying vec3 vN,vV,vP;varying float vD;void main(){vP=position;vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);vD=-mv.z;gl_Position=projectionMatrix*mv;}';
const bellFS='uniform vec3 uCol;varying vec3 vN,vV,vP;varying float vD;void main(){float f=pow(1.-abs(dot(normalize(vN),normalize(vV))),2.);float an=atan(vP.z,vP.x);float can=smoothstep(.8,1.,abs(sin(an*4.)))*smoothstep(0.,.5,vP.y+.1)*.18;float rim=smoothstep(.3,-.05,vP.y)*.25;float a=(.05+.5*f+can+rim)*exp(-pow(.04*vD,2.));gl_FragColor=vec4(uCol*(.6+f),a);}';
const gonadGeo=new THREE.TorusGeometry(.1,.032,16,40,Math.PI*1.5);
// pick a spot that covers the whole visible area at the jellyfish's depth
function viewAt(z){const dz=11.91-z;return{top:1.43+.28*dz,bottom:1.43-.56*dz,hw:.43*dz*VW/VH}}
function jellySpot(z,fresh,s){const v=viewAt(z);return[rnd(-v.hw,v.hw),fresh?rnd(v.bottom,v.top):v.bottom-1.5*s-.3]}
const jellies=[],jcols=[0x66e0ff,0xc58bff,0xff8ad0,0x7affc8];
const add={transparent:true,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false};
for(let n=0;n<(small?3:4);n++){
  const col=new THREE.Color(jcols[n%jcols.length]),pale=col.clone().lerp(new THREE.Color(0xffffff),.55);
  const g=new THREE.Group(),bell=new THREE.Group();
  const bellMesh=new THREE.Mesh(bellLo,new THREE.ShaderMaterial({uniforms:{uCol:{value:col}},vertexShader:bellVS,fragmentShader:bellFS,...add}));bell.add(bellMesh);
  {const gp=[],gi=[],o3=new THREE.Object3D();
    for(let k=0;k<4;k++){const an=k/4*Math.PI*2+.4,tg=gonadGeo.clone();
      o3.position.set(Math.cos(an)*.24,.2,Math.sin(an)*.24);o3.rotation.set(Math.PI/2,0,an);o3.updateMatrix();tg.applyMatrix4(o3.matrix);
      const o=gp.length/3,pa=tg.attributes.position.array;for(let q=0;q<pa.length;q++)gp.push(pa[q]);tg.index.array.forEach(v=>gi.push(v+o))}
    const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.Float32BufferAttribute(gp,3));gg.setIndex(gi);
    bell.add(new THREE.Mesh(gg,new THREE.MeshBasicMaterial({color:pale,opacity:.45,...add})))}
  g.add(bell);
  const gl=glowSprite(col,2.6,.12);gl.position.y=.2;g.add(gl);
  // frilly oral arms
  const arms=[],armP=[],armC=[],armI=[];
  for(let k=0;k<4;k++){
    const pg=new THREE.PlaneGeometry(1,1,4,32),o=armP.length/3,pa=pg.attributes.position.array;
    for(let q=0;q<pa.length;q++)armP.push(pa[q]);
    for(let m=0;m<=32;m++)for(let c=0;c<5;c++){const f=1-m/32*.75;armC.push(pale.r*f,pale.g*f,pale.b*f)}
    pg.index.array.forEach(v=>armI.push(v+o));
    arms.push({k,an:k/4*Math.PI*2+.8,len:rnd(1.3,1.9)});
  }
  const armGeo=new THREE.BufferGeometry();armGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(armP),3));
  armGeo.setAttribute('color',new THREE.Float32BufferAttribute(armC,3));armGeo.setIndex(armI);
  const armMesh=new THREE.Mesh(armGeo,new THREE.MeshBasicMaterial({vertexColors:true,opacity:.5,...add}));armMesh.frustumCulled=false;g.add(armMesh);
  // fine marginal tentacles in one draw call
  const NT=26,tn=[],tc=[];
  for(let k=0;k<NT;k++){const an=k/NT*Math.PI*2;tn.push({x0:Math.cos(an)*.76,z0:Math.sin(an)*.76,len:rnd(.9,2.2)});
    for(let m=0;m<14;m++){const f=.9*(1-m/14*.85);tc.push(col.r*f,col.g*f,col.b*f,col.r*f*.9,col.g*f*.9,col.b*f*.9)}}
  const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(NT*14*6),3));
  tg.setAttribute('color',new THREE.Float32BufferAttribute(tc,3));
  const tl=new THREE.LineSegments(tg,new THREE.LineBasicMaterial({vertexColors:true,opacity:.6,...add}));tl.frustumCulled=false;g.add(tl);
  const jz=-16+21*Math.pow(Math.random(),1.5),jsz=rnd(.5,1.5);g.scale.setScalar(jsz);const js=jellySpot(jz,true,jsz);g.position.set(js[0],js[1],jz);scene.add(g);
  jellies.push({g,bell,bellMesh,arms,armGeo,tn,tl,f:rnd(1.3,1.9),ph:rnd(0,6.28),k:rnd(.7,1.2)});
}

// lanternfish school: one instanced mesh, glowing photophores as points
const lfBody=new THREE.SphereGeometry(1,18,12);lfBody.scale(.55,.17,.1);
(()=>{const p=lfBody.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),f=.28+.72*Math.min(1,Math.max(0,(x+.55)/.75));p.setY(i,p.getY(i)*f);p.setZ(i,p.getZ(i)*f)}lfBody.computeVertexNormals()})();
function lfFin(pts,dx,dy){const s=new THREE.Shape();s.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)s.lineTo(pts[i][0],pts[i][1]);s.lineTo(pts[0][0],pts[0][1]);const g=new THREE.ShapeGeometry(s);g.translate(dx,dy,0);return g}
const lfTail=lfFin([[0,0],[-.34,.2],[-.26,0],[-.34,-.2]],-.5,0);
const lfDorsal=lfFin([[.12,0],[-.02,.17],[-.2,0]],0,.15);
const lfAnal=lfFin([[-.05,0],[-.2,-.1],[-.28,0]],0,-.1);
const lfPect=lfFin([[0,0],[-.16,-.09],[-.04,.01]],.3,-.05);
const lfGeo=(()=>{const p=[],n=[],c=[],ix=[];
  [[lfBody,0],[lfTail,1],[lfDorsal,1],[lfAnal,1],[lfPect,1]].forEach(pair=>{const g=pair[0],isFin=pair[1];
    if(!g.attributes.normal)g.computeVertexNormals();
    const o=p.length/3,pa=g.attributes.position.array,na=g.attributes.normal.array;
    for(let k=0;k<pa.length;k+=3){p.push(pa[k],pa[k+1],pa[k+2]);n.push(na[k],na[k+1],na[k+2]);
      if(isFin){c.push(.2,.3,.38)}else{const y=pa[k+1]/.17,x=pa[k];
        const back=Math.max(0,y-.1),belly=Math.max(0,-y-.2),head=Math.max(0,x-.3)*1.4;
        // dark blue-grey back, silvery flank, pale belly, slightly darker head
        c.push(.5-.4*back-.12*head+.25*belly,.62-.45*back-.12*head+.2*belly,.7-.45*back-.1*head+.15*belly)}}
    g.index.array.forEach(v=>ix.push(v+o))});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.setIndex(ix);return g})();
// two schools with their own size, path and speed
const SCHOOLS=[
  {n:small?16:25,w:.12,ph:0,zb:-11,za:4,R:12,y:1,ya:2,spread:1},
  {n:small?9:15,w:-.085,ph:3.4,zb:-16,za:3,R:14,y:-1.6,ya:1.2,spread:.7}
];
const LF=SCHOOLS[0].n+SCHOOLS[1].n,dummy=new THREE.Object3D(),tv=new THREE.Vector3();
const lfMesh=new THREE.InstancedMesh(lfGeo,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.38,metalness:.25,emissive:0x0a1a24}),LF);
lfMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);lfMesh.frustumCulled=false;scene.add(lfMesh);
const lfs=[];SCHOOLS.forEach((sc,si)=>{for(let i=0;i<sc.n;i++)lfs.push({s:si,o:[rnd(-3.4,3.4)*sc.spread,rnd(-1.5,1.5)*sc.spread,rnd(-2,2)*sc.spread],ph:rnd(0,6.28),sc:rnd(.38,.6)})});
const dotOff=[[.3,-.1,0],[.05,-.12,0],[-.2,-.1,0]],dotArr=new Float32Array(LF*9);
const dotGeo=new THREE.BufferGeometry();dotGeo.setAttribute('position',new THREE.BufferAttribute(dotArr,3));
const dots=new THREE.Points(dotGeo,new THREE.PointsMaterial({map:glowTex,color:0x9affe8,size:.3,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));
dots.frustumCulled=false;scene.add(dots);

// marine snow: slowly sinking specks of organic debris, adds depth
const SNOW=small?220:500,snowP=new Float32Array(SNOW*3),snowV=new Float32Array(SNOW),snowPh=new Float32Array(SNOW);
function snowSpawn(i,anywhere){
  const z=rnd(-22,4),v=viewAt(z);
  snowP[i*3]=rnd(-v.hw,v.hw)*1.05;snowP[i*3+1]=anywhere?rnd(v.bottom,v.top):v.top+.3;snowP[i*3+2]=z;
  snowV[i]=rnd(.06,.22);snowPh[i]=rnd(0,6.28);
}
for(let i=0;i<SNOW;i++)snowSpawn(i,true);
const snowGeo=new THREE.BufferGeometry();snowGeo.setAttribute('position',new THREE.BufferAttribute(snowP,3));
const snowPts=new THREE.Points(snowGeo,new THREE.PointsMaterial({map:glowTex,color:0xcfe3ee,size:.16,transparent:true,opacity:.4,depthWrite:false}));
snowPts.frustumCulled=false;scene.add(snowPts);

// comb jellies (ctenophores): glassy ovals with eight rows of shimmering, rainbow-coloured cilia and two long tentacles
const combT={value:0};
const combMat=new THREE.ShaderMaterial({uniforms:{uT:combT},transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,
  vertexShader:'varying vec3 vP,vN,vV;varying float vD;void main(){vP=position;vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);vD=-mv.z;gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform float uT;varying vec3 vP,vN,vV;varying float vD;void main(){float f=pow(1.-abs(dot(normalize(vN),normalize(vV))),2.);float a=atan(vP.z,vP.x);float row=smoothstep(.16,.0,abs(sin(a*4.)))*smoothstep(.55,.36,abs(vP.y));float ph=vP.y*2.2-uT*1.6;vec3 rb=.5+.5*cos(6.28318*(ph+vec3(0.,.33,.67)));float pulse=.55+.45*sin(vP.y*14.-uT*7.);vec3 col=mix(vec3(.55,.8,.95),rb,row);float al=(.04+.3*f+row*1.0*pulse)*exp(-pow(.04*vD,2.));gl_FragColor=vec4(col*(.5+f+row),al);}'});
const combGeo=new THREE.SphereGeometry(1,32,20);combGeo.scale(.3,.5,.3);
const combs=[];
function combSpot(z,fresh,sc){const v=viewAt(z);return[rnd(-v.hw,v.hw),fresh?rnd(v.bottom,v.top):v.bottom-sc-.5]}
for(let n=0;n<(small?2:3);n++){
  const g=new THREE.Group();g.add(new THREE.Mesh(combGeo,combMat));
  const NS=16,tp=new Float32Array(2*NS*6),tc=[];
  for(let k=0;k<2;k++)for(let m=0;m<NS;m++){const f=.8*(1-m/NS*.8);tc.push(.7*f,.9*f,1*f,.7*f,.9*f,1*f)}
  const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.BufferAttribute(tp,3));tg.setAttribute('color',new THREE.Float32BufferAttribute(tc,3));
  const tl=new THREE.LineSegments(tg,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.4,blending:THREE.AdditiveBlending,depthWrite:false}));
  tl.frustumCulled=false;g.add(tl);
  const z=rnd(-14,2),sc=rnd(1.3,2.4),sp=combSpot(z,true,sc);
  g.scale.setScalar(sc);g.position.set(sp[0],sp[1],z);g.rotation.z=rnd(-.5,.5);g.rotation.y=rnd(0,6.28);scene.add(g);
  combs.push({g,tl,NS,ph:rnd(0,6.28),v:rnd(.1,.22),spin:rnd(.15,.35),len:rnd(1.4,2)});
}
scene.userData.combs=combs;scene.userData.jellies=jellies;scene.userData.camera=camera;
// salp chains: long, glassy chains of linked barrel-shaped zooids that drift sideways, rippling and pulsing as they go
const salpT={value:0};
const salpMat=new THREE.ShaderMaterial({uniforms:{uT:salpT},transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,
  vertexShader:'varying vec3 vP,vN,vV;varying float vD;void main(){vP=position;vN=normalize(normalMatrix*mat3(instanceMatrix)*normal);vec4 mv=modelViewMatrix*instanceMatrix*vec4(position,1.);vV=normalize(-mv.xyz);vD=-mv.z;gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform float uT;varying vec3 vP,vN,vV;varying float vD;void main(){float f=pow(1.-abs(dot(normalize(vN),normalize(vV))),2.);float band=smoothstep(.1,.0,abs(fract(vP.y*10.+.5)-.5))*smoothstep(.27,.2,abs(vP.y));float shimmer=.75+.25*sin(vP.y*20.-uT*3.);vec3 col=mix(vec3(.5,.82,.92),vec3(.85,.97,1.),band);float al=(.04+.32*f+band*.3*shimmer)*exp(-pow(.04*vD,2.));gl_FragColor=vec4(col*(.55+f),al);}'});
const salpGeo=new THREE.CylinderGeometry(.2,.2,.5,20,8,true);
(()=>{const p=salpGeo.attributes.position;for(let i=0;i<p.count;i++){const u=p.getY(i)/.5,f=.85+.3*(1-4*u*u);p.setX(i,p.getX(i)*f);p.setZ(i,p.getZ(i)*f)}salpGeo.computeVertexNormals()})();
const nucGeo=new THREE.SphereGeometry(.05,8,6);
const nucMat=new THREE.MeshBasicMaterial({color:0xff9a70,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false});
const salps=[];
for(let n=0;n<1;n++){
  const N=small?8:12,sp=.42;
  const body=new THREE.InstancedMesh(salpGeo,salpMat,N),nuc=new THREE.InstancedMesh(nucGeo,nucMat,N);
  body.instanceMatrix.setUsage(THREE.DynamicDrawUsage);nuc.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  body.frustumCulled=false;nuc.frustumCulled=false;
  const g=new THREE.Group();g.add(body,nuc);
  const z=n===0?rnd(-8,-2):rnd(-21,-16),sc=rnd(1,1.7),vw=viewAt(z); // a single chain, fairly close to the camera
  g.scale.setScalar(sc);g.rotation.y=rnd(-.5,.5);g.rotation.z=rnd(-.2,.2);
  g.position.set(rnd(-vw.hw,vw.hw),rnd(vw.bottom+1,vw.top-1),z);scene.add(g);
  salps.push({g,body,nuc,N,sp,sc,dir:Math.random()<.5?-1:1,v:rnd(.12,.28),ph:rnd(0,6.28),amp:rnd(.25,.5)});
}
scene.userData.salps=salps;
const sM=new THREE.Matrix4(),sQ=new THREE.Quaternion(),sUp=new THREE.Vector3(0,1,0),sT=new THREE.Vector3(),sS=new THREE.Vector3(),sOne=new THREE.Vector3(1,1,1),sPts=[];
for(let i=0;i<16;i++)sPts.push(new THREE.Vector3());
function animSalps(t,dt){
  salpT.value=t;
  salps.forEach(c=>{
    const g=c.g,N=c.N;
    for(let i=0;i<N;i++)sPts[i].set((i-(N-1)/2)*c.sp,Math.sin(t*.6-i*.5+c.ph)*c.amp,Math.cos(t*.45-i*.4+c.ph)*c.amp*.6);
    for(let i=0;i<N;i++){
      const a=sPts[Math.max(0,i-1)],b=sPts[Math.min(N-1,i+1)];
      sT.subVectors(b,a).normalize();sQ.setFromUnitVectors(sUp,sT);
      const pulse=1+.1*Math.sin(t*1.8-i*.5+c.ph);
      sS.set(pulse,1,pulse);sM.compose(sPts[i],sQ,sS);c.body.setMatrixAt(i,sM);
      sM.compose(sPts[i],sQ,sOne);c.nuc.setMatrixAt(i,sM);
    }
    c.body.instanceMatrix.needsUpdate=true;c.nuc.instanceMatrix.needsUpdate=true;
    g.position.x+=c.dir*c.v*dt;g.position.y+=Math.sin(t*.3+c.ph)*.04*dt;
    const vw=viewAt(g.position.z),half=(N*c.sp/2)*c.sc*1.15+1;
    if(c.dir*g.position.x>vw.hw+half){g.position.x=-c.dir*(vw.hw+half);g.position.y=rnd(vw.bottom+1,vw.top-1)}
  });
}
function animExtras(t,dt){
  animSalps(t,dt);
  const sp=snowGeo.attributes.position.array;
  for(let i=0;i<SNOW;i++){
    sp[i*3+1]-=snowV[i]*dt;sp[i*3]+=Math.sin(t*.4+snowPh[i])*.06*dt;
    if(sp[i*3+1]<1.43-.56*(11.91-sp[i*3+2])-.3)snowSpawn(i,false); // same as viewAt(z).bottom, without allocating
  }
  snowGeo.attributes.position.needsUpdate=true;
  combT.value=t;
  combs.forEach(c=>{
    const g=c.g,v=viewAt(g.position.z),hw=v.hw;
    g.position.x+=-Math.sin(g.rotation.z)*c.v*dt+Math.sin(t*.25+c.ph)*.05*dt;
    g.position.y+=Math.cos(g.rotation.z)*c.v*dt;
    g.rotation.y+=c.spin*dt;g.rotation.z+=Math.sin(t*.3+c.ph)*.04*dt;
    if(g.position.y-(.3+c.len)*g.scale.x>v.top||Math.abs(g.position.x)>hw+2){const s=combSpot(g.position.z,false,g.scale.x);g.position.x=s[0];g.position.y=s[1]}
    const p=c.tl.geometry.attributes.position.array;let o=0;
    for(let k=0;k<2;k++){let px=0,py=0,pz=0;
      for(let m=0;m<=c.NS;m++){const d=m/c.NS,x=(k?.1:-.1)+Math.sin(t*1.1-d*4+c.ph+k*2)*.09*d*c.len,y=-.3-d*c.len,z=Math.sin(t*.9-d*3+c.ph+k*3)*.07*d*c.len;
        if(m>0){p[o++]=px;p[o++]=py;p[o++]=pz;p[o++]=x;p[o++]=y;p[o++]=z}px=x;py=y;pz=z}}
    c.tl.geometry.attributes.position.needsUpdate=true;
  });
}

let lastT=0;
function animCreatures(t){
  const dt=Math.min(.05,Math.max(0,t-lastT));lastT=t;
  animExtras(t,dt);
  jellies.forEach(j=>{
    const s=Math.sin(t*j.f+j.ph),push=Math.max(0,s);
    j.bell.scale.set(1+.14*s,1-.2*s,1+.14*s);
    j.g.position.y+=(.15+push*.5)*dt*j.k;j.g.position.x+=Math.sin(t*.2+j.ph)*dt*.3;
    if(j.g.position.y-2.5*j.g.scale.x>viewAt(j.g.position.z).top){const sp=jellySpot(j.g.position.z,false,j.g.scale.x);j.g.position.x=sp[0];j.g.position.y=sp[1]}
    j.g.rotation.z=Math.sin(t*.4+j.ph)*.1;
    {const want=camera.position.distanceTo(j.g.position)/j.g.scale.x<15?bellHi:bellLo;if(j.bellMesh.geometry!==want)j.bellMesh.geometry=want}
    const sc=1+.14*s,tp=j.tl.geometry.attributes.position.array;let o=0;
    j.tn.forEach((u,k)=>{let px,py,pz;for(let m=0;m<15;m++){const d=m/14,fl=sc*(1+d*.15*(.5+s*.5));
      const x=u.x0*fl+Math.sin(t*j.f*.9-m*.3+k*.7)*.07*d,y=-.1-d*u.len*(1-.1*s*d),z=u.z0*fl+Math.cos(t*j.f*.8-m*.25+k)*.07*d;
      if(m>0){tp[o++]=px;tp[o++]=py;tp[o++]=pz;tp[o++]=x;tp[o++]=y;tp[o++]=z}px=x;py=y;pz=z}});
    j.tl.geometry.attributes.position.needsUpdate=true;
    const p=j.armGeo.attributes.position;
    j.arms.forEach(a=>{const ca=Math.cos(a.an),sa=Math.sin(a.an),base=a.k*165;
      for(let m=0;m<=32;m++){const d=m/32,sw=Math.sin(t*j.f*.8-m*.225+j.ph+a.k)*.1*d,fr=Math.sin(d*11+a.k)*.045,y=-.05-d*a.len;
        for(let c=0;c<5;c++){const w=(c-2)*.05*(1-.5*d)+sw,r=.12+sw*.5+(c===2?fr:0);p.setXYZ(base+m*5+c,ca*r-sa*w,y,sa*r+ca*w)}}});
    p.needsUpdate=true;
  });
  {const st=SCHOOLS.map(sc=>{
      const P=a=>{const z=sc.zb+Math.sin(a*.7+1)*sc.za;return[Math.cos(a)*sc.R*(12-z)/15,sc.y+Math.sin(a*1.3)*sc.ya,z]};
      const a=t*sc.w+sc.ph,p=P(a),q=P(a+.02*(sc.w<0?-1:1)),yaw=Math.atan2(-(q[2]-p[2]),q[0]-p[0]);
      return{p,yaw,cy:Math.cos(yaw),sy:Math.sin(yaw)}});
    lfs.forEach((f,i)=>{
      const c=st[f.s],p=c.p,yaw=c.yaw,cy=c.cy,sy=c.sy;
      const ox=f.o[0]+Math.sin(t*1.1+f.ph)*.3,oy=f.o[1]+Math.sin(t*.8+f.ph)*.2,oz=f.o[2]+Math.cos(t*.9+f.ph)*.3;
      dummy.position.set(p[0]+ox*cy+oz*sy,p[1]+oy,p[2]-ox*sy+oz*cy);
      dummy.rotation.set(0,yaw+Math.sin(t*7+f.ph)*.12,Math.sin(t*3+f.ph)*.05);dummy.scale.setScalar(f.sc);dummy.updateMatrix();
      lfMesh.setMatrixAt(i,dummy.matrix);
      dotOff.forEach((d,k)=>{tv.set(d[0],d[1],d[2]).applyMatrix4(dummy.matrix);dotArr.set([tv.x,tv.y,tv.z],(i*3+k)*3)});
    });
    lfMesh.instanceMatrix.needsUpdate=true;dotGeo.attributes.position.needsUpdate=true;}
}

/* ---------- camera ---------- */
const yaw=0,pitch=.12,dist=12;
function resize(){VW=host.clientWidth||innerWidth;VH=host.clientHeight||innerHeight;renderer.setSize(VW,VH,false);camera.aspect=VW/VH;camera.updateProjectionMatrix()}
addEventListener('resize',resize);resize();

const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clock=new THREE.Clock(),target=new THREE.Vector3();let rafId=0;
// Dev-only stats: open any page with ?perf in the URL to see them
const perfOn=/[?&]perf\b/.test(location.search);
let perfEl=null,pAcc=0,pN=0,pLast=performance.now();
if(perfOn){
  perfEl=document.createElement('div');
  perfEl.style.cssText='position:fixed;left:8px;bottom:8px;z-index:99999;padding:6px 8px;font:11px/1.4 monospace;color:#9affe8;background:rgba(0,0,0,.6);pointer-events:none;white-space:pre';
  document.body.appendChild(perfEl);
  window.__ocean={renderer,scene};
}
function perfTick(t0){
  if(!perfOn)return;
  const now=performance.now();pAcc+=now-t0;pN++;
  if(now-pLast>=1000){
    const i=renderer.info,st={fps:pN*1000/(now-pLast),cpuMs:pAcc/pN,calls:i.render.calls,tris:i.render.triangles,geoms:i.memory.geometries,textures:i.memory.textures};
    window.__oceanStats=st;
    perfEl.textContent='fps '+st.fps.toFixed(0)+'\nJS ms/frame '+st.cpuMs.toFixed(2)+'\ndraw calls '+st.calls+'\ntriangles '+st.tris+'\ngeometries '+st.geoms+'  textures '+st.textures;
    pAcc=0;pN=0;pLast=now;
  }
}
// random start position and swimming direction, so each page load begins somewhere different
const PATH_PHASE=Math.random()*40,PATH_DIR=Math.random()<.5?1:-1;
function tick(){
  const _p0=performance.now();
  const t=clock.getElapsedTime()*(reduce?.4:1);
  const wave=x=>{const k=Math.max(0,(1.4-x)/3.6);return .2*k*k*Math.sin(t*5-x*1.5)};
  {const dTuna=camera.position.distanceTo(fish.position),want=tunaLod==='hi'?(dTuna>24?'lo':'hi'):(dTuna<20?'hi':'lo');
    if(want!==tunaLod){tunaLod=want;bodyMesh.geometry=(want==='hi'?bodyHi:bodyLo).geo}}
  deform.forEach(d=>{if(d.lod&&d.lod!==tunaLod)return;const p=d.geo.attributes.position,b=d.base;
    for(let i=0;i<p.count;i++)p.setXYZ(i,b[i*3],b[i*3+1],b[i*3+2]+wave(b[i*3]));
    p.needsUpdate=true;if(d.body)d.geo.computeVertexNormals();});
  const a=PATH_PHASE+PATH_DIR*t*.17,R=14;
  // depth wanders between about -26 and -2 (two sine waves, so the loop doesn't repeat quickly);
  // the sideways sweep is scaled by distance so the tuna stays inside the view at every depth
  const zAt=u=>-14+Math.sin(u*.95)*9.5+Math.sin(u*1.9+1)*2.5;
  const pz=zAt(a),px=Math.cos(a)*R*(12-pz)/15,py=Math.sin(a*2)*.8;
  const na=a+PATH_DIR*.02,nz=zAt(na),nx=Math.cos(na)*R*(12-nz)/15;
  fish.position.set(px,py,pz);fish.scale.setScalar(.8);fish.rotation.y=Math.atan2(-(nz-pz),nx-px);
  fish.rotation.z=Math.sin(a*2)*.08;fish.rotation.x=Math.sin(t*5)*.015;
  animCreatures(t);
  
  camera.position.set(target.x+Math.sin(yaw)*Math.cos(pitch)*dist,target.y+Math.sin(pitch)*dist,target.z+Math.cos(yaw)*Math.cos(pitch)*dist);
  camera.lookAt(target);
  renderer.render(scene,camera);perfTick(_p0);rafId=requestAnimationFrame(tick);
}
// the animation toggle button (see animation-toggle.ts) sets .animations-off on <html>
const isOn=()=>!document.documentElement.classList.contains('animations-off');
function syncPlayback(){
  cancelAnimationFrame(rafId);
  if(isOn()&&!document.hidden){clock.getDelta();tick()}
}
document.addEventListener('visibilitychange',syncPlayback);
document.addEventListener('animationschange',syncPlayback);
if(isOn())tick();

}

function init() {
  const host = document.querySelector('.background');
  if (!host) return;
  // skip on data-saver connections and when WebGL is unavailable
  const conn = (navigator as any).connection;
  if (conn && conn.saveData) return;
  const html = document.documentElement;
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    loadThree()
      .then(() => startOcean(host))
      .catch((err) => console.warn('Ocean background disabled:', err.message));
  };
  // if animations are switched off, don't download or start anything until they are turned on
  if (html.classList.contains('animations-off')) {
    const onChange = () => {
      if (!html.classList.contains('animations-off')) {
        document.removeEventListener('animationschange', onChange);
        start();
      }
    };
    document.addEventListener('animationschange', onChange);
  } else {
    start();
  }
}

const idle = (window as any).requestIdleCallback || ((fn) => setTimeout(fn, 200));
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => idle(init));
} else {
  idle(init);
}
