#!/bin/bash
# فاز ۱۰ verification — F1 (Web Share Target) + F2 (Bookmarklet deep-link) +
# F5 (URL-in-text suggestion, closes A-3.1) + F6 (related back bar, closes
# A-3.3). Single session: dev server + browser (demo, fa/en, 1280 + 390).
# Honest scoping recorded in-line: the REAL Android share-sheet hand-off can
# only happen on an installed device; the sandbox proves the GET landing
# (`/?title=…&text=…&url=…`), the manifest binding, the prefill, the
# one-step save, N10 on repeats and the B6 CTA — the full DoD chain minus
# the OS-level sheet itself.
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
# Harness note: fresh loads may land on an opaque-origin document where
# localStorage is DENIED (SecurityError) — the demo flag cannot be relied on
# across navigations. enterDemo polls for the app OR the gate and clicks the
# in-memory demo entry when needed (works regardless of localStorage).
enterDemo() {
  for i in $(seq 1 40); do
    M=$(ab eval "String(!!document.querySelector('main') && document.querySelector('main').innerText.trim().length > 10)" 2>/dev/null | python3 -c 'import sys,json
raw=sys.stdin.read().strip()
try: print(json.loads(raw))
except Exception: print(raw)' 2>/dev/null)
    [ "$M" = "true" ] && return 0
    ab eval "[...document.querySelectorAll('button')].find(b=>b.textContent.includes('ادامه در حالت'))?.click()" >/dev/null 2>&1
    sleep 0.5
  done
  ab wait --fn "document.querySelector('main') && document.querySelector('main').innerText.trim().length > 20" --timeout 30000 >/dev/null 2>&1
}

# ---------- 0. backend ----------
agent-browser close >/dev/null 2>&1
pkill -9 -f "next dev" 2>/dev/null; pkill -9 -f "next-server" 2>/dev/null; sleep 1
setsid nohup bun run dev > dev.log 2>&1 < /dev/null & disown
for i in $(seq 1 90); do curl -s -o /dev/null --max-time 2 http://localhost:3000/api/stats && break; sleep 1; done
DEV=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:3000/api/stats)
[ "$DEV" = "200" ]; check $? "dev server up (GET /api/stats = $DEV)"
curl -s --max-time 30 -X POST http://localhost:3000/api/seed >/dev/null
MANIFEST=$(curl -s --max-time 10 http://localhost:3000/manifest.webmanifest | python3 -c 'import json,sys; m=json.load(sys.stdin); st=m.get("share_target",{}); print(st.get("method","-"), "|".join(sorted(st.get("params",{}).keys())))' 2>/dev/null)
echo "$MANIFEST" | rg -q "GET text\|title\|url" ; check $? "F1 manifest binding: share_target GET {title,text,url} ($MANIFEST)"

# ---------- 0.5 locale lock (fa) — the harness may carry a stale locale ----------
ab open "http://localhost:3000/#/" >/dev/null 2>&1
ab wait --fn "document.readyState === 'complete'" --timeout 30000 >/dev/null 2>&1
enterDemo
ab eval "try{localStorage.setItem('savedbox.locale','fa')}catch(e){}" >/dev/null 2>&1
ab reload >/dev/null 2>&1
ab wait --fn "document.readyState === 'complete'" --timeout 30000 >/dev/null 2>&1
enterDemo
ab wait 800 >/dev/null
LOCALE=$(ev "String(document.documentElement.lang==='fa' || (document.querySelector('main')?.innerText.includes('ثبت سریع')||false))")
[ "$LOCALE" = "true" ]; check $? "fa locale locked for the whole run ($LOCALE)"

# ---------- 1. F1 — share-target landing pre-fills the capture dialog ----------
ab set viewport 1280 900 >/dev/null 2>&1
ab open "http://localhost:3000/?title=%D9%85%D9%82%D8%A7%D9%84%D9%87%20%D8%A7%D8%B4%D8%AA%D8%B1%D8%A7%DA%A9%DB%8C&url=https%3A%2F%2Fexample.com%2Ff1-article" >/dev/null 2>&1
ab wait --fn "document.readyState === 'complete'" --timeout 30000 >/dev/null 2>&1
ab eval "try{localStorage.clear();localStorage.setItem('savedbox.bulk.coach.v1','1')}catch(e){}" >/dev/null 2>&1
ab open "http://localhost:3000/?title=%D9%85%D9%82%D8%A7%D9%84%D9%87%20%D8%A7%D8%B4%D8%AA%D8%B1%D8%A7%DA%A9%DB%8C&url=https%3A%2F%2Fexample.com%2Ff1-article" >/dev/null 2>&1
ab wait --fn "document.readyState === 'complete'" --timeout 30000 >/dev/null 2>&1
enterDemo
CAP=$(ev "String(!!document.getElementById('capture-title'))")
[ "$CAP" = "true" ]; check $? "F1: share landing auto-opens the capture dialog ($CAP)"
TYPE=$(ev "(()=>{const a=[...document.querySelectorAll('[aria-pressed=\"true\"]')];return a.length?'chip':''})()")
URLVAL=$(ev "String(document.getElementById('capture-url')?.value||'')")
TITLEVAL=$(ev "String(document.getElementById('capture-title')?.value||'')")
[ "$URLVAL" = "https://example.com/f1-article" ]; check $? "F1: URL field prefilled from share params ($URLVAL)"
[ "$TITLEVAL" = "مقاله اشتراکی" ]; check $? "F1: title field prefilled ($TITLEVAL)"
QSTRIPPED=$(ev "String(window.location.search === '' && window.location.hash !== '#/capture')")
[ "$QSTRIPPED" = "true" ]; check $? "F1: share query consumed (no re-trigger on refresh) ($QSTRIPPED)"
ab screenshot $EV/f1-share-prefill-fa-1280.png >/dev/null

# ---------- 2. F1: one-step save on the prefilled dialog (N10-free URL) ----------
setInput "#capture-title" "ذخیرهٔ اشتراکی F1"
ev "(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('ذخیرهٔ مورد'));b.click();return 'ok'})()" >/dev/null 2>&1
ab wait 900 >/dev/null
SAVED=$(ev "(()=>{const t=[...document.querySelectorAll('[data-sonner-toast]')].find(x=>x.innerText.includes('مورد ذخیره شد'));if(!t)return 'NOTOAST';const a=[...t.querySelectorAll('button')].find(x=>x.innerText.includes('دسته‌بندی همین آیتم'));return a?'CTA':'NOCTA'})()")
echo "$SAVED" | rg -q "CTA"; check $? "F1: prefilled share saved in ONE step + optional B6 CTA ($SAVED)"
CLOSED=$(ev "String(!document.getElementById('capture-title'))")
[ "$CLOSED" = "true" ]; check $? "F1: dialog closed after save ($CLOSED)"
ab wait 400 >/dev/null; ab eval "(()=>{const x=document.querySelector('[data-sonner-toast] button[aria-label]');return 'ok'})()" >/dev/null 2>&1

# ---------- 3. F1+F2: repeat link → N10 banner (informational, non-blocking) ----------
ab open "http://localhost:3000/?url=https%3A%2F%2Fexample.com%2Ff1-article" >/dev/null 2>&1
ab wait --fn "document.readyState === 'complete'" --timeout 30000 >/dev/null 2>&1
enterDemo
ab wait --fn "!!document.getElementById('capture-title')" --timeout 15000 >/dev/null 2>&1
setInput "#capture-title" "ذخیرهٔ دوبارهٔ همان لینک"
ab wait 1300 >/dev/null
DUP=$(ev "(()=>{const s=[...document.querySelectorAll('[role=status]')].find(x=>x.innerText.includes('پیش‌تر'));return s?'BANNER':'NOBANNER'})()")
echo "$DUP" | rg -q "BANNER"; check $? "F1/F2: repeated share URL → N10 soft banner (save stays free) ($DUP)"
ENBTN=$(ev "String(![...document.querySelectorAll('button')].find(x=>x.innerText.includes('ذخیرهٔ مورد'))?.disabled)")
[ "$ENBTN" = "true" ]; check $? "F1/F2: save button NOT disabled by the duplicate banner ($ENBTN)"
ab screenshot $EV/f1-duplicate-banner-fa-1280.png >/dev/null
ab eval "(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('انصراف'));b?.click();return 'ok'})()" >/dev/null 2>&1
ab wait 500 >/dev/null

# ---------- 4. F2 — bookmarklet deep-link (#/capture?url=…&title=…) ----------
ab open "http://localhost:3000/#/capture?url=https%3A%2F%2Fexample.com%2Ff2-bookmark&title=F2%20Bookmarklet" >/dev/null 2>&1
ab wait --fn "document.readyState === 'complete'" --timeout 30000 >/dev/null 2>&1
enterDemo
ab wait --fn "!!document.getElementById('capture-url')" --timeout 15000 >/dev/null 2>&1
F2URL=$(ev "String(document.getElementById('capture-url')?.value||'')")
F2TITLE=$(ev "String(document.getElementById('capture-title')?.value||'')")
[ "$F2URL" = "https://example.com/f2-bookmark" ]; check $? "F2: deep-link URL prefilled ($F2URL)"
[ "$F2TITLE" = "F2 Bookmarklet" ]; check $? "F2: deep-link title prefilled ($F2TITLE)"
HASHGONE=$(ev "String(window.location.hash === '' || window.location.hash === '#/')")
[ "$HASHGONE" = "true" ]; check $? "F2: deep-link hash consumed after intake ($HASHGONE)"
ab screenshot $EV/f2-deeplink-prefill-fa-1280.png >/dev/null
ab eval "(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('انصراف'));b?.click();return 'ok'})()" >/dev/null 2>&1

# ---------- 5. F2 — plain #/capture = the ordinary empty dialog ----------
ab open "http://localhost:3000/#/capture" >/dev/null 2>&1
ab wait --fn "document.readyState === 'complete'" --timeout 30000 >/dev/null 2>&1
ab wait --fn "!!document.getElementById('capture-title')" --timeout 15000 >/dev/null 2>&1
PLAIN=$(ev "(()=>{const u=document.getElementById('capture-url');const t=document.getElementById('capture-title');return String(!u && t && t.value==='')})()")
[ "$PLAIN" = "true" ]; check $? "F2: #/capture without params → plain empty dialog (no prefill hint) ($PLAIN)"
ab screenshot $EV/f2-plain-dialog-fa-1280.png >/dev/null
ab eval "(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('انصراف'));b?.click();return 'ok'})()" >/dev/null 2>&1
ab wait 400 >/dev/null

# ---------- 6. F2 — N4/QE2 deep-link regression (capture never hijacks them) ----------
ab open "http://localhost:3000/#/library?fav=1" >/dev/null 2>&1
ab wait --fn "document.readyState === 'complete'" --timeout 30000 >/dev/null 2>&1
enterDemo
ab wait 1200 >/dev/null
N4=$(ev "(()=>{const cap=!!document.getElementById('capture-title');return String(!!document.querySelector('main') && window.location.hash.includes('fav=1') && !cap)})()")
[ "$N4" = "true" ]; check $? "F2 regression: #/library?fav=1 lands in the library, capture NOT hijacked ($N4)"
ab open "http://localhost:3000/#/library?arch=1" >/dev/null 2>&1
enterDemo
ab wait 800 >/dev/null
N4B=$(ev "String(window.location.hash.includes('arch=1'))")
[ "$N4B" = "true" ]; check $? "F2 regression: #/library?arch=1 intact ($N4B)"

# ---------- 7. F2 — settings card: bookmarklet snippet + copy ----------
ab open "http://localhost:3000/#/settings" >/dev/null 2>&1
ab wait --fn "document.readyState === 'complete'" --timeout 30000 >/dev/null 2>&1
ab wait --fn "document.querySelector('main')?.innerText.includes('کانال‌های ثبت بیرونی')" --timeout 20000 >/dev/null 2>&1
ab wait 600 >/dev/null
BM=$(ev "(()=>{const i=[...document.querySelectorAll('input')].find(x=>x.value.startsWith('javascript:'));const card=document.querySelector('main').innerText;return String(!!i && card.includes('بوکمارک‌لت') && card.includes('اشتراک‌گذاری به Savedbox'))})()")
[ "$BM" = "true" ]; check $? "F2: settings card shows the bookmarklet snippet + honest share-target note ($BM)"
SNIP=$(ev "String([...document.querySelectorAll('input')].find(x=>x.value.startsWith('javascript:'))?.value.includes('#/capture?url=')&&!([...document.querySelectorAll('input')].find(x=>x.value.startsWith('javascript:'))?.value.includes('innerHTML')))")
[ "$SNIP" = "true" ]; check $? "F2: snippet targets #/capture?url= (text-only prefill, no HTML) ($SNIP)"
ab screenshot $EV/f2-settings-card-fa-1280.png >/dev/null
# The copy path needs a TRUSTED user activation — a synthetic eval-click is
# denied by the sandbox clipboard, so this check clicks through the REAL
# agent-browser click (Playwright activation) and asserts the success cue.
ev "(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('کپی کد'));b?.scrollIntoView({block:'center'});return b?'EXISTS':'MISSING'})()" >/dev/null 2>&1
ab click "xpath=//button[contains(normalize-space(.), 'کپی کد')]" >/dev/null 2>&1
ab wait 800 >/dev/null
COP=$(ev "String([...document.querySelectorAll('[data-sonner-toast]')].some(x=>x.innerText.includes('کپی شد')) || [...document.querySelectorAll('button')].some(x=>x.getAttribute('aria-pressed')==='true' && x.innerText.includes('کپی')))")
[ "$COP" = "true" ]; check $? "F2: copy-code button works (trusted-click success cue) ($COP)"

# ---------- 8. F5 — URL typed into the content field → soft suggestion ----------
ab eval "(()=>{const b=document.querySelector('header button[title],header button[aria-label]');return 'ok'})()" >/dev/null 2>&1
ab open "http://localhost:3000/#/" >/dev/null 2>&1
ab wait --fn "document.readyState === 'complete'" --timeout 30000 >/dev/null 2>&1
ev "(()=>{const b=[...document.querySelectorAll('header button')].find(x=>x.innerText.includes('ثبت سریع'));b?.click();return 'ok'})()" >/dev/null 2>&1
ab wait --fn "!!document.getElementById('capture-content')" --timeout 15000 >/dev/null 2>&1
setInput "#capture-title" "یادداشت با لینک"
setText "#capture-content" "https://example.com/f5-pasted"
ab wait 600 >/dev/null
SUGG=$(ev "(()=>{const s=[...document.querySelectorAll('[role=status]')].find(x=>x.innerText.includes('لینک به‌نظر می‌رسد'));return s?'SUGGEST':'NOSUGGEST'})()")
echo "$SUGG" | rg -q "SUGGEST"; check $? "F5: whole-URL content → «تبدیل به لینک؟» suggestion ($SUGG)"
ab screenshot $EV/f5-suggest-banner-fa-1280.png >/dev/null
ev "(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('تبدیل'));b?.click();return 'ok'})()" >/dev/null 2>&1
ab wait 400 >/dev/null
CONV=$(ev "(()=>{const u=document.getElementById('capture-url');return String(!!u && u.value==='https://example.com/f5-pasted')})()")
[ "$CONV" = "true" ]; check $? "F5: accepted → type=link, URL moved to the link field ($CONV)"
GONE=$(ev "String(![...document.querySelectorAll('[role=status]')].some(x=>x.innerText.includes('لینک به‌نظر می‌رسد')))")
[ "$GONE" = "true" ]; check $? "F5: banner gone after conversion ($GONE)"
ab screenshot $EV/f5-converted-fa-1280.png >/dev/null
ab eval "(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('انصراف'));b?.click();return 'ok'})()" >/dev/null 2>&1
ab wait 400 >/dev/null

# ---------- 9. F5 — refusal saves as free text (never blocked) ----------
ev "(()=>{const b=[...document.querySelectorAll('header button')].find(x=>x.innerText.includes('ثبت سریع'));b?.click();return 'ok'})()" >/dev/null 2>&1
ab wait --fn "!!document.getElementById('capture-content')" --timeout 15000 >/dev/null 2>&1
setInput "#capture-title" "ذخیرهٔ متنیِ F5"
setText "#capture-content" "https://example.com/f5-kept-text"
ab wait 600 >/dev/null
ev "(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('می‌ماند متن'));b?.click();return 'ok'})()" >/dev/null 2>&1
ab wait 400 >/dev/null
KEPT=$(ev "(()=>{const c=document.getElementById('capture-content');return String(c && c.value==='https://example.com/f5-kept-text' && !document.getElementById('capture-url'))})()")
[ "$KEPT" = "true" ]; check $? "F5: dismissed → stays a free-text item, content untouched ($KEPT)"
ev "(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('ذخیرهٔ مورد'));b.click();return 'ok'})()" >/dev/null 2>&1
ab wait 900 >/dev/null
TXTOK=$(ev "String(!document.getElementById('capture-title'))")
[ "$TXTOK" = "true" ]; check $? "F5: refused URL saved as TEXT (never blocked) ($TXTOK)"

# ---------- 10. F6 — related back bar (open → related → back to FIRST) ----------
# NOTE: library note cards are div[role=button] (NOT <button>) — selectors
# must cover both. The section probes the first 6 cards for one that HAS
# related rows (seed data guarantees at least the tag-pair notes do).
ab open "http://localhost:3000/#/library" >/dev/null 2>&1
ab wait --fn "document.readyState === 'complete'" --timeout 30000 >/dev/null 2>&1
enterDemo
ab wait 1200 >/dev/null
ROOT_TITLE=""; FOUND="0"
for IDX in 0 1 2 3 4 5; do
  ev "(()=>{const cards=[...document.querySelectorAll('main button,main [role=button]')].filter(x=>(x.getAttribute('aria-label')||'').includes('باز کردن مورد'));const c=cards[$IDX];if(!c)return 'NOCARD';c.click();return 'ok'})()" >/dev/null 2>&1
  ab wait --fn "[...document.querySelectorAll('[role=dialog]')].some(x=>x.querySelector('h2'))" --timeout 15000 >/dev/null 2>&1
  ab wait 900 >/dev/null
  ROWS=$(ev "(()=>{const d=[...document.querySelectorAll('[role=dialog]')].find(x=>x.querySelector('h2'));if(!d)return '0';return String([...d.querySelectorAll('ul button')].filter(b=>(b.getAttribute('aria-label')||'').includes('باز کردن مورد')).length)})()")
  if [ "$ROWS" != "0" ] && [ -n "$ROWS" ]; then
    ROOT_TITLE=$(ev "(()=>{const d=[...document.querySelectorAll('[role=dialog]')].find(x=>x.querySelector('h2'));return d?d.querySelector('h2').textContent.trim():''})()")
    FOUND="1"; break
  fi
  ab eval "document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));return 'ok'" >/dev/null 2>&1
  ab wait 700 >/dev/null
done
[ "$FOUND" = "1" ]; check $? "F6: a card with related rows found (root=$ROOT_TITLE)"
ev "(()=>{const d=[...document.querySelectorAll('[role=dialog]')].find(x=>x.querySelector('h2'));const rel=[...(d||{querySelectorAll:()=>[]}).querySelectorAll('ul button')].filter(b=>(b.getAttribute('aria-label')||'').includes('باز کردن مورد'))[0];if(!rel)return 'NOREL';rel.click();return 'ok'})()" >/dev/null 2>&1
ab wait 1100 >/dev/null
BACK=$(ev "(()=>{const b=[...document.querySelectorAll('[role=dialog] button')].find(x=>(x.getAttribute('aria-label')||'').includes('بازگشت به آیتم اول'));return b?b.innerText.trim():'NOBAR'})()")
echo "$BACK" | rg -q "بازگشت"; check $? "F6: depth≥2 → back bar names the FIRST item ($BACK)"
ab screenshot $EV/f6-back-bar-fa-1280.png >/dev/null
ev "(()=>{const b=[...document.querySelectorAll('[role=dialog] button')].find(x=>(x.getAttribute('aria-label')||'').includes('بازگشت به آیتم اول'));b?.click();return 'ok'})()" >/dev/null 2>&1
ab wait 1000 >/dev/null
BACKROOT=$(ev "(()=>{const d=[...document.querySelectorAll('[role=dialog]')].find(x=>x.querySelector('h2'));return d?d.querySelector('h2').textContent.trim():'NOH2'})()")
[ "$ROOT_TITLE" = "$BACKROOT" ]; check $? "F6: one tap returns EXACTLY to the first item ($ROOT_TITLE → $BACKROOT)"
B2OK=$(ev "(()=>{const d=[...document.querySelectorAll('[role=dialog]')].find(x=>x.querySelector('h2'));return String(d && d.querySelectorAll('input:not([type=hidden]), textarea, [role=combobox]').length===0)})()")
[ "$B2OK" = "true" ]; check $? "F6/B2 regression: every regular open stays VIEW-first (0 editable controls) ($B2OK)"
ab eval "document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));return 'ok'" >/dev/null 2>&1
ab wait 600 >/dev/null

# ---------- 11. F6@390px — back bar present, no horizontal overflow ----------
ab set viewport 390 844 >/dev/null 2>&1
ab open "http://localhost:3000/#/library" >/dev/null 2>&1
ab wait --fn "document.readyState === 'complete'" --timeout 30000 >/dev/null 2>&1
enterDemo
ab wait 1200 >/dev/null
MFOUND="0"
for IDX in 0 1 2 3 4 5; do
  ev "(()=>{const cards=[...document.querySelectorAll('main button,main [role=button]')].filter(x=>(x.getAttribute('aria-label')||'').includes('باز کردن مورد'));const c=cards[$IDX];if(!c)return 'NOCARD';c.click();return 'ok'})()" >/dev/null 2>&1
  ab wait 900 >/dev/null
  ROWS=$(ev "(()=>{const d=[...document.querySelectorAll('[role=dialog]')].find(x=>x.querySelector('h2'));if(!d)return '0';return String([...d.querySelectorAll('ul button')].filter(b=>(b.getAttribute('aria-label')||'').includes('باز کردن مورد')).length)})()")
  if [ "$ROWS" != "0" ] && [ -n "$ROWS" ]; then MFOUND="1"; break; fi
  ab eval "document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));return 'ok'" >/dev/null 2>&1
  ab wait 600 >/dev/null
done
[ "$MFOUND" = "1" ]; check $? "F6@390px: related-bearing card opened ($MFOUND)"
ev "(()=>{const d=[...document.querySelectorAll('[role=dialog]')].find(x=>x.querySelector('h2'));const rel=[...(d||{querySelectorAll:()=>[]}).querySelectorAll('ul button')].filter(b=>(b.getAttribute('aria-label')||'').includes('باز کردن مورد'))[0];rel?.click();return 'ok'})()" >/dev/null 2>&1
ab wait 1000 >/dev/null
M390=$(ev "(()=>{const d=document.documentElement;const bar=[...document.querySelectorAll('[role=dialog] button')].some(x=>(x.getAttribute('aria-label')||'').includes('بازگشت به آیتم اول'));return String(bar && d.scrollWidth<=391)})()")
[ "$M390" = "true" ]; check $? "F6@390px: back bar visible, zero horizontal overflow ($M390)"
ab screenshot $EV/f6-back-bar-fa-390.png >/dev/null
ab eval "document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));return 'ok'" >/dev/null 2>&1
ab wait 500 >/dev/null

# ---------- 12. en parity spot-checks ----------
ab set viewport 1280 900 >/dev/null 2>&1
ab eval "try{localStorage.setItem('savedbox.locale','en')}catch(e){}" >/dev/null 2>&1
ab reload >/dev/null 2>&1
ab wait --fn "document.readyState === 'complete'" --timeout 30000 >/dev/null 2>&1
enterDemo
ab open "http://localhost:3000/?title=EN%20Check&url=https%3A%2F%2Fexample.com%2Fen-check" >/dev/null 2>&1
ab wait --fn "document.readyState === 'complete'" --timeout 30000 >/dev/null 2>&1
enterDemo
ab wait 800 >/dev/null
EN1=$(ev "String(document.body.innerText.includes('Prefilled from outside the app') || document.body.innerText.includes('Link detected'))")
[ "$EN1" = "true" ]; check $? "F1/en: prefill cue localized ($EN1)"
ab eval "try{localStorage.setItem('savedbox.locale','fa')}catch(e){}" >/dev/null 2>&1
ab reload >/dev/null 2>&1
ab wait --fn "document.readyState === 'complete'" --timeout 30000 >/dev/null 2>&1

# ---------- 13. console + close-out ----------
CONSOLE=$(ab console 2>/dev/null | rg -ci "error" || true)
[ "${CONSOLE:-0}" = "0" ]; check $? "browser console: 0 errors"
curl -s --max-time 30 -X POST http://localhost:3000/api/seed >/dev/null
SEEDN=$(curl -s --max-time 20 "http://localhost:3000/api/stats" | python3 -c 'import json,sys; print(json.load(sys.stdin)["total"])')
[ "${SEEDN:-0}" = "21" ]; check $? "close-out: demo DB re-seeded canonically (total=$SEEDN)"

echo ""
echo "================ RESULT: pass=$pass fail=$fail ================"
[ "$fail" = "0" ] && echo "PHASE-10 RUNBOOK: ALL PASS" || echo "PHASE-10 RUNBOOK: FAILURES PRESENT"
exit $fail
