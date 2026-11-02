(()=>{'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function drawTowerBackdrop(ctx,viewW,vh,cam,runHeight,elapsed){
  const smooth=(a,b,x)=>{
    const t=clamp((x-a)/(b-a),0,1);
    return t*t*(3-2*t);
  };
  const mix=(a,b,t)=>a.map((v,i)=>Math.round(v+(b[i]-v)*t));
  const rgb=c=>`rgb(${c[0]},${c[1]},${c[2]})`;
  const mod=(n,m)=>((n%m)+m)%m;
  const hash=n=>{
    const v=Math.sin(n*127.1+311.7)*43758.5453;
    return v-Math.floor(v);
  };

  // Color and structural damage drift continuously with height; there are no
  // hard visual level cuts for the procedural tower to expose.
  const mid=smooth(900,4200,runHeight);
  const machine=smooth(4300,7600,runHeight);
  const high=smooth(9000,13200,runHeight);
  const corruption=smooth(0,10000,runHeight);
  const lowerToSteel=mix([35,24,47],[18,34,52],mid);
  const steelToMachine=mix(lowerToSteel,[11,30,43],machine);
  const topColor=mix(steelToMachine,[74,112,151],high);
  const bottomColor=mix(
    mix([17,11,25],[9,17,30],mid),
    mix([8,17,29],[33,58,86],high),
    machine
  );
  const warm=mix(mix([180,74,169],[213,145,82],mid),[75,182,211],machine);
  const glow=mix(mix([209,76,197],[247,166,94],mid),[103,218,243],machine);

  const sky=ctx.createLinearGradient(0,0,viewW*.1,vh);
  sky.addColorStop(0,rgb(topColor));
  sky.addColorStop(1,rgb(bottomColor));
  ctx.fillStyle=sky;
  ctx.fillRect(0,0,viewW,vh);

  // A distant central shaft glow gives the tower scale without washing out
  // the route or the avatar.
  const cx=viewW*.5,cy=vh*.47;
  const haze=ctx.createRadialGradient(cx,cy,4,cx,cy,viewW*.72);
  haze.addColorStop(0,`rgba(${glow[0]},${glow[1]},${glow[2]},${.11-corruption*.045})`);
  haze.addColorStop(.42,`rgba(${warm[0]},${warm[1]},${warm[2]},${.055-corruption*.02})`);
  haze.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=haze;
  ctx.fillRect(0,0,viewW,vh);

  // Deep tower ribs and service towers move at separate parallax rates.
  for(let i=0;i<17;i++){
    const seed=700+i*41;
    const x=hash(seed)*viewW;
    const h=vh*(.22+hash(seed+1)*.65);
    const w=viewW*(.018+hash(seed+2)*.035);
    const y=mod(hash(seed+3)*(vh+180)-cam*.13,vh+180)-90;
    const side=x<viewW*.5?-1:1;
    const shade=side<0?'rgba(4,9,17,.52)':'rgba(7,14,23,.66)';
    ctx.fillStyle=shade;
    ctx.beginPath();
    ctx.moveTo(x-w*.5,y+h*.5);
    ctx.lineTo(x-w*.42,y-h*.25);
    ctx.lineTo(x-w*.12,y-h*.48);
    ctx.lineTo(x+w*.28,y-h*.34);
    ctx.lineTo(x+w*.5,y+h*.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle=`rgba(${glow[0]},${glow[1]},${glow[2]},${.12+hash(seed+4)*.1})`;
    ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(x-w*.35,y+h*.36);
    ctx.lineTo(x-w*.28,y-h*.2);
    ctx.lineTo(x-w*.06,y-h*.4);
    ctx.stroke();
    for(let win=0;win<3;win++){
      const wy=y-h*.12+win*h*.17;
      ctx.fillStyle=win===1&&corruption>.55
        ?`rgba(5,3,10,${.65+corruption*.25})`
        :`rgba(${glow[0]},${glow[1]},${glow[2]},${.11+hash(seed+win+8)*.19})`;
      ctx.fillRect(x-w*.14,wy,Math.max(2,w*.25),2);
    }
  }

  // Repeating but deterministic structural bays make modular background art
  // easy to replace later while keeping every join stable between frames.
  const bay=236;
  const first=Math.floor(cam/bay)-1;
  const last=Math.ceil((cam+vh)/bay)+1;
  for(let index=first;index<=last;index++){
    const worldY=index*bay;
    const sy=worldY-cam;
    const n=Math.abs(index)+1;
    const spread=viewW*(.31+hash(n+4)*.08);
    const beamY=sy+bay*(.2+hash(n+5)*.12);
    const alpha=.34+hash(n+6)*.2;

    // Tall frame, cross-brace, and side-mounted service channels.
    ctx.strokeStyle=`rgba(83,132,151,${alpha*(1-corruption*.25)})`;
    ctx.lineWidth=4;
    ctx.beginPath();
    ctx.moveTo(cx-spread,sy-18);
    ctx.lineTo(cx-spread*.92,sy+bay-12);
    ctx.moveTo(cx+spread,sy-18);
    ctx.lineTo(cx+spread*.92,sy+bay-12);
    ctx.stroke();
    ctx.strokeStyle=`rgba(${glow[0]},${glow[1]},${glow[2]},${.16+alpha*.24})`;
    ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(cx-spread,beamY);
    ctx.lineTo(cx+spread,beamY);
    ctx.moveTo(cx-spread*.92,sy+bay-12);
    ctx.lineTo(cx-spread*.56,beamY);
    ctx.moveTo(cx+spread*.92,sy+bay-12);
    ctx.lineTo(cx+spread*.56,beamY);
    ctx.stroke();

    // Recessed rack silhouettes sit behind the playable centerline.
    for(const side of [-1,1]){
      const rackX=cx+side*spread*.72;
      const rackW=viewW*(.075+hash(n+side*13+9)*.035);
      const rackH=bay*(.43+hash(n+side*17+11)*.25);
      const rackY=sy+bay*.48;
      ctx.fillStyle=`rgba(3,8,16,${.34+corruption*.18})`;
      ctx.fillRect(rackX-rackW*.5,rackY-rackH*.5,rackW,rackH);
      ctx.strokeStyle=`rgba(93,140,156,${.14+alpha*.18})`;
      ctx.lineWidth=1;
      ctx.strokeRect(rackX-rackW*.5,rackY-rackH*.5,rackW,rackH);
      for(let row=0;row<5;row++){
        const ly=rackY-rackH*.37+row*rackH*.18;
        const lit=hash(n+side*21+row*5)>.44;
        ctx.fillStyle=lit
          ?`rgba(${glow[0]},${glow[1]},${glow[2]},${.18+hash(n+row)*.22})`
          :'rgba(2,5,12,.7)';
        ctx.fillRect(rackX-rackW*.35,ly,rackW*.7,2);
      }
    }

    // Occasional large gear silhouettes hint at moving machinery in the shaft.
    if(index%2===0){
      const side=hash(n+31)>.5?1:-1;
      const gx=cx+side*spread*.91;
      const gy=sy+bay*.67;
      const r=Math.min(36,viewW*.055)*(1+hash(n+32)*.35);
      ctx.save();
      ctx.translate(gx,gy);
      ctx.rotate(elapsed*(.12+hash(n+33)*.12)*(side));
      ctx.strokeStyle=`rgba(119,157,168,${.16+alpha*.16})`;
      ctx.lineWidth=3;
      ctx.beginPath();
      ctx.arc(0,0,r,0,Math.PI*2);
      ctx.stroke();
      ctx.beginPath();
      for(let tooth=0;tooth<16;tooth++){
        const a=tooth*Math.PI/8;
        const inner=r*.78,outer=r*1.08;
        ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);
        ctx.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);
      }
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0,0,r*.33,0,Math.PI*2);
      ctx.stroke();
      ctx.restore();
    }

    // Corruption stains grow denser with height but remain behind gameplay art.
    if(corruption>.08){
      const amount=corruption*(.12+hash(n+42)*.25);
      ctx.fillStyle=`rgba(1,1,5,${amount})`;
      const side=hash(n+44)>.5?1:-1;
      const x=cx+side*spread*(.6+hash(n+45)*.35);
      ctx.beginPath();
      ctx.moveTo(x,sy+bay*.08);
      ctx.lineTo(x+side*viewW*.025,sy+bay*.24);
      ctx.lineTo(x-side*viewW*.008,sy+bay*.46);
      ctx.lineTo(x+side*viewW*.018,sy+bay*.73);
      ctx.lineTo(x-side*viewW*.012,sy+bay*.91);
      ctx.lineTo(x-side*viewW*.04,sy+bay*.71);
      ctx.lineTo(x-side*viewW*.03,sy+bay*.35);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Sparse dust catches the changing light; movement stays legible in the shaft.
  for(let i=0;i<34;i++){
    const seed=5200+i*19;
    const x=hash(seed)*viewW;
    const y=mod(hash(seed+1)*(vh+40)-cam*.24+elapsed*(3+hash(seed+2)*7),vh+40)-20;
    const size=.6+hash(seed+3)*1.3;
    ctx.fillStyle=`rgba(197,221,222,${.08+hash(seed+4)*.18})`;
    ctx.fillRect(x,y,size,size);
  }

  const vignette=ctx.createRadialGradient(cx,vh*.48,viewW*.12,cx,vh*.48,viewW*.76);
  vignette.addColorStop(0,'rgba(0,0,0,0)');
  vignette.addColorStop(.72,'rgba(1,4,10,.08)');
  vignette.addColorStop(1,'rgba(1,3,9,.46)');
  ctx.fillStyle=vignette;
  ctx.fillRect(0,0,viewW,vh);
}
window.GlitchedRender=window.GlitchedRender||{};
window.GlitchedRender.drawTowerBackdrop=drawTowerBackdrop;
})();
