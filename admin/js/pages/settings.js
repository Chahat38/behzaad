/* Settings page behaviour */
AdminPages.settings = {
  async init() {
    const session = await Admin.guard();
    if (!session) return;
    const titleEl = document.getElementById("admin-topbar-title");
    const userEl = document.getElementById("admin-topbar-user");
    if (titleEl) titleEl.textContent = "Settings";
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

    const root = document.getElementById("admin-settings-root");
    root.innerHTML = `<div class="admin-spinner"></div>`;
    await this.load();
  },

  async load() {
    const root = document.getElementById("admin-settings-root");
    root.innerHTML = `<div class="admin-spinner"></div>`;
    try {
      const [tags, profiles] = await Promise.all([Admin.tags.list().catch(() => []), Admin.profiles.list().catch(() => [])]);
      root.innerHTML = this.html(tags, profiles);
      this.bind();
    } catch (e) {
      root.innerHTML = `<div class="admin-empty"><h3>Unable to load settings</h3><p>${Admin.esc(e.message || "Unknown error")}</p></div>`;
    }
  },

  html(tags, profiles) {
    const statusRows = Admin.STATUSES.map((s) => `
      <div class="admin-row" style="justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--line);">
        <span><span class="badge status-${s}">${Admin.esc(Admin.STATUS_LABELS[s] || s)}</span></span>
        <input class="admin-input" style="max-width: 260px;" data-status="${s}" value="${Admin.esc(Admin.STATUS_LABELS[s] || s)}" />
      </div>`).join("");
    const tagList = tags.length
      ? tags.map((t) => `<div class="admin-row" style="justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--line);">
          <span class="tag-chip">${Admin.esc(t.name)}</span>
          <button class="admin-btn sm danger" data-tag-del="${t.id}">Delete</button>
        </div>`).join("")
      : `<div class="admin-muted" style="font-size:13px">No tags yet.</div>`;
    const profileList = profiles.length
      ? profiles.map((p) => `<div class="admin-row" style="justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--line);">
          <span><strong>${Admin.esc(p.email || "")}</strong> <span class="admin-muted" style="font-size:12px;">${Admin.esc(p.full_name || "")} · ${Admin.esc(p.role || "")}</span></span>
        </div>`).join("")
      : `<div class="admin-muted" style="font-size:13px">No team members yet.</div>`;
    return `
      <div class="admin-card">
        <h3>Status pipeline</h3>
        ${statusRows}
        <div class="admin-row" style="margin-top:14px;">
          <button class="admin-btn primary" id="settings-save-status">Save labels</button>
        </div>
      </div>
      <div class="admin-card">
        <h3>Tags</h3>
        <div class="admin-row">
          <input id="settings-new-tag" class="admin-input" placeholder="New tag name" />
          <button class="admin-btn primary" id="settings-add-tag">Add</button>
        </div>
        <div id="settings-tag-list" style="margin-top:12px;">${tagList}</div>
      </div>
      <div class="admin-card">
        <h3>Team</h3>
        <div id="settings-profile-list">${profileList}</div>
      </div>`;
  },

  bind() {
    const saveStatus = document.getElementById("settings-save-status");
    if (saveStatus) saveStatus.addEventListener("click", () => {
      document.querySelectorAll('[data-status]').forEach((inp) => {
        const val = (inp.value || "").trim();
        if (val) Admin.STATUS_LABELS[inp.getAttribute("data-status")] = val;
      });
      Admin.toast("Status labels updated");
    });
    const addTag = document.getElementById("settings-add-tag");
    if (addTag) addTag.addEventListener("click", async () => {
      const input = document.getElementById("settings-new-tag");
      const name = (input.value || "").trim();
      if (!name) return;
      await Admin.tags.create(name);
      input.value = "";
      await this.load();
    });
    const tagListEl = document.getElementById("settings-tag-list");
    if (tagListEl) {
      tagListEl.addEventListener("click", async (e) => {
        const btn = e.target.closest("[data-tag-del]");
        if (!btn) return;
        const id = btn.getAttribute("data-tag-del");
        await Admin.tags.remove(id);
        await this.load();
      });
    }
  },
};
