const NotesWidget = {
  id: "notes", template: "tpl-notes",
  init(el) {
    const list = el.querySelector('.notes-list');
    const entry = el.querySelector('.notes-entry');
    const input = entry.querySelector('input');
    const add = el.querySelector('#notes-add');
    const saved = Storage.get('notes.items', []);
    let items = Array.isArray(saved) ? saved.filter(i => i && typeof i.text === 'string') : [];
    const render = () => {
      list.replaceChildren();
      el.querySelector('.notes-empty').hidden = items.length > 0;
      const remaining = items.filter(i => !i.done).length;
      const completed = items.length - remaining;
      el.querySelector('.notes-count').textContent = `${remaining} left`;
      const percent = items.length ? Math.round(completed / items.length * 100) : 0;
      const progress = el.querySelector('.focus-progress');
      progress.setAttribute('aria-valuenow', percent);
      progress.querySelector('span').style.width = `${percent}%`;
      el.querySelector('.focus-status').textContent = !items.length ? 'A fresh start' : !remaining ? 'All done. Take a breath.' : `${completed} of ${items.length} complete`;
      el.querySelector('.focus-clear').hidden = completed === 0;
      for (const item of items) {
        const li = document.createElement('li');
        li.className = item.done ? 'done' : '';
        const check = document.createElement('button');
        check.className = 'check';
        check.setAttribute('aria-label', `${item.done ? 'Mark incomplete' : 'Complete'}: ${item.text}`);
        check.setAttribute('aria-pressed', String(!!item.done));
        check.onclick = () => { item.done = !item.done; save(); list.querySelectorAll('.check')[items.indexOf(item)]?.focus(); };
        const label = document.createElement('span');
        label.className = 'label'; label.textContent = item.text;
        const del = document.createElement('button');
        del.className = 'del'; del.textContent = '×';
        del.setAttribute('aria-label', `Delete: ${item.text}`);
        del.onclick = () => { items = items.filter(i => i.id !== item.id); save(); add.focus(); };
        li.append(check, label, del); list.append(li);
      }
    };
    const save = () => { Storage.set('notes.items', items); render(); };
    el.querySelector('.focus-clear').onclick = () => { items = items.filter(i => !i.done); save(); add.focus(); };
    add.onclick = () => { entry.hidden = !entry.hidden; add.setAttribute('aria-expanded', String(!entry.hidden)); if (!entry.hidden) input.focus(); };
    entry.onsubmit = e => {
      e.preventDefault();
      if (!input.value.trim()) return;
      items.push({ id: crypto.randomUUID(), text: input.value.trim(), done: false });
      input.value = ''; entry.hidden = true; add.setAttribute('aria-expanded','false'); save(); add.focus(); list.scrollTop = list.scrollHeight;
    };
    input.addEventListener('keydown', e => { if (e.key === 'Escape') { entry.hidden = true; add.setAttribute('aria-expanded','false'); add.focus(); } });
    render();
  }
};
