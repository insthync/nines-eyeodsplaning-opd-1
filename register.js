(() => {
  "use strict";

  const config = window.APP_CONFIG || {};
  const baseUrl = String(config.pocketBaseUrl || window.location.origin).replace(/\/$/, "");
  const form = document.querySelector("#registration-form");
  const formPanel = document.querySelector("#registration-form-panel");
  const successPanel = document.querySelector("#registration-success");
  const submitButton = document.querySelector("#registration-submit");
  const errorElement = document.querySelector("#registration-error");

  function setError(message = "") {
    errorElement.textContent = message;
    errorElement.hidden = !message;
  }

  function setLoading(loading) {
    submitButton.disabled = loading;
    submitButton.classList.toggle("loading", loading);
    form.setAttribute("aria-busy", String(loading));
  }

  function validate(values) {
    if (!values.name || !values.email || !values.password || !values.passwordConfirm) {
      return "กรุณากรอกข้อมูลให้ครบทุกช่อง";
    }
    if (values.name.length > 120) {
      return "ชื่อต้องไม่เกิน 120 ตัวอักษร";
    }
    if (values.password.length < 8) {
      return "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
    }
    if (values.password.length > 72) {
      return "รหัสผ่านต้องไม่เกิน 72 ตัวอักษร";
    }
    if (values.password !== values.passwordConfirm) {
      return "รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน";
    }
    return "";
  }

  async function register(values) {
    const response = await fetch(`${baseUrl}/api/or-planner/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    let body = {};
    try {
      body = await response.json();
    } catch {
      // A generic message below handles non-JSON proxy/server failures.
    }

    if (!response.ok) {
      throw new Error(body.message || "ไม่สามารถสร้างบัญชีได้ กรุณาตรวจสอบข้อมูลแล้วลองอีกครั้ง");
    }
    return body;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setError();

    const data = new FormData(form);
    const values = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim().toLowerCase(),
      password: String(data.get("password") || ""),
      passwordConfirm: String(data.get("passwordConfirm") || ""),
      website: String(data.get("website") || ""),
    };
    const validationMessage = validate(values);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setLoading(true);
    try {
      const account = await register(values);
      document.querySelector("#registered-name").textContent = account.name || values.name;
      form.reset();
      formPanel.hidden = true;
      successPanel.hidden = false;
      successPanel.focus?.();
    } catch (error) {
      setError(error instanceof Error ? error.message : "ไม่สามารถสร้างบัญชีได้ กรุณาลองอีกครั้ง");
    } finally {
      setLoading(false);
    }
  });
})();
