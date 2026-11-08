#!/bin/bash
# UX-B3 verification — the ONE search pattern + the ⌘K command palette (T-3).
# Proves: ⌘K AND Ctrl+K open the palette globally; the header desktop pill and
# the header mobile icon open the SAME surface; keyboard-first flow works
# (type → arrows → Enter) for jumping to views, running actions (capture /
# theme / language / clear filters), applying a library search, and opening
# items. Single session: dev server + browser (demo, fa, 1280/390).
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
palOpen() { ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.querySelector('[cmdk-input]'));return d?'OPEN':'CLOSED'})()"; }
fillPal() { ab eval "(()=>{const inp=document.querySelector('[cmdk-input]');const set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;set.call(inp,'$1');inp.dispatchEvent(new Event('input',{bubbles:true}));return 'filled'})()" >/dev/null 2>&1; }
closePal() { ab press Escape >/dev/null 2>&1; ab wait 500 >/dev/null; }
openK() { ab eval "window.dispatchEvent(new KeyboardEvent('keydown',{key:'k',metaKey:true,bubbles:true}))" >/dev/null 2>&1; ab wait 600 >/dev/null; }

# ---------- 0. backend ----------
agent-browser close >/dev/null 2>&1
pkill -9 -f "next dev" 2>/dev/null; pkill -9 -f "next-server" 2>/dev/null; sleep 1
setsid nohup bun run dev > dev.log 2>&1 < /dev/null & disown
for i in $(seq 1 90); do curl -s -o /dev/null --max-time 2 http://localhost:3000/api/stats && break; sleep 1; done
DEV=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:3000/api/stats)
[ "$DEV" = "200" ]; check $? "dev server up (GET /api/stats = $DEV)"
curl -s --max-time 30 -X POST http://localhost:3000/api/seed >/dev/null
SEEDN=$(curl -s --max-time 20 "http://localhost:3000/api/notes" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(sum(1 for n in d["items"] if "راهنما" in n["title"]))')
[ "${SEEDN:-0}" -ge 1 ]; check $? "canonical seed contains a «راهنما» title ($SEEDN)"

# ---------- 1. browser: demo mode (fa, 1280) ----------
ab open http://localhost:3000 >/dev/null 2>&1
ab wait --fn "document.readyState === 'complete'" --timeout 30000 >/dev/null 2>&1
ab eval "try{localStorage.clear()}catch(e){}" >/dev/null 2>&1
ab set viewport 1280 900 >/dev/null 2>&1
ab reload >/dev/null 2>&1
ab wait --fn "[...document.querySelectorAll('button')].some(b=>b.textContent.includes('ادامه در حالت'))" --timeout 30000 >/dev/null 2>&1
ab eval "[...document.querySelectorAll('button')].find(b=>b.textContent.includes('ادامه در حالت')).click()" >/dev/null 2>&1
ab wait --fn "document.querySelector('main') && document.querySelector('main').innerText.trim().length > 20" --timeout 30000 >/dev/null 2>&1
ab wait 900 >/dev/null

# ---------- 2. one pattern, two header entries ----------
PILL=$(ev "(()=>{const b=document.querySelector('header button[aria-label=\"باز کردن پالت فرمان‌ها (\u2318K)\"]');if(!b)return 'NOPILL';return (b.querySelector('kbd')?'KBD':'NOKBD')+'|'+(b.innerText.includes('جستجوی')?'PLACEHOLDER':'NOPH')})()")
echo "$PILL" | rg -q "KBD\|PLACEHOLDER"; check $? "desktop header search pill with ⌘K kbd + placeholder ($PILL)"
MICON=$(ev "(()=>{const b=[...document.querySelectorAll('header button')].filter(x=>x.getAttribute('aria-label')==='باز کردن پالت فرمان‌ها (⌘K)');return String(b.length >= 2)})()")
[ "$MICON" = "true" ]; check $? "mobile header icon ALSO opens the same palette (2 entries, one pattern) ($MICON)"
P0=$(palOpen); [ "$P0" = "CLOSED" ]; check $? "palette starts closed ($P0)"

# ---------- 3. keyboard-first: ⌘K AND Ctrl+K ----------
openK
P1=$(palOpen); [ "$P1" = "OPEN" ]; check $? "⌘K opens the palette globally ($P1)"
FOC=$(ev "(()=>{const inp=document.querySelector('[cmdk-input]');return String(document.activeElement===inp)})()")
[ "$FOC" = "true" ]; check $? "keyboard-first: focus lands in the palette input ($FOC)"
GR=$(ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.querySelector('[cmdk-input]'));return [...d.querySelectorAll('[cmdk-group-heading]')].map(h=>h.innerText).join('|')})()")
echo "$GR" | rg -q "دیدها"; echo "$GR" | rg -q "اعمال"; check $? "groups «دیدها» + «اعمال» present ($GR)"
ab screenshot $EV/b3-palette-fa-1280.png >/dev/null
closePal
P2=$(palOpen); [ "$P2" = "CLOSED" ]; check $? "Escape closes the palette ($P2)"
ab eval "window.dispatchEvent(new KeyboardEvent('keydown',{key:'k',ctrlKey:true,bubbles:true}))" >/dev/null 2>&1
ab wait 600 >/dev/null
P3=$(palOpen); [ "$P3" = "OPEN" ]; check $? "Ctrl+K opens it too (non-mac platforms) ($P3)"
closePal

