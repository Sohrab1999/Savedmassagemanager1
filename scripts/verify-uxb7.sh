#!/bin/bash
# UX-B7 verification — RTL directional icons + the archive-vs-trash scent (A-3.4).
# Proves: (SCAN) every directional chevron/arrow icon in app components carries
# the rtl:-scale-x-100 flip and the DOM computed transform is scaleX(-1) in RTL
# (the UX-A2 StatCard chevron — the ONLY directional icon in the app);
# (SCENT) the filter panel's archive + trash switch rows now carry honest
# one-line hints AT the touch point, and the sheet's archive/delete actions
# carry semantic tooltips — in fa AND en. Single session: dev + browser.
cd /home/z/my-project
EV=roadmaps/evidence
mkdir -p $EV

pass=0; fail=0
ok()  { pass=$((pass+1)); echo "  ✔ $1"; }
bad() { fail=$((fail+1)); echo "  ✘ $1"; }
check() { if [ "$1" = "0" ]; then ok "$2"; else bad "$2"; fi; }
ab() { agent-browser "$@"; }
ev() { ab eval "$1" | python3 -c 'import sys,json
raw=sys.stdin.read().strip()
try: print(json.loads(raw))
except Exception: print(raw)'; }
setInput() { ab eval "(()=>{const el=document.querySelector('$1');const set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;set.call(el,'$2');el.dispatchEvent(new Event('input',{bubbles:true}));return 'ok'})()" >/dev/null 2>&1; }
openK() { ab eval "window.dispatchEvent(new KeyboardEvent('keydown',{key:'k',metaKey:true,bubbles:true}))" >/dev/null 2>&1; ab wait 600 >/dev/null; }
closePal() { ab press Escape >/dev/null 2>&1; ab wait 500 >/dev/null; }

# ---------- 0. backend ----------
agent-browser close >/dev/null 2>&1
pkill -9 -f "next dev" 2>/dev/null; pkill -9 -f "next-server" 2>/dev/null; sleep 1
setsid nohup bun run dev > dev.log 2>&1 < /dev/null & disown
for i in $(seq 1 90); do curl -s -o /dev/null --max-time 2 http://localhost:3000/api/stats && break; sleep 1; done
DEV=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:3000/api/stats)
[ "$DEV" = "200" ]; check $? "dev server up (GET /api/stats = $DEV)"
curl -s --max-time 30 -X POST http://localhost:3000/api/seed >/dev/null

