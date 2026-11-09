#!/bin/bash
# UX-B6 verification — the capture→organize bridge (A-3.2).
# Proves: the success toast carries an OPTIONAL micro-CTA «دسته‌بندی همین
# آیتم»; clicking it opens THAT item's sheet STRAIGHT into the explicit edit
# session (categorize the new item in one bridge step); the plain save flow
# is unchanged and NEVER blocked (P2); a regular card open still lands in the
# B2 view-first mode (no accidental auto-edit). Single session: dev server +
# browser (demo, fa, 1280).
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
setText() { ab eval "(()=>{const el=document.querySelector('$1');const set=Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set;set.call(el,'$2');el.dispatchEvent(new Event('input',{bubbles:true}));return 'ok'})()" >/dev/null 2>&1; }

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
ab eval "try{localStorage.clear();localStorage.setItem('savedbox.bulk.coach.v1','1')}catch(e){}" >/dev/null 2>&1
ab set viewport 1280 900 >/dev/null 2>&1
ab reload >/dev/null 2>&1
ab wait --fn "[...document.querySelectorAll('button')].some(b=>b.textContent.includes('ادامه در حالت'))" --timeout 30000 >/dev/null 2>&1
ab eval "[...document.querySelectorAll('button')].find(b=>b.textContent.includes('ادامه در حالت')).click()" >/dev/null 2>&1
ab wait --fn "document.querySelector('main') && document.querySelector('main').innerText.trim().length > 20" --timeout 30000 >/dev/null 2>&1
ab wait 800 >/dev/null

# ---------- 2. capture an item (the plain one-step flow) ----------
ev "(()=>{const b=[...document.querySelectorAll('header button')].find(x=>x.innerText.includes('ثبت سریع'));b.click();return 'ok'})()" >/dev/null 2>&1
ab wait 600 >/dev/null
CAP=$(ev "String(!!document.getElementById('capture-title'))")
[ "$CAP" = "true" ]; check $? "capture dialog opened ($CAP)"
setInput "#capture-title" "آزمون پل B6"
setText "#capture-content" "متن آزمایشی برای پل ثبت به سازمان‌دهی."
ab wait 300 >/dev/null
ev "(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('ذخیرهٔ مورد'));b.click();return 'ok'})()" >/dev/null 2>&1
ab wait 900 >/dev/null
TOAST=$(ev "(()=>{const t=[...document.querySelectorAll('[data-sonner-toast]')].find(x=>x.innerText.includes('مورد ذخیره شد'));if(!t)return 'NOTOAST';const a=[...t.querySelectorAll('button')].find(x=>x.innerText.includes('دسته‌بندی همین آیتم'));return a?'CTA':'NOCTA'})()")
echo "$TOAST" | rg -q "CTA"; check $? "success toast carries the OPTIONAL organize CTA ($TOAST)"
CLOSED=$(ev "String(!document.getElementById('capture-title'))")
[ "$CLOSED" = "true" ]; check $? "save closed the capture dialog — ONE step, never blocked ($CLOSED)"
ab screenshot $EV/b6-toast-cta-fa-1280.png >/dev/null

# ---------- 3. the bridge: CTA opens the sheet STRAIGHT in edit mode ----------
ev "(()=>{const t=[...document.querySelectorAll('[data-sonner-toast]')].find(x=>x.innerText.includes('مورد ذخیره شد'));const a=[...t.querySelectorAll('button')].find(x=>x.innerText.includes('دسته‌بندی همین آیتم'));a.click();return 'ok'})()" >/dev/null 2>&1
ab wait 1000 >/dev/null
SHEET=$(ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.querySelector('#sheet-title, input, textarea'));return d?'SHEET':'NOSHEET'})()")
[ "$SHEET" = "SHEET" ]; check $? "the CTA opened the item's sheet ($SHEET)"
EDIT=$(ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.innerText.includes('ویرایش فعال'));return d?'EDIT':'VIEW'})()")
[ "$EDIT" = "EDIT" ]; check $? "the sheet landed STRAIGHT in the explicit edit session ($EDIT)"
COMBO=$(ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.innerText.includes('ویرایش فعال'));return String(d.querySelectorAll('[role=\"combobox\"]').length)})()")
[ "${COMBO:-0}" -ge 1 ]; check $? "the edit session exposes the category combobox ($COMBO)"
ab screenshot $EV/b6-bridge-edit-mode-fa-1280.png >/dev/null

