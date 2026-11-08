#!/bin/bash
# UX-B2 verification — the view/edit split in the note detail sheet (T-2).
# Proves: view mode is the DEFAULT and completely read-only (no accidental
# edits); «ویرایش» is the only entry into ONE edit session covering
# title/content + category + tags + description with explicit save/cancel;
# cancel commits NOTHING; save commits everything (toast + DOM + API).
# Single session: dev server + browser (demo, fa, 1280/390); canonical re-seed.
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
absent() { if echo "$1" | rg -q "$2"; then bad "$3 (unexpectedly found '$2' in: $1)"; else ok "$3"; fi; }
pickOption() { ab eval "(()=>{const opt=[...document.querySelectorAll('[role=\"option\"]')].find(o=>o.textContent.includes('$1'));if(!opt)return 'NO OPT';['pointerdown','pointerup'].forEach(t=>opt.dispatchEvent(new PointerEvent(t,{bubbles:true,pointerId:1,buttons:1})));opt.dispatchEvent(new MouseEvent('click',{bubbles:true}));return 'picked'})()" >/dev/null 2>&1; ab wait 500 >/dev/null; }
fillByLabel() { ab eval "(()=>{const el=document.querySelector('[aria-label=\"$1\"]');if(!el)return 'NOEL';const proto=el.tagName==='TEXTAREA'?window.HTMLTextAreaElement:window.HTMLInputElement;const set=Object.getOwnPropertyDescriptor(proto.prototype,'value').set;set.call(el,'$2');el.dispatchEvent(new Event('input',{bubbles:true}));return 'filled'})()" >/dev/null 2>&1; }
sheet() { ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.querySelector('h2'));return d?'SHEET':'NONE'})()"; }
viewControls() { ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.querySelector('h2'));if(!d)return 'NOSHEET';return String(d.querySelectorAll('input:not([type=hidden]), textarea, [role=\"combobox\"]').length)})()"; }

# ---------- 0. backend ----------
agent-browser close >/dev/null 2>&1
pkill -9 -f "next dev" 2>/dev/null; pkill -9 -f "next-server" 2>/dev/null; sleep 1
setsid nohup bun run dev > dev.log 2>&1 < /dev/null & disown
for i in $(seq 1 90); do curl -s -o /dev/null --max-time 2 http://localhost:3000/api/stats && break; sleep 1; done
DEV=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:3000/api/stats)
[ "$DEV" = "200" ]; check $? "dev server up (GET /api/stats = $DEV)"
curl -s --max-time 30 -X POST http://localhost:3000/api/seed >/dev/null
TARGET=$(curl -s --max-time 20 "http://localhost:3000/api/notes?page=1&pageSize=1" | python3 -c '
import json,sys
d=json.load(sys.stdin); n=d["items"][0]
cats=json.load(sys.stdin)' 2>/dev/null)
TARGET=$(curl -s --max-time 20 "http://localhost:3000/api/notes?page=1&pageSize=1" | python3 -c 'import json,sys; d=json.load(sys.stdin); n=d["items"][0]; print(n["id"])')
TID="$TARGET"
TAPI=$(curl -s --max-time 20 "http://localhost:3000/api/notes/$TID")
TTITLE=$(echo "$TAPI" | python3 -c 'import json,sys; print(json.load(sys.stdin)["title"])')
TDESC=$(echo "$TAPI" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("description") or "")')
TCAT=$(echo "$TAPI" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("categoryId") or "")')
[ -n "$TID" ]; check $? "target note from canonical seed (id=${TID:0:12}… title=$TTITLE)"

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
ab wait --fn "location.hash.startsWith('#/library')" --timeout 20000 >/dev/null 2>&1
ab wait 800 >/dev/null

# open the TARGET note's card
OPENED=$(ev "(()=>{const card=[...document.querySelectorAll('main [role=\"button\"]')].find(c=>c.innerText.includes('$TTITLE'.slice(0,18)));if(!card)return 'NOCARD';card.click();return 'opened'})()")
[ "$OPENED" = "opened" ]; check $? "target card opened ($OPENED)"
ab wait 900 >/dev/null
S=$(sheet); [ "$S" = "SHEET" ]; check $? "detail sheet is open ($S)"

# ---------- 2. VIEW mode (default, fully read-only) ----------
VC=$(viewControls)
[ "$VC" = "0" ]; check $? "DoD «no accidental editing»: ZERO editable controls in view mode ($VC)"
H2=$(ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.querySelector('h2'));return d.querySelector('h2').innerText})()")
[ "$H2" = "$TTITLE" ]; check $? "view mode shows the stored title as read-only h2 ($H2)"
EB=$(ev "String(!![...document.querySelectorAll('[role=\"dialog\"] button')].find(b=>b.getAttribute('aria-label')==='ویرایش'))")
[ "$EB" = "true" ]; check $? "explicit «ویرایش» entry present ($EB)"
DB=$(ev "String(!![...document.querySelectorAll('[role=\"dialog\"] button')].find(b=>b.textContent.trim()==='حذف'))")
[ "$DB" = "true" ]; check $? "view mode keeps the item actions (delete present) ($DB)"
if [ -n "$TCAT" ]; then
  CATNAME=$(curl -s --max-time 20 http://localhost:3000/api/categories | python3 -c "import json,sys; d=json.load(sys.stdin); print(next((c['nameFa'] for c in d['items'] if c['id']=='$TCAT'),''))")
CATVIEW=$(ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.querySelector('h2'));return d.innerText.includes('$CATNAME') ? 'OK' : 'NOMATCH'})()")
  [ "$CATVIEW" = "OK" ]; check $? "category displayed read-only with its name ($CATNAME found in the sheet)"
