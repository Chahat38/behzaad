/* Login page behaviour */
AdminPages.login = {
  async init() {
    const form = document.getElementById("admin-login-form");
    const err = document.getElementById("admin-login-error");
    const emailEl = document.getElementById("admin-email");
    const passEl = document.getElementById("admin-password");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      err.textContent = "";
      const email = emailEl.value.trim();
      const password = passEl.value;
      const res = await Admin.auth.signIn(email, password);
      if (res.error) {
        err.textContent = res.error.message || "Login failed";
        return;
      }
      if (Admin.auth.isAdmin(res.session)) {
        location.href = "/admin/";
      } else {
        err.textContent = "Access denied. This email is not on the admin list.";
      }
    });

    const forgot = document.getElementById("admin-forgot");
    forgot.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = emailEl.value.trim();
      if (!email) {
        Admin.toast("Enter your email to request a reset link", "error");
        return;
      }
      const res = await Admin.auth.resetPassword(email);
      if (res.error) Admin.toast(res.error.message || "Reset failed", "error");
      else Admin.toast("Password reset link sent to " + email);
    });

    const session = await Admin.auth.getSession();
    if (Admin.auth.isAdmin(session)) location.replace("/admin/");
  },
};
