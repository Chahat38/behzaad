/* ============================================================
   Behzaad Qureshi — Admin core
   Shared client, auth, helpers, data ops, charts, export.
   Page modules register under window.AdminPages.
   ============================================================ */

window.Admin = window.Admin || {};
window.AdminPages = window.AdminPages || {};

const ADMIN_EMAILS = ["behzadqureshiscience@gmail.com"];
const STATUSES = ["new", "contacted", "follow_up", "converted", "lost"];
const STATUS_LABELS = {
  new: "New",
  contacted: "Contacted",
  follow_up: "Follow-up",
  converted: "Converted",
  lost: "Lost",
};

window.SUPABASE_URL = window.SUPABASE_URL || "https://YOUR_PROJECT_REF.supabase.co";
window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "";

function adminClient() {
  if (!window.Admin.client) {
    window.Admin.client = window.Supabase
      ? window.Supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        })
      : null;
  }
  return window.Admin.client;
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toast(msg, type) {
  let t = document.getElementById("admin-toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "admin-toast";
    t.className = "admin-toast";
    document.body.appendChild(t);
  }
  t.className = "admin-toast" + (type ? " " + type : "");
  t.textContent = msg;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 2600);
  t.classList.add("show");
}

function modal(html) {
  let m = document.getElementById("admin-modal");
  if (!m) {
    m = document.createElement("div");
    m.id = "admin-modal";
    m.className = "admin-modal-back";
    m.innerHTML = '<div class="admin-modal" role="dialog" aria-modal="true"></div>';
    m.addEventListener("click", (e) => {
      if (e.target === m) closeModal();
    });
    document.body.appendChild(m);
  }
  const box = m.querySelector(".admin-modal");
  box.innerHTML = html;
  m.classList.add("show");
  return box;
}

function closeModal() {
  const m = document.getElementById("admin-modal");
  if (m) m.classList.remove("show");
}