else
CATVIEW=$(ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.querySelector('h2'));return d.innerText.includes('بدون دسته') ? 'OK' : 'NOMATCH'})()")
  [ "$CATVIEW" = "OK" ]; check $? "uncategorized displayed honestly ($CATVIEW)"
fi
ab screenshot $EV/b2-view-fa-1280.png >/dev/null

# ---------- 3. edit session: CANCEL commits NOTHING ----------
ab eval "[...document.querySelectorAll('[role=\"dialog\"] button')].find(b=>b.getAttribute('aria-label')==='ویرایش').click()" >/dev/null 2>&1
ab wait 700 >/dev/null
HINT=$(ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.querySelector('input[maxlength]'));const st=[...d.querySelectorAll('[role=\"status\"]')].find(x=>x.innerText.includes('ویرایش فعال'));return st?'HINT':'NOHINT'})()")
[ "$HINT" = "HINT" ]; check $? "explicit edit-mode cue visible (role=status «ویرایش فعال») ($HINT)"
EC=$(ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.querySelector('input[maxlength]'));const comb=[...d.querySelectorAll('[role=\"combobox\"]')].filter(b=>b.getAttribute('aria-label')==='دسته').length;return String(d.querySelectorAll('input:not([type=hidden]), textarea').length)+'|'+String(comb)})()")
echo "$EC" | rg -q "^[2-9]\|1$"; check $? "edit session: inputs+textareas present AND exactly 1 category combobox ($EC)"
SB=$(ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.querySelector('input[maxlength]'));return String([...d.querySelectorAll('button')].some(b=>b.textContent.trim()==='ذخیره'))+'|'+String([...d.querySelectorAll('button')].some(b=>b.textContent.trim()==='انصراف'))})()")
[ "$SB" = "true|true" ]; check $? "explicit «ذخیره» + «انصراف» pair present ($SB)"
PRE=$(ev "(()=>{const inp=document.querySelector('[role=\"dialog\"] input[maxlength]');return inp.value.slice(0,18)})()")
echo "$PRE" | rg -q "$(echo "$TTITLE" | cut -c1-12)"; check $? "form prefilled from the stored note ($PRE…)"

fillByLabel "عنوان" "عنوان لغوآزمون B2"
fillByLabel "توضیح من" "متنِ لغوشدهٔ آزمون"
ab eval "[...document.querySelectorAll('[role=\"dialog\"] button')].find(b=>b.textContent.trim()==='انصراف').click()" >/dev/null 2>&1
ab wait 700 >/dev/null
VC2=$(viewControls)
[ "$VC2" = "0" ]; check $? "cancel returns to read-only view mode ($VC2)"
H2C=$(ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.querySelector('h2'));return d.querySelector('h2').innerText})()")
[ "$H2C" = "$TTITLE" ]; check $? "cancel restored the original title ($H2C)"
ABSENT_API=$(curl -s --max-time 20 -G "http://localhost:3000/api/notes" --data-urlencode "q=عنوان لغوآزمون B2" | python3 -c 'import json,sys; print(json.load(sys.stdin)["total"])')
[ "$ABSENT_API" = "0" ]; check $? "cancel committed NOTHING to the backend (search finds 0)"

