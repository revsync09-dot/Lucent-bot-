const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src", "services", "cardGenerator.js");
let content = fs.readFileSync(filePath, "utf8");

const startMarker = "async function generateStartCard(user, hunter) {";
const endMarker   = "async function generateDungeonSpawnCard(";

const startIdx = content.indexOf(startMarker);
const endIdx   = content.indexOf(endMarker);
if (startIdx === -1 || endIdx === -1) { console.error("Markers not found", {startIdx, endIdx}); process.exit(1); }

const newFn = `async function generateStartCard(user, hunter) {
  const displayName = formatDisplayName(user.username);
  const W = 1400, H = 820;
  const canvas = new Canvas(W, H);
  const ctx = canvas.getContext("2d");
  await drawMainBackground(ctx, W, H);

  const rankLabel = normalizeRank(hunter.rank);
  const rankTint  = rankColor(rankLabel);
  const rankBadge = rankBadgeText(rankLabel);

  const FONT_NUM = "Orbitron";
  const FONT_LBL = "Rajdhani";
  const FONT_FB  = "Inter";
  function numFont(sz) { return "900 " + sz + "px " + FONT_NUM + ", " + FONT_FB; }
  function lblFont(sz) { return "700 " + sz + "px " + FONT_LBL + ", " + FONT_FB; }

  // Abbreviate large numbers
  function fmtNum(n) {
    const v = Number(n);
    if (isNaN(v)) return String(n);
    if (Math.abs(v) >= 1_000_000_000) return (v/1_000_000_000).toFixed(1).replace(/\.0$/,"")+"B";
    if (Math.abs(v) >= 1_000_000)     return (v/1_000_000).toFixed(1).replace(/\.0$/,"")+"M";
    if (Math.abs(v) >= 10_000)        return (v/1_000).toFixed(1).replace(/\.0$/,"")+"K";
    return v.toLocaleString();
  }
  // Fit Orbitron text within maxW, stepping down from maxSz to minSz
  function fitNumText(str, maxSz, minSz, maxW) {
    let sz = maxSz;
    while (sz > minSz) {
      ctx.font = numFont(sz);
      if (ctx.measureText(str).width <= maxW) return sz;
      sz -= 1;
    }
    return minSz;
  }

  // ─── DARK WASH ───────────────────────────────────────────────────
  const wash = ctx.createLinearGradient(0,0,W,H);
  wash.addColorStop(0,"rgba(2,4,18,0.82)"); wash.addColorStop(1,"rgba(1,2,12,0.92)");
  ctx.fillStyle=wash; ctx.fillRect(0,0,W,H);

  // ─── GRID ────────────────────────────────────────────────────────
  ctx.save(); ctx.globalAlpha=0.04; ctx.strokeStyle="#4A90D9"; ctx.lineWidth=1;
  for(let gx=0;gx<W;gx+=48){ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,H);ctx.stroke();}
  for(let gy=0;gy<H;gy+=48){ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(W,gy);ctx.stroke();}
  ctx.restore();

  // ─── SCAN LINES ──────────────────────────────────────────────────
  ctx.save(); ctx.globalAlpha=0.02; ctx.strokeStyle="#7C3AED"; ctx.lineWidth=1;
  for(let i=-H;i<W+H;i+=26){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+H,H);ctx.stroke();}
  ctx.restore();

  // ─── TOP + BOTTOM ACCENT BARS ────────────────────────────────────
  const barGrad = ctx.createLinearGradient(0,0,W,0);
  barGrad.addColorStop(0,"#7C3AED"); barGrad.addColorStop(0.4,"#4F46E5");
  barGrad.addColorStop(0.7,"#0EA5E9"); barGrad.addColorStop(1,"#7C3AED");
  ctx.fillStyle=barGrad; ctx.fillRect(0,0,W,8);
  const tGlow=ctx.createLinearGradient(0,8,0,80);
  tGlow.addColorStop(0,"rgba(124,58,237,0.40)"); tGlow.addColorStop(1,"transparent");
  ctx.fillStyle=tGlow; ctx.fillRect(0,8,W,72);
  ctx.fillStyle=barGrad; ctx.fillRect(0,H-8,W,8);
  const bGlow=ctx.createLinearGradient(0,H-80,0,H-8);
  bGlow.addColorStop(0,"transparent"); bGlow.addColorStop(1,"rgba(14,165,233,0.30)");
  ctx.fillStyle=bGlow; ctx.fillRect(0,H-80,W,72);

  // ─── CORNER BRACKETS ─────────────────────────────────────────────
  function drawCorner(bx,by,size,flipX,flipY,color) {
    ctx.save(); ctx.translate(bx,by); ctx.scale(flipX?-1:1,flipY?-1:1);
    ctx.strokeStyle=color; ctx.lineWidth=3; ctx.lineCap="square";
    ctx.beginPath(); ctx.moveTo(0,size); ctx.lineTo(0,0); ctx.lineTo(size,0); ctx.stroke();
    ctx.globalAlpha=0.22; ctx.lineWidth=10; ctx.stroke(); ctx.restore();
  }
  drawCorner(16,16,48,false,false,"#7C3AED"); drawCorner(W-16,16,48,true,false,"#7C3AED");
  drawCorner(16,H-16,48,false,true,"#0EA5E9"); drawCorner(W-16,H-16,48,true,true,"#0EA5E9");

  // ─── SYSTEM AWAKENING BANNER ─────────────────────────────────────
  const bannerY = 28;
  const bannerH = 80;
  roundedRect(ctx, 32, bannerY, W-64, bannerH, 18);
  const bannerBg = ctx.createLinearGradient(32, bannerY, W-32, bannerY+bannerH);
  bannerBg.addColorStop(0,"rgba(79,46,158,0.70)");
  bannerBg.addColorStop(0.5,"rgba(30,40,90,0.80)");
  bannerBg.addColorStop(1,"rgba(14,60,100,0.70)");
  ctx.fillStyle=bannerBg; ctx.fill();
  ctx.strokeStyle="#7C3AED88"; ctx.lineWidth=1.5; ctx.stroke();
  // banner gloss
  roundedRect(ctx,34,bannerY+2,W-68,bannerH*0.45,16);
  const bgl=ctx.createLinearGradient(32,bannerY,32,bannerY+bannerH*0.45);
  bgl.addColorStop(0,"rgba(255,255,255,0.10)"); bgl.addColorStop(1,"rgba(255,255,255,0)");
  ctx.fillStyle=bgl; ctx.fill();

  // system tag left
  ctx.font=lblFont(14); ctx.fillStyle="#7C3AED";
  ctx.fillText("[ SYSTEM ]", 52, bannerY+32);
  // big title
  ctx.font=numFont(28); ctx.fillStyle="#F8FAFC";
  ctx.textAlign="center";
  ctx.fillText("HUNTER REGISTRATION COMPLETE", W/2, bannerY+48);
  // sub label right
  ctx.font=lblFont(13); ctx.fillStyle="#4B5563"; ctx.textAlign="right";
  ctx.fillText("INITIALIZATION v1.0", W-52, bannerY+32);
  ctx.textAlign="left";

  // ─── LEFT: AVATAR PANEL ──────────────────────────────────────────
  const LP_X=32, LP_Y=bannerY+bannerH+16, LP_W=320, LP_H=H-LP_Y-36;
  roundedRect(ctx,LP_X,LP_Y,LP_W,LP_H,20);
  const lpBg=ctx.createLinearGradient(LP_X,LP_Y,LP_X,LP_Y+LP_H);
  lpBg.addColorStop(0,"rgba(10,18,48,0.96)"); lpBg.addColorStop(1,"rgba(4,8,24,0.99)");
  ctx.fillStyle=lpBg; ctx.fill();
  ctx.strokeStyle=rankTint+"66"; ctx.lineWidth=1.5; ctx.stroke();
  // left accent bar
  roundedRect(ctx,LP_X,LP_Y,5,LP_H,4);
  const lab=ctx.createLinearGradient(LP_X,LP_Y,LP_X,LP_Y+LP_H);
  lab.addColorStop(0,"#7C3AED"); lab.addColorStop(0.5,"#0EA5E9"); lab.addColorStop(1,"#7C3AED");
  ctx.fillStyle=lab; ctx.fill();

  // avatar
  const AV_CX=LP_X+LP_W/2, AV_CY=LP_Y+130, AV_R=90;
  [AV_R+32,AV_R+20,AV_R+10].forEach((r,i)=>{
    ctx.beginPath(); ctx.arc(AV_CX,AV_CY,r,0,Math.PI*2);
    ctx.strokeStyle="#7C3AED"; ctx.globalAlpha=0.10-i*0.02; ctx.lineWidth=3-i; ctx.stroke(); ctx.globalAlpha=1;
    ctx.fillStyle="#7C3AED"+(i===0?"15":i===1?"0D":"07"); ctx.fill();
  });
  // orbit dots
  for(let d=0;d<8;d++){
    const ang=(d/8)*Math.PI*2, or=AV_R+22;
    ctx.beginPath(); ctx.arc(AV_CX+Math.cos(ang)*or,AV_CY+Math.sin(ang)*or,d%2===0?3.5:2,0,Math.PI*2);
    ctx.fillStyle=d%2===0?"#7C3AED":"#0EA5E9"; ctx.globalAlpha=d%2===0?0.9:0.5; ctx.fill(); ctx.globalAlpha=1;
  }
  ctx.beginPath(); ctx.arc(AV_CX,AV_CY,AV_R,0,Math.PI*2); ctx.fillStyle="#0D1528"; ctx.fill();
  ctx.strokeStyle="#7C3AED"; ctx.lineWidth=3; ctx.stroke();
  try {
    const au=user.displayAvatarURL({size:512});
    if(au){const ai=await loadImage(au);ctx.save();ctx.beginPath();ctx.arc(AV_CX,AV_CY,AV_R-2,0,Math.PI*2);ctx.clip();ctx.drawImage(ai,AV_CX-AV_R,AV_CY-AV_R,AV_R*2,AV_R*2);ctx.restore();}
  } catch(e){}
  // sheen
  ctx.save(); ctx.beginPath(); ctx.arc(AV_CX,AV_CY,AV_R-2,0,Math.PI*2); ctx.clip();
  const sh=ctx.createLinearGradient(AV_CX-AV_R,AV_CY-AV_R,AV_CX-AV_R,AV_CY+AV_R);
  sh.addColorStop(0,"rgba(255,255,255,0.18)"); sh.addColorStop(0.4,"rgba(255,255,255,0)"); sh.addColorStop(1,"rgba(0,0,0,0.35)");
  ctx.fillStyle=sh; ctx.fillRect(AV_CX-AV_R,AV_CY-AV_R,AV_R*2,AV_R*2); ctx.restore();
  // rank badge
  const BD_X=AV_CX+AV_R*0.66, BD_Y=AV_CY+AV_R*0.66, BD_R=34;
  ctx.beginPath(); ctx.arc(BD_X,BD_Y,BD_R+4,0,Math.PI*2); ctx.fillStyle=rankTint+"44"; ctx.fill();
  ctx.beginPath(); ctx.arc(BD_X,BD_Y,BD_R,0,Math.PI*2); ctx.fillStyle=rankTint; ctx.fill();
  ctx.strokeStyle="#060E24"; ctx.lineWidth=3.5; ctx.stroke();
  ctx.fillStyle="#FFF"; ctx.font=numFont(rankBadge.length>1?14:20); ctx.textAlign="center";
  ctx.fillText(rankBadge,BD_X,BD_Y+8); ctx.textAlign="left";

  // Name + rank
  ctx.textAlign="center";
  const nmSz=Math.min(28, Math.floor(240/Math.max(displayName.length*0.6,1)));
  ctx.font=lblFont(Math.min(nmSz+4,30)); ctx.fillStyle="#F8FAFC";
  ctx.fillText(ellipsizeText(ctx,displayName,LP_W-32),AV_CX,AV_CY+AV_R+42);
  ctx.font=lblFont(14); ctx.fillStyle=rankTint;
  ctx.fillText(rankLabel+" RANK", AV_CX, AV_CY+AV_R+64);
  // NEW HUNTER pill
  const nhW=160,nhH=32,nhX=AV_CX-80,nhY=AV_CY+AV_R+78;
  roundedRect(ctx,nhX,nhY,nhW,nhH,999);
  const nhg=ctx.createLinearGradient(nhX,nhY,nhX+nhW,nhY);
  nhg.addColorStop(0,"#7C3AED"); nhg.addColorStop(1,"#0EA5E9"); ctx.fillStyle=nhg; ctx.fill();
  ctx.font=numFont(12); ctx.fillStyle="#FFF";
  ctx.fillText("✦  NEW HUNTER",AV_CX,nhY+21); ctx.textAlign="left";

  // starter stat mini-cards in left panel
  const miniStats=[
    {key:"rank",  label:"RANK",  value:rankLabel,              color:rankTint},
    {key:"level", label:"LEVEL", value:hunter.level,           color:"#06B6D4"},
    {key:"gold",  label:"GOLD",  value:hunter.gold,            color:"#FBBF24"},
    {key:"mana",  label:"MANA",  value:hunter.mana,            color:"#A78BFA"},
  ];
  const msW=(LP_W-44)/2, msH=58, msGap=8;
  const msStartY=nhY+nhH+14;
  for(let i=0;i<miniStats.length;i++){
    const ms=miniStats[i], col=i%2, row=Math.floor(i/2);
    const mx=LP_X+14+col*(msW+msGap), my=msStartY+row*(msH+msGap);
    roundedRect(ctx,mx,my,msW,msH,12);
    const msBg=ctx.createLinearGradient(mx,my,mx,my+msH);
    msBg.addColorStop(0,"rgba(15,22,52,0.95)"); msBg.addColorStop(1,"rgba(6,10,28,0.99)");
    ctx.fillStyle=msBg; ctx.fill();
    ctx.strokeStyle=ms.color+"55"; ctx.lineWidth=1.5; ctx.stroke();
    // top accent
    roundedRect(ctx,mx+2,my+2,msW-4,3,2); ctx.fillStyle=ms.color; ctx.fill();
    const mEmoji=ms.key&&STAT_EMOJI_IDS[ms.key]?await loadDiscordEmojiById(STAT_EMOJI_IDS[ms.key]):null;
    let mlx=mx+10;
    if(mEmoji){ctx.drawImage(mEmoji,mlx,my+10,16,16);mlx+=20;}
    ctx.fillStyle="#4B5563"; ctx.font=lblFont(11); ctx.fillText(ms.label,mlx,my+22);
    const msVal = typeof ms.value === "number" ? fmtNum(ms.value) : String(ms.value);
    const msSz = fitNumText(msVal, 18, 10, msW - 20);
    ctx.fillStyle=ms.color; ctx.font=numFont(msSz); ctx.fillText(ellipsizeText(ctx, msVal, msW-20), mx+10, my+msH-8);
  }

  // ─── CENTER: ATTRIBUTES ──────────────────────────────────────────
  const CP_X=LP_X+LP_W+18, CP_Y=LP_Y, CP_W=440, CP_H=LP_H;
  roundedRect(ctx,CP_X,CP_Y,CP_W,CP_H,20);
  const cpBg=ctx.createLinearGradient(CP_X,CP_Y,CP_X,CP_Y+CP_H);
  cpBg.addColorStop(0,"rgba(8,14,40,0.97)"); cpBg.addColorStop(1,"rgba(4,8,24,0.99)");
  ctx.fillStyle=cpBg; ctx.fill(); ctx.strokeStyle="#1E3A5F"; ctx.lineWidth=1.5; ctx.stroke();

  // section title
  ctx.font=lblFont(13); ctx.fillStyle="#1E3A5F";
  ctx.fillText("═".repeat(52),CP_X+16,CP_Y+22);
  ctx.fillStyle="#10B981"; ctx.fillText("[ SYSTEM ]  BASE ATTRIBUTES",CP_X+16,CP_Y+22);

  const attrs=[
    {key:"strength",     abbr:"STR",label:"Strength",    value:hunter.strength,    color:"#EF4444",glow:"#FF7B7B"},
    {key:"agility",      abbr:"AGI",label:"Agility",     value:hunter.agility,     color:"#10B981",glow:"#34D399"},
    {key:"intelligence", abbr:"INT",label:"Intelligence",value:hunter.intelligence,color:"#3B82F6",glow:"#60A5FA"},
    {key:"vitality",     abbr:"VIT",label:"Vitality",    value:hunter.vitality,    color:"#F59E0B",glow:"#FCD34D"},
  ];

  const atW=(CP_W-48)/2, atH=112, atGap=12;
  for(let i=0;i<attrs.length;i++){
    const a=attrs[i];
    const col=i%2, row=Math.floor(i/2);
    const ax=CP_X+16+col*(atW+atGap), ay=CP_Y+36+row*(atH+atGap);

    // card bg
    roundedRect(ctx,ax,ay,atW,atH,16);
    const abg=ctx.createLinearGradient(ax,ay,ax,ay+atH);
    abg.addColorStop(0,"rgba(12,20,50,0.95)"); abg.addColorStop(1,"rgba(5,9,26,0.99)");
    ctx.fillStyle=abg; ctx.fill();
    ctx.strokeStyle=a.color+"55"; ctx.lineWidth=1.5; ctx.stroke();
    // left accent
    roundedRect(ctx,ax,ay,5,atH,4); ctx.fillStyle=a.color; ctx.fill();
    // bottom accent
    roundedRect(ctx,ax+8,ay+atH-5,atW-16,4,4); ctx.fillStyle=a.color+"88"; ctx.fill();
    // gloss
    roundedRect(ctx,ax+2,ay+2,atW-4,atH*0.30,14);
    const agl=ctx.createLinearGradient(ax,ay,ax,ay+atH*0.30);
    agl.addColorStop(0,"rgba(255,255,255,0.09)"); agl.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=agl; ctx.fill();

    // emoji + label
    const aEmoji=await loadDiscordEmojiById(STAT_EMOJI_IDS[a.key]);
    let alx=ax+14;
    if(aEmoji){ctx.drawImage(aEmoji,alx,ay+14,22,22);alx+=28;}
    ctx.font=lblFont(14); ctx.fillStyle=a.color; ctx.fillText(a.abbr,alx,ay+30);
    ctx.font=lblFont(11); ctx.fillStyle="#374151"; ctx.fillText(a.label.toUpperCase(),ax+14,ay+50);

    // big value — abbreviated + auto-fit so nothing overflows
    const aValStr = fmtNum(a.value);
    const avSz = fitNumText(aValStr, 34, 14, atW - 28);
    ctx.font = numFont(avSz);
    ctx.save(); ctx.shadowColor = a.glow; ctx.shadowBlur = 18;
    ctx.fillStyle = a.glow; ctx.fillText(aValStr, ax+14, ay+atH-18); ctx.restore();
  }

  // ─── RIGHT: GUIDE PANEL ──────────────────────────────────────────
  const RP_X=CP_X+CP_W+18, RP_Y=LP_Y, RP_W=W-RP_X-36, RP_H=LP_H;
  roundedRect(ctx,RP_X,RP_Y,RP_W,RP_H,20);
  const rpBg=ctx.createLinearGradient(RP_X,RP_Y,RP_X,RP_Y+RP_H);
  rpBg.addColorStop(0,"rgba(8,14,42,0.97)"); rpBg.addColorStop(1,"rgba(4,8,24,0.99)");
  ctx.fillStyle=rpBg; ctx.fill(); ctx.strokeStyle="#1E3A5F"; ctx.lineWidth=1.5; ctx.stroke();
  // right accent bar
  roundedRect(ctx,RP_X+RP_W-5,RP_Y,5,RP_H,4);
  const rab=ctx.createLinearGradient(RP_X,RP_Y,RP_X,RP_Y+RP_H);
  rab.addColorStop(0,"#0EA5E9"); rab.addColorStop(0.5,"#7C3AED"); rab.addColorStop(1,"#0EA5E9");
  ctx.fillStyle=rab; ctx.fill();

  // section title
  ctx.font=lblFont(13); ctx.fillStyle="#1E3A5F";
  ctx.fillText("═".repeat(44),RP_X+16,RP_Y+22);
  ctx.fillStyle="#0EA5E9"; ctx.fillText("[ SYSTEM ]  AVAILABLE COMMANDS",RP_X+16,RP_Y+22);

  // command entries
  const commands=[
    {cmd:"/stats",   desc:"View your detailed combat stats card",    color:"#3B82F6"},
    {cmd:"/profile", desc:"Open your full hunter profile card",      color:"#10B981"},
    {cmd:"/hunt",    desc:"Go on a solo hunt for XP and gold",       color:"#F59E0B"},
    {cmd:"/dungeon", desc:"Enter a dungeon for epic rewards",        color:"#8B5CF6"},
    {cmd:"/battle",  desc:"Challenge another hunter to PvP",         color:"#EF4444"},
    {cmd:"/shop",    desc:"Visit the hunter shop to buy upgrades",   color:"#06B6D4"},
    {cmd:"/leaderboard",desc:"Check the global rank leaderboard",    color:"#FBBF24"},
    {cmd:"/shadows", desc:"Manage your shadow army",                  color:"#A78BFA"},
  ];

  let cmdY=RP_Y+38;
  const cmdRowH=54;
  for(let i=0;i<commands.length;i++){
    const cmd=commands[i], cy=cmdY+i*cmdRowH;
    // row bg
    roundedRect(ctx,RP_X+12,cy,RP_W-24,42,10);
    const rowBg=ctx.createLinearGradient(RP_X+12,cy,RP_X+RP_W-12,cy);
    rowBg.addColorStop(0,"rgba(12,20,50,0.80)"); rowBg.addColorStop(1,"rgba(6,10,28,0.60)");
    ctx.fillStyle=rowBg; ctx.fill();
    ctx.strokeStyle=cmd.color+"30"; ctx.lineWidth=1; ctx.stroke();
    // left micro bar
    roundedRect(ctx,RP_X+12,cy,4,42,4); ctx.fillStyle=cmd.color; ctx.fill();
    // cmd name
    ctx.font=numFont(13); ctx.fillStyle=cmd.color;
    ctx.fillText(cmd.cmd,RP_X+24,cy+27);
    // description
    const cmdW=ctx.measureText(cmd.cmd).width+14;
    ctx.font=lblFont(13); ctx.fillStyle="#4B5563";
    ctx.fillText("—  "+cmd.desc,RP_X+24+cmdW,cy+27);
  }

  // ─── BOTTOM BANNER (MOTIVATION) ──────────────────────────────────
  const btY=LP_Y+LP_H+10, btH=36;
  roundedRect(ctx,32,btY,W-64,btH,12);
  const btBg=ctx.createLinearGradient(32,btY,W-32,btY);
  btBg.addColorStop(0,"rgba(79,46,158,0.50)"); btBg.addColorStop(0.5,"rgba(14,60,100,0.55)"); btBg.addColorStop(1,"rgba(79,46,158,0.50)");
  ctx.fillStyle=btBg; ctx.fill(); ctx.strokeStyle="#7C3AED44"; ctx.lineWidth=1; ctx.stroke();
  ctx.font=lblFont(15); ctx.fillStyle="#94A3B8"; ctx.textAlign="center";
  ctx.fillText("I ALONE LEVEL UP  •  Rise from E-Rank and claim your place among the Shadow Monarch's chosen hunters", W/2, btY+23);
  ctx.textAlign="left";

  // watermark
  ctx.fillStyle="rgba(100,116,139,0.25)"; ctx.font=lblFont(12); ctx.textAlign="right";
  ctx.fillText("Solo Leveling RPG  •  Hunter Database",W-36,H-16); ctx.textAlign="left";

  return toBuffer(canvas);
}

`;

const before = content.slice(0, startIdx);
const after  = content.slice(endIdx);
fs.writeFileSync(filePath, before + newFn + after, "utf8");
console.log("✅ generateStartCard patched!");
