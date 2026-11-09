#!/bin/bash
# UX-B4 verification — the bulk-selection flow redesign (T-4).
# Proves: the ONE-time coach-mark teaches the hidden feature at its own entry
# (and never nags again — any dismissal latches localStorage); the count-
# bearing action bar carries the WHOLE select → apply → exit flow (select-all
# / deselect-all over the visible items, polite live count, archive apply);
# the SAFE exit (X button, toolbar toggle AND Escape — but Escape never yanks
# the selection out from under an open modal); the trash view keeps its
# restore-only contract; mobile 390 bar sits ABOVE the bottom nav with the
# FAB hidden. Single session: dev server + browser (demo, fa, 1280/390).
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
# The coach-mark popover = a Radix dialog carrying the UNIQUE coach sentence.
coachUp() { ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.innerText.includes('دکمهٔ چک‌لیست'));return d?'COACH':'NONE'})()"; }
bulkOn() { ev "String(!!document.querySelector('button[aria-label=\"خروج از انتخاب\"]'))"; }
checkboxes() { ev "String(document.querySelectorAll('[role=\"checkbox\"]').length)"; }
countTxt() { ev "(()=>{const c=document.querySelector('[role=\"toolbar\"] [aria-live=\"polite\"]');return c?c.innerText.trim():'NOCOUNT'})()"; }
barBtn() { ev "(()=>{const bar=document.querySelector('[role=\"toolbar\"]');if(!bar)return 'NOBAR';const b=[...bar.querySelectorAll('button')].find(x=>x.innerText.includes('$1'));return b?'YES':'NOBTN'})()"; }
clickBarBtn() { ev "(()=>{const bar=document.querySelector('[role=\"toolbar\"]');if(!bar)return 'NOBAR';const b=[...bar.querySelectorAll('button')].find(x=>x.innerText.includes('$1'));if(!b)return 'NOBTN';b.click();return 'CLICKED'})()"; }
# the live count renders PERSIAN digits — normalize before numeric asserts
countNum() { ev "(()=>{const c=document.querySelector('[role=\"toolbar\"] [aria-live=\"polite\"]');if(!c)return '-1';const m=c.innerText.match(/[0-9\u06F0-\u06F9]+/);if(!m)return '-1';return m[0].replace(/[\u06F0-\u06F9]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))})()"; }
stat() { curl -s --max-time 20 "http://localhost:3000/api/stats" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
# the live count renders PERSIAN digits — normalize before numeric asserts
countNum() { ev "(()=>{const c=document.querySelector('[role=\"toolbar\"] [aria-live=\"polite\"]');if(!c)return '-1';const m=c.innerText.match(/[0-9\u06F0-\u06F9]+/);if(!m)return '-1';return m[0].replace(/[\u06F0-\u06F9]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))})()"; }
stat() { curl -s --max-time 20 "http://localhost:3000/api/stats" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }

# ---------- 0. backend ----------
agent-browser close >/dev/null 2>&1
pkill -9 -f "next dev" 2>/dev/null; pkill -9 -f "next-server" 2>/dev/null; sleep 1
setsid nohup bun run dev > dev.log 2>&1 < /dev/null & disown
for i in $(seq 1 90); do curl -s -o /dev/null --max-time 2 http://localhost:3000/api/stats && break; sleep 1; done
DEV=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:3000/api/stats)
[ "$DEV" = "200" ]; check $? "dev server up (GET /api/stats = $DEV)"
curl -s --max-time 30 -X POST http://localhost:3000/api/seed >/dev/null
SEEDN=$(curl -s --max-time 20 "http://localhost:3000/api/stats" | python3 -c 'import json,sys; print(json.load(sys.stdin)["total"])')
[ "${SEEDN:-0}" -ge 20 ]; check $? "canonical seed present (total=$SEEDN)"

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
ab wait --fn "[...document.querySelectorAll('[role=\"checkbox\"]')].length === 0" --timeout 20000 >/dev/null 2>&1
ab wait 1400 >/dev/null

