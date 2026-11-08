#!/bin/bash
# N10 verification — single-session: dev server + API matrix + browser (demo mode, fa/en, 1280/390)
# Duplicate detection on capture: normalized-URL + N3-normalized exact-title
# soft warning; saving stays free (never blocked); no auto-deletion.
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
# Fill a React-controlled input (native setter + input event)
fill() { ab eval "(()=>{const el=document.getElementById('$1');const set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;set.call(el,'$2');el.dispatchEvent(new Event('input',{bubbles:true}));return 'filled'})()" >/dev/null 2>&1; }
# The title field's QE6 hint ALSO has role=status — duplicate-banner checks
# must select the status element by its TEXT, not by role alone.
banFa() { ev "(()=>{const s=[...document.querySelectorAll('[role=\"dialog\"] [role=\"status\"]')].find(x=>x.innerText.includes('پیش‌تر'));return s?s.innerText.replace(/\n/g,' | '):'NONE'})()"; }
banEn() { ev "(()=>{const s=[...document.querySelectorAll('[role=\"dialog\"] [role=\"status\"]')].find(x=>x.innerText.includes('already saved'));return s?s.innerText.replace(/\n/g,' | '):'NONE'})()"; }
waitBanFa() { ab wait --fn "[...document.querySelectorAll('[role=\"dialog\"] [role=\"status\"]')].some(x=>x.innerText.includes('پیش‌تر'))" --timeout 10000 >/dev/null 2>&1; }
waitBanEn() { ab wait --fn "[...document.querySelectorAll('[role=\"dialog\"] [role=\"status\"]')].some(x=>x.innerText.includes('already saved'))" --timeout 10000 >/dev/null 2>&1; }
DUPURL="https://example.com/guide"

# ---------- 0. backend ----------
agent-browser close >/dev/null 2>&1
pkill -9 -f "next dev" 2>/dev/null; pkill -9 -f "next-server" 2>/dev/null; sleep 1
setsid nohup bun run dev > dev.log 2>&1 < /dev/null & disown
for i in $(seq 1 90); do curl -s -o /dev/null --max-time 2 http://localhost:3000/api/stats && break; sleep 1; done
DEV=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:3000/api/stats)
[ "$DEV" = "200" ]; check $? "dev server up (GET /api/stats = $DEV)"