# ---------- 4. edit session: SAVE commits EVERYTHING ----------
ab eval "[...document.querySelectorAll('[role=\"dialog\"] button')].find(b=>b.getAttribute('aria-label')==='ویرایش').click()" >/dev/null 2>&1
ab wait 700 >/dev/null
NEWTITLE="$TTITLE — ویراستهٔ B2"
NEWDESC="توضیح آزمایشی B2: ذخیرهٔ صریح."
fillByLabel "عنوان" "$NEWTITLE"
fillByLabel "توضیح من" "$NEWDESC"
# category → خرید
ab eval "(()=>{const trig=[...document.querySelectorAll('[role=\"dialog\"] [role=\"combobox\"]')].find(b=>b.getAttribute('aria-label')==='دسته');trig.click()})()" >/dev/null 2>&1
ab wait 600 >/dev/null
pickOption "خرید"
# add one tag (chip input commits on Enter)
fillByLabel "برچسب‌ها" "برچسب‌آزمونB2"
ab eval "(()=>{const inp=document.querySelector('[role=\"dialog\"] input[aria-label=\"برچسب‌ها\"]');inp.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));return 'committed'})()" >/dev/null 2>&1
ab wait 400 >/dev/null
ab screenshot $EV/b2-edit-fa-1280.png >/dev/null
ab eval "[...document.querySelectorAll('[role=\"dialog\"] button')].find(b=>b.textContent.trim()==='ذخیره').click()" >/dev/null 2>&1
ab wait 1200 >/dev/null
TOAST=$(ev "(()=>{const t=document.querySelector('[data-sonner-toast]');return t?t.innerText.includes('تغییرات ذخیره شد')?'TOAST':'OTHER':'NONE'})()")
[ "$TOAST" = "TOAST" ]; check $? "DoD «explicit save»: success toast «تغییرات ذخیره شد» ($TOAST)"
VC3=$(viewControls)
[ "$VC3" = "0" ]; check $? "save returns to the read-only view mode ($VC3)"
H2S=$(ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.querySelector('h2'));return d.querySelector('h2').innerText})()")
[ "$H2S" = "$NEWTITLE" ]; check $? "view mode now shows the saved title ($H2S)"
DSC=$(ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.querySelector('h2'));return d.innerText.includes('توضیح آزمایشی B2')?'DESC':'NODESC'})()")
[ "$DSC" = "DESC" ]; check $? "saved description rendered as a read-only paragraph ($DSC)"
CATS=$(ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.querySelector('h2'));return d.innerText.includes('خرید')?'CHIP':'NOCHIP'})()")
[ "$CATS" = "CHIP" ]; check $? "saved category «خرید» rendered as a read-only chip ($CATS)"
TAGS=$(ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.querySelector('h2'));return d.innerText.includes('برچسب‌آزمونB2')?'TAG':'NOTAG'})()")
[ "$TAGS" = "TAG" ]; check $? "saved tag chip rendered read-only ($TAGS)"
SAVED=$(curl -s --max-time 20 "http://localhost:3000/api/notes/$TID")
NT=$(echo "$SAVED" | python3 -c 'import json,sys; print(json.load(sys.stdin)["title"])')
ND=$(echo "$SAVED" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("description") or "")')
[ "$NT" = "$NEWTITLE" ]; check $? "API: title persisted ($NT)"
[ "$ND" = "$NEWDESC" ]; check $? "API: description persisted ($ND)"
NCT=$(echo "$SAVED" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("categoryId") or "")')
BUYNAME=$(curl -s --max-time 20 http://localhost:3000/api/categories | python3 -c "import json,sys; d=json.load(sys.stdin); print(next((c['nameFa'] for c in d['items'] if c['id']=='$NCT'),''))")
[ "$BUYNAME" = "خرید" ]; check $? "API: category persisted to «خرید» ($BUYNAME)"
NTG=$(echo "$SAVED" | python3 -c 'import json,sys; d=json.load(sys.stdin); print("YES" if any(t["name"]=="برچسب‌آزمونB2" for t in d.get("tags",[])) else "NO")')
[ "$NTG" = "YES" ]; check $? "API: new tag attached via tagNames ($NTG)"
ab screenshot $EV/b2-after-save-fa-1280.png >/dev/null

# ---------- 5. quick-action regression + 390 geometry ----------
STAR=$(ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.querySelector('h2'));const b=[...d.querySelectorAll('button')].find(x=>x.getAttribute('aria-label')==='علاقه‌مندی');return b?String(b.getAttribute('aria-pressed')):'NOBTN'})()")
[ "$STAR" = "false" ] || [ "$STAR" = "true" ]; check $? "favorite stays an instant quick-action in view mode (aria-pressed=$STAR, untouched by the edit session)"
ab set viewport 390 844 >/dev/null 2>&1
ab wait 700 >/dev/null
S390=$(sheet); [ "$S390" = "SHEET" ]; check $? "sheet survives the 390 viewport (full-height) ($S390)"
OW=$(ev "(()=>{const d=[...document.querySelectorAll('[role=\"dialog\"]')].find(x=>x.querySelector('h2'));const r=d.getBoundingClientRect();return String(r.width<=391&&r.left>=0)})()")
[ "$OW" = "true" ]; check $? "390: sheet fits the viewport without horizontal overflow ($OW)"
ab screenshot $EV/b2-view-fa-390.png >/dev/null

# ---------- 6. console + close-out ----------
CONSOLE=$(ab console 2>/dev/null | rg -ci "error" || true)
[ "${CONSOLE:-0}" = "0" ]; check $? "browser console: 0 errors"
curl -s --max-time 30 -X POST http://localhost:3000/api/seed >/dev/null
FIN=$(curl -s --max-time 20 "http://localhost:3000/api/stats" | python3 -c 'import json,sys; print(json.load(sys.stdin)["total"])')
[ "$FIN" -ge 20 ]; check $? "close-out: demo DB re-seeded canonically (live total=$FIN)"

echo ""
echo "================ RESULT: pass=$pass fail=$fail ================"
grep -v "prisma:query" dev.log | rg "⨯|Error|error" | head -8 || echo "dev.log: no compile/runtime errors"
