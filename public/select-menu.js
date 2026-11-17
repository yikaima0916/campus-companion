// Replaces native <select> menus and confirm() boxes with in-app versions that
// match the rest of the interface. Forms keep reading select.value as before:
// the native <select> stays in the form, hidden, and is the source of truth.
const lang = () => document.documentElement.lang || 'en';
const L = (cn, tw, en) => (lang() === 'zh-TW' ? tw : lang() === 'en' ? en : cn);
const valueProperty = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
const indexProperty = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'selectedIndex');
const enhanced = new WeakMap();
const chevron = '<svg class="select-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6.5 9.5 5.5 5.5 5.5-5.5"/></svg>';
const check = '<svg class="select-check" viewBox="0 0 24 24" aria-hidden="true"><path d="m5.5 12.5 4.2 4.2 8.8-9.4"/></svg>';
let openMenu = null;
function closeOpenMenu(focusTrigger = false) {
  if (!openMenu) return;
  const {menu, trigger} = openMenu;
  menu.hidden = true;
  trigger.setAttribute('aria-expanded', 'false');
  trigger.closest('.select-menu')?.classList.remove('is-open');
  openMenu = null;
  if (focusTrigger) trigger.focus();
}
function upgrade(select) {
  if (enhanced.has(select) || select.multiple || select.hidden || select.dataset.native !== undefined || !select.isConnected) return;
  if (select.nextElementSibling?.matches('.assignee-picker,.repeat-trigger')) return;
  const wrap = document.createElement('span');
  wrap.className = 'select-menu';
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'select-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.innerHTML = `<span class="select-label" data-user-content></span>${chevron}`;
  const menu = document.createElement('div');
  menu.className = 'select-list';
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('data-user-content', '');
  menu.hidden = true;
  select.classList.add('select-native');
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');
  select.after(wrap);
  wrap.append(trigger, menu);
  const sync = () => {
    const option = select.options[indexProperty.get.call(select)];
    trigger.querySelector('.select-label').textContent = option ? option.textContent.trim() : '';
    trigger.disabled = select.disabled;
    const label = select.getAttribute('aria-label') || select.closest('label')?.firstChild?.textContent?.trim() || '';
    if (label) { trigger.setAttribute('aria-label', `${label}: ${option?.textContent.trim() || ''}`); trigger.dataset.labelSource = trigger.getAttribute('aria-label'); }
  };
  const build = () => {
    menu.innerHTML = '';
    [...select.options].forEach((option, index) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'select-option';
      item.setAttribute('role', 'option');
      const selected = index === indexProperty.get.call(select);
      item.setAttribute('aria-selected', String(selected));
      item.disabled = option.disabled;
      item.innerHTML = `<span></span>${check}`;
      item.firstChild.textContent = option.textContent.trim();
      item.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        const changed = indexProperty.get.call(select) !== index;
        indexProperty.set.call(select, index);
        sync();
        closeOpenMenu(true);
        if (changed) {
          select.dispatchEvent(new Event('input', {bubbles: true}));
          select.dispatchEvent(new Event('change', {bubbles: true}));
        }
      });
      menu.append(item);
    });
  };
  const open = () => {
    if (select.disabled) return;
    if (openMenu?.menu === menu) { closeOpenMenu(); return; }
    closeOpenMenu();
    build();
    menu.hidden = false;
    wrap.classList.add('is-open');
    // Open downwards unless there is clearly more room above the field.
    const box = trigger.getBoundingClientRect();
    const below = window.innerHeight - box.bottom, above = box.top;
    wrap.classList.toggle('opens-up', below < Math.min(menu.scrollHeight + 16, 320) && above > below);
    trigger.setAttribute('aria-expanded', 'true');
    openMenu = {menu, trigger};
    (menu.querySelector('[aria-selected="true"]') || menu.querySelector('.select-option:not(:disabled)'))?.focus({preventScroll: true});
  };
  trigger.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); open(); });
  trigger.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) { event.preventDefault(); if (openMenu?.menu !== menu) open(); }
  });
  menu.addEventListener('keydown', event => {
    const items = [...menu.querySelectorAll('.select-option:not(:disabled)')];
    const at = items.indexOf(document.activeElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const next = items[(at + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length];
      next?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeOpenMenu(true);
    } else if (event.key === 'Tab') closeOpenMenu();
  });
  // Keep the visible label in step when app code sets the value directly.
  Object.defineProperty(select, 'value', {configurable: true, get() { return valueProperty.get.call(this); }, set(next) { valueProperty.set.call(this, next); sync(); }});
  Object.defineProperty(select, 'selectedIndex', {configurable: true, get() { return indexProperty.get.call(this); }, set(next) { indexProperty.set.call(this, next); sync(); }});
  select.addEventListener('change', sync);
  select.form?.addEventListener('reset', () => setTimeout(sync));
  new MutationObserver(sync).observe(select, {childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['disabled']});
  enhanced.set(select, sync);
  sync();
}
export function upgradeSelects(root = document) {
  if (root.matches?.('select')) upgrade(root);
  root.querySelectorAll?.('select').forEach(upgrade);
}
/** Re-read every enhanced select, for example after the interface language changes. */
export function refreshSelects() {
  document.querySelectorAll('select.select-native').forEach(select => enhanced.get(select)?.());
}
export function watchSelects() {
  upgradeSelects();
  new MutationObserver(records => {
    // Wait one task so screens that build their own picker (group members) can hide the select first.
    const added = records.flatMap(record => [...record.addedNodes]).filter(node => node.nodeType === 1);
    if (added.length) setTimeout(() => added.forEach(node => upgradeSelects(node)));
  }).observe(document.body, {childList: true, subtree: true});
  document.addEventListener('click', event => { if (openMenu && !openMenu.menu.parentElement.contains(event.target)) closeOpenMenu(); });
  window.addEventListener('resize', () => closeOpenMenu());
}
/**
 * In-app replacement for window.confirm(). Resolves to true or false.
 * Options: confirmText, cancelText, danger (red confirm button).
 */
export function confirmDialog(message, {confirmText, cancelText, danger = false} = {}) {
  return new Promise(resolve => {
    const dialog = document.createElement('dialog');
    dialog.className = 'confirm-dialog';
    dialog.innerHTML = `<form method="dialog"><p class="confirm-message"></p><div class="confirm-actions"><button type="button" value="cancel" class="confirm-cancel"></button><button type="submit" value="ok" class="primary confirm-ok${danger ? ' is-danger' : ''}"></button></div></form>`;
    dialog.querySelector('.confirm-message').textContent = message;
    dialog.querySelector('.confirm-cancel').textContent = cancelText || L('取消', '取消', 'Cancel');
    dialog.querySelector('.confirm-ok').textContent = confirmText || L('确定', '確定', 'Confirm');
    let result = false;
    dialog.querySelector('.confirm-cancel').onclick = () => dialog.close();
    dialog.querySelector('form').onsubmit = () => { result = true; };
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => { dialog.remove(); resolve(result); });
    document.body.append(dialog);
    dialog.showModal();
    dialog.querySelector('.confirm-ok').focus();
  });
}