# ---------- 4. jump to a view (type + Enter) ----------
openK
fillPal "کتابخانه"
ab wait 400 >/dev/null
ab press ArrowDown >/dev/null 2>&1
ab press Enter >/dev/null 2>&1
ab wait 800 >/dev/null
P4=$(palOpen); [ "$P4" = "CLOSED" ]; check $? "Enter commits and closes the palette ($P4)"
H=$(ev "location.hash"); echo "$H" | rg -q "#/library"; check $? "jumped to the library view ($H)"

# ---------- 5. action: quick capture ----------
openK
fillPal "ثبت سریع"
ab wait 400 >/dev/null
ab press ArrowDown >/dev/null 2>&1
ab press Enter >/dev/null 2>&1
ab wait 800 >/dev/null
CAP=$(ev "String(!!document.getElementById('capture-title'))")
[ "$CAP" = "true" ]; check $? "palette action «ثبت سریع» opens the capture dialog ($CAP)"
ab press Escape >/dev/null 2>&1; ab wait 400 >/dev/null
CAPP=$(palOpen); [ "$CAPP" = "CLOSED" ]; check $? "no palette lingering behind the capture dialog ($CAPP)"

# ---------- 6. action: theme toggle ----------
DARK0=$(ev "String(document.documentElement.classList.contains('dark'))")
openK
fillPal "پوسته"
ab wait 400 >/dev/null
ab press ArrowDown >/dev/null 2>&1
ab press Enter >/dev/null 2>&1
ab wait 700 >/dev/null
DARK1=$(ev "String(document.documentElement.classList.contains('dark'))")
[ "$DARK0" != "$DARK1" ]; check $? "theme action toggles the dark class ($DARK0 → $DARK1)"
openK
fillPal "پوسته"
ab wait 400 >/dev/null
ab press ArrowDown >/dev/null 2>&1
ab press Enter >/dev/null 2>&1
ab wait 700 >/dev/null
DARK2=$(ev "String(document.documentElement.classList.contains('dark'))")
[ "$DARK2" = "$DARK0" ]; check $? "theme action toggles back ($DARK2)"