# ---------- 2. the coach-mark: discoverability of the hidden feature ----------
C1=$(coachUp); [ "$C1" = "COACH" ]; check $? "first library visit opens the one-time bulk coach-mark ($C1)"
TTL=$(ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.innerText.includes('دکمهٔ چک‌لیست'));return d&&d.innerText.includes('انتخاب گروهی')?'TITLED':'NOTITLED'})()")
[ "$TTL" = "TITLED" ]; check $? "coach-mark carries title «انتخاب گروهی» + the how-to sentence ($TTL)"
ab screenshot $EV/b4-coach-mark-fa-1280.png >/dev/null
BTN=$(ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.innerText.includes('دکمهٔ چک‌لیست'));if(!d)return 'NONE';const b=[...d.querySelectorAll('button')].find(x=>x.innerText.includes('متوجه شدم'));return b?'BTN':'NOBTN'})()")
[ "$BTN" = "BTN" ]; check $? "coach-mark has an explicit «متوجه شدم» dismiss ($BTN)"
ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.innerText.includes('دکمهٔ چک‌لیست'));const b=[...d.querySelectorAll('button')].find(x=>x.innerText.includes('متوجه شدم'));b.click();return 'ok'})()" >/dev/null 2>&1
ab wait 500 >/dev/null
C2=$(coachUp); [ "$C2" = "NONE" ]; check $? "dismiss closes the coach-mark ($C2)"
FLAG=$(ev "String(localStorage.getItem('savedbox.bulk.coach.v1'))")
[ "$FLAG" = "1" ]; check $? "ANY dismissal latches the localStorage flag ($FLAG)"

# ---------- 3. the coach never nags again ----------
ab reload >/dev/null 2>&1
ab wait --fn "document.querySelector('main') && document.querySelector('main').innerText.trim().length > 20" --timeout 30000 >/dev/null 2>&1
ab eval "location.hash='#/library'" >/dev/null 2>&1
ab wait 1800 >/dev/null
C3=$(coachUp); [ "$C3" = "NONE" ]; check $? "after reload the coach-mark does NOT re-appear ($C3)"

# ---------- 4. entering bulk mode (entry still via the toolbar toggle) ----------
ev "document.querySelector('button[aria-label=\"انتخاب موارد\"]').click()" >/dev/null 2>&1
ab wait 500 >/dev/null
B1=$(bulkOn); [ "$B1" = "true" ]; check $? "toolbar toggle enters bulk mode ($B1)"
CB=$(checkboxes); [ "${CB:-0}" -ge 3 ]; check $? "cards render selection checkboxes ($CB)"
C4=$(coachUp); [ "$C4" = "NONE" ]; check $? "coach-mark stays away in bulk mode ($C4)"
STICK=$(ev "String(!!document.querySelector('button[aria-label=\"انتخاب موارد\"][aria-pressed=\"true\"]') || document.querySelector('button[aria-label=\"خروج از انتخاب\"]').getAttribute('aria-pressed')==='true')")
[ "$STICK" = "true" ]; check $? "the toggle itself shows aria-pressed state ($STICK)"

# ---------- 5. the count-bearing bar: select → count ----------
ev "document.querySelectorAll('[role=\"checkbox\"]')[0].click()" >/dev/null 2>&1
ev "document.querySelectorAll('[role=\"checkbox\"]')[1].click()" >/dev/null 2>&1
ab wait 400 >/dev/null
CNT=$(countTxt); echo "$CNT" | rg -q "۲"; check $? "live count shows «۲ مورد انتخاب شد» ($CNT)"
LIVE=$(ev "(()=>{const c=document.querySelector('[role=\"toolbar\"] [aria-live=\"polite\"]');return c?String(c.getAttribute('aria-live')):'NONE'})()")
[ "$LIVE" = "polite" ]; check $? "the count is an aria-live=polite region ($LIVE)"
RING=$(ev "(()=>{const cards=[...document.querySelectorAll('[role=\"button\"]')].filter(x=>x.querySelector('[role=\"checkbox\"][aria-checked=\"true\"]'));return String(cards.length)})()")
[ "${RING:-0}" = "2" ]; check $? "selected cards get the selected visual treatment ($RING ringed)"
ab screenshot $EV/b4-bulk-selected-fa-1280.png >/dev/null

