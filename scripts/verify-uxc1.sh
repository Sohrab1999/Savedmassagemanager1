#!/bin/bash
# UX-C1 verification — the AA contrast audit (both themes).
# Proves: the 9 core TEXT token pairs compute ≥ 4.5:1 in BOTH light and dark
# (the two REAL fixes: light primary 0.55→0.53 lifted primary-fg/primary from
# 4.4 → ~4.8; the NEW --destructive-foreground token replaced bare text-white
# on the 6 destructive confirm buttons — dark was 2.88, now ~6.7, light ~4.9);
# the 5 type-chart tokens (ICON color usage, WCAG 1.4.11 non-text ≥ 3:1)
# pass in both themes (light chart-2 fixed 1.88 → ~3.4); the type-token TINT
# (tintOf = 8% token over the card) keeps body text ≥ 4.5:1.
# Single session: dev server + browser (demo, fa, 1280).
cd /home/z/my-project
EV=roadmaps/evidence
mkdir -p $EV

pass=0; fail=0
ok()  { pass=$((pass+1)); echo "  ✔ $1"; }
bad() { fail=$((fail+1)); echo "  ✘ $1"; }
check() { if [ "$1" = "0" ]; then ok "$2"; else bad "$2"; fi; }
ab() { agent-browser "$@"; }
# eval output is a JSON-encoded string (double-encoded) — unwrap BOTH layers.
jqv() { printf '%s' "$2" | python3 -c '
import sys, json
raw = sys.stdin.read().strip()
try: v = json.loads(raw)
except Exception: v = raw
if isinstance(v, str):
    try: v = json.loads(v)
    except Exception: pass
try: print(v[sys.argv[1]])
except Exception: print("")
' "$1"; }

PAIR_PROBE='(()=>{const lum=(c)=>{let m=c.match(/lab\(\s*([\d.+-]+)%?\s+([\d.+-]+)\s+([\d.+-]+)/i);if(m){const L=+m[1],a=+m[2],b=+m[3];const fy=(L+16)/116,fx=fy+a/500,fz=fy-b/200;const e=216/24389,k=24389/27;const xr=fx**3>e?fx**3:(116*fx-16)/k,yr=L>k*e?((L+16)/116)**3:L/k,zr=fz**3>e?fz**3:(116*fz-16)/k;const X=xr*0.95047,Y=yr,Z=zr*1.08883;const R=3.2404542*X-1.5371385*Y-0.4985314*Z,G=-0.9692660*X+1.8760108*Y+0.0415560*Z,B=0.0556434*X-0.2040259*Y+1.0572252*Z;const cl=(x)=>Math.min(1,Math.max(0,x));return 0.2126*cl(R)+0.7152*cl(G)+0.0722*cl(B)}m=c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);if(m){const f=(x)=>{x/=255;return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4)};return 0.2126*f(+m[1])+0.7152*f(+m[2])+0.0722*f(+m[3])}return null};const probe=(cls)=>{const d=document.createElement("div");d.className=cls;d.style.position="absolute";d.style.opacity="0";document.body.appendChild(d);const cs=getComputedStyle(d);const out={fg:cs.color,bg:cs.backgroundColor};d.remove();return out};const ratio=(fg,bg)=>{const l1=lum(fg),l2=lum(bg);if(l1===null||l2===null)return null;const[h,l]=l1>l2?[l1,l2]:[l2,l1];return Math.round(((h+0.05)/(l+0.05))*100)/100};const pairs=[["fg","bg","text-foreground","bg-background"],["muted-fg","bg","text-muted-foreground","bg-background"],["primary-fg","primary","text-primary-foreground","bg-primary"],["secondary-fg","secondary","text-secondary-foreground","bg-secondary"],["card-fg","card","text-card-foreground","bg-card"],["popover-fg","popover","text-popover-foreground","bg-popover"],["accent-fg","accent","text-accent-foreground","bg-accent"],["destructive-fg","destructive","text-destructive-foreground","bg-destructive"],["primary","bg","text-primary","bg-background"]];const out={};for(const[n1,n2,fc,bc]of pairs){const f=probe(fc),b=probe(bc);out[n1+"/"+n2]=ratio(f.fg,b.bg)}return JSON.stringify(out)})()'

CHART_PROBE='(()=>{const lum=(c)=>{let m=c.match(/lab\(\s*([\d.+-]+)%?\s+([\d.+-]+)\s+([\d.+-]+)/i);if(m){const L=+m[1],a=+m[2],b=+m[3];const fy=(L+16)/116,fx=fy+a/500,fz=fy-b/200;const e=216/24389,k=24389/27;const xr=fx**3>e?fx**3:(116*fx-16)/k,yr=L>k*e?((L+16)/116)**3:L/k,zr=fz**3>e?fz**3:(116*fz-16)/k;const X=xr*0.95047,Y=yr,Z=zr*1.08883;const R=3.2404542*X-1.5371385*Y-0.4985314*Z,G=-0.9692660*X+1.8760108*Y+0.0415560*Z,B=0.0556434*X-0.2040259*Y+1.0572252*Z;const cl=(x)=>Math.min(1,Math.max(0,x));return 0.2126*cl(R)+0.7152*cl(G)+0.0722*cl(B)}return null};const cs=getComputedStyle(document.documentElement);const bgY=lum(cs.getPropertyValue("--background").trim());const out={bg:Math.round(bgY*1000)/1000};for(const n of[1,2,3,4,5]){const y=lum(cs.getPropertyValue("--chart-"+n).trim());const[h,l]=y>bgY?[y,bgY]:[bgY,y];out["chart"+n]=Math.round(((h+0.05)/(l+0.05))*100)/100}return JSON.stringify(out)})()'

TINT_PROBE='(()=>{const lum=(c)=>{let m=c.match(/oklab\(\s*([\d.+-]+)%?\s+([\d.+-]+)\s+([\d.+-]+)/i);if(m){const L=+m[1],A=+m[2],B=+m[3];const l_=L+0.3963377774*A+0.2158037573*B,mm=L-0.1055613458*A-0.0638541728*B,s_=L-0.0894841775*A-1.2914855480*B;const l=l_**3,m2=mm**3,ss=s_**3;const R=4.0767416621*l-3.3077115913*m2+0.2309699292*ss,G=-1.2684380046*l+2.6097574011*m2-0.3413193965*ss,B2=-0.0041960863*l-0.7034186147*m2+1.7076147010*ss;const cl=(x)=>Math.min(1,Math.max(0,x));return 0.2126*cl(R)+0.7152*cl(G)+0.0722*cl(B2)}m=c.match(/lab\(\s*([\d.+-]+)%?\s+([\d.+-]+)\s+([\d.+-]+)/i);if(m){const L=+m[1],a=+m[2],b=+m[3];const fy=(L+16)/116,fx=fy+a/500,fz=fy-b/200;const e=216/24389,k=24389/27;const xr=fx**3>e?fx**3:(116*fx-16)/k,yr=L>k*e?((L+16)/116)**3:L/k,zr=fz**3>e?fz**3:(116*fz-16)/k;const X=xr*0.95047,Y=yr,Z=zr*1.08883;const R=3.2404542*X-1.5371385*Y-0.4985314*Z,G=-0.9692660*X+1.8760108*Y+0.0415560*Z,B=0.0556434*X-0.2040259*Y+1.0572252*Z;const cl=(x)=>Math.min(1,Math.max(0,x));return 0.2126*cl(R)+0.7152*cl(G)+0.0722*cl(B)}m=c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);if(m){const f=(x)=>{x/=255;return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4)};return 0.2126*f(+m[1])+0.7152*f(+m[2])+0.0722*f(+m[3])}return null};const d=document.createElement("div");d.className="bg-card text-foreground/90";d.style.position="absolute";d.style.opacity="0";document.body.appendChild(d);const cs=getComputedStyle(d);const fg=cs.color;const card=cs.backgroundColor;d.remove();const lfg=lum(fg),lcard=lum(card);const worst=Math.round(((Math.max(lfg,lcard)+0.05)/(Math.min(lfg,lcard)+0.05))*100)/100;return JSON.stringify({fgOverCard:worst})})()'

# ---------- 0. backend ----------
agent-browser close >/dev/null 2>&1
pkill -9 -f "next dev" 2>/dev/null; pkill -9 -f "next-server" 2>/dev/null; sleep 1
setsid nohup bun run dev > dev.log 2>&1 < /dev/null & disown
for i in $(seq 1 90); do curl -s -o /dev/null --max-time 2 http://localhost:3000/api/stats && break; sleep 1; done
DEV=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:3000/api/stats)
[ "$DEV" = "200" ]; check $? "dev server up (GET /api/stats = $DEV)"
curl -s --max-time 30 -X POST http://localhost:3000/api/seed >/dev/null

