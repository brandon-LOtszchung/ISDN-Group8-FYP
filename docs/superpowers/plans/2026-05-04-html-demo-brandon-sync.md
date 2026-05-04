# HTML Demo — Brandon April 28 Sync — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sync `smartfridge-interactive.html` with brandon's April 28 iOS batch — upgrade member state from plain strings to full objects, persist member preferences across edits, and add About section + Sign-out to the profile tab.

**Architecture:** All changes are in the single file `smartfridge-interactive.html`. No new files. Five focused tasks in dependency order: (1) core state and plan tab, (2) onboarding, (3) member-profile editing, (4) profile tab management, (5) new localization keys + About/Sign-out UI. Each task is independently verifiable in a browser.

**Tech Stack:** Vanilla HTML/CSS/JS, no build step. Open the file directly in a browser (`file://…`) to test.

---

## File map

| File | Changes |
|------|---------|
| `smartfridge-interactive.html` | All changes — five sections of the `<script>` block plus one new section in `renderProfile()` |

---

### Task 1: Upgrade `S.members` to object array and fix Plan tab

`S.members` changes from `['Mom','Dad']` to objects. `S.selectedMembers` switches from name-strings to numeric ids. `toggleMember` and the Plan-tab member pills are updated to match.

**Files:**
- Modify: `smartfridge-interactive.html` — `S` initial state (~line 830), `toggleMember` (~line 1941), member pills inside `renderPlan` (~line 1914), `obNext` (~line 1518)

- [ ] **Replace the `members` and `selectedMembers` entries in `S`**

  Find (inside `const S = {`):
  ```js
  members: ['Mom', 'Dad'],
  ...
  selectedMembers: new Set(),
  ```
  Replace with:
  ```js
  members: [
    {id:1, name:'Mom', age:'', dietary:[], allergies:[], health:[], spice:'', cuisines:[], disliked:[]},
    {id:2, name:'Dad', age:'', dietary:[], allergies:[], health:[], spice:'', cuisines:[], disliked:[]},
  ],
  ...
  selectedMembers: new Set([1, 2]),
  ```

- [ ] **Fix `obNext` — seed `selectedMembers` with ids not names**

  Find (inside `function obNext()`):
  ```js
  S.selectedMembers = new Set(S.members);
  ```
  Replace with:
  ```js
  S.selectedMembers = new Set(S.members.map(m => m.id));
  ```

- [ ] **Fix `toggleMember` to toggle by id**

  Find:
  ```js
  function toggleMember(name) {
    if (S.selectedMembers.has(name)) S.selectedMembers.delete(name);
    else S.selectedMembers.add(name);
    renderPlan();
  }
  ```
  Replace with:
  ```js
  function toggleMember(id) {
    if (S.selectedMembers.has(id)) S.selectedMembers.delete(id);
    else S.selectedMembers.add(id);
    renderPlan();
  }
  ```

- [ ] **Fix member pills in `renderPlan`**

  Find (inside `renderPlan`, the `pill-scroller` for cooking-for):
  ```js
  ${S.members.map(m => `
          <span class="pill ${S.selectedMembers.has(m)?'on':''}" onclick="toggleMember('${esc(m)}')">${m}</span>
        `).join('')}
  ```
  Replace with:
  ```js
  ${S.members.map(m => `
          <span class="pill ${S.selectedMembers.has(m.id)?'on':''}" onclick="toggleMember(${m.id})">${m.name}</span>
        `).join('')}
  ```

- [ ] **Verify in browser**

  Open `smartfridge-interactive.html`. Complete onboarding. Switch to Plan tab. Confirm member pills show "Mom" and "Dad" highlighted. Click one — it deselects. Click Get Ideas — only selected members shown. No JS errors in console.

- [ ] **Commit**
  ```bash
  git add smartfridge-interactive.html
  git commit -m "feat(demo): upgrade S.members to object array, toggle by id"
  ```

---

### Task 2: Update onboarding members step

`renderMembers()` and `addMember()` must read/write `m.name` instead of treating the member as a bare string.

**Files:**
- Modify: `smartfridge-interactive.html` — `renderMembers` (~line 1533), `addMember` (~line 1546)

