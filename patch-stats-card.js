const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src", "services", "cardGenerator.js");
let content = fs.readFileSync(filePath, "utf8");

const startMarker = "async function generateStatsCard(user, hunter, metrics = {}) {";
const endMarker = "async function generateHuntResultCard(";
const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);
if (startIdx === -1 || endIdx === -1) { console.error("Markers not found"); process.exit(1); }

const newFunction = `async function generateStatsCard(user, hunter, metrics = {}) {
  const displayName = formatDisplayName(user.username);
  const W = 1600;
  const H = 1000;
  const canvas = new Canvas(W, H);
  const ctx = canvas.getContext("2d");

  await drawMainBackground(ctx, W, H);

  const rankLabel = normalizeRank(hunter.rank);
  const rankTint = rankColor(rankLabel);
  const rankBadge = rankBadgeText(rankLabel);
  const { RANKS, RANK_THRESHOLDS } = require("../utils/constants");

  const expNeeded    = metrics.expNeeded    || Math.ceil(100 * Math.pow(hunter.level, 1.5));
  const basePower    = Number(metrics.basePower    || 0);
  const shadowPower  = Number(metrics.shadowPower  || 0);
  const cardPower    = Number(metrics.cardPower    || 0);
  const finalPower   = Number(metrics.finalPower   || 0);
  const equippedShadows = Number(metrics.equippedShadows || 0);
  const shadowSlots  = Number(metrics.shadowSlots  || hunter.shadow_slots || 0);
  const ownedCards   = Number(metrics.ownedCards   || 0);
  const topCards     = String(metrics.topCards     || "None");

  // Font aliases — use Orbitron for numbers, Rajdhani for labels, Inter as fallback
  const FONT_NUM = "Orbitron";
  const FONT_LBL = "Rajdhani";
  const FONT_FB  = "Inter";

  function numFont(size) { return "900 " + size + "px " + FONT_NUM + ", " + FONT_FB; }
  function lblFont(size) { return "700 " + size + "px " + FONT_LBL + ", " + FONT_FB; }
  function hdrFont(size) { return "900 " + size + "px " + FONT_LBL + ", " + FONT_FB; }

  // Abbreviate large numbers: 1500 → 1.5K, 2000000 → 2M
  function fmtNum(n) {
    const v = Number(n);
    if (isNaN(v)) return String(n);
    if (Math.abs(v) >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
    if (Math.abs(v) >= 1_000_000)     return (v / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (Math.abs(v) >= 10_000)        return (v / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return v.toLocaleString();
  }

  // Auto-fit number text into maxW using Orbitron, starting at maxSize down to minSize
  function fitNumText(str, maxSz, minSz, maxW) {
    let sz = maxSz;
    while (sz > minSz) {
      ctx.font = numFont(sz);
      if (ctx.measureText(str).width <= maxW) return sz;
      sz -= 1;
    }
    return minSz;
  }

  // ─── DARK BACKGROUND WASH ────────────────────────────────────────
  const wash = ctx.createLinearGradient(0, 0, W, H);
  wash.addColorStop(0, "rgba(2, 4, 16, 0.85)");
  wash.addColorStop(0.5, "rgba(5, 8, 24, 0.78)");
  wash.addColorStop(1, "rgba(1, 2, 12, 0.90)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);

  // ─── SYSTEM GRID ─────────────────────────────────────────────────
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.strokeStyle = "#4A90D9";
  ctx.lineWidth = 1;
  for (let gx = 0; gx < W; gx += 48) { ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,H); ctx.stroke(); }
  for (let gy = 0; gy < H; gy += 48) { ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke(); }
  ctx.restore();

  // ─── DIAGONAL SCAN LINES ─────────────────────────────────────────
  ctx.save();
  ctx.globalAlpha = 0.022;
  ctx.strokeStyle = "#7C3AED";
  ctx.lineWidth = 1;
  for (let i = -H; i < W + H; i += 28) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i+H,H); ctx.stroke(); }
  ctx.restore();

  // ─── TOP & BOTTOM BARS ───────────────────────────────────────────
  const topGrad = ctx.createLinearGradient(0,0,W,0);
  topGrad.addColorStop(0, rankTint); topGrad.addColorStop(0.3,"#7C3AED"); topGrad.addColorStop(0.7,"#0EA5E9"); topGrad.addColorStop(1,rankTint);
  ctx.fillStyle = topGrad; ctx.fillRect(0,0,W,8);
  const tg = ctx.createLinearGradient(0,8,0,72); tg.addColorStop(0,rankTint+"44"); tg.addColorStop(1,"transparent");
  ctx.fillStyle=tg; ctx.fillRect(0,8,W,64);
  ctx.fillStyle = topGrad; ctx.fillRect(0,H-8,W,8);
  const bg2=ctx.createLinearGradient(0,H-72,0,H-8); bg2.addColorStop(0,"transparent"); bg2.addColorStop(1,rankTint+"33");
  ctx.fillStyle=bg2; ctx.fillRect(0,H-72,W,64);

  // ─── CORNER BRACKETS ─────────────────────────────────────────────
  function drawCorner(bx,by,size,flipX,flipY,color) {
    ctx.save(); ctx.translate(bx,by); ctx.scale(flipX?-1:1,flipY?-1:1);
    ctx.strokeStyle=color; ctx.lineWidth=3; ctx.lineCap="square";
    ctx.beginPath(); ctx.moveTo(0,size); ctx.lineTo(0,0); ctx.lineTo(size,0); ctx.stroke();
    ctx.globalAlpha=0.25; ctx.lineWidth=9; ctx.stroke(); ctx.restore();
  }
  drawCorner(16,16,46,false,false,rankTint); drawCorner(W-16,16,46,true,false,rankTint);
  drawCorner(16,H-16,46,false,true,rankTint); drawCorner(W-16,H-16,46,true,true,rankTint);

  // ─── LEFT PANEL ──────────────────────────────────────────────────
  const LP_X=32, LP_Y=28, LP_W=360, LP_H=H-56;
  roundedRect(ctx,LP_X,LP_Y,LP_W,LP_H,24);
  const lpBg=ctx.createLinearGradient(LP_X,LP_Y,LP_X,LP_Y+LP_H);
  lpBg.addColorStop(0,"rgba(10,18,45,0.96)"); lpBg.addColorStop(1,"rgba(5,10,28,0.99)");
  ctx.fillStyle=lpBg; ctx.fill();
  ctx.strokeStyle=rankTint+"70"; ctx.lineWidth=2; ctx.stroke();
  // glowing left border stripe
  roundedRect(ctx,LP_X,LP_Y,5,LP_H,4);
  const lbg=ctx.createLinearGradient(LP_X,LP_Y,LP_X,LP_Y+LP_H);
  lbg.addColorStop(0,rankTint); lbg.addColorStop(0.5,"#7C3AED"); lbg.addColorStop(1,rankTint);
  ctx.fillStyle=lbg; ctx.fill();

  // ─── AVATAR ──────────────────────────────────────────────────────
  const AV_CX=LP_X+LP_W/2, AV_CY=LP_Y+150, AV_R=105;
  [AV_R+36,AV_R+22,AV_R+10].forEach((r,i)=>{
    ctx.beginPath(); ctx.arc(AV_CX,AV_CY,r,0,Math.PI*2);
    ctx.strokeStyle=rankTint; ctx.globalAlpha=0.10-i*0.02; ctx.lineWidth=3-i; ctx.stroke(); ctx.globalAlpha=1;
    ctx.fillStyle=rankTint+(i===0?"16":i===1?"0E":"07"); ctx.fill();
  });
  // orbit dots
  for(let d=0;d<8;d++){
    const ang=(d/8)*Math.PI*2; const or=AV_R+26;
    ctx.beginPath(); ctx.arc(AV_CX+Math.cos(ang)*or,AV_CY+Math.sin(ang)*or,d%2===0?4:2.5,0,Math.PI*2);
    ctx.fillStyle=d%2===0?rankTint:"#7C3AED"; ctx.globalAlpha=d%2===0?0.9:0.5; ctx.fill(); ctx.globalAlpha=1;
  }
  ctx.beginPath(); ctx.arc(AV_CX,AV_CY,AV_R,0,Math.PI*2); ctx.fillStyle="#0D1528"; ctx.fill();
  ctx.strokeStyle=rankTint; ctx.lineWidth=3.5; ctx.stroke();
  try {
    const au=user.displayAvatarURL({size:512});
    if(au){const ai=await loadImage(au);ctx.save();ctx.beginPath();ctx.arc(AV_CX,AV_CY,AV_R-2,0,Math.PI*2);ctx.clip();ctx.drawImage(ai,AV_CX-AV_R,AV_CY-AV_R,AV_R*2,AV_R*2);ctx.restore();}
  } catch(e){}
  // avatar sheen
  ctx.save(); ctx.beginPath(); ctx.arc(AV_CX,AV_CY,AV_R-2,0,Math.PI*2); ctx.clip();
  const sh=ctx.createLinearGradient(AV_CX-AV_R,AV_CY-AV_R,AV_CX-AV_R,AV_CY+AV_R);
  sh.addColorStop(0,"rgba(255,255,255,0.15)"); sh.addColorStop(0.4,"rgba(255,255,255,0.00)"); sh.addColorStop(1,"rgba(0,0,0,0.40)");
  ctx.fillStyle=sh; ctx.fillRect(AV_CX-AV_R,AV_CY-AV_R,AV_R*2,AV_R*2); ctx.restore();
  // rank badge
  const BD_X=AV_CX+AV_R*0.65, BD_Y=AV_CY+AV_R*0.65, BD_R=38;
  ctx.beginPath(); ctx.arc(BD_X,BD_Y,BD_R+5,0,Math.PI*2); ctx.fillStyle=rankTint+"40"; ctx.fill();
  ctx.beginPath(); ctx.arc(BD_X,BD_Y,BD_R,0,Math.PI*2); ctx.fillStyle=rankTint; ctx.fill();
  ctx.strokeStyle="#060E24"; ctx.lineWidth=4; ctx.stroke();
  ctx.fillStyle="#FFFFFF"; ctx.font=numFont(rankBadge.length>1?16:22); ctx.textAlign="center";
  ctx.fillText(rankBadge,BD_X,BD_Y+9); ctx.textAlign="left";

  // Name
  ctx.textAlign="center";
  const nmSz=fitFontSize(ctx,displayName,34,16,LP_W-40);
  ctx.font=hdrFont(nmSz); ctx.fillStyle="#F8FAFC";
  ctx.fillText(ellipsizeText(ctx,displayName,LP_W-40),AV_CX,AV_CY+AV_R+48);
  ctx.font=lblFont(16); ctx.fillStyle=rankTint;
  ctx.fillText(rankLabel,AV_CX,AV_CY+AV_R+74);
  // level pill
  const lvW=130,lvH=36,lvX=AV_CX-65,lvY=AV_CY+AV_R+88;
  roundedRect(ctx,lvX,lvY,lvW,lvH,999);
  const lvg=ctx.createLinearGradient(lvX,lvY,lvX+lvW,lvY);
  lvg.addColorStop(0,"#1E40AF"); lvg.addColorStop(1,"#0EA5E9"); ctx.fillStyle=lvg; ctx.fill();
  ctx.font=numFont(14); ctx.fillStyle="#FFFFFF";
  ctx.fillText("LV. "+String(hunter.level),AV_CX,lvY+24); ctx.textAlign="left";

  // ─── RANK PROGRESS BAR ───────────────────────────────────────────
  const rpY=AV_CY+AV_R+140, rpW=LP_W-48, rpX=LP_X+24;
  const rankIdx=RANKS.indexOf(rankLabel);
  const nextRank=rankIdx<RANKS.length-1?RANKS[rankIdx+1]:null;
  const nextThresh=nextRank?RANK_THRESHOLDS[nextRank]:null;
  const rankPct=nextThresh?Math.min(hunter.level/nextThresh,1):1;

  ctx.font=lblFont(12); ctx.fillStyle="#475569"; ctx.fillText("RANK PROGRESS",rpX,rpY);
  if(nextRank){ctx.textAlign="right";ctx.fillStyle=rankTint;ctx.fillText("→ "+nextRank+"  (Lv."+nextThresh+")",rpX+rpW,rpY);ctx.textAlign="left";}

  const rpBarH=22,rpBarY=rpY+10;
  ctx.save(); ctx.shadowColor=rankTint; ctx.shadowBlur=14;
  roundedRect(ctx,rpX,rpBarY,rpW,rpBarH,999); ctx.strokeStyle=rankTint+"45"; ctx.lineWidth=1.5; ctx.stroke(); ctx.restore();
  roundedRect(ctx,rpX,rpBarY,rpW,rpBarH,999);
  const rpt=ctx.createLinearGradient(rpX,rpBarY,rpX,rpBarY+rpBarH);
  rpt.addColorStop(0,"rgba(20,30,65,0.96)"); rpt.addColorStop(1,"rgba(10,16,42,0.99)"); ctx.fillStyle=rpt; ctx.fill();
  const rpFillW=Math.max(0,rpW*rankPct);
  if(rpFillW>0){
    roundedRect(ctx,rpX,rpBarY,rpFillW,rpBarH,999);
    const rpf=ctx.createLinearGradient(rpX,rpBarY,rpX+rpFillW,rpBarY);
    rpf.addColorStop(0,rankTint); rpf.addColorStop(0.6,"#7C3AED"); rpf.addColorStop(1,"#0EA5E9"); ctx.fillStyle=rpf; ctx.fill();
    roundedRect(ctx,rpX,rpBarY,rpFillW,rpBarH*0.44,999); ctx.fillStyle="rgba(255,255,255,0.22)"; ctx.fill();
    if(rpFillW>10){
      const tx=rpX+rpFillW,ty=rpBarY+rpBarH/2;
      ctx.save(); ctx.shadowColor="#FFF"; ctx.shadowBlur=16;
      ctx.beginPath(); ctx.arc(tx,ty,5,0,Math.PI*2); ctx.fillStyle="#FFFFFF"; ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(tx,ty,10,0,Math.PI*2); ctx.strokeStyle="rgba(255,255,255,0.30)"; ctx.lineWidth=1.5; ctx.stroke();
    }
  }
  [0.25,0.5,0.75].forEach(f=>{
    const tx=rpX+rpW*f; ctx.strokeStyle="rgba(255,255,255,0.10)"; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(tx,rpBarY+3); ctx.lineTo(tx,rpBarY+rpBarH-3); ctx.stroke();
  });
  if(rpFillW>30){
    ctx.font=numFont(11); ctx.fillStyle="#F8FAFC"; ctx.textAlign="center";
    ctx.fillText(Math.floor(rankPct*100)+"%",rpX+rpFillW/2,rpBarY+15); ctx.textAlign="left";
  }

  // ─── DIVIDER ─────────────────────────────────────────────────────
  const divY=rpBarY+rpBarH+16;
  ctx.strokeStyle=rankTint+"30"; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(LP_X+20,divY); ctx.lineTo(LP_X+LP_W-20,divY); ctx.stroke();

  // ─── RESOURCE CARDS ──────────────────────────────────────────────
  const resources=[
    {key:"gold",  label:"GOLD",     value:Number(hunter.gold||0),           color:"#FBBF24"},
    {key:"mana",  label:"MANA",     value:Number(hunter.mana||0),           color:"#A78BFA"},
    {key:"level", label:"LEVEL",    value:Number(hunter.level||1),          color:"#06B6D4"},
    {key:null,    label:"STAT PTS", value:Number(hunter.stat_points||0),     color:"#10B981"},
    {key:null,    label:"SHADOWS",  value:equippedShadows+"/"+shadowSlots,  color:"#8B5CF6"},
    {key:null,    label:"CARDS",    value:ownedCards,                        color:"#F97316"},
  ];
  const resW=(LP_W-48)/2, resH=78, resGap=10, resStartY=divY+12;

  for(let i=0;i<resources.length;i++){
    const res=resources[i], col=i%2, row=Math.floor(i/2);
    const rx=LP_X+16+col*(resW+resGap), ry=resStartY+row*(resH+resGap);

    // card
    roundedRect(ctx,rx,ry,resW,resH,14);
    const rbg=ctx.createLinearGradient(rx,ry,rx,ry+resH);
    rbg.addColorStop(0,"rgba(15,24,55,0.94)"); rbg.addColorStop(1,"rgba(7,12,32,0.98)");
    ctx.fillStyle=rbg; ctx.fill();
    ctx.strokeStyle=res.color+"55"; ctx.lineWidth=1.5; ctx.stroke();
    // top colored stripe
    roundedRect(ctx,rx+2,ry+2,resW-4,4,3); ctx.fillStyle=res.color; ctx.fill();
    // gloss
    roundedRect(ctx,rx+4,ry+7,resW-8,resH*0.32,10);
    const rgl=ctx.createLinearGradient(rx,ry,rx,ry+resH*0.4);
    rgl.addColorStop(0,"rgba(255,255,255,0.08)"); rgl.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=rgl; ctx.fill();
    // right color accent
    roundedRect(ctx,rx+resW-4,ry,4,resH,4); ctx.fillStyle=res.color+"33"; ctx.fill();

    const emoji=res.key?await loadDiscordEmojiById(STAT_EMOJI_IDS[res.key]):null;
    let lx=rx+12;
    if(emoji){ctx.drawImage(emoji,lx,ry+12,18,18);lx+=24;}
    ctx.fillStyle="#4B5563"; ctx.font=lblFont(12); ctx.fillText(res.label,lx,ry+27);

    const resValStr = typeof res.value === "number" ? fmtNum(res.value) : String(res.value);
    const resvSz = fitNumText(resValStr, 24, 12, resW - 24);
    ctx.fillStyle = res.color; ctx.font = numFont(resvSz);
    ctx.fillText(resValStr, rx + 12, ry + resH - 10);
  }

  // ─── MAIN AREA ───────────────────────────────────────────────────
  const MX=LP_X+LP_W+24, MY=28, MW=W-MX-32;

  // SECTION HEADER HELPER
  function sysHeader(x,y,label,color) {
    ctx.font=lblFont(13); ctx.fillStyle="#1E3A5F";
    ctx.fillText("═".repeat(70),x,y+16);
    ctx.fillStyle=color; ctx.fillText("[ SYSTEM ]  "+label,x,y+16);
  }

  sysHeader(MX,MY,"HUNTER STATISTICS PANEL  v3.0","#3B82F6");

  // ─── STAT GAUGE CARDS ────────────────────────────────────────────
  const coreStats=[
    {key:"strength",    abbr:"STR",label:"Strength",    value:hunter.strength,    color:"#EF4444",glow:"#FF7B7B",bg:"rgba(100,20,20,0.18)"},
    {key:"agility",     abbr:"AGI",label:"Agility",     value:hunter.agility,     color:"#10B981",glow:"#34D399",bg:"rgba(16,100,60,0.18)"},
    {key:"intelligence",abbr:"INT",label:"Intelligence",value:hunter.intelligence,color:"#3B82F6",glow:"#60A5FA",bg:"rgba(20,50,120,0.18)"},
    {key:"vitality",    abbr:"VIT",label:"Vitality",    value:hunter.vitality,    color:"#F59E0B",glow:"#FCD34D",bg:"rgba(100,70,10,0.18)"},
  ];

  const gaugeGap=20, gaugeW=(MW-gaugeGap*3)/4, gaugeH=200, gaugeY=MY+38, gaugeR=54, maxStat=200;

  for(let i=0;i<coreStats.length;i++){
    const s=coreStats[i], gx=MX+i*(gaugeW+gaugeGap), gcx=gx+gaugeW/2, gcy=gaugeY+gaugeR+28;

    // card bg with tinted gradient
    roundedRect(ctx,gx,gaugeY,gaugeW,gaugeH,20);
    const gbg=ctx.createLinearGradient(gx,gaugeY,gx,gaugeY+gaugeH);
    gbg.addColorStop(0,s.bg); gbg.addColorStop(0.5,"rgba(8,14,35,0.97)"); gbg.addColorStop(1,"rgba(4,8,22,0.99)");
    ctx.fillStyle=gbg; ctx.fill();
    ctx.strokeStyle=s.color+"55"; ctx.lineWidth=2; ctx.stroke();

    // top gloss on card
    roundedRect(ctx,gx+2,gaugeY+2,gaugeW-4,gaugeH*0.28,18);
    const cg=ctx.createLinearGradient(gx,gaugeY,gx,gaugeY+gaugeH*0.28);
    cg.addColorStop(0,"rgba(255,255,255,0.08)"); cg.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=cg; ctx.fill();

    // colored bottom accent line
    roundedRect(ctx,gx+8,gaugeY+gaugeH-6,gaugeW-16,4,4); ctx.fillStyle=s.color; ctx.fill();

    // gauge track
    const arcS=Math.PI*0.75, arcE=Math.PI*2.25;
    const arcF=arcS+(arcE-arcS)*Math.min(s.value/maxStat,1);
    ctx.beginPath(); ctx.arc(gcx,gcy,gaugeR,arcS,arcE);
    ctx.strokeStyle="rgba(25,40,80,0.9)"; ctx.lineWidth=12; ctx.lineCap="round"; ctx.stroke();
    // outer dim ring
    ctx.beginPath(); ctx.arc(gcx,gcy,gaugeR+7,arcS,arcE);
    ctx.strokeStyle=s.color+"18"; ctx.lineWidth=3; ctx.lineCap="round"; ctx.stroke();

    // gauge fill with glow
    ctx.save(); ctx.shadowColor=s.glow; ctx.shadowBlur=22;
    ctx.beginPath(); ctx.arc(gcx,gcy,gaugeR,arcS,arcF);
    const ag=ctx.createLinearGradient(gcx-gaugeR,gcy,gcx+gaugeR,gcy);
    ag.addColorStop(0,s.color+"CC"); ag.addColorStop(0.6,s.color); ag.addColorStop(1,s.glow);
    ctx.strokeStyle=ag; ctx.lineWidth=12; ctx.lineCap="round"; ctx.stroke(); ctx.restore();

    // inner circle bg
    ctx.beginPath(); ctx.arc(gcx,gcy,gaugeR-16,0,Math.PI*2); ctx.fillStyle="rgba(4,8,22,0.97)"; ctx.fill();
    // inner ring
    ctx.beginPath(); ctx.arc(gcx,gcy,gaugeR-16,0,Math.PI*2); ctx.strokeStyle=s.color+"22"; ctx.lineWidth=2; ctx.stroke();

    // value inside gauge — use abbreviated number to prevent overflow
    const gaugeInnerW = (gaugeR - 16) * 1.8;
    const valRaw = fmtNum(s.value);
    const inSz = fitNumText(valRaw, 34, 12, gaugeInnerW);
    ctx.font = numFont(inSz); ctx.fillStyle = s.glow; ctx.textAlign = "center";
    ctx.save(); ctx.shadowColor = s.glow; ctx.shadowBlur = 14;
    ctx.fillText(valRaw, gcx, gcy + Math.floor(inSz * 0.38));
    ctx.restore();

    // emoji + abbr
    const emoji=await loadDiscordEmojiById(STAT_EMOJI_IDS[s.key]);
    const lby=gaugeY+gaugeH-64;
    if(emoji){ctx.drawImage(emoji,gcx-30,lby,24,24);ctx.font=lblFont(15);ctx.fillStyle=s.color;ctx.fillText(s.abbr,gcx+10,lby+18);}
    else{ctx.font=lblFont(16);ctx.fillStyle=s.color;ctx.fillText(s.abbr,gcx,lby+18);}
    ctx.font=lblFont(12); ctx.fillStyle="#374151"; ctx.textAlign="center";
    ctx.fillText(s.label.toUpperCase(),gcx,lby+38);

    // bottom mini bar
    const pctX=gx+14,pctY2=gaugeY+gaugeH-14,pctW=gaugeW-28,pctH=6;
    roundedRect(ctx,pctX,pctY2,pctW,pctH,999); ctx.fillStyle="rgba(20,32,70,0.9)"; ctx.fill();
    const pf=Math.max(0,pctW*Math.min(s.value/maxStat,1));
    if(pf>0){
      roundedRect(ctx,pctX,pctY2,pf,pctH,999);
      const pg=ctx.createLinearGradient(pctX,pctY2,pctX+pf,pctY2);
      pg.addColorStop(0,s.color); pg.addColorStop(1,s.glow); ctx.fillStyle=pg; ctx.fill();
    }
    ctx.textAlign="left";
  }

  // ─── POWER ANALYSIS SECTION ──────────────────────────────────────
  const pwSecY=gaugeY+gaugeH+26;
  sysHeader(MX,pwSecY,"COMBAT POWER ANALYSIS","#7C3AED");

  const powerEntries=[
    {label:"BASE PWR",  value:basePower,  color:"#22C55E",glow:"#4ADE80",pct:Math.min(basePower/Math.max(finalPower,1),1)},
    {label:"SHADOW+",   value:shadowPower,color:"#A78BFA",glow:"#C4B5FD",pct:Math.min(shadowPower/Math.max(finalPower,1),1),prefix:"+"},
    {label:"CARD+",     value:cardPower,  color:"#F59E0B",glow:"#FCD34D",pct:Math.min(cardPower/Math.max(finalPower,1),1),prefix:"+"},
    {label:"⚡ POWER",  value:finalPower, color:"#EF4444",glow:"#FCA5A5",pct:1,                                             final:true},
  ];
  const pwW=(MW-gaugeGap*3)/4, pwH=132, pwY=pwSecY+28;

  for(let i=0;i<powerEntries.length;i++){
    const pe=powerEntries[i], px=MX+i*(pwW+gaugeGap), fin=pe.final;
    const peDisp=(pe.prefix?pe.prefix:"")+fmtNum(pe.value);
    const peLabelMaxW=pwW-28;

    roundedRect(ctx,px,pwY,pwW,pwH,16);
    if(fin){
      const fbg=ctx.createLinearGradient(px,pwY,px,pwY+pwH);
      fbg.addColorStop(0,"rgba(120,20,20,0.45)"); fbg.addColorStop(1,"rgba(60,5,5,0.65)");
      ctx.fillStyle=fbg;
    } else {
      const pbg=ctx.createLinearGradient(px,pwY,px,pwY+pwH);
      pbg.addColorStop(0,"rgba(10,18,48,0.96)"); pbg.addColorStop(1,"rgba(5,9,28,0.99)");
      ctx.fillStyle=pbg;
    }
    ctx.fill();
    if(fin){ctx.save();ctx.shadowColor=pe.color;ctx.shadowBlur=18;}
    ctx.strokeStyle=pe.color+(fin?"99":"44"); ctx.lineWidth=fin?2.5:1.5; ctx.stroke();
    if(fin)ctx.restore();

    // top tinted band
    roundedRect(ctx,px,pwY,pwW,32,16);
    ctx.fillStyle=pe.color+(fin?"28":"18"); ctx.fill();

    ctx.font=lblFont(12); ctx.fillStyle=fin?"#E2E8F0":"#4B5563";
    ctx.fillText(pe.label,px+14,pwY+22);

    const pvSz = fitNumText(peDisp, fin ? 46 : 38, 16, peLabelMaxW);
    ctx.font = numFont(pvSz); ctx.fillStyle = pe.glow;
    if(fin){ctx.save();ctx.shadowColor=pe.color;ctx.shadowBlur=24;ctx.fillText(peDisp,px+14,pwY+90);ctx.restore();}
    else ctx.fillText(peDisp,px+14,pwY+86);

    // power mini bar
    const mbY=pwY+pwH-15,mbW=pwW-28;
    roundedRect(ctx,px+14,mbY,mbW,8,999); ctx.fillStyle="rgba(15,28,62,0.9)"; ctx.fill();
    const mf=Math.max(0,mbW*pe.pct);
    if(mf>0){
      roundedRect(ctx,px+14,mbY,mf,8,999);
      const mg=ctx.createLinearGradient(px+14,mbY,px+14+mf,mbY);
      mg.addColorStop(0,pe.color); mg.addColorStop(1,pe.glow); ctx.fillStyle=mg; ctx.fill();
      roundedRect(ctx,px+14,mbY,mf,4,999); ctx.fillStyle="rgba(255,255,255,0.18)"; ctx.fill();
    }
  }

  // ─── XP BAR (ULTRA) ──────────────────────────────────────────────
  const xpSecY=pwY+pwH+26;
  sysHeader(MX,xpSecY,"EXPERIENCE PROGRESS  ─  LV."+hunter.level,"#0EA5E9");

  const xpPct=Math.min(hunter.exp/expNeeded,1);
  const xpBY=xpSecY+28, xpBH=54;

  // outer glow
  ctx.save(); ctx.shadowColor="#1D4ED8"; ctx.shadowBlur=20;
  roundedRect(ctx,MX-2,xpBY-2,MW+4,xpBH+4,18); ctx.strokeStyle="#1D4ED822"; ctx.lineWidth=2; ctx.stroke(); ctx.restore();

  // track
  roundedRect(ctx,MX,xpBY,MW,xpBH,16);
  const xpT=ctx.createLinearGradient(MX,xpBY,MX,xpBY+xpBH);
  xpT.addColorStop(0,"rgba(10,18,52,0.97)"); xpT.addColorStop(1,"rgba(4,9,28,0.99)");
  ctx.fillStyle=xpT; ctx.fill(); ctx.strokeStyle="#1E3E6A"; ctx.lineWidth=1.5; ctx.stroke();

  // fill
  const xpFW=Math.max(0,(MW-4)*xpPct);
  if(xpFW>0){
    roundedRect(ctx,MX+2,xpBY+2,xpFW,xpBH-4,14);
    const xpF=ctx.createLinearGradient(MX+2,xpBY,MX+2+xpFW,xpBY);
    xpF.addColorStop(0,"#1D4ED8"); xpF.addColorStop(0.3,"#2563EB"); xpF.addColorStop(0.65,"#06B6D4"); xpF.addColorStop(1,"#7DD3FC");
    ctx.fillStyle=xpF; ctx.fill();
    // depth
    roundedRect(ctx,MX+2,xpBY+xpBH*0.55,xpFW,xpBH*0.43,14); ctx.fillStyle="rgba(0,0,0,0.20)"; ctx.fill();
    // gloss
    roundedRect(ctx,MX+2,xpBY+2,xpFW,xpBH*0.42,14);
    const gl=ctx.createLinearGradient(MX,xpBY,MX,xpBY+xpBH*0.42);
    gl.addColorStop(0,"rgba(255,255,255,0.36)"); gl.addColorStop(1,"rgba(255,255,255,0)"); ctx.fillStyle=gl; ctx.fill();
    // bottom glow
    roundedRect(ctx,MX+2,xpBY+xpBH*0.72,xpFW,xpBH*0.25,14);
    const bl=ctx.createLinearGradient(MX,xpBY+xpBH*0.72,MX,xpBY+xpBH);
    bl.addColorStop(0,"rgba(56,189,248,0)"); bl.addColorStop(1,"rgba(56,189,248,0.26)"); ctx.fillStyle=bl; ctx.fill();
    // tip flare
    if(xpFW>12){
      const tipX=MX+2+xpFW, tipY=xpBY+xpBH/2;
      [22,14,8].forEach((r,ri)=>{ctx.beginPath();ctx.arc(tipX,tipY,r,0,Math.PI*2);ctx.fillStyle="rgba(125,211,252,"+(0.07-ri*0.018)+")";ctx.fill();});
      ctx.save();ctx.shadowColor="#FFF";ctx.shadowBlur=22;ctx.beginPath();ctx.arc(tipX,tipY,5,0,Math.PI*2);ctx.fillStyle="#FFFFFF";ctx.fill();ctx.restore();
      [-0.4,0,0.4,Math.PI-0.3,Math.PI,Math.PI+0.3].forEach(a=>{
        ctx.strokeStyle="rgba(255,255,255,0.50)";ctx.lineWidth=1.5;ctx.lineCap="round";
        ctx.beginPath();ctx.moveTo(tipX+Math.cos(a)*8,tipY+Math.sin(a)*8);ctx.lineTo(tipX+Math.cos(a)*17,tipY+Math.sin(a)*17);ctx.stroke();
      });
    }
  }

  // 10-segment markers
  for(let seg=1;seg<10;seg++){
    const sx=MX+2+(MW-4)*(seg/10);
    ctx.strokeStyle=seg%5===0?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.06)";
    ctx.lineWidth=seg%5===0?2:1;
    ctx.beginPath();ctx.moveTo(sx,xpBY+4);ctx.lineTo(sx,xpBY+xpBH-4);ctx.stroke();
  }

  // ── XP LABELS: left and right BELOW bar ──────────────────────────
  const xpLabelY = xpBY + xpBH + 20;
  // left: current XP
  ctx.font = numFont(15); ctx.fillStyle = "#38BDF8";
  ctx.fillText(hunter.exp.toLocaleString() + " XP", MX + 4, xpLabelY);
  // center: percentage
  ctx.font = numFont(15); ctx.fillStyle = "#FFFFFF"; ctx.textAlign = "center";
  ctx.fillText(Math.floor(xpPct * 100) + "%", MX + MW / 2, xpLabelY);
  // right: max XP
  ctx.font = lblFont(14); ctx.fillStyle = "#4B5563"; ctx.textAlign = "right";
  ctx.fillText("MAX  " + expNeeded.toLocaleString() + " XP", MX + MW - 4, xpLabelY);
  ctx.textAlign = "left";

  // ─── BOTTOM INFO ROW ─────────────────────────────────────────────
  const infoY=xpLabelY+18, infoH=62;
  roundedRect(ctx,MX,infoY,MW,infoH,14);
  const iBg=ctx.createLinearGradient(MX,infoY,MX+MW,infoY);
  iBg.addColorStop(0,"rgba(8,14,38,0.97)");iBg.addColorStop(0.5,"rgba(12,22,50,0.93)");iBg.addColorStop(1,"rgba(8,14,38,0.97)");
  ctx.fillStyle=iBg;ctx.fill();ctx.strokeStyle="#1E3A5F";ctx.lineWidth=1.5;ctx.stroke();

  const infoItems=[
    {label:"SHADOWS",   value:equippedShadows+" / "+shadowSlots, color:"#A78BFA"},
    {label:"CARDS",     value:String(ownedCards),                  color:"#F97316"},
    {label:"TOP CARDS", value:topCards,                            color:"#06B6D4"},
    {label:"STAT PTS",  value:String(hunter.stat_points||0),       color:"#10B981"},
    {label:"GOLD",      value:Number(hunter.gold||0).toLocaleString(),color:"#FBBF24"},
  ];
  const iiW=MW/infoItems.length;
  for(let i=0;i<infoItems.length;i++){
    const itm=infoItems[i],ix=MX+i*iiW+14;
    ctx.font=lblFont(11);ctx.fillStyle="#334155";ctx.fillText(itm.label,ix,infoY+20);
    ctx.font=numFont(17);ctx.fillStyle=itm.color;ctx.fillText(ellipsizeText(ctx,itm.value,iiW-28),ix,infoY+48);
    if(i<infoItems.length-1){ctx.strokeStyle="#1E3A5F";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(MX+(i+1)*iiW,infoY+10);ctx.lineTo(MX+(i+1)*iiW,infoY+infoH-10);ctx.stroke();}
  }

  // ─── WATERMARK ───────────────────────────────────────────────────
  ctx.fillStyle="rgba(100,116,139,0.30)"; ctx.font=lblFont(13); ctx.textAlign="right";
  ctx.fillText("Solo Leveling RPG  •  Hunter Database",W-36,H-22); ctx.textAlign="left";

  return toBuffer(canvas);
}

`;

const before=content.slice(0,startIdx);
const after=content.slice(endIdx);
fs.writeFileSync(filePath, before+newFunction+after, "utf8");
console.log("✅ Ultimate Stats Card v3 patched with new fonts!");