# ---------- 1. seed + N10 corpus ----------
curl -s --max-time 30 -X POST http://localhost:3000/api/seed >/dev/null
CAT=$(curl -s --max-time 20 http://localhost:3000/api/categories | python3 -c 'import json,sys; items=json.load(sys.stdin)["items"]; print(next(c["id"] for c in items if c["nameFa"]=="آموزش"))')
[ -n "$CAT" ]; check $? "canonical seed + «آموزش» category found (id=${CAT:0:12}…)"
D1=$(curl -s --max-time 20 -X POST http://localhost:3000/api/notes -H 'Content-Type: application/json' -d "{\"type\":\"link\",\"title\":\"راهنمای پروژه دمو\",\"url\":\"$DUPURL\",\"categoryId\":\"$CAT\"}" | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')
[ -n "$D1" ]; check $? "N10 corpus: duplicate-target link note created (D1=$D1)"

# ---------- 2. N10 API matrix ----------
pjson() { curl -s --max-time 20 "$@" | python3 -c 'import json,sys; d=json.load(sys.stdin); n=d.get("note"); print("MATCH", d.get("matchOn"), n["id"] if n else "", (n["title"] if n else ""))'; }
P1=$(pjson "http://localhost:3000/api/notes/duplicate?url=$DUPURL")
echo "$P1" | rg -q "^MATCH url $D1"; check $? "API: exact URL → matchOn=url on D1 ($P1)"
P2=$(pjson "http://localhost:3000/api/notes/duplicate?url=https://EXAMPLE.com/guide/")
echo "$P2" | rg -q "^MATCH url $D1"; check $? "API: case + trailing-slash canonicalized → same match ($P2)"
P3=$(pjson "http://localhost:3000/api/notes/duplicate?url=https://www.example.com/guide?utm_source=telegram")
echo "$P3" | rg -q "^MATCH url $D1"; check $? "API: www. + utm tracking stripped → same match ($P3)"
P4=$(pjson "http://localhost:3000/api/notes/duplicate?url=https://example.com/other-page")
echo "$P4" | rg -q "^MATCH url $"; [ "$P4" = "MATCH url  " ] || [ "$P4" = "MATCH None  " ]; check $? "API: different URL → no match ($P4)"
P5=$(pjson -G "http://localhost:3000/api/notes/duplicate" --data-urlencode "title=راهنمای پروژه دمو")
echo "$P5" | rg -q "^MATCH title $D1"; check $? "API: exact title → matchOn=title ($P5)"
P6=$(pjson -G "http://localhost:3000/api/notes/duplicate" --data-urlencode "title=راهنماى پروژه دمو")
echo "$P6" | rg -q "^MATCH title $D1"; check $? "API: Arabic yeh (ى) folds via N3 → SAME match, no false negative ($P6)"
CODE=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:3000/api/notes/duplicate")
[ "$CODE" = "400" ]; check $? "API: no url and no title → 400 duplicate.no-input ($CODE)"
curl -s --max-time 20 -X POST http://localhost:3000/api/notes/bulk -H 'Content-Type: application/json' -d "{\"ids\":[\"$D1\"],\"action\":\"delete\"}" >/dev/null
P7=$(pjson "http://localhost:3000/api/notes/duplicate?url=$DUPURL")
[ "$P7" = "MATCH url  " ] || [ "$P7" = "MATCH None  " ]; check $? "API: trashed duplicate is NOT reported (recorded decision) ($P7)"
curl -s --max-time 20 -X POST http://localhost:3000/api/notes/bulk -H 'Content-Type: application/json' -d "{\"ids\":[\"$D1\"],\"action\":\"restore\"}" >/dev/null
P8=$(pjson "http://localhost:3000/api/notes/duplicate?url=$DUPURL")
echo "$P8" | rg -q "^MATCH url $D1"; check $? "API: restored → match returns ($P8)"

# ---------- 3. browser: demo mode (fa) ----------
ab open http://localhost:3000 >/dev/null 2>&1
ab wait --fn "document.readyState === 'complete'" --timeout 30000 >/dev/null 2>&1
ab eval "try{localStorage.clear()}catch(e){}" >/dev/null 2>&1
ab set viewport 1280 900 >/dev/null 2>&1
ab reload >/dev/null 2>&1
ab wait --fn "[...document.querySelectorAll('button')].some(b=>b.textContent.includes('ادامه در حالت'))" --timeout 30000 >/dev/null 2>&1
ab eval "[...document.querySelectorAll('button')].find(b=>b.textContent.includes('ادامه در حالت')).click()" >/dev/null 2>&1
ab wait --fn "document.querySelector('main') && document.querySelector('main').innerText.trim().length > 20" --timeout 30000 >/dev/null 2>&1
ab wait 1200 >/dev/null

open_capture() {
  ab eval "[...document.querySelectorAll('header button, main button')].find(b=>b.textContent.includes('ثبت سریع')||b.textContent.includes('Quick capture')).click()" >/dev/null 2>&1
  ab wait --fn "!!document.getElementById('capture-title')" --timeout 15000 >/dev/null 2>&1
  ab wait 400 >/dev/null
}
select_link_type() {
  ab eval "[...document.querySelectorAll('[role=\"dialog\"] button')].find(b=>b.textContent.trim()==='لینک'||b.textContent.trim()==='Link').click()" >/dev/null 2>&1
  ab wait 300 >/dev/null
}

# ---------- 4. banner with category (the owner scenario: paste a dup link) ----------
open_capture
select_link_type
fill capture-url "$DUPURL"
waitBanFa
BAN=$(banFa)
echo "$BAN" | rg -q "پیش‌تر در «آموزش» ذخیره شده"; check $? "N10 UI: banner names the existing category «آموزش» ($BAN)"
VIEW=$(ev "String(!![...document.querySelectorAll('[role=\"dialog\"] button')].find(b=>b.textContent.trim()==='مشاهده'))")
[ "$VIEW" = "true" ]; check $? "N10 UI: «مشاهده» button present"
ab screenshot $EV/n10-duplicate-banner-fa-1280.png >/dev/null

# ---------- 5. NOT-BLOCKED proof: saving with the banner stays free ----------
fill capture-title "ثبت دوم آزمون"
ab wait 1200 >/dev/null
ENB=$(ev "(()=>{const b=[...document.querySelectorAll('[role=\"dialog\"] button')].find(b=>b.textContent.includes('ذخیرهٔ مورد'));return String(!!b && !b.disabled)})()")
[ "$ENB" = "true" ]; check $? "N10 DoD: save button ENABLED while the banner is visible (not blocked: $ENB)"
ab eval "[...document.querySelectorAll('[role=\"dialog\"] footer button, [role=\"dialog\"] button')].filter(b=>b.textContent.includes('ذخیرهٔ مورد')).pop().click()" >/dev/null 2>&1
ab wait 1500 >/dev/null
CLOSED=$(ev "String(!document.getElementById('capture-title'))")
[ "$CLOSED" = "true" ]; check $? "N10 DoD: duplicate URL + new title SAVED successfully (dialog closed = $CLOSED)"
P9=$(pjson "http://localhost:3000/api/notes/duplicate?url=$DUPURL")
echo "$P9" | rg -q "^MATCH url .+ ثبت دوم آزمون"; check $? "N10 DoD: the second copy EXISTS in the library AND newest-wins ranking ($P9)"

# ---------- 6. «مشاهده» flow + uncategorized banner variant ----------
open_capture
select_link_type
fill capture-url "$DUPURL"
waitBanFa
BAN2=$(banFa | python3 -c 'import sys; print(sys.stdin.read().split(" | ")[0])')
echo "$BAN2" | rg -q "این آیتم پیش‌تر ذخیره شده"; check $? "N10 UI: uncategorized match → no-category variant ($BAN2)"
ab eval "[...document.querySelectorAll('[role=\"dialog\"] button')].find(b=>b.textContent.trim()==='مشاهده').click()" >/dev/null 2>&1
ab wait 1000 >/dev/null
SHT=$(ev "document.querySelector('h2')?.innerText ?? ''")
DIAL=$(ev "String(!document.getElementById('capture-title'))")
[ "$SHT" = "ثبت دوم آزمون" ] && [ "$DIAL" = "true" ]; check $? "N10 DoD: «مشاهده» closes capture and opens THAT item's sheet (h2=$SHT, capture closed=$DIAL)"
ab screenshot $EV/n10-duplicate-sheet-fa-1280.png >/dev/null
ab press Escape >/dev/null 2>&1
ab wait 500 >/dev/null

# ---------- 7. negative: unique URL → no banner ----------
open_capture
select_link_type
fill capture-url "https://example.com/unique-xyz-12345"
ab wait 1200 >/dev/null
NEG=$(ev "String(![...document.querySelectorAll('[role=\"dialog\"] [role=\"status\"]')].some(x=>x.innerText.includes('پیش‌تر')))")
[ "$NEG" = "true" ]; check $? "N10: unique URL → NO banner (silent, no noise)"
ab press Escape >/dev/null 2>&1
ab wait 500 >/dev/null

# ---------- 8. EN spot check ----------
ab eval "[...document.querySelectorAll('header button, nav button')].find(b=>b.textContent.trim()==='EN').click()" >/dev/null 2>&1
ab wait 600 >/dev/null
open_capture
select_link_type
fill capture-url "$DUPURL"
waitBanEn
BEN=$(banEn)
echo "$BEN" | rg -q "already saved"; check $? "N10 (en): banner localized ($BEN)"
ab screenshot $EV/n10-duplicate-en-1280.png >/dev/null
ab press Escape >/dev/null 2>&1
ab eval "[...document.querySelectorAll('header button, nav button')].find(b=>b.textContent.trim()==='FA').click()" >/dev/null 2>&1
ab wait 500 >/dev/null

# ---------- 9. mobile 390 ----------
ab set viewport 390 844 >/dev/null 2>&1
ab wait 600 >/dev/null
open_capture
select_link_type
fill capture-url "$DUPURL"
waitBanFa
ab screenshot $EV/n10-duplicate-mobile-390.png >/dev/null
ab press Escape >/dev/null 2>&1
ab set viewport 1280 900 >/dev/null 2>&1

# ---------- 10. console + log + close-out ----------
CONSOLE=$(ab console 2>/dev/null | rg -ci "error" || true)
[ "${CONSOLE:-0}" = "0" ]; check $? "browser console: 0 errors"

curl -s --max-time 30 -X POST http://localhost:3000/api/seed >/dev/null
FIN=$(curl -s --max-time 20 "http://localhost:3000/api/stats" | python3 -c 'import json,sys; print(json.load(sys.stdin)["total"])')
[ "$FIN" -ge 20 ]; check $? "close-out: demo DB re-seeded canonically (live total=$FIN)"

echo ""
echo "================ RESULT: pass=$pass fail=$fail ================"
grep -v "prisma:query" dev.log | rg "⨯|Error|error" | head -8 || echo "dev.log: no compile/runtime errors"