function confirmDialog({ title, body, confirmText = "Confirm", danger, onConfirm }) {
  const box = modal(
    `<h3 style="font-family:'Fraunces',serif;font-size:22px;margin:0 0 8px;">${esc(title)}</h3><p style="margin:0;color:var(--ink-soft);">${esc(body)}</p>`
  );
  const row = document.createElement("div");
  row.className = "admin-row";
  row.style.justifyContent = "flex-end";
  row.style.marginTop = "18px";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "admin-btn";
  cancel.textContent = "Cancel";
  cancel.addEventListener("click", () => closeModal());
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "admin-btn danger";
  btn.textContent = confirmText;
  btn.addEventListener("click", async () => {
    closeModal();
    if (onConfirm) await onConfirm();
  });
  row.appendChild(cancel);
  row.appendChild(btn);
  box.appendChild(row);
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
function fmtDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function timeAgo(iso) {
  if (!iso) return "—";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  if (s < 86400 * 30) return Math.floor(s / 86400) + "d ago";
  return fmtDate(iso);
}
function statusBadgeHtml(status, followUpAt) {
  const label = STATUS_LABELS[status] || status || "New";
  const cls = "badge status-" + (status || "new");
  let extra = "";
  if (followUpAt) {
    const due = new Date(followUpAt).getTime();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    if (due < startOfToday) extra = `<span class="badge overdue">Overdue</span>`;
    else if (due >= startOfToday && due < startOfToday + 86400000) extra = `<span class="badge today">Today</span>`;
  }
  return `<span class="${cls}">${esc(label)}</span>${extra ? `<span>${extra}</span>` : ""}`;
}

function followUpBadgeHtml(followUpAt) {
  if (!followUpAt) return "";
  const due = new Date(followUpAt).getTime();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (due < startOfToday) return `<span class="badge overdue">Overdue</span>`;
  if (due >= startOfToday && due < startOfToday + 86400000) return `<span class="badge today">Today</span>`;
  return `<span class="badge">${esc(new Date(followUpAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }))}</span>`;
}
function quickActionsHtml(lead) {
  const tel = lead.phone ? `tel:${String(lead.phone).replace(/[^+\d]/g, "")}` : "#";
  const wa = lead.phone
    ? `https://wa.me/${encodeURIComponent(String(lead.phone).replace(/[^+\d]/g, ""))}?text=${encodeURIComponent("Hi " + (lead.name || "") + ", this is Mian Behzad Nadeem (Behzad Qureshi).")}`
    : "#";
  const mail = lead.email ? `mailto:${lead.email}` : "#";
  const a = (href, label) =>
    `<a class="admin-quick" href="${esc(href)}" ${href.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}><span>${esc(label)}</span></a>`;
  return `<div class="admin-quick" style="display:flex;gap:8px;flex-wrap:wrap;">${a(tel, "Call")}${a(wa, "WhatsApp")}${a(mail, "Email")}</div>`;
}

async function api() {
  const c = adminClient();
  if (!c) throw new Error("Supabase client unavailable");
  return c;
}

window.Admin = window.Admin || {};
window.Admin.STATUSES = STATUSES;
window.Admin.STATUS_LABELS = STATUS_LABELS;
window.Admin.ADMIN_EMAILS = ADMIN_EMAILS;
window.Admin.esc = esc;
window.Admin.fmtDate = fmtDate;
window.Admin.fmtDateTime = fmtDateTime;
window.Admin.timeAgo = timeAgo;
window.Admin.statusBadgeHtml = statusBadgeHtml;
window.Admin.followUpBadgeHtml = followUpBadgeHtml;
window.Admin.quickActionsHtml = quickActionsHtml;
window.Admin.api = api;
window.Admin.modal = modal;
window.Admin.closeModal = closeModal;
window.Admin.toast = toast;
window.Admin.confirmDialog = confirmDialog;
window.Admin.exportCSV = exportCSV;
window.Admin.SUPABASE_URL = window.SUPABASE_URL;
window.Admin.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;

/* ---------------- auth ---------------- */
window.Admin.auth = {
  async getSession() {
    const c = adminClient();
    const { data, error } = await c.auth.getSession();
    if (error) return null;
    return data.session;
  },
  async signIn(email, password) {
    const c = adminClient();
    const { data, error } = await c.auth.signInWithPassword({ email, password });
    return { session: data.session, error };
  },
  async signOut() {
    const c = adminClient();
    await c.auth.signOut();
  },
  async resetPassword(email) {
    const c = adminClient();
    const { error } = await c.auth.resetPasswordForEmail(email, { redirectTo: location.origin + "/admin/login.html" });
    return { error };
  },
  isAdmin(session) {
    if (!session || !session.user || !session.user.email) return false;
    const email = String(session.user.email).toLowerCase();
    return ADMIN_EMAILS.map((e) => String(e).toLowerCase()).includes(email);
  },
};

/* Guard used by every /admin page: redirects to login when not an admin. */
window.Admin.guard = async function () {
  const session = await window.Admin.auth.getSession();
  if (!window.Admin.auth.isAdmin(session)) {
    location.href = "/admin/login.html";
    return null;
  }
  return session;
};

/* ---------------- leads ---------------- */
window.Admin.leads = {
  async list(opts = {}) {
    const c = adminClient();
    let q = c
      .from("leads")
      .select(
        "id, name, phone, email, message, source, status, follow_up_at, created_at, assigned_to:profiles!leads_assigned_to_fkey(id, email, full_name), tags:lead_tags(tag_id:tags!lead_tags_tag_id_fkey(id, name))"
      )
      .order("created_at", { ascending: false });
    if (opts.status) q = q.eq("status", opts.status);
    if (opts.source) q = q.eq("source", opts.source);
    if (opts.assigned_to) q = q.eq("assigned_to", opts.assigned_to);
    if (opts.from) q = q.gte("created_at", opts.from);
    if (opts.to) q = q.lte("created_at", opts.to);
    if (opts.q) {
      const term = opts.q.trim().toLowerCase();
      q = q.or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,message.ilike.%${term}%`);
    }
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    let rows = data || [];
    if (opts.sort) {
      const dir = opts.order === "asc" ? 1 : -1;
      rows = [...rows].sort((a, b) => {
        const av = a[opts.sort];
        const bv = b[opts.sort];
        if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
        return String(av ?? "").localeCompare(String(bv ?? "")) * dir;
      });
    }
    const page = opts.page || 1;
    const size = opts.pageSize || 10;
    const start = (page - 1) * size;
    return { leads: rows.slice(start, start + size), total: rows.length, page, pageSize: size };
  },
  async all() {
    const c = adminClient();
    const { data, error } = await c.from("leads").select("*");
    if (error) throw new Error(error.message);
    return data || [];
  },
  async get(id) {
    const c = adminClient();
    const { data, error } = await c.from("leads").select("*").eq("id", id).single();
    if (error) throw new Error(error.message);
    return data;
  },
  async create(d) {
    const c = adminClient();
    const { data: lead, error } = await c.from("leads").insert(d).select().single();
    if (error) throw new Error(error.message);
    return lead;
  },
  async update(id, patch) {
    const c = adminClient();
    const { data, error } = await c.from("leads").update(patch).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  async setStatus(id, status) {
    const c = adminClient();
    const { data, error } = await c.from("leads").update({ status, updated_at: new Date().toISOString() }).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  async remove(ids) {
    const c = adminClient();
    const { error } = await c.from("leads").delete().in("id", ids);
    if (error) throw new Error(error.message);
  },
};

window.Admin.notes = {
  async list(leadId) {
    const c = adminClient();
    const { data, error } = await c.from("notes").select("*").eq("lead_id", leadId).order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  },
  async add(leadId, body, author) {
    const c = adminClient();
    const { data, error } = await c.from("notes").insert({ lead_id: leadId, body, author }).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  async remove(id) {
    const c = adminClient();
    const { error } = await c.from("notes").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

window.Admin.tags = {
  async list() {
    const c = adminClient();
    const { data, error } = await c.from("tags").select("*").order("name");
    if (error) throw new Error(error.message);
    return data || [];
  },
  async create(name) {
    const c = adminClient();
    const { data, error } = await c.from("tags").insert({ name }).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  async remove(id) {
    const c = adminClient();
    const { error } = await c.from("tags").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

window.Admin.leadTags = {
  async list(leadId) {
    const c = adminClient();
    const { data, error } = await c.from("lead_tags").select("tag_id:tags!lead_tags_tag_id_fkey(id, name)").eq("lead_id", leadId);
    if (error) throw new Error(error.message);
    return (data || []).map((r) => r.tag_id).filter(Boolean);
  },
  async set(leadId, tagIds) {
    const c = adminClient();
    const { error } = await c.from("lead_tags").delete().eq("lead_id", leadId);
    if (error) throw new Error(error.message);
    if (tagIds && tagIds.length) {
      const rows = tagIds.map((tag_id) => ({ lead_id: leadId, tag_id }));
      const { error: e2 } = await c.from("lead_tags").insert(rows);
      if (e2) throw new Error(e2.message);
    }
  },
};

window.Admin.activity = {
  async list(leadId) {
    const c = adminClient();
    const { data, error } = await c.from("activity_log").select("*").eq("lead_id", leadId).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },
  async add(leadId, action, detail, actor) {
    const c = adminClient();
    const { error } = await c.from("activity_log").insert({ lead_id: leadId, action, detail: detail || null, actor: actor || null });
    if (error) throw new Error(error.message);
  },
};

window.Admin.profiles = {
  async list() {
    const c = adminClient();
    const { data, error } = await c.from("profiles").select("id, email, full_name, role").order("created_at");
    if (error) throw new Error(error.message);
    return data || [];
  },
};

window.Admin.stats = {
  async compute() {
    const leads = await window.Admin.leads.all();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = startOfToday - ((now.getDay() + 6) % 7) * 86400000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 0, 0, 0, 0).getTime();
    const total = leads.length;
    const today = leads.filter((l) => new Date(l.created_at).getTime() >= startOfToday).length;
    const week = leads.filter((l) => new Date(l.created_at).getTime() >= startOfWeek).length;
    const month = leads.filter((l) => new Date(l.created_at).getTime() >= startOfMonth).length;
    const byStatus = {};
    const bySource = {};
    for (const l of leads) {
      byStatus[l.status] = (byStatus[l.status] || 0) + 1;
      bySource[l.source] = (bySource[l.source] || 0) + 1;
    }
    const converted = byStatus.converted || 0;
    const conversionRate = total ? Math.round((converted / total) * 1000) / 10 : 0;
    const last10 = leads.slice(0, 10);
    return { total, today, week, month, byStatus, bySource, conversionRate, leads, last10 };
  },
};

/* ---------------- charts ---------------- */
function barChartSvg(items) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const w = 560, h = 200, pad = 10;
  const bw = Math.min(64, (w - pad * 2) / Math.max(1, items.length) - 18);
  const gap = (w - pad * 2 - bw * items.length) / Math.max(1, items.length - 1);
  const bars = items
    .map((it, i) => {
      const bh = (it.value / max) * (h - 44);
      const x = pad + i * (bw + gap);
      const y = h - 24 - bh;
      return `<rect x="${x}" y="${y}" width="${bw}" height="${Math.max(0, bh)}" rx="6" fill="#6b7f3a" opacity="${0.35 + 0.65 * (it.value / max)}"></rect><text x="${x + bw / 2}" y="${h - 8}" text-anchor="middle" font-size="11" fill="#33422a" font-family="Inter, sans-serif">${esc(it.label)}</text>`;
    })
    .join("");
  const maxLabel = items.reduce((m, i) => (i.value > m ? i.value : m), 0);
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img"><rect x="0" y="0" width="${w}" height="${h}" rx="12" fill="#e9eedc" opacity="0.35"/>${bars}${maxLabel ? `<text x="${w - pad}" y="14" text-anchor="end" font-size="12" fill="#33422a" font-family="Fraunces, serif">${maxLabel}</text>` : ""}</svg>`;
}

function donutSvg(items) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  const r = 60, cx = 80, cy = 80, sw = 26;
  let acc = 0;
  const segs = items
    .map((it) => {
      const frac = it.value / total;
      const start = acc;
      acc += frac;
      const a0 = start * Math.PI * 2 - Math.PI / 2;
      const a1 = (start + frac) * Math.PI * 2 - Math.PI / 2;
      const large = frac > 0.5 ? 1 : 0;
      const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      const path = `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
      return `<path d="${path}" stroke="#6b7f3a" stroke-width="${sw}" fill="none" stroke-opacity="0.9"></path>`;
    })
    .join("");
  return `<svg viewBox="0 0 160 160" width="160" height="160"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e9eedc" stroke-width="${sw}"/>${segs}<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="26" fill="#33422a" font-family="Fraunces, serif" font-weight="600">${total}</text><text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="9" fill="#33422a" font-family="Inter, sans-serif" letter-spacing="1" text-transform="uppercase">total</text></svg>`;
}

/* ---------------- CSV export ---------------- */
function exportCSV(leads) {
  const head = ["id", "name", "phone", "email", "message", "source", "status", "follow_up_at", "created_at", "assigned_to"];
  const rows = leads.map((l) =>
    [l.id, l.name, l.phone || "", l.email, String(l.message || "").replace(/\n/g, " "), l.source, l.status, l.follow_up_at || "", l.created_at, l.assigned_to ? l.assigned_to.email : ""]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [head.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "leads-" + new Date().toISOString().slice(0, 10) + ".csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
