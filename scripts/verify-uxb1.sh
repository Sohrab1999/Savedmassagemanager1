#!/bin/bash
# UX-B1 verification — the three-layer library toolbar (T-1/T-6) runbook.
# Proves the FULL previous filter matrix is 100% reachable through the NEW
# architecture: layer 1 search · layer 2 type chips · layer 3 unified Filter
# entry (desktop popover / mobile bottom-sheet) + QE5 active-chip row,
# while the N4 deep-links (fav=1/arch=1) and QE2 (sort/layout always visible)
# hold without regression. Single session: dev server + browser (demo, fa,
# 1280/390). Ends with the canonical re-seed.
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
# NEGATIVE assertion helper: $2 must NOT appear in $1.
absent() { if echo "$1" | rg -q "$2"; then bad "$3 (unexpectedly found '$2' in: $1)"; else ok "$3"; fi; }
waitLib() { ab wait --fn "location.hash.startsWith('#/library') && document.querySelector('main') && document.querySelector('main').innerText.includes('مورد')" --timeout 20000 >/dev/null 2>&1; }
# the unified Filter entry trigger
openFilter() { ab eval "[...document.querySelectorAll('main button')].find(b=>b.textContent.includes('فیلترها')).click()" >/dev/null 2>&1; ab wait 600 >/dev/null; }
findPanel() { ev "(()=>{const p=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.innerText.includes('جایگاه'));return p?'PANEL':'NONE'})()"; }
# Radix Select option picker (pointer-event dispatch — synthetic click() is
# NOT enough for Radix SelectItem; pointerdown+pointerup is proven enough).
pickOption() { ab eval "(()=>{const opt=[...document.querySelectorAll('[role=\"option\"]')].find(o=>o.textContent.includes('$1'));if(!opt)return 'NO OPT';['pointerdown','pointerup'].forEach(t=>opt.dispatchEvent(new PointerEvent(t,{bubbles:true,pointerId:1,buttons:1})));opt.dispatchEvent(new MouseEvent('click',{bubbles:true}));return 'picked'})()" >/dev/null 2>&1; ab wait 500 >/dev/null; }
# the QE5 active-filter row: chip LABELS via innerText (the aria-label only
# carries the count «N فعال»)
chipsRow() { ev "(()=>{const g=[...document.querySelectorAll('main [role=\"group\"]')].find(x=>(x.getAttribute('aria-label')||'').includes('فعال'));return g?g.innerText.replace(/\n/g,' | '):'NONE'})()"; }
switchState() { ev "(()=>{const p=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.innerText.includes('جایگاه'));const s=p?[...p.querySelectorAll('[role=\"switch\"]')].find(x=>x.textContent.includes('$1')):null;return s?s.getAttribute('aria-checked'):'NOSWITCH'})()"; }

