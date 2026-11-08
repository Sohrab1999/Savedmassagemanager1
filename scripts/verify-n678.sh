#!/bin/bash
# N6/N7/N8 verification — single-session: dev server + browser (demo mode, fa/en, 1280/390)
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

# ---------- 0. backend ----------
agent-browser close >/dev/null 2>&1
pkill -9 -f "next dev" 2>/dev/null; pkill -9 -f "next-server" 2>/dev/null; sleep 1
setsid nohup bun run dev > dev.log 2>&1 < /dev/null & disown
for i in $(seq 1 90); do curl -s -o /dev/null --max-time 2 http://localhost:3000/api/stats && break; sleep 1; done
DEV=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:3000/api/stats)
[ "$DEV" = "200" ]; check $? "dev server up (GET /api/stats = $DEV)"

# ---------- 1. seed + N6 corpus ----------
curl -s --max-time 30 -X POST http://localhost:3000/api/seed >/dev/null
post() { curl -s --max-time 20 -X POST http://localhost:3000/api/notes -H 'Content-Type: application/json' -d "$1" | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])'; }
R1=$(post '{"type":"text","title":"پروژه بازطراحی سایت","content":"یادداشت‌های جلسهٔ بازطراحی","tagNames":["پروژه-الفا"]}')
R2=$(post '{"type":"text","title":"چک‌لیست استقرار پروژه","content":"مراحل انتشار نهایی","tagNames":["پروژه-الفا"]}')
R3=$(post '{"type":"link","title":"راهنمای پروژه","url":"https://example.com/project-guide","tagNames":["پروژه-الفا"]}')
R4=$(post '{"type":"text","title":"یادداشت منزوی","content":"هیچ اشتراکی با هیچ آیتمی ندارد"}')
[ -n "$R1" ] && [ -n "$R2" ] && [ -n "$R3" ] && [ -n "$R4" ]; check $? "N6 corpus created (R1=$R1 R2=$R2 R3=$R3 R4=$R4)"

# ---------- 2. N6 API probe ----------
REL=$(curl -s --max-time 20 "http://localhost:3000/api/notes/$R1/related" | python3 -c '
import json,sys
items=json.load(sys.stdin)["items"]
titles=[i["title"] for i in items]
print(("OK " + "|".join(titles)) if titles==["چک‌لیست استقرار پروژه","راهنمای پروژه"] else "BAD "+ "|".join(titles))')
echo "$REL" | rg -q "^OK"; check $? "N6 API: related(R1) = [R2(score 4), R3(score 3)] exactly ($REL)"
REL4=$(curl -s --max-time 20 "http://localhost:3000/api/notes/$R4/related" | python3 -c 'import json,sys; print(len(json.load(sys.stdin)["items"]))')
[ "$REL4" = "0" ]; check $? "N6 API: isolated note R4 → 0 related"

# ---------- 3. N7 API probe ----------
RES=$(curl -s --max-time 20 "http://localhost:3000/api/resurface" | python3 -c '
import json,sys
items=json.load(sys.stdin)["items"]
ages=[( __import__("datetime").datetime.now() - __import__("datetime").datetime.fromisoformat(i["savedAt"].replace("Z","+00:00")).replace(tzinfo=None) ).days for i in items]
ok = len(items) >= 2 and all(a >= 30 for a in ages)
asc = ages == sorted(ages, reverse=True)
print("OK n=%d oldestFirst=%s" % (len(items), asc) if ok and asc else "BAD n=%d ages=%s" % (len(items), ages))')
echo "$RES" | rg -q "^OK"; check $? "N7 API: ≥2 candidates, all ≥30d, oldest-first ($RES)"

# ---------- 4. N8 static checks ----------
M=$(curl -s --max-time 20 -o /tmp/manifest.json -w '%{http_code}' http://localhost:3000/manifest.webmanifest)
[ "$M" = "200" ]; check $? "N8: GET /manifest.webmanifest → 200"
python3 -c '
import json
m=json.load(open("/tmp/manifest.json"))
assert m["display"]=="standalone" and m["start_url"]=="/" and len(m["icons"])>=3 and m["theme_color"]=="#0d9488"
print("manifest fields OK:", m["short_name"], "| icons:", len(m["icons"]))' ; check $? "N8: manifest valid (standalone + start_url + ≥3 icons + theme)"
for f in icon-192.png icon-512.png icon-maskable-512.png apple-touch-icon.png; do
  C=$(curl -s -o /dev/null -w '%{http_code} %{content_type}' --max-time 20 "http://localhost:3000/icons/$f")
  echo "$C" | rg -q "200 image/png"; check $? "N8: /icons/$f → $C"
done
S=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 http://localhost:3000/sw.js)
[ "$S" = "200" ]; check $? "N8: GET /sw.js → 200"

# ---------- 5. browser: demo mode (fa) ----------
ab open http://localhost:3000 >/dev/null 2>&1
ab wait --fn "document.readyState === 'complete'" --timeout 30000 >/dev/null 2>&1
ab eval "try{localStorage.clear()}catch(e){}" >/dev/null 2>&1
ab set viewport 1280 900 >/dev/null 2>&1
ab reload >/dev/null 2>&1
ab wait --fn "[...document.querySelectorAll('button')].some(b=>b.textContent.includes('ادامه در حالت'))" --timeout 30000 >/dev/null 2>&1
ab eval "[...document.querySelectorAll('button')].find(b=>b.textContent.includes('ادامه در حالت')).click()" >/dev/null 2>&1
ab wait --fn "document.querySelector('main') && document.querySelector('main').innerText.trim().length > 20" --timeout 30000 >/dev/null 2>&1
ab wait 1200 >/dev/null

# ---------- 6. N7 — resurfacing card ----------
HAS=$(ev "String(document.querySelector('main').innerText.includes('از ذخیره‌های قدیمی‌تان'))")
[ "$HAS" = "true" ]; check $? "N7 UI: resurfacing card visible with old candidate"
T1=$(ev "(()=>{const s=[...document.querySelectorAll('main section')].find(x=>x.getAttribute('aria-label')==='از ذخیره‌های قدیمی‌تان');return s?s.querySelector('button[aria-label^=\"باز کردن مورد\"] span span').textContent:'NONE'})()")
echo "$T1" | rg -q "."; check $? "N7 UI: candidate title rendered ($T1)"
ab screenshot $EV/n7-resurface-card-fa-1280.png >/dev/null
ab eval "[...document.querySelectorAll('main button')].find(b=>b.getAttribute('aria-label')==='نمایش آیتم قدیمی بعدی').click()" >/dev/null 2>&1
ab wait 600 >/dev/null
T2=$(ev "(()=>{const s=[...document.querySelectorAll('main section')].find(x=>x.getAttribute('aria-label')==='از ذخیره‌های قدیمی‌تان');return s?s.querySelector('button[aria-label^=\"باز کردن مورد\"] span span').textContent:'NONE'})()")
[ "$T1" != "$T2" ] && [ "$T2" != "NONE" ]; check $? "N7 UI: «یکی دیگر» cycles to a different candidate ($T1 → $T2)"
# click the item → sheet opens with that note
ab eval "[...document.querySelectorAll('main button')].find(b=>b.getAttribute('aria-label')==='باز کردن مورد: $T2').click()" >/dev/null 2>&1
ab wait 900 >/dev/null
SH=$(ev "document.querySelector('h2')?.innerText ?? ''")
[ "$SH" = "$T2" ]; check $? "N7 UI: clicking the candidate opens its sheet ($SH)"
METR=$(ev "JSON.parse(localStorage.getItem('savedbox.resurfaceMetrics')||'{\"impressions\":0,\"clicks\":0}').impressions + '/' + JSON.parse(localStorage.getItem('savedbox.resurfaceMetrics')||'{\"impressions\":0,\"clicks\":0}').clicks")
echo "$METR" | rg -q "^([2-9]|[0-9]{2,})/[1-9]"; check $? "N7 KPI: micro-events recorded impressions/clicks = $METR"
ab press Escape >/dev/null 2>&1
ab wait 500 >/dev/null
# negative case: no candidates → no card (trash the 2 old candidates via API, then restore)
OLDIDS=$(curl -s --max-time 20 "http://localhost:3000/api/resurface" | python3 -c 'import json,sys; print(json.dumps([i["id"] for i in json.load(sys.stdin)["items"]]))')
curl -s --max-time 20 -X POST http://localhost:3000/api/notes/bulk -H 'Content-Type: application/json' -d "{\"ids\":$OLDIDS,\"action\":\"delete\"}" >/dev/null
ab wait 3000 >/dev/null
HAS=$(ev "String(!![...document.querySelectorAll('main section')].find(x=>x.getAttribute('aria-label')==='از ذخیره‌های قدیمی‌تان'))")
[ "$HAS" = "false" ]; check $? "N7 DoD: card absent when no candidate exists (candidates trashed)"
curl -s --max-time 20 -X POST http://localhost:3000/api/notes/bulk -H 'Content-Type: application/json' -d "{\"ids\":$OLDIDS,\"action\":\"restore\"}" >/dev/null
ab wait 3000 >/dev/null
HAS=$(ev "String(!![...document.querySelectorAll('main section')].find(x=>x.getAttribute('aria-label')==='از ذخیره‌های قدیمی‌تان'))")
[ "$HAS" = "true" ]; check $? "N7 DoD: card returns after restore"

# ---------- 7. N6 — related notes in the sheet ----------
ab eval "[...document.querySelectorAll('nav button')].find(b=>b.textContent.includes('کتابخانه')).click()" >/dev/null 2>&1
ab wait 900 >/dev/null
ab eval "[...document.querySelectorAll('main [role=\"button\"]')].find(e=>(e.getAttribute('aria-label')||'').includes('پروژه بازطراحی سایت')).click()" >/dev/null 2>&1
ab wait 1200 >/dev/null
HAS=$(ev "String(document.body.innerText.includes('مرتبط‌ها'))")
[ "$HAS" = "true" ]; check $? "N6 UI: «مرتبط‌ها» section renders for a tagged note"
NOAI=$(ev "String(document.body.innerText.includes('بدون AI'))")
[ "$NOAI" = "true" ]; check $? "N6 DoD: honest «بدون AI» label present"
R2IN=$(ev "(()=>{const dlg=document.querySelector('[role=\"dialog\"]');return String(dlg?dlg.innerText.includes('چک‌لیست استقرار پروژه'):'NO-DIALOG')})()")
R3IN=$(ev "(()=>{const dlg=document.querySelector('[role=\"dialog\"]');return String(dlg?dlg.innerText.includes('راهنمای پروژه'):'NO-DIALOG')})()")
R4OUT=$(ev "(()=>{const dlg=document.querySelector('[role=\"dialog\"]');return String(dlg?dlg.innerText.includes('یادداشت منزوی'):'NO-DIALOG')})()")
[ "$R2IN" = "true" ] && [ "$R3IN" = "true" ]; check $? "N6 UI: R2 and R3 listed as related (sheet-scoped)"
[ "$R4OUT" = "false" ]; check $? "N6 UI: the isolated note is NOT suggested (sheet-scoped)"
ab screenshot $EV/n6-related-fa-1280.png >/dev/null
# click a related row → the sheet swaps to that note
ab eval "[...document.querySelectorAll('[role=\"dialog\"] button, [data-slot=\"sheet-content\"] button')].find(b=>(b.getAttribute('aria-label')||'').includes('چک‌لیست استقرار پروژه')).click()" >/dev/null 2>&1
ab wait 1000 >/dev/null
SH=$(ev "document.querySelector('h2')?.innerText ?? ''")
[ "$SH" = "چک‌لیست استقرار پروژه" ]; check $? "N6 DoD: clicking a related row opens THAT item's sheet ($SH)"
ab press Escape >/dev/null 2>&1
ab wait 500 >/dev/null
# isolated note → no section
ab eval "[...document.querySelectorAll('main [role=\"button\"]')].find(e=>(e.getAttribute('aria-label')||'').includes('یادداشت منزوی')).click()" >/dev/null 2>&1
ab wait 1200 >/dev/null
HAS=$(ev "String(document.body.innerText.includes('مرتبط‌ها'))")
[ "$HAS" = "false" ]; check $? "N6 DoD: isolated note → NO related section (single-item honesty)"
ab press Escape >/dev/null 2>&1
ab wait 500 >/dev/null

# ---------- 8. N7 — settings toggle (persistent) ----------
ab eval "[...document.querySelectorAll('nav button')].find(b=>b.textContent.includes('تنظیمات')).click()" >/dev/null 2>&1
ab wait 900 >/dev/null
HAS=$(ev "String(document.body.innerText.includes('بازکشف هفتگی'))")
[ "$HAS" = "true" ]; check $? "N7 UI: settings resurfacing card present"
ab eval "document.getElementById('resurface-toggle').click()" >/dev/null 2>&1
ab wait 500 >/dev/null
CHK=$(ev "String(document.getElementById('resurface-toggle').getAttribute('aria-checked') ?? document.getElementById('resurface-toggle').checked)")
[ "$CHK" = "false" ]; check $? "N7 UI: toggle switched off ($CHK)"
PERS=$(ev "localStorage.getItem('savedbox.resurface.enabled')")
[ "$PERS" = "0" ]; check $? "N7 DoD: off-state persisted to localStorage ($PERS)"
ab eval "[...document.querySelectorAll('nav button')].find(b=>b.textContent.includes('داشبورد')).click()" >/dev/null 2>&1
ab wait 900 >/dev/null
HAS=$(ev "String(!![...document.querySelectorAll('main section')].find(x=>x.getAttribute('aria-label')==='از ذخیره‌های قدیمی‌تان'))")
[ "$HAS" = "false" ]; check $? "N7 DoD: card hidden after toggle-off"
ab reload >/dev/null 2>&1
ab wait --fn "document.querySelector('main') && document.querySelector('main').innerText.trim().length > 20" --timeout 30000 >/dev/null 2>&1
ab wait 1200 >/dev/null
HAS=$(ev "String(!![...document.querySelectorAll('main section')].find(x=>x.getAttribute('aria-label')==='از ذخیره‌های قدیمی‌تان'))")
[ "$HAS" = "false" ]; check $? "N7 DoD: card still hidden after reload (persistent)"
ab eval "[...document.querySelectorAll('nav button')].find(b=>b.textContent.includes('تنظیمات')).click()" >/dev/null 2>&1
ab wait 900 >/dev/null
ab eval "document.getElementById('resurface-toggle').click()" >/dev/null 2>&1
ab wait 400 >/dev/null
ab screenshot $EV/n7-settings-fa-1280.png >/dev/null
ab eval "[...document.querySelectorAll('nav button')].find(b=>b.textContent.includes('داشبورد')).click()" >/dev/null 2>&1
ab wait 900 >/dev/null
HAS=$(ev "String(!![...document.querySelectorAll('main section')].find(x=>x.getAttribute('aria-label')==='از ذخیره‌های قدیمی‌تان'))")
[ "$HAS" = "true" ]; check $? "N7 DoD: card returns after toggle-on"

# ---------- 9. EN spot check ----------
ab eval "[...document.querySelectorAll('header button, nav button')].find(b=>b.textContent.trim()==='EN').click()" >/dev/null 2>&1
ab wait 600 >/dev/null
HAS=$(ev "String(document.body.innerText.includes('From your older saves'))")
[ "$HAS" = "true" ]; check $? "N7 (en): card title localized"
ab eval "[...document.querySelectorAll('header button, nav button')].find(b=>b.textContent.trim()==='FA').click()" >/dev/null 2>&1
ab wait 500 >/dev/null

# ---------- 10. N8 — browser-side PWA checks ----------
MAN=$(ev "String(!!document.querySelector('link[rel=\"manifest\"]'))")
[ "$MAN" = "true" ]; check $? "N8: <link rel=manifest> in head"
ab wait 1500 >/dev/null
SW=$(ev "navigator.serviceWorker.getRegistration().then(r=>String(r ? (r.active ? 'ACTIVE' : 'REGISTERING') : 'NONE'))")
ab wait 2000 >/dev/null
SW=$(ev "navigator.serviceWorker.getRegistration().then(r=>String(r ? (r.active ? 'ACTIVE' : 'REGISTERING') : 'NONE'))")
[ "$SW" = "ACTIVE" ]; check $? "N8: service worker registered and ACTIVE ($SW)"
MJ=$(ev "fetch('/manifest.webmanifest').then(r=>r.json()).then(m=>String(m.display==='standalone' && m.start_url==='/'))")
[ "$MJ" = "true" ]; check $? "N8: manifest fetchable from the page and valid"
ab screenshot $EV/n8-pwa-fa-1280.png >/dev/null

# ---------- 11. mobile 390 ----------
ab set viewport 390 844 >/dev/null 2>&1
ab wait 600 >/dev/null
ab screenshot $EV/n7-mobile-390.png >/dev/null
ab set viewport 1280 900 >/dev/null 2>&1

# ---------- 12. console + log ----------
CONSOLE=$(ab console 2>/dev/null | rg -ci "error" || true)
[ "${CONSOLE:-0}" = "0" ]; check $? "browser console: 0 errors"

echo ""
echo "================ RESULT: pass=$pass fail=$fail ================"
grep -v "prisma:query" dev.log | rg "⨯|Error|error" | head -8 || echo "dev.log: no compile/runtime errors"