# ---------- 6. select-all / deselect-all over the VISIBLE items ----------
TOT=$(checkboxes)
ev "(()=>{const bar=document.querySelector('[role=\"toolbar\"]');const b=[...bar.querySelectorAll('button')].find(x=>x.innerText.includes('انتخاب همه'));b.click();return 'ok'})()" >/dev/null 2>&1
ab wait 400 >/dev/null
ALLN=$(countNum)
[ "${ALLN:-0}" = "${TOT:-0}" ]; check $? "select-all selects ALL visible items ($ALLN of $TOT)"
DA=$(barBtn "هیچ‌کدام"); [ "$DA" = "YES" ]; check $? "bar flips to «هیچ‌کدام» when everything is selected ($DA)"
ab screenshot $EV/b4-select-all-fa-1280.png >/dev/null
ev "(()=>{const bar=document.querySelector('[role=\"toolbar\"]');const b=[...bar.querySelectorAll('button')].find(x=>x.innerText.includes('هیچ‌کدام'));b.click();return 'ok'})()" >/dev/null 2>&1
ab wait 400 >/dev/null
Z=$(countNum)
[ "${Z:-1}" = "0" ]; check $? "deselect-all empties the selection ($Z)"

# ---------- 7. apply: bulk archive (API-proven) then bulk DELETE keeps the S5 undo contract ----------
ev "document.querySelectorAll('[role=\"checkbox\"]')[0].click()" >/dev/null 2>&1
ev "document.querySelectorAll('[role=\"checkbox\"]')[1].click()" >/dev/null 2>&1
ab wait 300 >/dev/null
ARCH0=$(stat archived)
clickBarBtn "بایگانی" >/dev/null 2>&1
ab wait 900 >/dev/null
ARCH1=$(stat archived)
[ "$ARCH1" = "$((ARCH0 + 2))" ]; check $? "bulk archive applied exactly 2 items via API ($ARCH0 → $ARCH1)"
Z2=$(countNum)
[ "${Z2:-1}" = "0" ]; check $? "count resets after the action ($Z2)"
TOAST=$(ev "String(!!document.body.innerText.match(/مورد بایگانی شد/))")
[ "$TOAST" = "true" ]; check $? "success toast confirms the batch ($TOAST)"
# now the destructive batch: bulk DELETE — the S5 undo contract (UX-A6 toast,
# ≥ 8 s, 44px undo button) must restore the WHOLE batch (P6 untouched).
TOT0=$(stat total)
ev "document.querySelectorAll('[role=\"checkbox\"]')[0].click()" >/dev/null 2>&1
ev "document.querySelectorAll('[role=\"checkbox\"]')[1].click()" >/dev/null 2>&1
ab wait 300 >/dev/null
clickBarBtn "حذف" >/dev/null 2>&1
ab wait 900 >/dev/null
TOT1=$(stat total)
[ "$TOT1" = "$((TOT0 - 2))" ]; check $? "bulk delete moved exactly 2 items to trash ($TOT0 → $TOT1)"
UNDO=$(ev "(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('بازگردانی'));return b?'UNDO':'NOUNDO'})()")
[ "$UNDO" = "UNDO" ]; check $? "the stabilized undo toast offers batch restore (P6 untouched) ($UNDO)"
ev "(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('بازگردانی'));if(b)b.click();return 'ok'})()" >/dev/null 2>&1
ab wait 900 >/dev/null
TOT2=$(stat total)
[ "$TOT2" = "$TOT0" ]; check $? "undo restored the whole batch ($TOT1 → $TOT2)"

# ---------- 8. safe exit: X button AND Escape (modal-guarded) ----------
ev "(()=>{const bar=document.querySelector('[role=\"toolbar\"]');const b=[...bar.querySelectorAll('button')].find(x=>x.getAttribute('aria-label')==='لغو انتخاب');b.click();return 'ok'})()" >/dev/null 2>&1
ab wait 400 >/dev/null
B2=$(bulkOn); [ "$B2" = "false" ]; check $? "the bar X exits bulk mode ($B2)"
CB2=$(checkboxes); [ "${CB2:-1}" = "0" ]; check $? "exiting removes the checkboxes ($CB2)"
ev "document.querySelector('button[aria-label=\"انتخاب موارد\"]').click()" >/dev/null 2>&1
ab wait 400 >/dev/null
ev "document.querySelectorAll('[role=\"checkbox\"]')[0].click()" >/dev/null 2>&1
# open a modal (capture dialog) — Escape belongs to IT, not to the selection
ev "(()=>{const b=[...document.querySelectorAll('header button')].find(x=>x.innerText.includes('ثبت سریع'));if(b){b.click();return 'hdr'}const f=document.querySelector('button[aria-label=\"ثبت سریع\"]');if(f){f.click();return 'fab'}return 'NONE'})()" >/dev/null 2>&1
ab wait 600 >/dev/null
CAP=$(ev "String(!!document.getElementById('capture-title'))")
[ "$CAP" = "true" ]; check $? "capture dialog opened over bulk mode ($CAP)"
ab press Escape >/dev/null 2>&1
ab wait 500 >/dev/null
CAP2=$(ev "String(!document.getElementById('capture-title'))")
[ "$CAP2" = "true" ]; check $? "Escape closed the dialog… ($CAP2)"
B3=$(bulkOn); [ "$B3" = "true" ]; check $? "…and did NOT wipe the bulk selection beneath it ($B3)"
CNTC=$(countTxt); echo "$CNTC" | rg -q "۱"; check $? "selection survived the dialog Escape ($CNTC)"
ab press Escape >/dev/null 2>&1
ab wait 500 >/dev/null
B4=$(bulkOn); [ "$B4" = "false" ]; check $? "bare Escape now safely exits bulk mode ($B4)"

