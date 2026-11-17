/* Site content editor — /admin/content.html
   Every field maps to a row in public.site_content (key/value).
   Empty value = row deleted = the public site uses its built-in text. */

(function () {
  const UNS = (id) => "https://images.unsplash.com/photo-" + id + "?auto=format&fit=crop&w=400&q=60";

  /* Current default photos of the public site (used as thumbnails). */
  const DEFAULT_PHOTO = {
    mars: "1614728263952-84ea256f9679",
    lab: "1532094349884-543bc11b234d",
    kohat: "1506744038136-46273834b3fb",
    earth: "1446776811953-b23d57bd21aa",
    conf: "1475721027785-f74eccf877e2",
    conf2: "1540575467063-178a50c2df87",
    conf3: "1591115765373-5207764f72e7",
    mic: "1576086213369-97a306d36557",
    bsl: "1582719471384-894fbb16e074",
    edtech: "1523240795612-9a054b0db644",
    growth: "1530836369250-ef72a3f5cda8",
    campus: "1523050854058-8df90110c9f1",
    soil: "1464226184884-fa280b87c399",
    petri: "1579154204601-01588f351e67",
    chamber: "1581093450021-4a7360e9a6b5",
    plants: "1416879595882-3373a0480b5b"
  };

  const expFields = (n) => [
    ["exp" + n + ".year", "Card " + n + " — year / tag", "text"],
    ["exp" + n + ".role", "Card " + n + " — role", "text"],
    ["exp" + n + ".org", "Card " + n + " — organisation & dates", "text"],
    ["exp" + n + ".line1", "Card " + n + " — detail line 1", "text"],
    ["exp" + n + ".line2", "Card " + n + " — detail line 2", "text"]
  ];

  const chapFields = (n) => [
    ["res.c" + n + ".title", "Chapter " + n + " — title (HTML allowed)", "html"],
    ["res.c" + n + ".text", "Chapter " + n + " — text", "area"]
  ];

  const statFields = (n) => [
    ["about.stat" + n + ".value", "Stat " + n + " — number", "text"],
    ["about.stat" + n + ".label", "Stat " + n + " — label", "text"]
  ];

  const eduFields = (n) => [
    ["edu.r" + n + ".title", "Row " + n + " — qualification (HTML allowed)", "html"],
    ["edu.r" + n + ".detail", "Row " + n + " — school & years", "text"]
  ];

  const pubFields = (n) => [
    ["pub" + n + ".title", "Publication " + n + " — title", "text"],
    ["pub" + n + ".authors", "Publication " + n + " — authors", "text"],
    ["pub" + n + ".venue", "Publication " + n + " — journal & year", "text"]
  ];

  const GROUPS = [
    {
      title: "Brand & hero",
      note: "Your name, the big headline and the two hero buttons.",
      fields: [
        ["site.name", "Your name (top-left)", "text"],
        ["nav.cta", "Top-right link text", "text"],
        ["hero.line1", "Headline — line 1", "text"],
        ["hero.line2", "Headline — line 2 (HTML allowed)", "html"],
        ["hero.line3", "Headline — line 3", "text"],
        ["hero.note", "Handwritten note", "text"],
        ["hero.cta1.label", "Button 1 — text", "text"],
        ["hero.cta1.href", "Button 1 — link (e.g. #exp)", "text"],
        ["hero.cta2.label", "Button 2 — text", "text"],
        ["hero.cta2.href", "Button 2 — link (e.g. your CV file)", "text"],
        ["hero.marquee", "Scrolling strip text", "text"],
        ["image.mars", "Photo — Mars landscape", "image"],
        ["image.portrait", "Photo — your portrait", "image"]
      ]
    },
    {
      title: "About",
      note: "The intro paragraph, the handwritten note and the four numbers.",
      fields: [
        ["about.paragraph", "About paragraph (HTML allowed)", "html"],
        ["about.note", "Handwritten note under the paragraph", "text"],
        ...statFields(1),
        ...statFields(2),
        ...statFields(3),
        ...statFields(4),
        ["image.lab", "Photo — lab", "image"],
        ["image.kohat", "Photo — Kohat", "image"],
        ["image.conf", "Photo — conference", "image"]
      ]
    },
    {
      title: "Photo strips",
      note: "The three full-width photo bands between sections.",
      fields: [
        ["band.kohat", "First strip — text", "text"],
        ["band.plants", "Second strip — text", "text"],
        ["band.earth", "Third strip — text", "text"],
        ["image.earth", "Photo — journey strip", "image"]
      ]
    },
    {
      title: "Experience",
      note: "Section heading and the five work cards.",
      fields: [
        ["exp.title", "Section heading (HTML allowed)", "html"],
        ...expFields(1),
        ...expFields(2),
        ...expFields(3),
        ...expFields(4),
        ...expFields(5),
        ["image.mic", "Photo — card 1", "image"],
        ["image.bsl", "Photo — card 2", "image"],
        ["image.edtech", "Photo — card 3", "image"],
        ["image.growth", "Photo — card 4", "image"],
        ["image.campus", "Photo — card 5", "image"]
      ]
    },
    {
      title: "Research",
      note: "Heading, intro and the four chapters.",
      fields: [
        ["res.title", "Section heading (HTML allowed)", "html"],
        ["res.intro", "Intro paragraph", "area"],
        ...chapFields(1),
        ...chapFields(2),
        ...chapFields(3),
        ...chapFields(4),
        ["image.soil", "Photo — soil samples", "image"],
        ["image.petri", "Photo — petri dishes", "image"],
        ["image.chamber", "Photo — growth chamber", "image"],
        ["image.plants", "Photo — plants", "image"]
      ]
    },
    {
      title: "Education",
      note: "Heading and the five rows.",
      fields: [["edu.title", "Section heading (HTML allowed)", "html"], ...eduFields(1), ...eduFields(2), ...eduFields(3), ...eduFields(4), ...eduFields(5)]
    },
    {
      title: "Publications",
      fields: [["pub.title", "Section heading (HTML allowed)", "html"], ...pubFields(1), ...pubFields(2)]
    },
    {
      title: "Conferences",
      fields: [
        ["conf.title", "Section heading (HTML allowed)", "html"],
        ["conf1", "Conference 1 (HTML allowed)", "html"],
        ["conf2", "Conference 2 (HTML allowed)", "html"],
        ["conf3", "Conference 3 (HTML allowed)", "html"],
        ["conf.note", "Closing paragraph (HTML allowed)", "html"],
        ["image.conf2", "Photo — conference strip 1", "image"],
        ["image.conf3", "Photo — conference strip 2", "image"]
      ]
    },
    {
      title: "Gallery & skills",
      fields: [
        ["gal.title", "Photo notes — heading (HTML allowed)", "html"],
        ["skills.title", "What I do — heading (HTML allowed)", "html"]
      ]
    },
    {
      title: "Contact & footer",
      fields: [
        ["contact.title", "Big heading (HTML allowed)", "html"],
        ["contact.languages", "Languages line", "text"],
        ["contact.email", "Email address", "text"],
        ["footer.note", "Footer note", "text"]
      ]
    }
  ];

  const idFor = (key) => "cms-" + key.replace(/[^a-z0-9]+/gi, "-");

  AdminPages.content = {
    map: {},

    async init() {
      const session = await Admin.guard();
      if (!session) return;

      const titleEl = document.getElementById("admin-topbar-title");
      const userEl = document.getElementById("admin-topbar-user");
      if (titleEl) titleEl.textContent = "Site content";
      if (userEl) userEl.textContent = session.user?.email || "";

      const logoutBtn = document.getElementById("admin-logout");
      if (logoutBtn)
        logoutBtn.addEventListener("click", async () => {
          await Admin.auth.signOut();
          location.href = "/admin/login.html";
        });

      const burger = document.getElementById("admin-burger");
      const scrim = document.getElementById("admin-scrim");
      const sidebar = document.getElementById("admin-sidebar");
      if (burger)
        burger.addEventListener("click", () => {
          if (sidebar) sidebar.classList.toggle("open");
          if (scrim) scrim.classList.toggle("show");
        });
      if (scrim)
        scrim.addEventListener("click", () => {
          if (sidebar) sidebar.classList.remove("open");
          scrim.classList.remove("show");
        });

      document.querySelectorAll(".admin-nav a[data-nav]").forEach((a) => {
        a.addEventListener("click", () => {
          document.querySelectorAll(".admin-nav a[data-nav]").forEach((x) => x.classList.remove("active"));
          a.classList.add("active");
          if (sidebar) sidebar.classList.remove("open");
          if (scrim) scrim.classList.remove("show");
        });
      });

      await this.load();
    },

    async load() {
      const root = document.getElementById("admin-content-root");
      root.innerHTML = `<div class="admin-spinner"></div>`;
      let rows = [];
      try {
        const c = await Admin.api();
        const { data, error } = await c.from("site_content").select("key,value");
        if (error) throw error;
        rows = data || [];
      } catch (e) {
        const missing = /PGRST205|42P01|schema cache|does not exist/i.test(e.message || "");
        root.innerHTML = `<div class="admin-card">
            <h3>${missing ? "One-time database setup needed" : "Unable to load content"}</h3>
            <p class="admin-muted">${
              missing
                ? 'The <code>site_content</code> table is not in your Supabase project yet. Open Supabase → SQL Editor, paste the contents of <code>supabase/content.sql</code> from this project and click Run. Then reload this page.'
                : Admin.esc(e.message || "Unknown error")
            }</p>
          </div>`;
        return;
      }
      this.map = Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
      root.innerHTML = this.html();
      this.bind();
    },

    fieldHtml(field) {
      const [key, label, type] = field;
      const id = idFor(key);
      const val = this.map[key] ?? "";
      const tip = `<div class="admin-muted" style="font-size:12px;margin-top:4px;">Empty = site default</div>`;

      if (type === "image") {
        const def = DEFAULT_PHOTO[key.replace(/^image\./, "")];
        const thumbSrc = val || (def ? UNS(def) : "");
        const thumb = thumbSrc
          ? `<img id="${id}-thumb" src="${Admin.esc(thumbSrc)}" alt="" style="width:112px;height:84px;object-fit:cover;border-radius:8px;border:1px solid var(--line);background:var(--sky);flex:0 0 auto;" />`
          : `<div id="${id}-thumb" style="width:112px;height:84px;border-radius:8px;border:1px dashed var(--line);flex:0 0 auto;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--ink-faint);">no photo</div>`;
        return `<div style="margin-bottom:18px;">
            <label class="admin-label" for="${id}">${Admin.esc(label)}</label>
            <div class="admin-row" style="gap:12px;align-items:flex-start;flex-wrap:wrap;">
              ${thumb}
              <div style="flex:1 1 230px;display:grid;gap:8px;">
                <input class="admin-input" id="${id}" data-key="${Admin.esc(key)}" value="${Admin.esc(val)}" placeholder="Paste an image URL or upload a photo →" />
                <div class="admin-row" style="gap:8px;flex-wrap:wrap;">
                  <button type="button" class="admin-btn sm" data-upload-btn="${id}">Upload photo</button>
                  <button type="button" class="admin-btn sm" data-use-default="${id}">Use default</button>
                  <span class="admin-muted" id="${id}-hint" style="font-size:12px;"></span>
                </div>
                <input type="file" accept="image/*" id="${id}-file" style="display:none;" />
              </div>
            </div>
          </div>`;
      }

      if (type === "area" || type === "html") {
        const rows = type === "html" ? 2 : 3;
        return `<div style="margin-bottom:16px;">
            <label class="admin-label" for="${id}">${Admin.esc(label)}</label>
            <textarea class="admin-input" id="${id}" data-key="${Admin.esc(key)}" rows="${rows}" style="width:100%;resize:vertical;font-family:inherit;">${Admin.esc(val)}</textarea>
            ${tip}
          </div>`;
      }

      return `<div style="margin-bottom:14px;">
          <label class="admin-label" for="${id}">${Admin.esc(label)}</label>
          <input class="admin-input" id="${id}" data-key="${Admin.esc(key)}" value="${Admin.esc(val)}" />
          ${tip}
        </div>`;
    },

    html() {
      const groups = GROUPS.map(
        (g) => `
        <div class="admin-card" style="margin-bottom:16px;">
          <h3 style="margin-bottom:4px;">${Admin.esc(g.title)}</h3>
          ${g.note ? `<div class="admin-muted" style="font-size:13px;margin-bottom:14px;">${Admin.esc(g.note)}</div>` : `<div style="height:10px"></div>`}
          ${g.fields.map((f) => this.fieldHtml(f)).join("")}
        </div>`
      ).join("");
      return groups;
    },

    bind() {
      const saveBtns = ["cms-save", "cms-save-top"].map((id) => document.getElementById(id));
      saveBtns.forEach((b) => b && b.addEventListener("click", () => this.save()));

      const reset = document.getElementById("cms-reset");
      if (reset)
        reset.addEventListener("click", () => {
          Admin.confirmDialog({
            title: "Reset all content?",
            body: "Every edited text and photo goes back to the site's original. This cannot be undone.",
            confirmText: "Reset everything",
            onConfirm: async () => {
              try {
                const c = await Admin.api();
                const { error } = await c.from("site_content").delete().neq("key", "");
                if (error) throw error;
                Admin.toast("Content reset to defaults");
                await this.load();
              } catch (e) {
                Admin.toast(e.message || "Reset failed", "error");
              }
            }
          });
        });

      document.querySelectorAll("[data-key]").forEach((inp) => {
        const key = inp.getAttribute("data-key");
        if (key.indexOf("image.") !== 0) return;
        const id = idFor(key);
        const thumb = document.getElementById(id + "-thumb");
        inp.addEventListener("input", () => {
          const url = inp.value.trim();
          if (thumb && thumb.tagName === "IMG") thumb.src = url || (DEFAULT_PHOTO[key.slice(6)] ? UNS(DEFAULT_PHOTO[key.slice(6)]) : "");
        });
        const useDefault = document.querySelector('[data-use-default="' + id + '"]');
        if (useDefault)
          useDefault.addEventListener("click", () => {
            inp.value = "";
            if (thumb && thumb.tagName === "IMG") {
              const def = DEFAULT_PHOTO[key.slice(6)];
              thumb.src = def ? UNS(def) : "";
            }
          });
        const fileInput = document.getElementById(id + "-file");
        const uploadBtn = document.querySelector('[data-upload-btn="' + id + '"]');
        if (uploadBtn && fileInput) {
          uploadBtn.addEventListener("click", () => fileInput.click());
          fileInput.addEventListener("change", () => {
            const file = fileInput.files && fileInput.files[0];
            if (file) this.upload(key, file, inp, thumb, document.getElementById(id + "-hint"));
            fileInput.value = "";
          });
        }
      });
    },

    async upload(key, file, inputEl, thumbEl, hintEl) {
      const hint = (msg, bad) => {
        if (!hintEl) return;
        hintEl.textContent = msg;
        hintEl.style.color = bad ? "var(--danger)" : "var(--ink-faint)";
      };
      if (!/^image\//.test(file.type)) {
        hint("Please choose an image file.", true);
        return;
      }
      if (file.size > 6 * 1024 * 1024) {
        hint("That picture is larger than 6 MB.", true);
        return;
      }
      hint("Uploading…");
      try {
        const c = await Admin.api();
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const path = key.replace(/^image\./, "").replace(/[^a-z0-9]+/gi, "-") + "-" + Date.now() + "." + ext;
        const { error } = await c.storage
          .from("site-images")
          .upload(path, file, { contentType: file.type || "image/jpeg", cacheControl: "31536000", upsert: true });
        if (error) throw error;
        const { data } = c.storage.from("site-images").getPublicUrl(path);
        if (!data || !data.publicUrl) throw new Error("Could not create a public URL");
        inputEl.value = data.publicUrl;
        if (thumbEl && thumbEl.tagName === "IMG") thumbEl.src = data.publicUrl;
        hint("Uploaded — press Save changes to publish.");
      } catch (e) {
        const msg = e.message || "Upload failed";
        hint(/bucket/i.test(msg) ? "Image bucket missing — run supabase/content.sql in Supabase once." : msg, true);
      }
    },

    async save() {
      try {
        const c = await Admin.api();
        const rows = [];
        const dels = [];
        document.querySelectorAll("[data-key]").forEach((inp) => {
          const key = inp.getAttribute("data-key");
          const val = (inp.value || "").trim();
          const orig = this.map[key] || "";
          if (val === orig) return;
          if (!val) dels.push(key);
          else rows.push({ key, value: val, updated_at: new Date().toISOString() });
        });
        if (!rows.length && !dels.length) {
          Admin.toast("No changes to save");
          return;
        }
        if (rows.length) {
          const { error } = await c.from("site_content").upsert(rows, { onConflict: "key" });
          if (error) throw error;
        }
        if (dels.length) {
          const { error } = await c.from("site_content").delete().in("key", dels);
          if (error) throw error;
        }
        rows.forEach((r) => (this.map[r.key] = r.value));
        dels.forEach((k) => delete this.map[k]);
        Admin.toast("Saved — live on the site");
      } catch (e) {
        const msg = e.message || "Save failed";
        Admin.toast(/PGRST205|schema cache/i.test(msg) ? "Run supabase/content.sql in Supabase first" : msg, "error");
      }
    }
  };
})();
