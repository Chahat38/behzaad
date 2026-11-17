/* ============================================================
   Public site content loader.
   Reads rows from public.site_content (editable in
   /admin/content.html) and applies them to [data-cms] nodes.
   If the table is missing or the network fails, nothing changes:
   the page keeps its built-in text and photos.
   ============================================================ */
(function () {
  var SB_URL = window.SUPABASE_URL || "https://pwjxwegkipitvbmcllzi.supabase.co";
  var SB_KEY = window.SUPABASE_ANON_KEY || "sb_publishable_sidyLozgB8ho7S4vAGvEZQ_c0wOwOPH";

  window.CMS_IMG = window.CMS_IMG || {};

  window.CMS_READY = (async function () {
    try {
      var Sb = window.Supabase || window.supabase;
      if (!Sb || !SB_URL || !SB_KEY) return {};
      var client = Sb.createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });
      var res = await client.from("site_content").select("key,value");
      if (res.error) {
        if (res.error.code !== "PGRST205") console.warn("[site content]", res.error.message);
        return {};
      }
      var map = {};
      (res.data || []).forEach(function (r) {
        if (r && r.key && r.value != null && String(r.value).trim() !== "") map[r.key] = r.value;
      });
      return map;
    } catch (e) {
      if (window.console) console.warn("[site content]", e && e.message);
      return {};
    }
  })();

  function q(attr, key) {
    var safe = String(key).replace(/["\\]/g, "");
    return document.querySelectorAll("[" + attr + '="' + safe + '"]');
  }

  function paintImage(key, url) {
    window.CMS_IMG[key] = url;
    var holder = document.querySelector('.ph[data-k="' + String(key).replace(/["\\]/g, "") + '"]');
    if (!holder) return;
    var img = holder.querySelector("img");
    if (!img) {
      img = new Image();
      img.alt = (holder.textContent || "").trim() || "Site photo";
      img.loading = "lazy";
      holder.prepend(img);
    }
    img.onerror = function () {
      img.remove();
    };
    if (img.getAttribute("src") !== url) img.src = url;
  }

  window.applyCMS = function (map) {
    map = map || {};
    Object.keys(map).forEach(function (key) {
      var value = map[key];

      if (key.indexOf("image.") === 0) {
        paintImage(key.slice(6), value);
        return;
      }
      q("data-cms", key).forEach(function (el) {
        el.textContent = value;
      });
      q("data-cms-html", key).forEach(function (el) {
        el.innerHTML = value;
      });
      q("data-cms-href", key).forEach(function (el) {
        el.setAttribute("href", value);
      });
      q("data-cms-mailto", key).forEach(function (el) {
        var addr = String(value).replace(/^mailto:/i, "");
        el.setAttribute("href", "mailto:" + addr);
        el.textContent = addr;
      });
      q("data-cms-num", key).forEach(function (el) {
        var num = String(value).replace(/[^\d.-]/g, "");
        if (num === "") return;
        el.setAttribute("data-c", num);
        el.textContent = num;
      });
    });
    return true;
  };
})();