# ---------- 9. trash: restore-only bar contract ----------
ab eval "location.hash='#/library?trash=1'" >/dev/null 2>&1
ab wait 900 >/dev/null
TR=$(ev "String(document.body.innerText.includes('سطل'))")
[ "$TR" = "true" ]; check $? "trash view reached via deep-link ($TR)"
ev "document.querySelector('button[aria-label=\"انتخاب موارد\"]').click()" >/dev/null 2>&1
ab wait 500 >/dev/null
REST=$(barBtn "بازگردانی"); [ "$REST" = "YES" ]; check $? "trash bar offers bulk restore ($REST)"
NOARCH=$(ev "(()=>{const bar=document.querySelector('[role=\"toolbar\"]');return String(!bar.innerText.includes('حذف') && !bar.innerText.includes('دسته‌بندی'))})()")
[ "$NOARCH" = "true" ]; check $? "trash bar hides delete/categorize (soft-delete contract) ($NOARCH)"
ev "(()=>{const bar=document.querySelector('[role=\"toolbar\"]');const b=[...bar.querySelectorAll('button')].find(x=>x.innerText.includes('انتخاب همه'));if(b)b.click();return 'ok'})()" >/dev/null 2>&1
ab wait 400 >/dev/null
CNTR=$(countTxt); echo "$CNTR" | rg -q "بازگردانی|مورد"; check $? "select-all works in trash too ($CNTR)"
ab screenshot $EV/b4-bulk-trash-fa-1280.png >/dev/null
ev "(()=>{const bar=document.querySelector('[role=\"toolbar\"]');const b=[...bar.querySelectorAll('button')].find(x=>x.getAttribute('aria-label')==='لغو انتخاب');if(b)b.click();return 'ok'})()" >/dev/null 2>&1
ab wait 400 >/dev/null

# ---------- 10. mobile 390: bar above the nav, FAB hidden ----------
ab set viewport 390 844 >/dev/null 2>&1
ab wait 700 >/dev/null
ev "document.querySelector('button[aria-label=\"انتخاب موارد\"]').click()" >/dev/null 2>&1
ab wait 500 >/dev/null
ev "document.querySelectorAll('[role=\"checkbox\"]')[0].click()" >/dev/null 2>&1
ev "document.querySelectorAll('[role=\"checkbox\"]')[1].click()" >/dev/null 2>&1
ab wait 400 >/dev/null
GEO=$(ev "(()=>{const bar=document.querySelector('[role=\"toolbar\"]');if(!bar)return 'NOBAR';const r=bar.getBoundingClientRect();const nav=document.querySelector('nav');const nr=nav?nav.getBoundingClientRect():null;const fab=document.querySelector('button[aria-label=\"ثبت سریع\"]');return JSON.stringify({barBottom:Math.round(r.bottom),navTop:nr?Math.round(nr.top):-1,fab:String(!!fab)})})()")
echo "$GEO" | rg -q '"fab":"false"'; check $? "390: capture FAB hidden during bulk selection ($GEO)"
NAVOK=$(ev "(()=>{const bar=document.querySelector('[role=\"toolbar\"]');const r=bar.getBoundingClientRect();const nav=document.querySelector('nav');const nr=nav.getBoundingClientRect();return String(r.bottom <= nr.top + 1)})()")
[ "$NAVOK" = "true" ]; check $? "390: the action bar sits ABOVE the bottom nav, no overlap ($GEO)"
ab screenshot $EV/b4-bulk-bar-fa-390.png >/dev/null
SA390=$(barBtn "انتخاب همه"); [ "$SA390" = "YES" ]; check $? "390: select-all present in the mobile bar ($SA390)"
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