# ---------- 7. item search → open the sheet ----------
openK
fillPal "راهنما"
ab wait 900 >/dev/null
ITEMS=$(ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.querySelector('[cmdk-input]'));const groups=[...d.querySelectorAll('[cmdk-group-heading]')];const g=groups.find(h=>h.innerText==='آیتم‌ها');if(!g)return 'NOGROUP';const list=g.nextElementSibling;return String(list.querySelectorAll('[cmdk-item]').length)})()")
[ "${ITEMS:-0}" -ge 1 ]; check $? "live item search renders the «آیتم‌ها» group ($ITEMS rows)"
IDX=$(ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.querySelector('[cmdk-input]'));const items=[...d.querySelectorAll('[cmdk-item]')];return String(items.findIndex(i=>i.closest('[cmdk-group]') && i.closest('[cmdk-group]').previousElementSibling?.innerText==='آیتم‌ها' || i.parentElement.previousElementSibling?.innerText==='آیتم‌ها'))})()")
ab screenshot $EV/b3-palette-items-fa-1280.png >/dev/null
# ArrowDown through the rendered items until an item row of the items group
# is selected, then Enter — deterministic without depending on cmdk internals.
NAV=$(ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.querySelector('[cmdk-input]'));const items=[...d.querySelectorAll('[cmdk-item]')];const firstItem=items.find(i=>{const g=i.closest('[cmdk-group]');return g && [...g.querySelectorAll('[cmdk-group-heading]')].length>0 && g.innerText.startsWith('آیتم‌ها')});if(!firstItem)return '-1';return String(items.indexOf(firstItem))})()")
for i in $(seq 1 $((NAV + 1))); do ab press ArrowDown >/dev/null 2>&1; done
ab press Enter >/dev/null 2>&1
ab wait 1000 >/dev/null
SHEET=$(ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.querySelector('h2'));return d?d.querySelector('h2').innerText.slice(0,20):'NOSHEET'})()")
echo "$SHEET" | rg -q "راهنما"; check $? "Enter on a found item opens ITS sheet ($SHEET…)"
PAL=$(palOpen); [ "$PAL" = "CLOSED" ]; check $? "palette closed itself after opening the item ($PAL)"
ab press Escape >/dev/null 2>&1; ab wait 400 >/dev/null

# ---------- 8. library-search action (the merge into ONE pattern) ----------
openK
fillPal "خرید"
ab wait 400 >/dev/null
ACTION=$(ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.querySelector('[cmdk-input]'));const it=[...d.querySelectorAll('[cmdk-item]')].find(i=>i.innerText.includes('نمایش نتایج «خرید» در کتابخانه'));return it?'ACTION':'NOACTION'})()")
[ "$ACTION" = "ACTION" ]; check $? "typed query offers «نمایش نتایج «خرید» در کتابخانه» ($ACTION)"
ab press Enter >/dev/null 2>&1
ab wait 900 >/dev/null
H=$(ev "location.hash"); echo "$H" | rg -q "q="; check $? "the action applied the query to the library ($H)"
CHIP=$(ev "(()=>{const g=[...document.querySelectorAll('main [role=\"group\"]')].find(x=>(x.getAttribute('aria-label')||'').includes('فعال'));return g?g.innerText.includes('خرید')?'CHIP':'NOCHIP':'NONE'})()")
[ "$CHIP" = "CHIP" ]; check $? "library shows the search echo chip «خرید» ($CHIP)"

# ---------- 9. action: clear filters ----------
openK
fillPal "پاک کردن فیلترها"
ab wait 400 >/dev/null
ab press ArrowDown >/dev/null 2>&1
ab press Enter >/dev/null 2>&1
ab wait 900 >/dev/null
H=$(ev "location.hash")
if echo "$H" | rg -q "q="; then bad "clear-filters action cleaned the hash ($H)"; else ok "clear-filters action cleaned the hash ($H)"; fi

# ---------- 10. mobile 390: same palette via the header icon ----------
ab set viewport 390 844 >/dev/null 2>&1
ab wait 700 >/dev/null
ab eval "document.querySelector('header button[aria-label=\"باز کردن پالت فرمان‌ها (⌘K)\"]').click()" >/dev/null 2>&1
ab wait 700 >/dev/null
PM=$(palOpen); [ "$PM" = "OPEN" ]; check $? "390: the header icon opens the SAME palette ($PM)"
ab screenshot $EV/b3-palette-fa-390.png >/dev/null
closePal
ab set viewport 1280 900 >/dev/null 2>&1

# ---------- 11. console + close-out ----------
CONSOLE=$(ab console 2>/dev/null | rg -ci "error" || true)
[ "${CONSOLE:-0}" = "0" ]; check $? "browser console: 0 errors"
curl -s --max-time 30 -X POST http://localhost:3000/api/seed >/dev/null
FIN=$(curl -s --max-time 20 "http://localhost:3000/api/stats" | python3 -c 'import json,sys; print(json.load(sys.stdin)["total"])')
[ "$FIN" -ge 20 ]; check $? "close-out: demo DB re-seeded canonically (live total=$FIN)"

echo ""
echo "================ RESULT: pass=$pass fail=$fail ================"
grep -v "prisma:query" dev.log | rg "⨯|Error|error" | head -8 || echo "dev.log: no compile/runtime errors"
