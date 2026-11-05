const NotesWidget = {
  id: "notes",
  template: "tpl-notes",

  init(el) {
    const listEl = el.querySelector("#notes-list");
    const addBtn = el.querySelector("#notes-add");

    let items = Storage.get("notes.items", []);

    const save = () => Storage.set("notes.items", items);

    const renderItem = (item) => {
      const li = document.createElement("li");
      li.className = item.done ? "done" : "";

      const check = document.createElement("span");
      check.className = "check";
      check.onclick = () => {
        item.done = !item.done;
        save();
        renderAll();
      };

      const label = document.createElement("span");
      label.className = "label";
      label.textContent = item.text;

      const del = document.createElement("button");
      del.className = "del";
      del.textContent = "✕";
      del.onclick = () => {
        items = items.filter((i) => i.id !== item.id);
        save();
        renderAll();
      };

      li.append(check, label, del);
      return li;
    };

    const renderAll = () => {
      listEl.innerHTML = "";
      items.forEach((item) => listEl.appendChild(renderItem(item)));
    };

    addBtn.addEventListener("click", () => {
      const text = prompt("New item:");
      if (!text || !text.trim()) return;
      items.push({ id: crypto.randomUUID(), text: text.trim(), done: false });
      save();
      renderAll();
    });

    renderAll();
  }
};