# ---------- 0. backend ----------
agent-browser close >/dev/null 2>&1
pkill -9 -f "next dev" 2>/dev/null; pkill -9 -f "next-server" 2>/dev/null; sleep 1
setsid nohup bun run dev > dev.log 2>&1 < /dev/null & disown
for i in $(seq 1 90); do curl -s -o /dev/null --max-time 2 http://localhost:3000/api/stats && break; sleep 1; done
DEV=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:3000/api/stats)
[ "$DEV" = "200" ]; check $? "dev server up (GET /api/stats = $DEV)"
curl -s --max-time 30 -X POST http://localhost:3000/api/seed >/dev/null
CAT=$(curl -s --max-time 20 http://localhost:3000/api/categories | python3 -c 'import json,sys; items=json.load(sys.stdin)["items"]; print(next(c["id"] for c in items if c["nameFa"]=="آموزش"))')
[ -n "$CAT" ]; check $? "canonical seed + «آموزش» category present"

# ---------- 1. browser: demo mode (fa, 1280) ----------
ab open http://localhost:3000 >/dev/null 2>&1
ab wait --fn "document.readyState === 'complete'" --timeout 30000 >/dev/null 2>&1
ab eval "try{localStorage.clear()}catch(e){}" >/dev/null 2>&1
ab set viewport 1280 900 >/dev/null 2>&1
ab reload >/dev/null 2>&1
ab wait --fn "[...document.querySelectorAll('button')].some(b=>b.textContent.includes('ادامه در حالت'))" --timeout 30000 >/dev/null 2>&1
ab eval "[...document.querySelectorAll('button')].find(b=>b.textContent.includes('ادامه در حالت')).click()" >/dev/null 2>&1
ab wait --fn "document.querySelector('main') && document.querySelector('main').innerText.trim().length > 20" --timeout 30000 >/dev/null 2>&1
ab eval "location.hash='#/library'" >/dev/null 2>&1
waitLib
TOTAL=$(ev "document.querySelector('main').innerText.match(/(\S+) مورد/)?.[1] ?? 'NONE'")
[ "$TOTAL" = "۲۱" ]; check $? "library on canonical seed — total ۲۱ مورد ($TOTAL)"
ab screenshot $EV/b1-toolbar-fa-1280.png >/dev/null

# ---------- 2. layer architecture (T-1) ----------
TCHIPS=$(ev "(()=>{const chips=[...document.querySelectorAll('main [aria-pressed]')].filter(b=>['همه','متن','لینک','تصویر','ویدیو','فایل'].includes(b.textContent.trim()));return chips.length})()")
[ "$TCHIPS" = "6" ]; check $? "layer 2: exactly 6 type chips (All + 5 types) visible ($TCHIPS)"
STATECHIPS=$(ev "(()=>{const open=[...document.querySelectorAll('[role=\"dialog\"]')].length;const chips=[...document.querySelectorAll('main [aria-pressed], main button')].filter(b=>['علاقه‌مندی','بدون دسته','بایگانی','سطل'].includes(b.textContent.trim())&&!b.closest('[role=\"dialog\"]'));return open+'|'+chips.length})()")
echo "$STATECHIPS" | rg -q "^0\|0"; check $? "T-1: state chips (fav/uncat/arch/trash) GONE from the open row, no dialog open ($STATECHIPS)"
FBTN=$(ev "String(!![...document.querySelectorAll('main button')].find(b=>b.textContent.includes('فیلترها')))")
[ "$FBTN" = "true" ]; check $? "layer 3: unified «فیلترها» entry present"
CTRL=$(ev "(()=>{const m=document.querySelector('main');const s=[...m.querySelectorAll('button, [role=\"combobox\"]')];const sort=!!s.find(b=>(b.getAttribute('aria-label')||'')==='ترتیب');const grid=!!s.find(b=>(b.getAttribute('aria-label')||'')==='نمای شبکه‌ای');const list=!!s.find(b=>(b.getAttribute('aria-label')||'')==='نمای فهرستی');const bulk=!!s.find(b=>(b.getAttribute('aria-label')||'')==='انتخاب موارد');const filt=!!s.find(b=>b.textContent.includes('فیلترها'));return [filt,sort,grid,list,bulk].every(x=>x)?'ALL5':'MISSING'})()")
[ "$CTRL" = "ALL5" ]; check $? "QE2: filter + sort + grid + list + bulk ALL visible in the controls row ($CTRL)"
SEARCH=$(ev "String(!!document.querySelector('main input[type=\"search\"]'))")
[ "$SEARCH" = "true" ]; check $? "layer 1: search always visible above"

# ---------- 3. type matrix (layer 2) ----------
ab eval "[...document.querySelectorAll('main [aria-pressed]')].find(b=>b.textContent.trim()==='متن').click()" >/dev/null 2>&1; ab wait 500 >/dev/null
H=$(ev "location.hash")
echo "$H" | rg -q "type=text"; check $? "type chip «متن» → hash type=text ($H)"
CH=$(chipsRow); echo "$CH" | rg -q "متن"; check $? "QE5: active chip «متن» rendered ($CH)"
ab eval "[...document.querySelectorAll('main [aria-pressed]')].find(b=>b.textContent.trim()==='لینک').click()" >/dev/null 2>&1; ab wait 500 >/dev/null
H=$(ev "location.hash"); echo "$H" | rg -q "type=link"; check $? "type chip «لینک» replaces it → type=link ($H)"
CH=$(chipsRow); absent "$CH" "متن" "QE5: previous type chip removed when replaced ($CH)"
ab eval "[...document.querySelectorAll('main [aria-pressed]')].find(b=>b.textContent.trim()==='همه').click()" >/dev/null 2>&1; ab wait 500 >/dev/null
H=$(ev "location.hash"); absent "$H" "type=" "«همه» clears the type filter ($H)"

# ---------- 4. filter panel matrix (layer 3, popover) ----------
openFilter
P=$(findPanel); [ "$P" = "PANEL" ]; check $? "popover opens with the unified panel ($P)"
SW=$(ev "(()=>{const p=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.innerText.includes('جایگاه'));return p.querySelectorAll('[role=\"switch\"]').length})()")
[ "$SW" = "4" ]; check $? "panel: 4 status switch rows ($SW)"
SEC=$(ev "(()=>{const p=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.innerText.includes('جایگاه'));return (p.innerText.includes('وضعیت و جایگاه‌ها')&&p.innerText.includes('دسته و برچسب‌ها'))?'BOTH':'PARTIAL'})()")
[ "$SEC" = "BOTH" ]; check $? "T-6 IA split: «وضعیت و جایگاه‌ها» + «دسته و برچسب‌ها» sections ($SEC)"
ab screenshot $EV/b1-popover-fa-1280.png >/dev/null

# favorite
ab eval "(()=>{const p=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.innerText.includes('جایگاه'));[...p.querySelectorAll('[role=\"switch\"]')].find(s=>s.textContent.includes('علاقه‌مندی')).click()})()" >/dev/null 2>&1; ab wait 500 >/dev/null
S=$(switchState "علاقه‌مندی"); [ "$S" = "true" ]; check $? "favorite toggle ON via panel ($S)"
H=$(ev "location.hash"); echo "$H" | rg -q "fav=1"; check $? "hash carries fav=1 ($H)"
RC=$(ev "document.querySelector('main').innerText.match(/(\S+) مورد/)?.[1] ?? 'NONE'")
[ "$RC" = "۵" ]; check $? "N4 contract: fav filter → ۵ مورد ($RC)"
FB=$(ev "(()=>{const b=[...document.querySelectorAll('main button')].find(x=>x.textContent.includes('فیلترها'));return b.textContent.includes('۱')?'BADGE1':'NOBADGE'})()")
[ "$FB" = "BADGE1" ]; check $? "entry button shows live count badge ۱ ($FB)"

# uncategorized
ab eval "(()=>{const p=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.innerText.includes('جایگاه'));[...p.querySelectorAll('[role=\"switch\"]')].find(s=>s.textContent.includes('بدون دسته')).click()})()" >/dev/null 2>&1; ab wait 500 >/dev/null
H=$(ev "location.hash"); echo "$H" | rg -q "cat=none"; check $? "uncategorized toggle → cat=none ($H)"

# archived
ab eval "(()=>{const p=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.innerText.includes('جایگاه'));[...p.querySelectorAll('[role=\"switch\"]')].find(s=>s.textContent.includes('بایگانی')).click()})()" >/dev/null 2>&1; ab wait 500 >/dev/null
H=$(ev "location.hash"); echo "$H" | rg -q "arch=1"; check $? "archived toggle → arch=1 ($H)"

# trash + mutual exclusion (S5)
ab eval "(()=>{const p=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.innerText.includes('جایگاه'));[...p.querySelectorAll('[role=\"switch\"]')].find(s=>s.textContent.includes('سطل')).click()})()" >/dev/null 2>&1; ab wait 500 >/dev/null
H=$(ev "location.hash"); echo "$H" | rg -q "trash=1"; check $? "trash toggle → trash=1 ($H)"
S=$(switchState "بایگانی"); [ "$S" = "false" ]; check $? "S5 mutual exclusion: trash ON forced archived OFF ($S)"
ab eval "(()=>{const p=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.innerText.includes('جایگاه'));[...p.querySelectorAll('[role=\"switch\"]')].find(s=>s.textContent.includes('سطل')).click()})()" >/dev/null 2>&1; ab wait 400 >/dev/null

# category select inside the panel
ab eval "(()=>{const trig=[...document.querySelectorAll('[role=\"dialog\"] button')].find(b=>b.getAttribute('aria-label')==='دسته');trig.click()})()" >/dev/null 2>&1; ab wait 600 >/dev/null
pickOption "آموزش"
TRIG=$(ev "(()=>{const trig=[...document.querySelectorAll('[role=\"dialog\"] button')].find(b=>b.getAttribute('aria-label')==='دسته');return trig?trig.textContent.trim():'NOTRIG'})()")
echo "$TRIG" | rg -q "آموزش"; check $? "category select inside panel → «آموزش» ($TRIG)"
H=$(ev "location.hash"); echo "$H" | rg -q "cat=$CAT"; check $? "hash carries cat=<آموزش-id> ($H)"

# tags inside the panel
ab eval "(()=>{const p=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.innerText.includes('جایگاه'));const t=[...p.querySelectorAll('button')].find(b=>b.innerText.includes('طراحی رابط'));t.click()})()" >/dev/null 2>&1; ab wait 500 >/dev/null
H=$(ev "location.hash"); echo "$H" | rg -q "tags="; check $? "tag check «طراحی رابط» → hash tags=… ($H)"
ab screenshot $EV/b1-active-chips-fa-1280.png >/dev/null
CH=$(chipsRow); echo "$CH" | rg -q "علاقه‌مندی"; check $? "QE5: active chip «علاقه‌مندی» ($CH)"
echo "$CH" | rg -q "آموزش"; check $? "QE5: active chip «آموزش» ($CH)"
echo "$CH" | rg -q "طراحی رابط"; check $? "QE5: active chip «طراحی رابط» ($CH)"

# removable chip
REMOVED=$(ev "(()=>{const g=[...document.querySelectorAll('main [role=\"group\"]')].find(x=>(x.getAttribute('aria-label')||'').includes('فعال'));const x=[...g.querySelectorAll('button')].find(b=>(b.getAttribute('aria-label')||'').includes('طراحی رابط'));if(!x)return 'NOCHIP';x.click();return 'removed'})()")
[ "$REMOVED" = "removed" ]; check $? "active chip removable via its X ($REMOVED)"
H=$(ev "location.hash"); absent "$H" "tags=" "chip removal really clears the tag filter ($H)"

# panel «پاک‌کردن همه» + QE5 clear-all
ab eval "(()=>{const p=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.innerText.includes('جایگاه'));const b=[...p.querySelectorAll('button')].find(x=>x.textContent.includes('پاک کردن فیلترها'));b.click()})()" >/dev/null 2>&1; ab wait 600 >/dev/null
H=$(ev "location.hash"); [ "$H" = "#/library" ] || [ "$H" = "#/library?" ]; check $? "panel «پاک‌کردن همه» → hash reset ($H)"
CH=$(chipsRow); [ "$CH" = "NONE" ]; check $? "QE5 row fully hidden after clear ($CH)"

# ---------- 5. search (layer 1) ----------
ab eval "(()=>{const inp=document.querySelector('main input[type=\"search\"]');const set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;set.call(inp,'راهنما');inp.dispatchEvent(new Event('input',{bubbles:true}))})()" >/dev/null 2>&1
ab wait --fn "location.hash.includes('q=')" --timeout 8000 >/dev/null 2>&1
H=$(ev "location.hash"); echo "$H" | rg -q "q="; check $? "search layer 1 → hash q=… ($H)"
ab eval "(()=>{const g=[...document.querySelectorAll('main [role=\"group\"]')].find(x=>(x.getAttribute('aria-label')||'').includes('فعال'));return g?g.innerText.includes('راهنما'):'NONE'})()" >/dev/null 2>&1
CH=$(chipsRow); echo "$CH" | rg -q "راهنما"; check $? "QE5: search echo chip «راهنما» ($CH)"
ab eval "[...document.querySelectorAll('main button')].find(b=>(b.getAttribute('aria-label')||'')==='پاک کردن جستجو').click()" >/dev/null 2>&1; ab wait 500 >/dev/null
H=$(ev "location.hash"); absent "$H" "q=" "search X clears the query ($H)"

# ---------- 6. sort / layout / bulk (QE2 stable end) ----------
ab eval "(()=>{const trig=[...document.querySelectorAll('main button')].find(b=>b.getAttribute('aria-label')==='ترتیب');trig.click()})()" >/dev/null 2>&1; ab wait 600 >/dev/null
pickOption "قدیمی‌ترین"
H=$(ev "location.hash"); echo "$H" | rg -q "sort=oldest"; check $? "sort → oldest in hash ($H)"
ab eval "[...document.querySelectorAll('main button')].find(b=>b.getAttribute('aria-label')==='نمای فهرستی').click()" >/dev/null 2>&1; ab wait 400 >/dev/null
LP=$(ev "[...document.querySelectorAll('main button')].find(b=>b.getAttribute('aria-label')==='نمای فهرستی').getAttribute('aria-pressed')")
[ "$LP" = "true" ]; check $? "layout toggle list → aria-pressed ($LP)"
ab eval "[...document.querySelectorAll('main button')].find(b=>(b.getAttribute('aria-label')||'')==='انتخاب موارد').click()" >/dev/null 2>&1; ab wait 500 >/dev/null
TB=$(ev "String(!!document.querySelector('main [role=\"toolbar\"]'))")
[ "$TB" = "true" ]; check $? "bulk mode → action toolbar appears ($TB)"
ab eval "[...document.querySelectorAll('main button')].find(b=>(b.getAttribute('aria-label')||'')==='خروج از انتخاب').click()" >/dev/null 2>&1; ab wait 400 >/dev/null
ab eval "[...document.querySelectorAll('main button')].find(b=>b.getAttribute('aria-label')==='نمای شبکه‌ای').click()" >/dev/null 2>&1; ab wait 300 >/dev/null

# ---------- 7. N4 deep-links ----------
ab open "http://localhost:3000/#/library?fav=1" >/dev/null 2>&1
waitLib
RC=$(ev "document.querySelector('main').innerText.match(/(\S+) مورد/)?.[1] ?? 'NONE'")
[ "$RC" = "۵" ]; check $? "N4 deep-link fav=1 → ۵ مورد ($RC)"
H=$(ev "location.hash"); echo "$H" | rg -q "fav=1"; check $? "deep-link hash preserved ($H)"
openFilter
S=$(switchState "علاقه‌مندی"); [ "$S" = "true" ]; check $? "deep-link reflects in the panel switch ($S)"
FB=$(ev "(()=>{const b=[...document.querySelectorAll('main button')].find(x=>x.textContent.includes('فیلترها'));return b.textContent.includes('۱')?'BADGE1':'NOBADGE'})()")
[ "$FB" = "BADGE1" ]; check $? "deep-link reflected on the entry badge ($FB)"
ab press Escape >/dev/null 2>&1; ab wait 400 >/dev/null
ab open "http://localhost:3000/#/library?arch=1" >/dev/null 2>&1
waitLib
RC=$(ev "document.querySelector('main').innerText.match(/(\S+) مورد/)?.[1] ?? 'NONE'")
[ "$RC" = "۲" ]; check $? "N4 deep-link arch=1 → ۲ مورد ($RC)"
openFilter
S=$(switchState "علاقه‌مندی"); [ "$S" = "false" ]; check $? "no filter leak: arch deep-link keeps favorite OFF ($S)"
S=$(switchState "بایگانی"); [ "$S" = "true" ]; check $? "arch deep-link shows in the archived switch ($S)"
ab press Escape >/dev/null 2>&1; ab wait 400 >/dev/null
ab open "http://localhost:3000/#/library?trash=1" >/dev/null 2>&1
waitLib
H=$(ev "location.hash"); echo "$H" | rg -q "trash=1"; check $? "trash deep-link still supported ($H)"

# ---------- 8. mobile 390: drawer + QE2 geometry ----------
ab open "http://localhost:3000/#/library" >/dev/null 2>&1
ab set viewport 390 844 >/dev/null 2>&1
ab wait 800 >/dev/null
GEO=$(ev "(()=>{const names=['ترتیب','نمای شبکه‌ای','نمای فهرستی','انتخاب موارد'];const ok=[...document.querySelectorAll('main button, main [role=\"combobox\"]')].filter(b=>names.includes(b.getAttribute('aria-label'))).filter(b=>{const r=b.getBoundingClientRect();return r.width>0&&r.right<=391&&r.left>=-1}).length;const f=[...document.querySelectorAll('main button')].find(b=>b.textContent.includes('فیلترها'));const fr=f?f.getBoundingClientRect():{right:9999,width:0};return 'stable:'+ok+' filter:'+(fr.width>0&&fr.right<=391?'in':'out')})()")
echo "$GEO" | rg -q "stable:4 filter:in"; check $? "QE2 @390: filter+sort+grid/list+bulk all inside the viewport ($GEO)"
ab screenshot $EV/b1-toolbar-fa-390.png >/dev/null
openFilter
P=$(findPanel); [ "$P" = "PANEL" ]; check $? "mobile: Filter opens as a BOTTOM-SHEET ($P)"
FOOT=$(ev "(()=>{const p=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.innerText.includes('جایگاه'));return (p.innerText.includes('نمایش نتایج')&&p.innerText.includes('پاک کردن فیلترها'))?'FOOTER':'MISSING'})()")
[ "$FOOT" = "FOOTER" ]; check $? "drawer footer: «نمایش نتایج» + «پاک‌کردن همه» ($FOOT)"
ab eval "(()=>{const p=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.innerText.includes('جایگاه'));[...p.querySelectorAll('[role=\"switch\"]')].find(s=>s.textContent.includes('علاقه‌مندی')).click()})()" >/dev/null 2>&1; ab wait 500 >/dev/null
H=$(ev "location.hash"); echo "$H" | rg -q "fav=1"; check $? "drawer toggle writes the same filter state ($H)"
ab screenshot $EV/b1-drawer-fa-390.png >/dev/null
ab eval "(()=>{const p=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.innerText.includes('جایگاه'));const b=[...p.querySelectorAll('button')].find(x=>x.textContent.includes('نمایش نتایج'));b.click()})()" >/dev/null 2>&1; ab wait 600 >/dev/null
CLOSED=$(ev "(()=>{const p=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.innerText.includes('جایگاه'));return p?'OPEN':'CLOSED'})()")
[ "$CLOSED" = "CLOSED" ]; check $? "«نمایش نتایج» closes the sheet ($CLOSED)"
CH=$(chipsRow); echo "$CH" | rg -q "علاقه‌مندی"; check $? "QE5 chip row behind the drawer stayed in sync ($CH)"

# ---------- 9. console + close-out ----------
CONSOLE=$(ab console 2>/dev/null | rg -ci "error" || true)
[ "${CONSOLE:-0}" = "0" ]; check $? "browser console: 0 errors"

curl -s --max-time 30 -X POST http://localhost:3000/api/seed >/dev/null
FIN=$(curl -s --max-time 20 "http://localhost:3000/api/stats" | python3 -c 'import json,sys; print(json.load(sys.stdin)["total"])')
[ "$FIN" -ge 20 ]; check $? "close-out: demo DB re-seeded canonically (live total=$FIN)"

echo ""
echo "================ RESULT: pass=$pass fail=$fail ================"
grep -v "prisma:query" dev.log | rg "⨯|Error|error" | head -8 || echo "dev.log: no compile/runtime errors"
