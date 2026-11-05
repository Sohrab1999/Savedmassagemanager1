#!/bin/bash
# TeleVault E2E verification — scenarios 1-10 (single-session: emulators + dev server + browser)
cd /home/z/my-project
mkdir -p /tmp/e2e && rm -f /tmp/e2e/*.png

pass=0; fail=0
ok()   { pass=$((pass+1)); echo "  ✔ $1"; }
bad()  { fail=$((fail+1)); echo "  ✘ $1"; }
check() { if [ "$1" = "0" ]; then ok "$2"; else bad "$2"; fi; }

# ---------- 0. Backends ----------
pkill -9 -f java 2>/dev/null; pkill -9 -f "firebase" 2>/dev/null; pkill -9 -f "next-server" 2>/dev/null; pkill -9 -f "next dev" 2>/dev/null; agent-browser close >/dev/null 2>&1; sleep 1
setsid nohup ./node_modules/.bin/firebase emulators:start --only auth,firestore --project televault-dev > /tmp/firebase-emulators.log 2>&1 < /dev/null & disown
for i in $(seq 1 60); do rg -q "All emulators ready" /tmp/firebase-emulators.log 2>/dev/null && break; sleep 1; done
setsid nohup bun run dev > /dev/null 2>&1 < /dev/null & disown
for i in $(seq 1 60); do curl -s -o /dev/null --max-time 1 http://localhost:3000 && break; sleep 1; done
echo "backends: emulators=$(rg -c 'All emulators ready' /tmp/firebase-emulators.log) dev=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000)"

ab() { agent-browser "$@"; }

# ---------- 1. Auth gate ----------
echo "[1] auth gate renders"
ab open http://localhost:3000 >/dev/null 2>&1
ab wait --fn "document.readyState === 'complete'" --timeout 25000 >/dev/null 2>&1
ab eval "try { localStorage.clear(); } catch (e) {}" >/dev/null 2>&1
ab eval "try { indexedDB.deleteDatabase('firebaseLocalStorageDb'); } catch (e) {}" >/dev/null 2>&1
ab reload >/dev/null 2>&1
ab wait --fn "document.getElementById('auth-email') !== null" --timeout 25000 >/dev/null 2>&1
ab find text "EN" click >/dev/null 2>&1
ab wait 700 >/dev/null
IN_GATE=$(ab eval "!!document.getElementById('auth-email')" 2>/dev/null)
[ "$IN_GATE" = "true" ]; check $? "auth gate shows sign-in form (screenshot 01)"
ab screenshot /tmp/e2e/01-auth-gate.png >/dev/null

# ---------- 2. Create account (scenario 1) ----------
echo "[2] create account alice"
ab find role tab click --name "Create account" >/dev/null 2>&1
ab find first "#auth-name" fill "Alice" >/dev/null 2>&1
ab find first "#auth-email" fill "alice@televault.test" >/dev/null 2>&1
ab find first "#auth-password" fill "test123456" >/dev/null 2>&1
ab find role button click --name "Create account" >/dev/null 2>&1
ab wait --fn "document.querySelector('main') !== null" --timeout 25000 >/dev/null 2>&1
ab wait --fn "document.querySelector('main').innerText.trim().length > 20" --timeout 25000 >/dev/null 2>&1
ab screenshot /tmp/e2e/02-alice-dashboard.png >/dev/null
DASH=$(ab find first "main" text 2>/dev/null)
echo "$DASH" | rg -q "." ; check $? "dashboard rendered for new cloud user"
echo "  (dashboard content: $(echo "$DASH" | head -c 120))"

# ---------- 3. Create a note (scenario 2) ----------
echo "[3] create note via quick capture"
ab find role button click --name "Quick capture" >/dev/null 2>&1
ab wait --fn "document.getElementById('capture-title') !== null" --timeout 10000 >/dev/null 2>&1
ab find first "#capture-title" fill "Firestore persistence check" >/dev/null 2>&1
ab find first "#capture-content" fill "This note must survive a page reload." >/dev/null 2>&1
ab find first "#capture-tags" fill "e2e,cloud" >/dev/null 2>&1
ab screenshot /tmp/e2e/03-capture-form.png >/dev/null
ab find role button click --name "Save item" >/dev/null 2>&1
ab wait --fn "document.getElementById('capture-title') === null" --timeout 10000 >/dev/null 2>&1
ab wait 1500 >/dev/null

# go to library
ab find role button click --name "Library" >/dev/null 2>&1
ab wait 1200 >/dev/null
MAIN=$(ab find first "main" text 2>/dev/null)
echo "$MAIN" | rg -q "Firestore persistence check"; check $? "note visible in library (scenario 2)"
ab screenshot /tmp/e2e/04-library-with-note.png >/dev/null

# ---------- 4. Refresh: persistence (scenarios 3+4) ----------
echo "[4] refresh → persistence"
ab reload >/dev/null 2>&1
ab wait --fn "document.readyState === 'complete'" --timeout 20000 >/dev/null 2>&1
ab wait --fn "document.querySelector('main') !== null" --timeout 25000 >/dev/null 2>&1
ab wait 2500 >/dev/null
STILL_IN=$(ab find first "main" text 2>/dev/null)
echo "$STILL_IN" | rg -q "Firestore persistence check"; check $? "note still exists after refresh (scenarios 3+4)"
SIGNED_IN=$(ab eval "!!document.querySelector('main')" 2>/dev/null)
[ "$SIGNED_IN" = "true" ]; check $? "session restored after refresh (auth persistence)"
ab screenshot /tmp/e2e/05-after-refresh.png >/dev/null

# ---------- 5. Edit note (scenario 5a) ----------
echo "[5] edit note description"
ab find text "Firestore persistence check" click >/dev/null 2>&1
ab wait --fn "document.querySelector('textarea') !== null" --timeout 10000 >/dev/null 2>&1
ab find first "textarea" fill "Edited description — saved to Firestore." >/dev/null 2>&1
ab find role button click --name "Save description" >/dev/null 2>&1
ab wait 1500 >/dev/null
ab reload >/dev/null 2>&1
ab wait --fn "document.querySelector('main') !== null" --timeout 25000 >/dev/null 2>&1
ab wait 2500 >/dev/null
ab find text "Firestore persistence check" click >/dev/null 2>&1
ab wait 1200 >/dev/null
SHEET=$(ab find first "body" text 2>/dev/null)
echo "$SHEET" | rg -q "e2e"; check $? "note tag badge rendered in detail sheet (scenario 2b)"
echo "$SHEET" | rg -q "Edited description"; check $? "edited description persisted to Firestore"
ab screenshot /tmp/e2e/06-edited-note.png >/dev/null

# ---------- 6. Delete note (scenario 5b) ----------
echo "[6] delete note"
DELREF=$(ab snapshot -i 2>/dev/null | rg -o 'button "Delete" \[ref=(e[0-9]+)\]' | tail -1 | rg -o 'e[0-9]+')
ab click @$DELREF >/dev/null 2>&1
ab wait 900 >/dev/null
CONFREF=$(ab snapshot -i 2>/dev/null | rg -o 'button "Delete" \[ref=(e[0-9]+)\]' | tail -1 | rg -o 'e[0-9]+')
ab click @$CONFREF >/dev/null 2>&1
ab wait 2000 >/dev/null
ab reload >/dev/null 2>&1
ab wait --fn "document.querySelector('main') !== null" --timeout 25000 >/dev/null 2>&1
ab wait 2500 >/dev/null
MAIN=$(ab find first "main" text 2>/dev/null)
echo "$MAIN" | rg -q "Firestore persistence check" && bad "note gone after delete (scenario 5)" || ok "note gone after delete (scenario 5)"
ab screenshot /tmp/e2e/07-after-delete.png >/dev/null

# ---------- 7. Recreate note + create category & tags (scenario 6) ----------
echo "[7] recreate note, create category + tag"
ab find role button click --name "Quick capture" >/dev/null 2>&1
ab wait --fn "document.getElementById('capture-title') !== null" --timeout 10000 >/dev/null 2>&1
ab find first "#capture-title" fill "Isolation probe note" >/dev/null 2>&1
ab find first "#capture-content" fill "Only Alice should see this." >/dev/null 2>&1
ab find role button click --name "Save item" >/dev/null 2>&1
ab wait 1200 >/dev/null

ab find role button click --name "Categories" >/dev/null 2>&1
ab wait 1000 >/dev/null
ab find role button click --name "New category" >/dev/null 2>&1
ab wait --fn "document.getElementById('category-name') !== null" --timeout 10000 >/dev/null 2>&1
ab find first "#category-name" fill "Work" >/dev/null 2>&1
ab find role button click --name "Save" >/dev/null 2>&1
ab wait --fn "document.getElementById('category-name') === null" --timeout 10000 >/dev/null 2>&1
ab wait 1200 >/dev/null
CATS=$(ab find first "main" text 2>/dev/null)
echo "$CATS" | rg -q "Work"; check $? "category created (scenario 6)"

ab find role tab click --name "Tags" >/dev/null 2>&1
ab wait 800 >/dev/null
echo "  (tag input present: $(ab eval "document.querySelectorAll('main input').length" 2>/dev/null))"
ab find first "main input" fill "urgent" >/dev/null 2>&1
echo "  (input value: $(ab eval "document.querySelector('main input')?.value" 2>/dev/null))"
ab press Enter >/dev/null 2>&1
ab wait 1500 >/dev/null
CATS=$(ab find first "main" text 2>/dev/null)
echo "$CATS" | rg -q "urgent"; check $? "tag created (scenario 6)"
ab screenshot /tmp/e2e/08-categories-tags.png >/dev/null

# ---------- 8. Sign out → gate (scenario 7) ----------
echo "[8] sign out and sign back in"
ab find role button click --name "Account menu" >/dev/null 2>&1
ab wait 600 >/dev/null
ab find role menuitem click --name "Sign out" >/dev/null 2>&1
ab wait --fn "document.getElementById('auth-email') !== null" --timeout 15000 >/dev/null 2>&1
ab wait --fn "document.getElementById('auth-email') !== null" --timeout 15000 >/dev/null 2>&1
IN_GATE=$(ab eval "!!document.getElementById('auth-email')" 2>/dev/null)
[ "$IN_GATE" = "true" ]; check $? "sign out returns to auth gate"
ab screenshot /tmp/e2e/09-signed-out.png >/dev/null

ab find first "#auth-email" fill "alice@televault.test" >/dev/null 2>&1
ab find first "#auth-password" fill "test123456" >/dev/null 2>&1
ab find role button click --name "Sign in" >/dev/null 2>&1
ab wait --fn "document.querySelector('main') !== null" --timeout 25000 >/dev/null 2>&1
ab wait 2000 >/dev/null
ab find role button click --name "Library" >/dev/null 2>&1
ab wait 1200 >/dev/null
MAIN=$(ab find first "main" text 2>/dev/null)
echo "$MAIN" | rg -q "Isolation probe note"; check $? "data available after re-login (scenarios 7+8)"

# ---------- 9. Second user isolation (scenario 9) ----------
echo "[9] user isolation (bob)"
ab find role button click --name "Account menu" >/dev/null 2>&1
ab wait 500 >/dev/null
ab find role menuitem click --name "Sign out" >/dev/null 2>&1
ab wait --fn "document.getElementById('auth-email') !== null" --timeout 15000 >/dev/null 2>&1
ab find role tab click --name "Create account" >/dev/null 2>&1
ab find first "#auth-name" fill "Bob" >/dev/null 2>&1
ab find first "#auth-email" fill "bob@televault.test" >/dev/null 2>&1
ab find first "#auth-password" fill "test123456" >/dev/null 2>&1
ab find role button click --name "Create account" >/dev/null 2>&1
ab wait --fn "document.querySelector('main') !== null" --timeout 25000 >/dev/null 2>&1
ab wait 2000 >/dev/null
ab find role button click --name "Library" >/dev/null 2>&1
ab wait 1200 >/dev/null
MAIN=$(ab find first "main" text 2>/dev/null)
echo "$MAIN" | rg -q "Isolation probe note" && bad "bob must NOT see alice's note (scenario 9)" || ok "bob cannot see alice's data (scenario 9)"
echo "$MAIN" | rg -q "Work" && bad "bob must NOT see alice's categories" || ok "bob cannot see alice's categories"
ab screenshot /tmp/e2e/10-bob-isolated.png >/dev/null

# ---------- 10. Wrong password rejected (auth error path) ----------
echo "[10] auth error handling"
ab find role button click --name "Account menu" >/dev/null 2>&1
ab wait 500 >/dev/null
ab find role menuitem click --name "Sign out" >/dev/null 2>&1
ab wait --fn "document.getElementById('auth-email') !== null" --timeout 15000 >/dev/null 2>&1
ab find first "#auth-email" fill "alice@televault.test" >/dev/null 2>&1
ab find first "#auth-password" fill "wrongpassword" >/dev/null 2>&1
ab find role button click --name "Sign in" >/dev/null 2>&1
ab wait 1800 >/dev/null
ERR=$(ab find first "[role=alert]" text 2>/dev/null)
echo "$ERR" | rg -qi "incorrect|credential|error" ; check $? "wrong password rejected with error message (scenario 10 - auth)"
ab screenshot /tmp/e2e/11-auth-error.png >/dev/null

# ---------- console errors ----------
echo "console errors:"
ab errors 2>/dev/null | head -8

echo ""
echo "E2E RESULT: $pass passed, $fail failed"
[ "$fail" = "0" ]