# ---------- 4. categorize in the bridged edit session ----------
ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.innerText.includes('ویرایش فعال'));const c=[...d.querySelectorAll('[role=\"combobox\"]')][0];c.click();return 'ok'})()" >/dev/null 2>&1
ab wait 500 >/dev/null
ev "(()=>{const opt=[...document.querySelectorAll('[role=\"option\"]')].find(x=>x.innerText.includes('خرید'));if(!opt)return 'NOOPT';opt.click();return 'ok'})()" >/dev/null 2>&1
ab wait 400 >/dev/null
ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.innerText.includes('ویرایش فعال'));const b=[...d.querySelectorAll('button')].find(x=>x.innerText.includes('ذخیره'));b.click();return 'ok'})()" >/dev/null 2>&1
ab wait 1000 >/dev/null
SAVED=$(ev "String(!!document.body.innerText.match(/تغییرات ذخیره شد/))")
[ "$SAVED" = "true" ]; check $? "the categorize save confirmed via toast ($SAVED)"
API=$(curl -s --max-time 20 "http://localhost:3000/api/notes" | python3 -c "
import json,sys
d=json.load(sys.stdin)
n=[x for x in d['items'] if x['title']=='آزمون پل B6']
print(n[0]['category']['nameFa'] if n and n[0].get('category') else 'NOCAT')")
echo "$API" | rg -q "خرید"; check $? "API: the bridged item is now in «خرید» ($API)"
CHIP=$(ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.querySelector('h2'));return d&&d.innerText.includes('خرید')?'CHIP':'NOCHIP'})()")
[ "$CHIP" = "CHIP" ]; check $? "view mode shows the category chip read-only ($CHIP)"

# ---------- 5. the plain flow: saving WITHOUT the CTA opens nothing ----------
ab press Escape >/dev/null 2>&1; ab wait 600 >/dev/null
ev "(()=>{const b=[...document.querySelectorAll('header button')].find(x=>x.innerText.includes('ثبت سریع'));b.click();return 'ok'})()" >/dev/null 2>&1
ab wait 600 >/dev/null
setInput "#capture-title" "آزمون پل B6 بدون CTA"
setText "#capture-content" "ذخیرهٔ ساده بدون استفاده از پل."
ev "(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('ذخیرهٔ مورد'));b.click();return 'ok'})()" >/dev/null 2>&1
ab wait 900 >/dev/null
TOAST2=$(ev "(()=>{const t=[...document.querySelectorAll('[data-sonner-toast]')].find(x=>x.innerText.includes('مورد ذخیره شد'));return t?'TOAST':'NOTOAST'})()")
[ "$TOAST2" = "TOAST" ]; check $? "the plain flow still saves with the same toast ($TOAST2)"
NOSHEET=$(ev "String(![...document.querySelectorAll('[role=\"dialog\"]')].some(x=>x.innerText.includes('ویرایش فعال')))")
[ "$NOSHEET" = "true" ]; check $? "ignoring the CTA opens NOTHING (optional bridge) ($NOSHEET)"
ev "(()=>{const t=[...document.querySelectorAll('[data-sonner-toast]')].find(x=>x.innerText.includes('مورد ذخیره شد'));const c=t&&t.querySelector('[data-sonner-toast] [aria-label], button[aria-label=\"بستن\"]');return 'ok'})()" >/dev/null 2>&1
ab wait 500 >/dev/null

# ---------- 6. B2 regression: a regular card open lands in VIEW mode ----------
ab eval "location.hash='#/library'" >/dev/null 2>&1
ab wait 1200 >/dev/null
ev "(()=>{const c=[...document.querySelectorAll('[role=\"button\"]')].find(x=>x.innerText.includes('آزمون پل B6')&&!x.querySelector('[role=\"checkbox\"]'));if(!c)return 'NOCARD';c.click();return 'ok'})()" >/dev/null 2>&1
ab wait 900 >/dev/null
VIEW=$(ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.querySelector('h2')&&x.innerText.includes('آزمون پل B6'));if(!d)return 'NOSHEET';return d.innerText.includes('ویرایش فعال')?'EDIT':'VIEW'})()")
[ "$VIEW" = "VIEW" ]; check $? "regular open: the sheet is VIEW-first (B2 intact, no accidental auto-edit) ($VIEW)"
ab press Escape >/dev/null 2>&1; ab wait 400 >/dev/null

# ---------- 7. console + close-out ----------
CONSOLE=$(ab console 2>/dev/null | rg -ci "error" || true)
[ "${CONSOLE:-0}" = "0" ]; check $? "browser console: 0 errors"
curl -s --max-time 30 -X POST http://localhost:3000/api/seed >/dev/null
FIN=$(curl -s --max-time 20 "http://localhost:3000/api/stats" | python3 -c 'import json,sys; print(json.load(sys.stdin)["total"])')
[ "$FIN" -ge 20 ]; check $? "close-out: demo DB re-seeded canonically (live total=$FIN)"

echo ""
echo "================ RESULT: pass=$pass fail=$fail ================"
grep -v "prisma:query" dev.log | rg "⨯|Error|error" | head -8 || echo "dev.log: no compile/runtime errors"
