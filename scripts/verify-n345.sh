#!/bin/bash
# N3/N4/N5 verification v3 — single-session: dev server + browser (demo mode, fa/en, 1280/390)
cd /home/z/my-project
EV=roadmaps/evidence
mkdir -p $EV

pass=0; fail=0
ok()  { pass=$((pass+1)); echo "  ✔ $1"; }
bad() { fail=$((fail+1)); echo "  ✘ $1"; }
check() { if [ "$1" = "0" ]; then ok "$2"; else bad "$2"; fi; }
ab() { agent-browser "$@"; }
# agent-browser eval returns JSON-encoded strings (quotes + \uXXXX escapes);
# ev() decodes so text assertions work on real Persian characters.
ev() { ab eval "$1" | python3 -c 'import sys,json
raw=sys.stdin.read().strip()
try: print(json.loads(raw))
except Exception: print(raw)'; }

# ---------- 0. backend ----------
agent-browser close >/dev/null 2>&1
pkill -9 -f "next dev" 2>/dev/null; pkill -9 -f "next-server" 2>/dev/null; sleep 1
setsid nohup bun run dev > dev.log 2>&1 < /dev/null & disown
for i in $(seq 1 90); do curl -s -o /dev/null --max-time 2 http://localhost:3000/api/stats && break; sleep 1; done
DEV=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:3000/api/stats)
[ "$DEV" = "200" ]; check $? "dev server up (GET /api/stats = $DEV)"

