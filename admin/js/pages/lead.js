/* Lead detail page behaviour */
function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

AdminPages.lead = {
  state: { id: null, lead: null, notes: [], activity: [], tags: [], leadTags: [], profiles: [] },

  async init() {
    const session = await Admin.guard();
    if (!session) return;
    AdminPages.lead.state.id = new URLSearchParams(location.search).get("id");

    const titleEl = document.getElementById("admin-topbar-title");
    const userEl = document.getElementById("admin-topbar-user");
    if (titleEl) titleEl.textContent = "Lead";
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

    const root = document.getElementById("admin-lead-root");
    root.innerHTML = `<div class="admin-spinner"></div>`;
    await this.load();
  },

  async load() {
    const id = AdminPages.lead.state.id;
    const root = document.getElementById("admin-lead-root");
    root.innerHTML = `<div class="admin-spinner"></div>`;
    if (!id) {
      root.innerHTML = `<div class="admin-empty"><h3>No lead selected</h3><p>Open a lead from the CRM.</p></div>`;
      return;
    }
    try {
      const lead = await Admin.leads.get(id);
      AdminPages.lead.state.lead = lead;
      const [notes, activity, tags, leadTags, profiles] = await Promise.all([
        Admin.notes.list(id).catch(() => []),
        Admin.activity.list(id).catch(() => []),
        Admin.tags.list().catch(() => []),
        Admin.leadTags.list(id).catch(() => []),
        Admin.profiles.list().catch(() => []),
      ]);
      AdminPages.lead.state.notes = notes;
      AdminPages.lead.state.activity = activity;
      AdminPages.lead.state.tags = tags;
      AdminPages.lead.state.leadTags = leadTags;
      AdminPages.lead.state.profiles = profiles;
      root.innerHTML = this.html(lead, notes, activity, tags, leadTags, profiles);
      this.bind(lead, notes, activity, tags, leadTags, profiles);
    } catch (e) {
      root.innerHTML = `<div class="admin-empty"><h3>Unable to load lead</h3><p>${Admin.esc(e.message || "Unknown error")}</p></div>`;
    }
  },

  html(lead, notes, activity, tags, leadTags, profiles) {
    const quick = Admin.quickActionsHtml(lead);
    const noteList = notes.length
      ? notes.map((n) => `<div class="admin-note"><div>${esc(n.body)}</div><div class="admin-muted" style="font-size:11px;margin-top:4px">${Admin.esc(n.author || "admin")} · ${Admin.fmtDateTime(n.created_at)}</div></div>`).join("")
      : `<div class="admin-muted" style="font-size:13px">No notes yet.</div>`;
    const actList = activity.length
      ? activity.map((a) => `<div class="admin-row" style="justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line);font-size:13px"><span><strong>${Admin.esc(a.action)}</strong> — ${Admin.esc(a.detail || "")}</span><span class="admin-muted" style="font-size:11px">${Admin.esc(a.actor || "")} · ${Admin.fmtDateTime(a.created_at)}</span></div>`).join("")
      : `<div class="admin-muted" style="font-size:13px">No activity yet.</div>`;
    const tagChips = tags.map((t) => {
      const on = leadTags.includes(t.id);
      const chip = document.createElement("span");
      chip.className = "tag-chip";
      chip.style.cursor = "pointer";
      chip.style.background = on ? "var(--ink)" : "var(--sky)";
      chip.style.color = on ? "#fff" : "var(--ink)";
      chip.textContent = t.name;
      chip.addEventListener("click", () => AdminPages.lead.toggleTag(t.id, on));
      const wrap = document.createElement("span");
      wrap.style.display = "inline-flex";
      wrap.appendChild(chip);
      return wrap;
    });
    const tagsHtml = tagChips.length ? tagChips.map((w) => w.outerHTML).join("") : `<span class="admin-muted" style="font-size:13px">No tags.</span>`;

    return `
      <div class="admin-grid" style="grid-template-columns: 2fr 1fr; align-items:start;">
        <div>
          <div class="admin-card">
            <div class="admin-row" style="justify-content: space-between; align-items: flex-start;">
              <div>
                <h2 style="font-family:'Fraunces',serif;font-size:30px;margin:0;">${Admin.esc(lead.name || "—")}</h2>
                <div style="margin-top:8px;">${Admin.statusBadgeHtml(lead.status, lead.follow_up_at)}</div>
              </div>
              <div class="admin-row">
                <button class="admin-btn" id="lead-edit-btn">Edit</button>
                <button class="admin-btn danger" id="lead-delete-btn">Delete</button>
              </div>
            </div>
            <dl class="admin-detail-grid" style="grid-template-columns:1fr 1fr; gap:8px 20px; margin-top:18px;">
              <dt>Source</dt><dd>${Admin.esc(lead.source || "—")}</dd>
              <dt>Phone</dt><dd>${Admin.esc(lead.phone || "—")}</dd>
              <dt>Email</dt><dd>${Admin.esc(lead.email || "—")}</dd>
              <dt>Created</dt><dd>${Admin.fmtDateTime(lead.created_at)}</dd>
              <dt>Follow-up</dt><dd>${Admin.followUpBadgeHtml(lead.follow_up_at)}</dd>
              <dt>Assigned</dt><dd>${lead.assigned_to ? Admin.esc(lead.assigned_to.email || lead.assigned_to.full_name || "—") : "—"}</dd>
            </dl>
            <div style="margin-top:16px;"><div class="admin-label">Message</div><p style="margin:0;white-space:pre-wrap;">${Admin.esc(lead.message || "")}</p></div>
          </div>
        </div>
        <div>
          <div class="admin-card">
            <h3>Quick actions</h3>
            <div id="lead-quick">${quick}</div>
          </div>
          <div class="admin-card">
            <h3>Status</h3>
            <select id="lead-status" class="admin-select">${Admin.STATUSES.map((s) => `<option value="${s}" ${s === lead.status ? "selected" : ""}>${Admin.STATUS_LABELS[s]}</option>`).join("")}</select>
            <div class="admin-label">Assigned to</div>
            <select id="lead-assignee" class="admin-select"><option value="">Unassigned</option>${profiles.map((p) => `<option value="${p.id}" ${p.id === lead.assigned_to?.id ? "selected" : ""}>${Admin.esc(p.email || p.full_name || p.id)}</option>`).join("")}</select>
          </div>
          <div class="admin-card">
            <h3>Tags</h3>
            <div id="lead-tag-chips" style="min-height:20px;">${tagsHtml}</div>
            <div class="admin-row" style="margin-top:12px;">
              <select id="lead-tag-select" class="admin-select"><option value="">Add tag…</option>${tags.map((t) => `<option value="${t.id}">${Admin.esc(t.name)}</option>`).join("")}</select>
              <button class="admin-btn sm" id="lead-tag-add">Add</button>
            </div>
          </div>
          <div class="admin-card">
            <h3>Notes</h3>
            <div id="lead-notes-list">${noteList}</div>
            <div class="admin-row" style="margin-top:12px;">
              <input id="lead-note-input" class="admin-input" placeholder="Add a note…" />
              <button class="admin-btn sm primary" id="lead-note-add">Add</button>
            </div>
          </div>
          <div class="admin-card">
            <h3>Activity</h3>
            <div id="lead-activity-list">${actList}</div>
          </div>
        </div>
      </div>`;
  },

  bind(lead, notes, activity, tags, leadTags, profiles) {
    const root = document.getElementById("admin-lead-root");
    // NOTE: html() above returns a string via template; binding wired through event delegation on root.
    // Status change
    root.addEventListener("change", async (e) => {
      if (e.target && e.target.id === "lead-status") {
        const status = e.target.value;
        try {
          await Admin.leads.setStatus(lead.id, status);
          await Admin.activity.add(lead.id, "status_change", `Status changed to ${Admin.STATUS_LABELS[status]}`, "admin");
          await this.load();
        } catch (err) { Admin.toast("Status update failed: " + err.message, "error"); }
        return;
      }
      if (e.target && e.target.id === "lead-assignee") {
        try {
          await Admin.leads.update(lead.id, { assigned_to: e.target.value || null });
          Admin.toast("Assignee updated");
        } catch (err) { Admin.toast("Assignee update failed: " + err.message, "error"); }
        return;
      }
    });
    const editBtn = document.getElementById("lead-edit-btn");
    if (editBtn) editBtn.addEventListener("click", () => AdminPages.lead.openEdit(lead));
    const delBtn = document.getElementById("lead-delete-btn");
    if (delBtn) delBtn.addEventListener("click", () => {
      Admin.confirmDialog({
        title: "Delete lead",
        body: `Delete lead for ${lead.name || "this contact"}? This cannot be undone.`,
        confirmText: "Delete",
        danger: true,
        onConfirm: async () => { try { await Admin.leads.remove([lead.id]); Admin.toast("Lead deleted"); location.href = "/admin/leads.html"; } catch (e) { Admin.toast("Delete failed: " + e.message, "error"); } },
      });
    });
    const noteAdd = document.getElementById("lead-note-add");
    if (noteAdd) noteAdd.addEventListener("click", async () => {
      const input = document.getElementById("lead-note-input");
      const body = input.value.trim();
      if (!body) return;
      await Admin.notes.add(lead.id, body, "admin");
      await Admin.activity.add(lead.id, "note_added", body, "admin");
      input.value = "";
      await this.load();
    });
    const tagAdd = document.getElementById("lead-tag-add");
    if (tagAdd) tagAdd.addEventListener("click", async () => {
      const sel = document.getElementById("lead-tag-select");
      const tagId = sel.value;
      if (!tagId) return;
      const tag = (AdminPages.lead.state.tags || []).find((t) => t.id === tagId);
      if (!tag) return;
      if (AdminPages.lead.state.leadTags.includes(tagId)) { Admin.toast("Tag already applied", "error"); return; }
      await Admin.leadTags.set(lead.id, [...AdminPages.lead.state.leadTags, tagId]);
      await this.load();
    });
  },

  async openEdit(lead) {
    const profiles = await Admin.profiles.list();
    const box = Admin.modal(
      `<h3 style="font-family:'Fraunces',serif;font-size:22px;margin:0 0 8px;">Edit lead</h3>
       <form id="admin-lead-edit-form">
         <label class="admin-label">Name</label><input name="name" class="admin-input" value="${Admin.esc(lead.name || "")}" />
         <label class="admin-label">Phone</label><input name="phone" class="admin-input" value="${Admin.esc(lead.phone || "")}" />
         <label class="admin-label">Email</label><input name="email" class="admin-input" type="email" value="${Admin.esc(lead.email || "")}" />
         <label class="admin-label">Message</label><textarea name="message" class="admin-textarea" rows="4">${Admin.esc(lead.message || "")}</textarea>
         <label class="admin-label">Source</label><input name="source" class="admin-input" value="${Admin.esc(lead.source || "contact")}" />
         <label class="admin-label">Status</label><select name="status" class="admin-select">${Admin.STATUSES.map((s) => `<option value="${s}" ${s === lead.status ? "selected" : ""}>${Admin.STATUS_LABELS[s]}</option>`).join("")}</select>
         <label class="admin-label">Follow-up date</label><input name="follow_up_at" class="admin-input" type="datetime-local" value="${toLocalInput(lead.follow_up_at)}" />
         <label class="admin-label">Assigned to</label><select name="assigned_to" class="admin-select"><option value="">Unassigned</option>${profiles.map((p) => `<option value="${p.id}" ${p.id === lead.assigned_to?.id ? "selected" : ""}>${Admin.esc(p.email || p.full_name || p.id)}</option>`).join("")}</select>
       </form>`
    );
    const form = box.querySelector("form");
    const submit = form.querySelector("button[type=submit]");
    if (!submit) return;
    submit.addEventListener("click", async () => {
      const data = new FormData(form);
      const patch = {
        name: data.get("name"),
        phone: data.get("phone") || null,
        email: data.get("email"),
        message: data.get("message"),
        source: data.get("source") || "contact",
        status: data.get("status") || "new",
        follow_up_at: fromLocalInput(data.get("follow_up_at")),
        assigned_to: data.get("assigned_to") || null,
      };
      await Admin.leads.update(lead.id, patch);
      await Admin.activity.add(lead.id, "edit", "Lead details updated", "admin");
      Admin.closeModal();
      await this.load();
    });
    form.addEventListener("submit", async (e) => { e.preventDefault(); });
  },

  async toggleTag(tagId, on) {
    const ids = new Set(AdminPages.lead.state.leadTags);
    if (on) ids.add(tagId); else ids.delete(tagId);
    try {
      await Admin.leadTags.set(AdminPages.lead.state.id, Array.from(ids));
      AdminPages.lead.state.leadTags = Array.from(ids);
      await this.load();
    } catch (e) { Admin.toast("Tag update failed: " + e.message, "error"); }
  },
};