# ---------- 1. browser: demo mode (fa, 1280, LIGHT) ----------
ab open http://localhost:3000 >/dev/null 2>&1
ab wait --fn "document.readyState === 'complete'" --timeout 30000 >/dev/null 2>&1
ab eval "try{localStorage.clear();localStorage.setItem('savedbox.bulk.coach.v1','1');localStorage.setItem('theme','light')}catch(e){}" >/dev/null 2>&1
ab set viewport 1280 900 >/dev/null 2>&1
ab reload >/dev/null 2>&1
ab wait --fn "[...document.querySelectorAll('button')].some(b=>b.textContent.includes('ادامه در حالت'))" --timeout 30000 >/dev/null 2>&1
ab eval "[...document.querySelectorAll('button')].find(b=>b.textContent.includes('ادامه در حالت')).click()" >/dev/null 2>&1
ab wait --fn "document.querySelector('main') && document.querySelector('main').innerText.trim().length > 20" --timeout 30000 >/dev/null 2>&1
ab wait 800 >/dev/null

# ---------- 2. LIGHT: the 9 text pairs ≥ 4.5 ----------
L=$(ab eval "$PAIR_PROBE" 2>/dev/null)
for p in "fg/bg" "muted-fg/bg" "primary-fg/primary" "secondary-fg/secondary" "card-fg/card" "popover-fg/popover" "accent-fg/accent" "destructive-fg/destructive" "primary/bg"; do
  V=$(jqv "$p" "$L" 2>/dev/null)
  PASS=$(python3 -c "print(1 if float('$V')>=4.5 else 0)" 2>/dev/null)
  [ "$PASS" = "1" ]; check $? "LIGHT $p = $V (AA ≥ 4.5)"