# ---------- 1. STATIC SCAN: directional icons in app components ----------
# NOTE: ArrowLeftRight is a SYMMETRIC swap icon (matches neither ArrowLeft[^R]
# nor ArrowRight[^R]); ArrowUp/Down are keyboard handlers, not rendered icons.
HITS=$(rg -c "ChevronRight|ChevronLeft|ArrowLeft[^R]|ArrowRight[^R]|MoveRight|MoveLeft" src/components/app/ 2>/dev/null | wc -l)
[ "${HITS:-0}" = "1" ]; check $? "static scan: exactly ONE app file uses a directional icon ($HITS files)"
FLIP=$(rg -A2 "ChevronRight" src/components/app/views/dashboard-view.tsx | rg -c "rtl:-scale-x-100" || echo 0)
[ "${FLIP:-0}" -ge 1 ]; check $? "the StatCard chevron carries rtl:-scale-x-100 (the UX-A2 pattern)"
NOFLIP=$(rg "<(ChevronRight|ChevronLeft|ArrowRight|ArrowLeft|MoveRight|MoveLeft)" src/components/app/ -A2 --no-heading | python3 -c "
import sys, re
blocks = {}
cur = None
for line in sys.stdin:
    m = re.match(r'^(src/[^:]+):(\d+)[:\-](.*)$', line.rstrip('\n'))
    if m:
        cur = (m.group(1), int(m.group(2)))
        blocks.setdefault(cur, '')
        blocks[cur] += m.group(3) + '\n'
    elif cur is not None:
        blocks[cur] += line[1:] + '\n'
bad = [k for k, v in blocks.items() if 'rtl:-scale-x-100' not in v]
print(len(bad))")
[ "${NOFLIP:-1}" = "0" ]; check $? "static scan: ZERO un-flipped directional icon usages in app components ($NOFLIP)"

# ---------- 2. browser: demo mode (fa, 1280) ----------
ab open http://localhost:3000 >/dev/null 2>&1
ab wait --fn "document.readyState === 'complete'" --timeout 30000 >/dev/null 2>&1
ab eval "try{localStorage.clear();localStorage.setItem('savedbox.bulk.coach.v1','1')}catch(e){}" >/dev/null 2>&1
ab set viewport 1280 900 >/dev/null 2>&1
ab reload >/dev/null 2>&1
ab wait --fn "[...document.querySelectorAll('button')].some(b=>b.textContent.includes('ادامه در حالت'))" --timeout 30000 >/dev/null 2>&1
ab eval "[...document.querySelectorAll('button')].find(b=>b.textContent.includes('ادامه در حالت')).click()" >/dev/null 2>&1
ab wait --fn "document.querySelector('main') && document.querySelector('main').innerText.trim().length > 20" --timeout 30000 >/dev/null 2>&1
ab wait 900 >/dev/null

# ---------- 3. DOM RTL scan: every rendered directional icon is flipped ----------
# Tailwind v4 compiles -scale-x-100 into the `scale` PROPERTY (`scale: -1 1`),
# not the transform matrix — read BOTH computed channels.
DIR=$(ev "(()=>{const svgs=[...document.querySelectorAll('main svg')].filter(s=>/lucide-(chevron-right|chevron-left|arrow-right|arrow-left|move-right|move-left)/.test(s.getAttribute('class')||''));if(svgs.length===0)return '[]';const m=svgs.map(s=>{const cs=getComputedStyle(s);return (cs.scale&&cs.scale.includes('-1'))||cs.transform.includes('-1')?'FLIPPED':'UNFLIPPED'});return JSON.stringify({n:svgs.length,all:m.every(x=>x==='FLIPPED')})})()")
echo "$DIR" | rg -q '"all":true'; check $? "RTL DOM scan: every directional icon computes scaleX(-1) ($DIR)"
[ "$(echo "$DIR" | python3 -c 'import json,sys;print(json.loads(sys.stdin.read())["n"])')" -ge 1 ]; check $? "RTL DOM scan: at least the A2 chevron exists to prove the pattern"
ab screenshot $EV/b7-dashboard-rtl-fa-1280.png >/dev/null

# ---------- 4. the archive/trash scent IN the filter panel (fa) ----------
ab eval "location.hash='#/library'" >/dev/null 2>&1
ab wait 1200 >/dev/null
ev "document.querySelector('button[aria-label=\"باز کردن فیلترها\"]').click()" >/dev/null 2>&1
ab wait 600 >/dev/null
AH=$(ev "String(document.body.innerText.includes('از چشم خارج می‌شود'))")
[ "$AH" = "true" ]; check $? "fa: the ARCHIVE row hint visible at the touch point ($AH)"
TH=$(ev "String(document.body.innerText.includes('۷ روز فرصت بازگردانی'))")
[ "$TH" = "true" ]; check $? "fa: the TRASH row hint visible at the touch point ($TH)"
SAME=$(ev "(()=>{const d=document.querySelector('[role=\"dialog\"]');return d&&d.innerText.includes('وضعیت و جایگاه‌ها')&&d.innerText.includes('از چشم خارج')&&d.innerText.includes('۷ روز')?'TOGETHER':'APART'})()")
[ "$SAME" = "TOGETHER" ]; check $? "fa: both hints live INSIDE the state section, next to their switches ($SAME)"
ab screenshot $EV/b7-filter-hints-fa-1280.png >/dev/null
ab press Escape >/dev/null 2>&1; ab wait 400 >/dev/null

# ---------- 5. the sheet action tooltips carry the semantics (fa) ----------
ev "(()=>{const c=[...document.querySelectorAll('[role=\"button\"]')].find(x=>!x.querySelector('[role=\"checkbox\"]'));if(!c)return 'NOCARD';c.click();return 'ok'})()" >/dev/null 2>&1
ab wait 1000 >/dev/null
AT=$(ev "(()=>{const b=[...document.querySelectorAll('[role=\"dialog\"] button')].find(x=>x.getAttribute('aria-label')==='بایگانی');return b?(b.getAttribute('title')||'').includes('از چشم خارج')?'HINT':'NOHINT':'NOBTN'})()")
[ "$AT" = "HINT" ]; check $? "fa: the sheet ARCHIVE action tooltip explains the semantics ($AT)"
DT=$(ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.querySelector('h2'));const b=[...d.querySelectorAll('button')].find(x=>x.innerText.trim()==='حذف');return b?(b.getAttribute('title')||'').includes('۷ روز')?'HINT':'NOHINT':'NOBTN'})()")
[ "$DT" = "HINT" ]; check $? "fa: the sheet DELETE action tooltip explains the 7-day trash ($DT)"
ab press Escape >/dev/null 2>&1; ab wait 400 >/dev/null

# ---------- 6. the SAME scent in English (one pattern, both locales) ----------
# Deterministic locale switch: the i18n persistence key + reload.
ab eval "localStorage.setItem('savedbox.locale','en');'ok'" >/dev/null 2>&1
ab reload >/dev/null 2>&1
ab wait --fn "document.querySelector('main') && document.querySelector('main').innerText.trim().length > 20" --timeout 30000 >/dev/null 2>&1
ab wait 800 >/dev/null
LANG=$(ev "document.documentElement.lang")
[ "$LANG" = "en" ]; check $? "locale switched to en via the documented persistence key ($LANG)"
ab eval "location.hash='#/library'" >/dev/null 2>&1
ab wait 1200 >/dev/null
ev "(()=>{const b=document.querySelector('button[aria-label=\"Open filters\"]');if(b){b.click();return 'ok'}return 'NOBTN'})()" >/dev/null 2>&1
ab wait 600 >/dev/null
AHEN=$(ev "String(document.body.innerText.includes('Out of sight — always reachable'))")
[ "$AHEN" = "true" ]; check $? "en: the ARCHIVE hint renders in the same place ($AHEN)"
THEN=$(ev "String(document.body.innerText.includes('Restorable for 7 days'))")
[ "$THEN" = "true" ]; check $? "en: the TRASH hint renders in the same place ($THEN)"
ab screenshot $EV/b7-filter-hints-en-1280.png >/dev/null
ab press Escape >/dev/null 2>&1; ab wait 300 >/dev/null

# ---------- 7. console + close-out ----------
CONSOLE=$(ab console 2>/dev/null | rg -ci "error" || true)
[ "${CONSOLE:-0}" = "0" ]; check $? "browser console: 0 errors"
curl -s --max-time 30 -X POST http://localhost:3000/api/seed >/dev/null
FIN=$(curl -s --max-time 20 "http://localhost:3000/api/stats" | python3 -c 'import json,sys; print(json.load(sys.stdin)["total"])')
[ "$FIN" -ge 20 ]; check $? "close-out: demo DB re-seeded canonically (live total=$FIN)"

echo ""
echo "================ RESULT: pass=$pass fail=$fail ================"
grep -v "prisma:query" dev.log | rg "⨯|Error|error" | head -8 || echo "dev.log: no compile/runtime errors"