- [ ] **Fix `renderMembers` to reference `m.name`**

  Find:
  ```js
  function renderMembers() {
    const el = document.getElementById('mem-list');
    if (!el) return;
    el.innerHTML = S.members.map((m,i) => `
      <div class="mem-row">
        <input class="mem-input" value="${m}" placeholder="Name"
               oninput="S.members[${i}]=this.value" autocomplete="off">
        <button class="mem-del" onclick="S.members.splice(${i},1);renderMembers()">
  ```
  Replace with:
  ```js
  function renderMembers() {
    const el = document.getElementById('mem-list');
    if (!el) return;
    el.innerHTML = S.members.map((m,i) => `
      <div class="mem-row">
        <input class="mem-input" value="${m.name}" placeholder="Name"
               oninput="S.members[${i}].name=this.value" autocomplete="off">
        <button class="mem-del" onclick="S.members.splice(${i},1);renderMembers()">
  ```
  (Leave the rest of the function unchanged — only the `value` attribute and `oninput` differ.)

- [ ] **Fix `addMember` to push a full member object**

  Find:
  ```js
  function addMember() {
    S.members.push('');
    renderMembers();
  ```
  Replace with:
  ```js
  function addMember() {
    S.members.push({id: Date.now(), name:'', age:'', dietary:[], allergies:[], health:[], spice:'', cuisines:[], disliked:[]});
    renderMembers();
  ```

- [ ] **Verify in browser**

  Open the file. On the "Who's in your family?" onboarding step: the two pre-filled inputs show "Mom" and "Dad". Edit one name — the change persists when you move to the next step. Click "Add Member" — a blank row appears. Enter a name. Complete onboarding. No console errors.

- [ ] **Commit**
  ```bash
  git add smartfridge-interactive.html
  git commit -m "feat(demo): update onboarding member step for object array"
  ```

---

### Task 3: Persist member preferences in edit form

`showMemberProfile` pre-fills `MP` from the member object. `saveMemberProfile` writes all fields back. `MP` gets an `age` field. The age input in `renderMemberProfile` is pre-populated.

**Files:**
- Modify: `smartfridge-interactive.html` — `MP` declaration (~line 2361), `showMemberProfile` (~line 2405), `renderMemberProfile` age input (~line 2443), `saveMemberProfile` (~line 2503)

- [ ] **Add `age` to `MP` declaration**

  Find:
  ```js
  const MP = { index: -1, dietary: new Set(), allergies: new Set(), health: new Set(), spice: '', cuisines: new Set(), disliked: [] };
  ```
  Replace with:
  ```js
  const MP = { index: -1, age: '', dietary: new Set(), allergies: new Set(), health: new Set(), spice: '', cuisines: new Set(), disliked: [] };
  ```

- [ ] **Load all member fields into `MP` in `showMemberProfile`**

  Find:
  ```js
  function showMemberProfile(index) {
    MP.index = index;
    MP.dietary = new Set();
    MP.allergies = new Set();
    MP.health = new Set();
    MP.spice = '';
    MP.cuisines = new Set();
    MP.disliked = [];
    goScreen('s-member-profile');
    renderMemberProfile();
  }
  ```
  Replace with:
  ```js
  function showMemberProfile(index) {
    MP.index = index;
    const m = S.members[index];
    MP.age      = m.age || '';
    MP.dietary  = new Set(m.dietary);
    MP.allergies = new Set(m.allergies);
    MP.health   = new Set(m.health);
    MP.spice    = m.spice || '';
    MP.cuisines = new Set(m.cuisines);
    MP.disliked = [...m.disliked];
    goScreen('s-member-profile');
    renderMemberProfile();
  }
  ```

- [ ] **Pre-populate age input in `renderMemberProfile`**

  Find (inside `renderMemberProfile`, the age row):
  ```js
          <input id="mp-age" type="number" placeholder="${t('profile.member.age_hint')}" style="flex:1;border:none;outline:none;font:16px/1 Inter,sans-serif;color:var(--text);text-align:right;background:transparent" min="1" max="120">
  ```
  Replace with:
  ```js
          <input id="mp-age" type="number" placeholder="${t('profile.member.age_hint')}" value="${MP.age}" style="flex:1;border:none;outline:none;font:16px/1 Inter,sans-serif;color:var(--text);text-align:right;background:transparent" min="1" max="120">
  ```

- [ ] **Write all MP fields back to the member object in `saveMemberProfile`**

  Find:
  ```js
  function saveMemberProfile() {
    const nameEl = document.getElementById('mp-name');
    if (nameEl && nameEl.value.trim()) S.members[MP.index] = nameEl.value.trim();
    showToast('Profile saved');
    backFromMemberProfile();
  }
  ```
  Replace with:
  ```js
  function saveMemberProfile() {
    const nameEl = document.getElementById('mp-name');
    const ageEl  = document.getElementById('mp-age');
    const newName = nameEl ? nameEl.value.trim() : '';
    if (!newName) return;
    S.members[MP.index] = {
      ...S.members[MP.index],
      name:      newName,
      age:       ageEl ? ageEl.value.trim() : '',
      dietary:   [...MP.dietary],
      allergies: [...MP.allergies],
      health:    [...MP.health],
      spice:     MP.spice,
      cuisines:  [...MP.cuisines],
      disliked:  [...MP.disliked],
    };
    showToast('Profile saved');
    backFromMemberProfile();
  }
  ```

- [ ] **Verify in browser**

  Complete onboarding. Go to Profile tab → tap "Mom". Select "Vegetarian" under Dietary Restrictions and set Spice to "Mild". Tap Save. Tap "Mom" again — Vegetarian should be highlighted and Spice should show "Mild". No console errors.

- [ ] **Commit**
  ```bash
  git add smartfridge-interactive.html
  git commit -m "feat(demo): persist member preferences across profile edits"
  ```

---

### Task 4: Fix member management in profile tab

`renderProfile` member rows use `m.id` for swipe tracking, show age subtitle, and initialize swipe rows by id. `promptDeleteMember` reads `m.name`. `confirmDeleteMember` deletes by id from `S.selectedMembers`. `submitAddMember` pushes a full member object.

**Files:**
- Modify: `smartfridge-interactive.html` — `renderProfile` (~line 2363), `promptDeleteMember` (~line 2617), `confirmDeleteMember` (~line 2624), `submitAddMember` (~line 2601)

- [ ] **Update member rows in `renderProfile`**

  Find (inside `renderProfile`, the `memberRows` construction):
  ```js
  const memberRows = S.members.map((m, i) => `
      <div class="swipe-row-wrap" data-swipe-id="mem-${i}">
        <div class="swipe-row-trailing">
          <button class="swipe-action-btn" style="background:#FF3B30" onclick="promptDeleteMember(${i})">
  ```
  Replace with:
  ```js
  const memberRows = S.members.map((m, i) => `
      <div class="swipe-row-wrap" data-swipe-id="mem-${m.id}">
        <div class="swipe-row-trailing">
          <button class="swipe-action-btn" style="background:#FF3B30" onclick="promptDeleteMember(${i})">
  ```

  Also find (the content row inside the same map, showing member name):
  ```js
        <div class="swipe-row-content row" onclick="showMemberProfile(${i})" style="cursor:pointer">
          <span class="row-em">👤</span>
          <div class="row-info"><div class="row-title">${m || '(unnamed)'}</div></div>
  ```
  Replace with:
  ```js
        <div class="swipe-row-content row" onclick="showMemberProfile(${i})" style="cursor:pointer">
          <span class="row-em">👤</span>
          <div class="row-info">
            <div class="row-title">${m.name || '(unnamed)'}</div>
            ${m.age ? `<div class="row-sub">Age: ${m.age}</div>` : ''}
          </div>
  ```

- [ ] **Fix swipe row init at the bottom of `renderProfile`**

  Find:
  ```js
    S.members.forEach((_, i) => initTrailingOnlySwipeRow(`mem-${i}`));
  ```
  Replace with:
  ```js
    S.members.forEach((m) => initTrailingOnlySwipeRow(`mem-${m.id}`));
  ```

- [ ] **Fix `promptDeleteMember` to read `m.name`**

  Find:
  ```js
  function promptDeleteMember(idx) {
    _pendingDeleteMemberIdx = idx;
    const name = S.members[idx] || 'this member';
    document.getElementById('delete-member-name').textContent = `Remove "${name}"?`;
    openSheet('sheet-delete-member');
  }
  ```
  Replace with:
  ```js
  function promptDeleteMember(idx) {
    _pendingDeleteMemberIdx = idx;
    const member = S.members[idx];
    const name = member ? member.name : 'this member';
    document.getElementById('delete-member-name').textContent = `Remove "${name}"?`;
    openSheet('sheet-delete-member');
  }
  ```

- [ ] **Fix `confirmDeleteMember` to delete by id**

  Find:
  ```js
  function confirmDeleteMember() {
    closeSheet('sheet-delete-member');
    if (_pendingDeleteMemberIdx == null) return;
    const idx = _pendingDeleteMemberIdx;
    _pendingDeleteMemberIdx = null;
    openSwipeId = null; openSwipeDir = null;
    const name = S.members[idx];
    S.selectedMembers.delete(name);
    S.members.splice(idx, 1);
    renderProfile();
    showToast('Member removed');
  }
  ```
  Replace with:
  ```js
  function confirmDeleteMember() {
    closeSheet('sheet-delete-member');
    if (_pendingDeleteMemberIdx == null) return;
    const idx = _pendingDeleteMemberIdx;
    _pendingDeleteMemberIdx = null;
    openSwipeId = null; openSwipeDir = null;
    const member = S.members[idx];
    if (member) S.selectedMembers.delete(member.id);
    S.members.splice(idx, 1);
    renderProfile();
    showToast('Member removed');
  }
  ```

- [ ] **Fix `submitAddMember` to push a full object**

  Find:
  ```js
  function submitAddMember() {
    const nameEl = document.getElementById('am-name');
    const name = nameEl ? nameEl.value.trim() : '';
    if (!name) return;
    S.members.push(name);
    S.selectedMembers.add(name);
    closeAddMemberSheet();
    renderProfile();
    showToast(`${name} added`);
  }
  ```
  Replace with:
  ```js
  function submitAddMember() {
    const nameEl = document.getElementById('am-name');
    const ageEl  = document.getElementById('am-age');
    const name = nameEl ? nameEl.value.trim() : '';
    if (!name) return;
    const newMember = {
      id:        Date.now(),
      name,
      age:       ageEl ? ageEl.value.trim() : '',
      dietary:   [...AM.dietary],
      allergies: [...AM.allergies],
      health:    [...AM.health],
      spice:     AM.spice,
      cuisines:  [...AM.cuisines],
      disliked:  [...AM.disliked],
    };
    S.members.push(newMember);
    S.selectedMembers.add(newMember.id);
    closeAddMemberSheet();
    renderProfile();
    showToast(`${name} added`);
  }
  ```

- [ ] **Verify in browser**

  Go to Profile tab. Swipe-left to delete "Dad" — confirm dialog appears with name "Dad". Confirm. Row disappears. Go to Plan tab — only "Mom" pill is shown. Tap + in Profile → add "Grandma" with age 70 and Halal dietary. Save. Grandma appears in the list with "Age: 70" subtitle. Swipe the row — delete action shows "Grandma". No console errors.

- [ ] **Commit**
  ```bash
  git add smartfridge-interactive.html
  git commit -m "feat(demo): fix profile tab member rows and delete/add for object array"
  ```

---

### Task 5: Add localization strings, About section, and Sign-out

New string keys in both locales. `renderProfile` gains an About section inside the scroll area and a Sign-out button pinned below it. New `signOut()` helper.

**Files:**
- Modify: `smartfridge-interactive.html` — `STRINGS.en` (~line 1113), `STRINGS.zh` (~line 1154), `renderProfile` (~line 2363), new `signOut` function

- [ ] **Add new keys to `STRINGS.en`**

  Find (inside `STRINGS.en`, after `'profile.member.delete_msg'`):
  ```js
      'profile.member.delete_msg': 'This member and their preferences will be permanently removed.',
      'common.cancel': 'Cancel',
  ```
  Replace with:
  ```js
      'profile.member.delete_msg': 'This member and their preferences will be permanently removed.',
      'profile.about': 'About',
      'profile.privacy_policy': 'Privacy Policy',
      'profile.version': 'Version',
      'profile.sign_out': 'Sign Out',
      'profile.sign_out_confirm': 'Are you sure you want to sign out?',
      'common.cancel': 'Cancel',
  ```

- [ ] **Add the same keys to `STRINGS.zh`**

  Find (inside `STRINGS.zh`, after `'profile.member.delete_msg'`):
  ```js
      'profile.member.delete_msg': '此成員及其偏好設定將被永久移除。',
      'common.cancel': '取消',
  ```
  Replace with:
  ```js
      'profile.member.delete_msg': '此成員及其偏好設定將被永久移除。',
      'profile.about': '關於',
      'profile.privacy_policy': '私隱政策',
      'profile.version': '版本',
      'profile.sign_out': '登出',
      'profile.sign_out_confirm': '您確定要登出嗎？',
      'common.cancel': '取消',
  ```

- [ ] **Add About section inside the scroll div and Sign-out below it in `renderProfile`**

  Find (at the end of `renderProfile`, the closing of the scroll div and the `forEach` call):
  ```js
        ${S.members.length > 0 ? `<div style="padding:8px 16px 20px;font-size:12px;color:var(--gray);text-align:center">${t('profile.swipe_hint')}</div>` : ''}
      </div>`;

    S.members.forEach((m) => initTrailingOnlySwipeRow(`mem-${m.id}`));
  ```
  Replace with:
  ```js
        ${S.members.length > 0 ? `<div style="padding:8px 16px 4px;font-size:12px;color:var(--gray);text-align:center">${t('profile.swipe_hint')}</div>` : ''}

      <div class="sec-hdr">${t('profile.about')}</div>
      <div class="inset">
        <div class="row" style="cursor:pointer" onclick="window.open('https://brandon-lotsz.github.io/smartfridge-privacy/','_blank')">
          <div class="row-info"><div class="row-title">${t('profile.privacy_policy')}</div></div>
          <svg width="7" height="12" viewBox="0 0 7 12" fill="none" style="color:#C7C7CC;flex-shrink:0"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="row">
          <div class="row-info"><div class="row-title">${t('profile.version')}</div></div>
          <span style="font-size:14px;color:var(--gray)">1.0</span>
        </div>
      </div>
      <div style="height:20px"></div>
    </div>
    <div style="flex-shrink:0;padding:12px 16px 20px;border-top:0.5px solid rgba(0,0,0,0.1);background:rgba(250,250,250,0.94)">
      <button class="btn btn-ghost" style="color:var(--danger);padding:14px" onclick="signOut()">${t('profile.sign_out')}</button>
    </div>`;

    S.members.forEach((m) => initTrailingOnlySwipeRow(`mem-${m.id}`));
  ```

- [ ] **Add `signOut` function** (place it near the other profile functions, after `cancelDeleteMember`):

  Find:
  ```js
  function cancelDeleteMember() {
    _pendingDeleteMemberIdx = null;
    closeSheet('sheet-delete-member');
  }
  ```
  Replace with:
  ```js
  function cancelDeleteMember() {
    _pendingDeleteMemberIdx = null;
    closeSheet('sheet-delete-member');
  }

  function signOut() {
    if (confirm(t('profile.sign_out_confirm'))) {
      showToast(t('profile.sign_out'));
    }
  }
  ```

- [ ] **Verify in browser**

  Go to Profile tab. Scroll down — see "About" section with "Privacy Policy" (tappable, opens new tab) and "Version 1.0" row. Below the scroll area, a red "Sign Out" button is pinned. Tap it — confirm dialog in the current language appears. Confirm — toast shows "Sign Out" / "登出". Toggle language to 中文 — all new strings appear in Chinese. No console errors.

- [ ] **Commit**
  ```bash
  git add smartfridge-interactive.html
  git commit -m "feat(demo): add About section and Sign-out to profile tab"
  ```