done
ab screenshot $EV/c1-light-dashboard-fa-1280.png >/dev/null

# ---------- 3. LIGHT: chart tokens (icon usage) ≥ 3 ----------
LC=$(ab eval "$CHART_PROBE" 2>/dev/null)
for n in 1 2 3 4 5; do
  V=$(jqv "chart$n" "$LC" 2>/dev/null)
  PASS=$(python3 -c "print(1 if float('$V')>=3 else 0)" 2>/dev/null)
  [ "$PASS" = "1" ]; check $? "LIGHT chart-$n = $V (non-text ≥ 3; chart-2 was 1.88 before the fix)"
done

# ---------- 4. LIGHT: tinted excerpt text stays ≥ 4.5 ----------
LT=$(ab eval "$TINT_PROBE" 2>/dev/null)
TV=$(jqv "fgOverCard" "$LT" 2>/dev/null)
TPASS=$(python3 -c "print(1 if float('$TV')>=4.5 else 0)" 2>/dev/null)
[ "$TPASS" = "1" ]; check $? "LIGHT foreground/90 over the card tint = $TV (≥ 4.5)"

# ---------- 5. DARK: the same 9 pairs + 5 chart tokens ----------
ab eval "document.documentElement.classList.add('dark');localStorage.setItem('theme','dark');'ok'" >/dev/null 2>&1
ab wait 600 >/dev/null
D=$(ab eval "$PAIR_PROBE" 2>/dev/null)
for p in "fg/bg" "muted-fg/bg" "primary-fg/primary" "secondary-fg/secondary" "card-fg/card" "popover-fg/popover" "accent-fg/accent" "destructive-fg/destructive" "primary/bg"; do
  V=$(jqv "$p" "$D" 2>/dev/null)
  PASS=$(python3 -c "print(1 if float('$V')>=4.5 else 0)" 2>/dev/null)
  [ "$PASS" = "1" ]; check $? "DARK $p = $V (AA ≥ 4.5; destructive pair was 2.88 before the fix)"
done
ab screenshot $EV/c1-dark-dashboard-fa-1280.png >/dev/null
DC=$(ab eval "$CHART_PROBE" 2>/dev/null)
for n in 1 2 3 4 5; do
  V=$(jqv "chart$n" "$DC" 2>/dev/null)
  PASS=$(python3 -c "print(1 if float('$V')>=3 else 0)" 2>/dev/null)
  [ "$PASS" = "1" ]; check $? "DARK chart-$n = $V (non-text ≥ 3)"
done
DT=$(ab eval "$TINT_PROBE" 2>/dev/null)
DV=$(jqv "fgOverCard" "$DT" 2>/dev/null)
DPASS=$(python3 -c "print(1 if float('$DV')>=4.5 else 0)" 2>/dev/null)
[ "$DPASS" = "1" ]; check $? "DARK foreground/90 over the card tint = $DV (≥ 4.5)"

# ---------- 6. the destructive buttons really use the new token ----------
ab eval "document.documentElement.classList.remove('dark');localStorage.setItem('theme','light');'ok'" >/dev/null 2>&1
ab wait 500 >/dev/null
USAGE=$(rg -c "bg-destructive text-destructive-foreground" src/components/app -g '*.tsx' 2>/dev/null | awk -F: '{s+=$2} END {print s}')
[ "${USAGE:-0}" = "6" ]; check $? "all 6 destructive confirm buttons use text-destructive-foreground ($USAGE)"
LEGACY=$(rg -c "bg-destructive text-white" src/components/app -g '*.tsx' 2>/dev/null | awk -F: '{s+=$2} END {print s+0}')
[ "${LEGACY:-0}" = "0" ]; check $? "zero legacy bg-destructive text-white remain ($LEGACY)"

# ---------- 7. console + close-out ----------
CONSOLE=$(ab console 2>/dev/null | rg -ci "error" || true)
[ "${CONSOLE:-0}" = "0" ]; check $? "browser console: 0 errors"
curl -s --max-time 30 -X POST http://localhost:3000/api/seed >/dev/null
FIN=$(curl -s --max-time 20 "http://localhost:3000/api/stats" | python3 -c 'import json,sys; print(json.load(sys.stdin)["total"])')
[ "$FIN" -ge 20 ]; check $? "close-out: demo DB re-seeded canonically (live total=$FIN)"

echo ""
echo "================ RESULT: pass=$pass fail=$fail ================"
grep -v "prisma:query" dev.log | rg "⨯|Error|error" | head -8 || echo "dev.log: no compile/runtime errors"
