/* Dashboard page behaviour */
AdminPages.dashboard = {
  async init() {
    const session = await Admin.guard();
    if (!session) return;

    const titleEl = document.getElementById("admin-topbar-title");
    const userEl = document.getElementById("admin-topbar-user");
    if (titleEl) titleEl.textContent = "Dashboard";
    if (userEl) userEl.textContent = session.user?.email || "";

    const logoutBtn = document.getElementById("admin-logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        await Admin.auth.signOut();
        location.href = "/admin/login.html";
      });
    }

    const burger = document.getElementById("admin-burger");
    const scrim = document.getElementById("admin-scrim");
    const sidebar = document.getElementById("admin-sidebar");
    if (burger) {
      burger.addEventListener("click", () => {
        if (sidebar) sidebar.classList.toggle("open");
        if (scrim) scrim.classList.toggle("show");
      });
    }
    if (scrim) scrim.addEventListener("click", () => {
      if (sidebar) sidebar.classList.remove("open");
      scrim.classList.remove("show");
    });

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

    const root = document.getElementById("admin-dashboard-root");
    root.innerHTML = `<div class="admin-spinner"></div>`;
    try {
      const stats = await Admin.stats.compute();
      root.innerHTML = this.html(stats);
      await this.loadLast10(stats.leads);
    } catch (e) {
      root.innerHTML = `<div class="admin-empty"><h3>Unable to load dashboard</h3><p>${Admin.esc(e.message || "Unknown error")}</p></div>`;
    }
  },

  html(stats) {
    const statusItems = Object.keys(stats.byStatus).map((k) => ({ label: Admin.STATUS_LABELS[k] || k, value: stats.byStatus[k] }));
    const sourceItems = Object.keys(stats.bySource).map((k) => ({ label: k, value: stats.bySource[k] }));
    const chart = (items, title) =>
      `<div class="admin-card"><h3>${title}</h3><div>${
        items.length
          ? Admin.barChartSvg(items)
          : '<div class="admin-muted" style="font-size:13px;padding:24px 0">No data yet — it fills in as leads arrive.</div>'
      }</div></div>`;
    return `
      <div class="admin-card" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:20px;">
        <div>
          <h3 style="margin:0 0 2px;">Site content</h3>
          <div class="admin-muted" style="font-size:13px;">Change the words and photos on the public site yourself — no code.</div>
        </div>
        <a class="admin-btn primary" href="/admin/content.html">Edit site content</a>
      </div>
      ${
        stats.total === 0
          ? `<div class="admin-card" style="margin-bottom:20px;"><h3 style="margin:0 0 4px;">No leads yet</h3><div class="admin-muted" style="font-size:13px;">This dashboard stays empty until someone uses the contact form on the site. Send a test message from <a href="/" target="_blank" rel="noopener">the contact section</a> and the lead will appear here.</div></div>`
          : ""
      }
      <div class="admin-grid cols-4">
        <div class="admin-card stat-card"><div class="label">Total leads</div><div class="value">${stats.total}</div><div class="sub">All time</div></div>
        <div class="admin-card stat-card"><div class="label">New today</div><div class="value">${stats.today}</div><div class="sub">Joined in last 24h</div></div>
        <div class="admin-card stat-card"><div class="label">New this week</div><div class="value">${stats.week}</div><div class="sub">Last 7 days</div></div>
        <div class="admin-card stat-card"><div class="label">New this month</div><div class="value">${stats.month}</div><div class="sub">Last 30 days</div></div>
        <div class="admin-card stat-card"><div class="label">Conversion rate</div><div class="value">${stats.conversionRate}%</div><div class="sub">Converted / total</div></div>
      </div>
      <div class="admin-grid cols-2" style="margin-top:20px;">
        ${chart(statusItems, "Leads by status")}
        ${chart(sourceItems, "Leads by source")}
      </div>
      <div class="admin-card" style="margin-top:20px;">
        <h3>Last 10 leads</h3>
        <div style="overflow-x:auto;">
          <table class="admin-table">
            <thead><tr><th>Name</th><th>Source</th><th>Status</th><th>Created</th></tr></thead>
            <tbody id="admin-last10-body"></tbody>
          </table>
        </div>
      </div>`;
  },

  async loadLast10(leads) {
    const tbody = document.getElementById("admin-last10-body");
    if (!tbody) return;
    tbody.innerHTML = "";
    const rows = leads.slice(0, 10);
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="admin-muted" style="padding:18px 0;">No leads yet. Enquiries from the site's contact form appear here.</td></tr>`;
      return;
    }
    for (const l of rows) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${Admin.esc(l.name || "—")}</strong><div style="font-size:12px;color:var(--ink-faint)">${Admin.esc(l.email || "")}</div></td>
        <td>${Admin.esc(l.source || "—")}</td>
        <td>${Admin.statusBadgeHtml(l.status, l.follow_up_at)}</td>
        <td style="white-space:nowrap">${Admin.fmtDateTime(l.created_at)}</td>`;
      tbody.appendChild(tr);
    }
  },
};