# ---------- 1. seed + test data ----------
curl -s --max-time 30 -X POST http://localhost:3000/api/seed >/dev/null
post() { curl -s --max-time 20 -X POST http://localhost:3000/api/notes -H 'Content-Type: application/json' -d "$1" | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])'; }
A=$(post '{"type":"text","title":"کتاب مدیریت زمان","content":"نکته‌های کاربردی دربارهٔ مدیریت زمان و بهره‌وری روزانه"}')
B=$(post '{"type":"text","title":"یادداشت جلسهٔ هفتگی","content":"من فردا می‌روم به جلسه و بعد مطالعهٔ فصل سوم را شروع می‌کنم"}')
D=$(post '{"type":"text","title":"مطالعهٔ شبانه","content":"برنامهٔ مطالعهٔ شبانه برای درس آمار آماده شده است"}')
C=$(post '{"type":"link","title":"Note Taking Guide","url":"https://example.com/notes-guide","content":"A guide to better note taking"}')
E=$(post '{"type":"text","title":"طرح پروژه آلفا","content":"پیش‌نویس اولیهٔ طرح پروژه برای بازبینی"}')
F=$(post '{"type":"text","title":"فاکتور اینترنت","content":"پرداخت ماهانهٔ اینترنت باید تا پنجشنبه انجام شود"}')
G=$(post '{"type":"text","title":"لیست خرید","content":"شیر، نان، میوه و چای"}')
[ -n "$A" ] && [ -n "$B" ] && [ -n "$C" ] && [ -n "$D" ] && [ -n "$E" ] && [ -n "$F" ] && [ -n "$G" ]; check $? "7 test notes created"
curl -s --max-time 20 -X POST http://localhost:3000/api/notes/bulk -H 'Content-Type: application/json' -d "{\"ids\":[\"$E\",\"$F\",\"$G\"],\"action\":\"delete\"}" >/dev/null
TRASHED=$(curl -s --max-time 20 "http://localhost:3000/api/notes?trash=true&pageSize=100" | python3 -c 'import json,sys; print(json.load(sys.stdin)["total"])')
[ "$TRASHED" = "3" ]; check $? "N5 setup: 3 notes in trash ($TRASHED)"

# ---------- 2. N3 API probes (normalization matrix) ----------
probe() { curl -s --max-time 20 --get --data-urlencode "q=$1" http://localhost:3000/api/notes | python3 -c 'import json,sys; print(json.load(sys.stdin)["total"])'; }
K1=$(probe 'كتاب'); K2=$(probe 'کتاب')
[ -n "$K1" ] && [ "$K1" = "$K2" ] && [ "$K2" -ge 1 ]; check $? "N3 API: «كتاب»(arabic kaf) == «کتاب» → $K1/$K2"
Y1=$(probe 'يادداشت'); Y2=$(probe 'یادداشت')
[ -n "$Y1" ] && [ "$Y1" = "$Y2" ] && [ "$Y2" -ge 1 ]; check $? "N3 API: «يادداشت»(arabic yeh) == «یادداشت» → $Y1/$Y2"
M1=$(probe 'مُطالعه'); M2=$(probe 'مطالعه')
[ -n "$M1" ] && [ "$M1" = "$M2" ] && [ "$M2" -ge 1 ]; check $? "N3 API: «مُطالعه»(diacritic) == «مطالعه» → $M1/$M2"
Z=$(probe 'میروم')
[ -n "$Z" ] && [ "$Z" -ge 1 ]; check $? "N3 API: «میروم» matches ZWNJ content «می‌روم» → $Z"
EN=$(probe 'taking guide')
[ -n "$EN" ] && [ "$EN" -ge 1 ]; check $? "N3 regression: EN query «taking guide» → $EN"
U=$(probe 'example.com')
[ -n "$U" ] && [ "$U" -ge 1 ]; check $? "N3 regression: URL query «example.com» → $U"

# ---------- 3. N5 API guard probe ----------
R=$(curl -s --max-time 20 -X POST http://localhost:3000/api/notes/bulk -H 'Content-Type: application/json' -d "{\"ids\":[\"$A\"],\"action\":\"purge\"}")
echo "$R" | rg -q '"updated":0'; check $? "N5 guard: purge of LIVE note refused ($R)"

# ---------- 4. browser: enter demo mode (fa) ----------
ab open http://localhost:3000 >/dev/null 2>&1
ab wait --fn "document.readyState === 'complete'" --timeout 30000 >/dev/null 2>&1
ab eval "try{localStorage.clear()}catch(e){}" >/dev/null 2>&1
ab set viewport 1280 900 >/dev/null 2>&1
ab reload >/dev/null 2>&1
ab wait --fn "[...document.querySelectorAll('button')].some(b=>b.textContent.includes('ادامه در حالت'))" --timeout 30000 >/dev/null 2>&1
ab eval "[...document.querySelectorAll('button')].find(b=>b.textContent.includes('ادامه در حالت')).click()" >/dev/null 2>&1
ab wait --fn "document.querySelector('main') && document.querySelector('main').innerText.trim().length > 20" --timeout 30000 >/dev/null 2>&1
ab wait 1000 >/dev/null
MAIN=$(ev "document.querySelector('main').innerText")
echo "$MAIN" | rg -q "موارد ذخیره‌شده"; check $? "demo mode entered, dashboard rendered (fa)"

# ---------- 5. N4 — interactive dashboard ----------
TW=$(ev "(()=>{const el=[...document.querySelectorAll('main *')].find(e=>e.childElementCount===0&&e.textContent.trim()==='افزوده‌شده در این هفته');return el&&el.closest('button')?'CLICKABLE':'STATIC'})()")
[ "$TW" = "STATIC" ]; check $? "N4 DoD: «این هفته» card stays display-only ($TW)"
TAG=$(ev "document.querySelector('[aria-label=\"نمایش علاقه‌مندی‌ها در کتابخانه\"]')?.tagName ?? 'MISSING'")
[ "$TAG" = "BUTTON" ]; check $? "N4: favorites stat card is a native <button> ($TAG)"
ab screenshot $EV/n4-dashboard-fa-1280.png >/dev/null
ab eval "document.querySelector('[aria-label=\"نمایش علاقه‌مندی‌ها در کتابخانه\"]').click()" >/dev/null 2>&1
ab wait 700 >/dev/null
H=$(ev "location.hash")
echo "$H" | rg -q "fav=1"; check $? "N4: favorites card → clean deep-link $H (fav=1, no stale filters)"
echo "$H" | rg -qv "arch=1"; check $? "N4: favorites deep-link does NOT leak arch"
ab screenshot $EV/n4-fav-deeplink-fa-1280.png >/dev/null
ab eval "[...document.querySelectorAll('nav button')].find(b=>b.textContent.includes('داشبورد')).click()" >/dev/null 2>&1
ab wait 700 >/dev/null
ab eval "document.querySelector('[aria-label=\"نمایش بایگانی در کتابخانه\"]').click()" >/dev/null 2>&1
ab wait 700 >/dev/null
H=$(ev "location.hash")
echo "$H" | rg -q "arch=1"; check $? "N4: archived card → clean deep-link $H (arch=1)"
echo "$H" | rg -qv "fav=1"; check $? "N4: archived deep-link does NOT leak fav"
ab screenshot $EV/n4-arch-deeplink-fa-1280.png >/dev/null
ab eval "[...document.querySelectorAll('nav button')].find(b=>b.textContent.includes('داشبورد')).click()" >/dev/null 2>&1
ab wait 700 >/dev/null
ab eval "document.querySelector('[aria-label=\"نمایش همهٔ آیتم‌ها در کتابخانه\"]').click()" >/dev/null 2>&1
ab wait 700 >/dev/null
H=$(ev "location.hash")
[ "$H" = "#/library" ]; check $? "N4: total card → plain library ($H)"
ab eval "[...document.querySelectorAll('nav button')].find(b=>b.textContent.includes('داشبورد')).click()" >/dev/null 2>&1
ab wait 700 >/dev/null
ab eval "document.querySelector('[aria-label=\"رفتن به صندوق ورودی — موارد بدون دسته\"]').click()" >/dev/null 2>&1
ab wait 700 >/dev/null
H=$(ev "location.hash")
echo "$H" | rg -q "cat=none"; check $? "N1 regression: inbox card → $H (cat=none)"

# ---------- 6. N3 — browser search + highlight (library UI) ----------
# Enter the library through the N4 total card: resetFilters() + setView —
# so the searches below run against a CLEAN filter state (no leftover
# cat=none from the N1 regression step).
ab eval "[...document.querySelectorAll('nav button')].find(b=>b.textContent.includes('داشبورد')).click()" >/dev/null 2>&1
ab wait 700 >/dev/null
ab eval "document.querySelector('[aria-label=\"نمایش همهٔ آیتم‌ها در کتابخانه\"]').click()" >/dev/null 2>&1
ab wait 800 >/dev/null
clearSearch() {
  ab find first "input[type=search]" click >/dev/null 2>&1
  ab press Control+a >/dev/null 2>&1
  ab press Backspace >/dev/null 2>&1
  ab wait 600 >/dev/null
}
clearSearch
ab find first "input[type=search]" fill "كتاب" >/dev/null 2>&1
ab wait 1000 >/dev/null
MARK=$(ev "String(!!document.querySelector('main mark'))")
HIT=$(ev "String(document.querySelector('main').innerText.includes('کتاب مدیریت زمان'))")
[ "$MARK" = "true" ]; check $? "N3 UI: <mark> highlight present for «كتاب» ($MARK)"
[ "$HIT" = "true" ]; check $? "N3 UI: arabic-kaf query finds «کتاب مدیریت زمان» ($HIT)"
ab screenshot $EV/n3-search-arabic-kaf-fa-1280.png >/dev/null
clearSearch
ab find first "input[type=search]" fill "مُطالعه" >/dev/null 2>&1
ab wait 1000 >/dev/null
MARK=$(ev "String(!!document.querySelector('main mark'))")
HIT=$(ev "String(document.querySelector('main').innerText.includes('مطالعهٔ شبانه'))")
[ "$MARK" = "true" ]; check $? "N3 UI: diacritic query «مُطالعه» highlight ($MARK)"
[ "$HIT" = "true" ]; check $? "N3 UI: diacritic query finds «مطالعهٔ شبانه» ($HIT)"
ab screenshot $EV/n3-search-diacritic-fa-1280.png >/dev/null
clearSearch
ab find first "input[type=search]" fill "میروم" >/dev/null 2>&1
ab wait 1000 >/dev/null
MARK=$(ev "String(!!document.querySelector('main mark'))")
HIT=$(ev "String(document.querySelector('main').innerText.includes('یادداشت جلسهٔ هفتگی'))")
[ "$MARK" = "true" ] && [ "$HIT" = "true" ]; check $? "N3 UI: ZWNJ-free query «میروم» matches ZWNJ data + highlight"
ab screenshot $EV/n3-search-zwnj-fa-1280.png >/dev/null
# EN regression in browser (switch to EN)
ab eval "[...document.querySelectorAll('header button, nav button')].find(b=>b.textContent.trim()==='EN').click()" >/dev/null 2>&1
ab wait 500 >/dev/null
ab find first "input[type=search]" fill "taking guide" >/dev/null 2>&1
ab wait 1000 >/dev/null
HIT=$(ev "String(document.querySelector('main').innerText.toLowerCase().includes('note taking guide'))")
[ "$HIT" = "true" ]; check $? "N3 UI (en): «taking guide» finds Note Taking Guide"
ab screenshot $EV/n3-search-en-1280.png >/dev/null
ab eval "[...document.querySelectorAll('header button, nav button')].find(b=>b.textContent.trim()==='FA').click()" >/dev/null 2>&1
ab wait 500 >/dev/null
clearSearch
ab set viewport 390 844 >/dev/null 2>&1
ab wait 500 >/dev/null
ab screenshot $EV/n3-library-mobile-390.png >/dev/null
ab set viewport 1280 900 >/dev/null 2>&1

# ---------- 7. N5 — trash management UI (UI-touch navigation) ----------
clearSearch
ab eval "[...document.querySelectorAll('main button')].find(b=>b.textContent.trim()==='سطل').click()" >/dev/null 2>&1
ab wait --fn "[...document.querySelectorAll('main button')].some(b=>b.textContent.includes('خالی‌کردن سطل'))" --timeout 15000 >/dev/null 2>&1
TXT=$(ev "document.querySelector('main').innerText")
echo "$TXT" | rg -q "۷ روز تا پاک‌سازی"; check $? "N5 UI: countdown chip «۷ روز تا پاک‌سازی» shown"
echo "$TXT" | rg -q "خالی‌کردن سطل"; check $? "N5 UI: «خالی‌کردن سطل» button present in trash view"
ab screenshot $EV/n5-trash-countdown-fa-1280.png >/dev/null
# per-item purge — dialog must name the item (causal confirm)
ab eval "[...document.querySelectorAll('main button[aria-label^=\"حذف قطعی:\"]')][0].click()" >/dev/null 2>&1
ab wait --fn "document.querySelector('[role=\"alertdialog\"]') !== null" --timeout 10000 >/dev/null 2>&1
DLG=$(ev "document.querySelector('[role=\"alertdialog\"]')?.innerText ?? ''")
echo "$DLG" | rg -q "حذف قطعی؟"; check $? "N5 UI: purge confirm dialog opened"
echo "$DLG" | rg -q "لیست خرید"; check $? "N5 UI: dialog names the exact item «لیست خرید» (causal)"
ab screenshot $EV/n5-purge-confirm-fa-1280.png >/dev/null
ab eval "[...document.querySelector('[role=\"alertdialog\"]').querySelectorAll('button')].find(b=>b.textContent.includes('بله، حذف قطعی')).click()" >/dev/null 2>&1
ab wait 1500 >/dev/null
TOAST=$(ev "[...document.querySelectorAll('[data-sonner-toast]')].map(t=>t.innerText).join(' | ')")
echo "$TOAST" | rg -q "برای همیشه حذف شد"; check $? "N5 UI: purge toast shown ($TOAST)"
CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 http://localhost:3000/api/notes/$G)
[ "$CODE" = "404" ]; check $? "N5 API: purged note G really deleted (GET → $CODE)"
echo "$TOAST" | rg -q "بازگردانی"; UNDO_LEAK=$?; [ "$UNDO_LEAK" != "0" ]; check $? "N5 DoD: purge is NOT wired into undo"
ab screenshot $EV/n5-purge-toast-fa-1280.png >/dev/null
# empty trash — two-step confirmation
ab eval "[...document.querySelectorAll('main button')].find(b=>b.textContent.includes('خالی‌کردن سطل')).click()" >/dev/null 2>&1
ab wait 600 >/dev/null
DLG=$(ev "document.querySelector('[role=\"alertdialog\"]')?.innerText ?? ''")
echo "$DLG" | rg -q "بازگشت‌ناپذیر"; check $? "N5 UI step1: scope + irreversibility stated"
ab screenshot $EV/n5-empty-step1-fa-1280.png >/dev/null
ab eval "[...document.querySelector('[role=\"alertdialog\"]').querySelectorAll('button')].find(b=>b.textContent.includes('ادامه')).click()" >/dev/null 2>&1
ab wait 600 >/dev/null
DLG=$(ev "document.querySelector('[role=\"alertdialog\"]')?.innerText ?? ''")
echo "$DLG" | rg -q "تأیید نهایی"; check $? "N5 UI step2: final confirmation reached"
ab screenshot $EV/n5-empty-step2-fa-1280.png >/dev/null
ab eval "[...document.querySelector('[role=\"alertdialog\"]').querySelectorAll('button')].find(b=>b.textContent.includes('سطل خالی شود')).click()" >/dev/null 2>&1
ab wait 1500 >/dev/null
TXT=$(ev "document.querySelector('main').innerText")
echo "$TXT" | rg -q "سطل خالی است"; check $? "N5 UI: explicit trash empty state after emptying"
ab screenshot $EV/n5-trash-empty-state-fa-1280.png >/dev/null
CODE_F=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 http://localhost:3000/api/notes/$F)
CODE_E=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 http://localhost:3000/api/notes/$E)
[ "$CODE_F" = "404" ] && [ "$CODE_E" = "404" ]; check $? "N5 API: empty-trash deleted F($CODE_F) and E($CODE_E) for real"
EMPTY2=$(curl -s --max-time 20 -X DELETE http://localhost:3000/api/trash)
echo "$EMPTY2" | rg -q '"deleted":0'; check $? "N5 API: empty trash idempotent on empty trash ($EMPTY2)"

# ---------- 8. N4 (en) — aria labels ----------
ab eval "[...document.querySelectorAll('header button, nav button')].find(b=>b.textContent.trim()==='EN').click()" >/dev/null 2>&1
ab wait 500 >/dev/null
ab eval "[...document.querySelectorAll('nav button')].find(b=>b.textContent.includes('Dashboard')).click()" >/dev/null 2>&1
ab wait 900 >/dev/null
TAG=$(ev "document.querySelector('[aria-label=\"Show favorites in the library\"]')?.tagName ?? 'MISSING'")
[ "$TAG" = "BUTTON" ]; check $? "N4 (en): aria labels localized ($TAG)"
ab screenshot $EV/n4-en-1280.png >/dev/null
ab eval "[...document.querySelectorAll('header button, nav button')].find(b=>b.textContent.trim()==='FA').click()" >/dev/null 2>&1

# ---------- 9. console errors + log ----------
CONSOLE=$(ab console 2>/dev/null | rg -ci "error" || true)
[ "${CONSOLE:-0}" = "0" ]; check $? "browser console: 0 errors"

echo ""
echo "================ RESULT: pass=$pass fail=$fail ================"
grep -v "prisma:query" dev.log | rg "⨯|Error|error" | head -8 || echo "dev.log: no compile/runtime errors"
