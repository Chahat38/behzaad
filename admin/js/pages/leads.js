/* Leads / CRM page behaviour */
AdminPages.leads = {
  state: {
    q: "",
    status: "",
    source: "",
    from: "",
    to: "",
    assignee: "",
    view: "table",
    sort: "",
    order: "desc",
    page: 1,
    pageSize: 10,
    selected: new Set(),
    rows: [],
    total: 0,
  },

  async init() {
    const session = await Admin.guard();
    if (!session) return;
    const titleEl = document.getElementById("admin-topbar-title");
    const userEl = document.getElementById("admin-topbar-user");
    if (titleEl) titleEl.textContent = "Leads";
    if (userEl) userEl.textContent = session.user?.email || "";

    const logoutBtn = document.getElementById("admin-logout");
    if (logoutBtn) logoutBtn.addEventListener("click", async () => { await Admin.auth.signOut(); location.href = "/admin/login.html"; });

    const burger = document.getElementById("admin-burger");
    const scrim = document.getElementById("admin-scrim");
    const sidebar = document.getElementById("admin-sidebar");
    if (burger) burger.addEventListener("click", () => { if (sidebar) sidebar.classList.toggle("open"); if (scrim) scrim.classList.toggle("show"); });
    if (scrim) scrim.addEventListener("click", () => { if (sidebar) sidebar.classList.remove("open"); scrim.classList.remove("show"); });

    document.querySelectorAll('.admin-nav a[data-nav]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const nav = e.currentTarget.getAttribute("data-nav");
        document.querySelectorAll('.admin-nav a[data-nav]').forEach((x) => x.classList.remove("active"));
        e.currentTarget.classList.add("active");
        if (nav === "dashboard") location.href = "/admin/";
        else if (nav === "leads") location.href = "/admin/leads.html";
        else if (nav === "settings") location.href = "/admin/settings.html";
        if (sidebar) sidebar.classList.remove("open");
        if (scrim) scrim.classList.remove("show");
      });
    });

    const searchEl = document.getElementById("leads-search");
    const statusEl = document.getElementById("leads-status");
    const sourceEl = document.getElementById("leads-source");
    const fromEl = document.getElementById("leads-from");
    const toEl = document.getElementById("leads-to");
    const assigneeEl = document.getElementById("leads-assignee");
    const bulkStatusEl = document.getElementById("bulk-status");
    const bulkBar = document.getElementById("admin-bulk-bar");

    const applyFilters = () => {
      AdminPages.leads.state.q = searchEl.value.trim();
      AdminPages.leads.state.status = statusEl.value;
      AdminPages.leads.state.source = sourceEl.value;
      AdminPages.leads.state.from = fromEl.value ? new Date(fromEl.value + "T00:00:00.000Z").toISOString() : "";
      AdminPages.leads.state.to = toEl.value ? new Date(toEl.value + "T23:59:59.999Z").toISOString() : "";
      AdminPages.leads.state.assignee = assigneeEl.value;
      AdminPages.leads.state.page = 1;
      AdminPages.leads.load();
    };
    searchEl.addEventListener("input", applyFilters);
    statusEl.addEventListener("change", applyFilters);
    sourceEl.addEventListener("change", applyFilters);
    fromEl.addEventListener("change", applyFilters);
    toEl.addEventListener("change", applyFilters);
    assigneeEl.addEventListener("change", applyFilters);

    document.getElementById("leads-btn-table").addEventListener("click", () => { AdminPages.leads.state.view = "table"; AdminPages.leads.state.page = 1; AdminPages.leads.renderView(); });
    document.getElementById("leads-btn-kanban").addEventListener("click", () => { AdminPages.leads.state.view = "kanban"; AdminPages.leads.state.page = 1; AdminPages.leads.renderView(); });
    document.getElementById("leads-btn-export").addEventListener("click", () => AdminPages.leads.exportAll());
    document.getElementById("leads-btn-add").addEventListener("click", () => AdminPages.leads.addLead());
    document.getElementById("bulk-apply-status").addEventListener("click", () => AdminPages.leads.bulkStatus());
    document.getElementById("bulk-delete").addEventListener("click", () => AdminPages.leads.bulkDelete());

    const stSel = document.getElementById("leads-status");
    stSel.innerHTML = `<option value="">All statuses</option>` + Admin.STATUSES.map((s) => `<option value="${s}">${Admin.STATUS_LABELS[s]}</option>`).join("");
    const srcSel = document.getElementById("leads-source");
    srcSel.innerHTML = `<option value="">All sources</option>`;
    const asgSel = document.getElementById("leads-assignee");
    asgSel.innerHTML = `<option value="">All assignees</option>`;
    const bulkStSel = document.getElementById("bulk-status");
    bulkStSel.innerHTML = `<option value="">Set status…</option>` + Admin.STATUSES.map((s) => `<option value="${s}">${Admin.STATUS_LABELS[s]}</option>`).join("");

    let sources = ["contact"];
    const collectSources = async () => {
      try {
        const all = await Admin.leads.all();
        const set = new Set(["contact"]);
        all.forEach((l) => l.source && set.add(l.source));
        sources = Array.from(set);
        srcSel.innerHTML = `<option value="">All sources</option>` + sources.map((s) => `<option value="${s}">${Admin.esc(s)}</option>`).join("");
      } catch (e) {}
    };
    await collectSources();

    const profiles = await Admin.profiles.list();
    const asgOpts = profiles.map((p) => `<option value="${p.id}">${Admin.esc(p.email || p.full_name || p.id)}</option>`).join("");
    asgSel.innerHTML = `<option value="">All assignees</option>${asgOpts}`;

    await this.load();
  },

  async load() {
    const root = document.getElementById("admin-leads-root");
    root.innerHTML = `<div class="admin-spinner"></div>`;
    try {
      const res = await Admin.leads.list({
        q: this.state.q,
        status: this.state.status,
        source: this.state.source,
        from: this.state.from,
        to: this.state.to,
        assignee: this.state.assignee,
        sort: this.state.sort,
        order: this.state.order,
        page: this.state.page,
        pageSize: this.state.pageSize,
      });
      this.state.rows = res.leads;
      this.state.total = res.total;
      const cnt = document.getElementById("nav-count-leads");
      if (cnt) cnt.textContent = res.total;
      await this.renderView();
      this.renderPager(res);
    } catch (e) {
      root.innerHTML = `<div class="admin-empty"><h3>Unable to load leads</h3><p>${Admin.esc(e.message || "Unknown error")}</p></div>`;
    }
  },

  async renderView() {
    const root = document.getElementById("admin-leads-root");
    if (this.state.view === "kanban") {
      root.innerHTML = `<div class="admin-kb" id="admin-kb"></div>`;
      this.renderKanban();
    } else {
      root.innerHTML = `<div style="overflow-x:auto;"><table class="admin-table" id="admin-leads-table"><thead><tr>
        <th><input type="checkbox" id="leads-select-all" /></th>
        <th class="no-sort">Name</th>
        <th class="no-sort">Source</th>
        <th class="no-sort">Status</th>
        <th class="no-sort">Follow-up</th>
        <th class="no-sort">Created</th>
        <th class="no-sort">Assigned</th>
        <th class="no-sort">Actions</th>
      </tr></thead>
      <tbody id="admin-leads-tbody"></tbody></table></div>`;
      this.renderTable();
    }
  },

  renderTable() {
    const tbody = document.getElementById("admin-leads-tbody");
    tbody.innerHTML = "";
    const rows = this.state.rows;
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="admin-empty">No leads match your filters.</div></td></tr>`;
      const headCb = document.querySelector("#admin-leads-table thead input");
      if (headCb) headCb.checked = false;
      this.state.selected.clear();
      this.updateBulkBar();
      return;
    }
    rows.forEach((l) => {
      const tr = document.createElement("tr");
      tr.dataset.id = l.id;
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = this.state.selected.has(l.id);
      cb.addEventListener("change", (e) => {
        if (e.target.checked) this.state.selected.add(l.id);
        else this.state.selected.delete(l.id);
        this.updateBulkBar();
      });
      const tdCb = document.createElement("td"); tdCb.appendChild(cb);
      const tdName = document.createElement("td");
      tdName.innerHTML = `<strong>${Admin.esc(l.name || "—")}</strong><div style="font-size:12px;color:var(--ink-faint)">${Admin.esc(l.email || "")}</div>`;
      const tdSource = document.createElement("td"); tdSource.textContent = l.source || "—";
      const tdStatus = document.createElement("td"); tdStatus.innerHTML = Admin.statusBadgeHtml(l.status, l.follow_up_at);
      const tdFollow = document.createElement("td"); tdFollow.innerHTML = Admin.followUpBadgeHtml(l.follow_up_at);
      const tdCreated = document.createElement("td"); tdCreated.textContent = Admin.fmtDateTime(l.created_at);
      const tdAssigned = document.createElement("td"); tdAssigned.textContent = l.assigned_to ? Admin.esc(l.assigned_to.email || l.assigned_to.full_name || "—") : "—";
      const tdActions = document.createElement("td");
      const openBtn = document.createElement("button");
      openBtn.className = "admin-btn sm";
      openBtn.textContent = "Open";
      openBtn.addEventListener("click", () => { location.href = "/admin/lead.html?id=" + encodeURIComponent(l.id); });
      tdActions.appendChild(openBtn);
      tr.append(tdCb, tdName, tdSource, tdStatus, tdFollow, tdCreated, tdAssigned, tdActions);
      tbody.appendChild(tr);
    });

    const headCb = document.querySelector("#admin-leads-table thead input");
    if (headCb) {
      headCb.addEventListener("change", (e) => {
        const checked = e.target.checked;
        this.state.selected.clear();
        if (checked) rows.forEach((l) => this.state.selected.add(l.id));
        this.updateBulkBar();
      });
    }
  },

  renderKanban() {
    const kb = document.getElementById("admin-kb");
    kb.innerHTML = "";
    Admin.STATUSES.forEach((status) => {
      const col = document.createElement("div");
      col.className = "kb-col";
      col.dataset.status = status;
      col.addEventListener("dragover", (e) => { e.preventDefault(); col.classList.add("drag-over"); });
      col.addEventListener("dragleave", () => col.classList.remove("drag-over"));
      col.addEventListener("drop", async (e) => {
        e.preventDefault();
        col.classList.remove("drag-over");
        const id = e.dataTransfer.getData("text/plain");
        const lead = this.state.rows.find((r) => r.id === id);
        if (lead && lead.status !== status) {
          try {
            await Admin.leads.setStatus(id, status);
            await Admin.activity.add(id, "status_change", `Status changed to ${Admin.STATUS_LABELS[status]}`, "admin");
            await this.load();
          } catch (e) { Admin.toast("Status update failed: " + e.message, "error"); }
        }
      });
      const head = document.createElement("h4");
      head.innerHTML = `${Admin.STATUS_LABELS[status]} <span>${this.state.rows.filter((r) => r.status === status).length}</span>`;
      col.appendChild(head);
      const cards = document.createElement("div");
      cards.className = "admin-kb-cards";
      this.state.rows.filter((r) => r.status === status).forEach((l) => {
        const card = document.createElement("div");
        card.className = "kb-card";
        card.dataset.id = l.id;
        card.addEventListener("click", () => { location.href = "/admin/lead.html?id=" + encodeURIComponent(l.id); });
        card.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/plain", l.id); card.classList.add("dragging"); });
        card.addEventListener("dragend", () => card.classList.remove("dragging"));
        card.innerHTML = `<div class="kb-title">${Admin.esc(l.name || "—")}</div><div class="kb-meta">${Admin.esc(l.source || "")} · ${Admin.fmtDate(l.created_at)}</div>`;
        cards.appendChild(card);
      });
      col.appendChild(cards);
      kb.appendChild(col);
    });
  },

  renderPager(res) {
    const root = document.getElementById("admin-leads-root");
    const old = document.getElementById("admin-pager");
    if (old) old.remove();
    const pages = Math.max(1, Math.ceil(res.total / res.pageSize));
    const wrap = document.createElement("div");
    wrap.id = "admin-pager";
    wrap.style.marginTop = "14px";
    wrap.innerHTML = `
      <div class="admin-row" style="justify-content: space-between;">
        <span class="admin-muted" style="font-size:12px">Page ${res.page} of ${pages} · ${res.total} leads</span>
        <div class="admin-row">
          <button class="admin-btn sm" id="leads-pager-prev">← Prev</button>
          <button class="admin-btn sm" id="leads-pager-next">Next →</button>
        </div>
      </div>`;
    root.appendChild(wrap);
    document.getElementById("leads-pager-prev").addEventListener("click", async () => {
      if (AdminPages.leads.state.page > 1) { AdminPages.leads.state.page -= 1; await AdminPages.leads.load(); }
    });
    document.getElementById("leads-pager-next").addEventListener("click", async () => {
      if (AdminPages.leads.state.page < pages) { AdminPages.leads.state.page += 1; await AdminPages.leads.load(); }
    });
  },

  updateBulkBar() {
    const bar = document.getElementById("admin-bulk-bar");
    const countEl = document.getElementById("bulk-count");
    if (this.state.selected.size === 0) { bar.style.display = "none"; return; }
    bar.style.display = "flex";
    countEl.textContent = this.state.selected.size;
  },

  bulkStatus() {
    if (!this.state.selected.size) { Admin.toast("Select leads first", "error"); return; }
    const status = document.getElementById("bulk-status").value;
    if (!status) { Admin.toast("Pick a status first", "error"); return; }
    const ids = Array.from(this.state.selected);
    ids.forEach(async (id) => {
      try { await Admin.leads.setStatus(id, status); await Admin.activity.add(id, "status_change", "Status changed via bulk action to " + Admin.STATUS_LABELS[status], "admin"); } catch (e) { Admin.toast("Bulk update failed: " + e.message, "error"); }
    });
    this.state.selected.clear();
    document.getElementById("admin-bulk-bar").style.display = "none";
    this.load();
  },

  bulkDelete() {
    const ids = Array.from(this.state.selected);
    if (!ids.length) { Admin.toast("Select leads first", "error"); return; }
    Admin.confirmDialog({
      title: "Delete leads",
      body: `Permanently delete ${ids.length} lead(s)? This cannot be undone.`,
      confirmText: "Delete",
      danger: true,
      onConfirm: async () => {
        try { await Admin.leads.remove(ids); Admin.toast("Deleted " + ids.length + " lead(s)"); } catch (e) { Admin.toast("Delete failed: " + e.message, "error"); }
        this.state.selected.clear();
        document.getElementById("admin-bulk-bar").style.display = "none";
        await this.load();
      },
    });
  },

  exportAll() {
    this.state.page = 1;
    this.state.pageSize = 1000;
    Admin.leads
      .list({ q: this.state.q, status: this.state.status, source: this.state.source, from: this.state.from, to: this.state.to, assignee: this.state.assignee, page: 1, pageSize: 1000 })
      .then((res) => { Admin.exportCSV(res.leads); Admin.toast("Exported " + res.leads.length + " leads to CSV"); this.state.pageSize = 10; this.state.page = 1; this.load(); })
      .catch((e) => Admin.toast("Export failed: " + e.message, "error"));
  },

  async addLead() {
    const profiles = await Admin.profiles.list();
    const box = Admin.modal(
      `<h3 style="font-family:'Fraunces',serif;font-size:22px;margin:0 0 8px;">Add lead</h3>
       <form id="admin-lead-form">
         <label class="admin-label">Name</label><input name="name" class="admin-input" required />
         <label class="admin-label">Phone</label><input name="phone" class="admin-input" />
         <label class="admin-label">Email</label><input name="email" class="admin-input" type="email" required />
         <label class="admin-label">Message</label><textarea name="message" class="admin-textarea" rows="4" required></textarea>
         <label class="admin-label">Source</label><input name="source" class="admin-input" defaultValue="contact" />
         <label class="admin-label">Status</label><select name="status" class="admin-select"><option value="new">New</option><option value="contacted">Contacted</option><option value="follow_up">Follow-up</option><option value="converted">Converted</option><option value="lost">Lost</option></select>
         <label class="admin-label">Follow-up date</label><input name="follow_up_at" class="admin-input" type="datetime-local" />
         <label class="admin-label">Assigned to</label><select name="assigned_to" class="admin-select"><option value="">Unassigned</option>${profiles.map((p) => `<option value="${p.id}">${Admin.esc(p.email || p.full_name || p.id)}</option>`).join("")}</select>
         <button class="admin-btn primary" type="submit" style="width:100%;justify-content:center;margin-top:18px;">Add lead</button>
       </form>`
    );
    const form = box.querySelector("form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const lead = await Admin.leads.create({
        name: data.get("name"),
        phone: data.get("phone") || null,
        email: data.get("email"),
        message: data.get("message"),
        source: data.get("source") || "contact",
        status: data.get("status") || "new",
        follow_up_at: data.get("follow_up_at") || null,
        assigned_to: data.get("assigned_to") || null,
      });
      Admin.toast("Lead added");
      Admin.closeModal();
      await this.load();
    });
  },
};
