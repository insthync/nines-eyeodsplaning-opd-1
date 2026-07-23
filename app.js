(() => {
  "use strict";

  const DEFAULT_CONFIG = {
    pocketBaseUrl: window.location.origin,
    collection: "surgery_cases",
    authCollection: "users",
    requireAuth: true,
    writeRoles: ["admin", "editor"],
    refreshIntervalMs: 30000,
  };

  const config = { ...DEFAULT_CONFIG, ...(window.APP_CONFIG || {}) };
  const LOCAL_STORAGE_KEY = "or-planning-board-cases-v1";
  const START_HOUR = 8;
  const END_HOUR = 21;
  const SLOT_MINUTES = 30;
  const START_TIMES = Array.from(
    { length: ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES },
    (_, index) => minutesToTime(START_HOUR * 60 + index * SLOT_MINUTES),
  );

  const STATUS_META = {
    confirmed: { label: "OR รับเคสแล้ว", color: "var(--confirmed)" },
    waitlist: { label: "รอจัดห้อง", color: "var(--waitlist)" },
    coordination: { label: "รอประสานงาน", color: "var(--coordination)" },
  };

  const ANESTHESIA_LABELS = {
    general: "ดมยาสลบ",
    local: "ฉีดยาชา",
    regional: "ระงับความรู้สึกเฉพาะส่วน",
  };

  const elements = {
    addButton: document.querySelector("#add-case-button"),
    addButtonIcon: document.querySelector("#add-case-button path"),
    printButton: document.querySelector("#print-button"),
    syncStatus: document.querySelector("#sync-status"),
    syncStatusLabel: document.querySelector("#sync-status-label"),
    viewTabs: Array.from(document.querySelectorAll(".view-tab")),
    previousPeriod: document.querySelector("#previous-period"),
    todayButton: document.querySelector("#today-button"),
    nextPeriod: document.querySelector("#next-period"),
    dateDisplay: document.querySelector("#date-display"),
    dailyView: document.querySelector("#daily-view"),
    calendarGrid: document.querySelector("#calendar-grid"),
    monthlyView: document.querySelector("#monthly-view"),
    monthlyHeading: document.querySelector("#monthly-heading"),
    monthSummary: document.querySelector("#month-summary"),
    monthGrid: document.querySelector("#month-grid"),
    dashboardView: document.querySelector("#dashboard-view"),
    dashboardHeading: document.querySelector("#dashboard-heading"),
    metricTotal: document.querySelector("#metric-total"),
    metricConfirmed: document.querySelector("#metric-confirmed"),
    metricWaitlist: document.querySelector("#metric-waitlist"),
    metricCoordination: document.querySelector("#metric-coordination"),
    statusBreakdown: document.querySelector("#status-breakdown"),
    busyDaysList: document.querySelector("#busy-days-list"),
    roomUsage: document.querySelector("#room-usage"),
    caseModal: document.querySelector("#case-modal"),
    caseForm: document.querySelector("#case-form"),
    caseFormTitle: document.querySelector("#case-form-title"),
    closeModal: document.querySelector("#close-modal"),
    cancelButton: document.querySelector("#cancel-button"),
    deleteCaseButton: document.querySelector("#delete-case-button"),
    saveCaseButton: document.querySelector("#save-case-button"),
    formError: document.querySelector("#form-error"),
    surgeryDate: document.querySelector("#surgery-date"),
    operatingRoom: document.querySelector("#operating-room"),
    startTime: document.querySelector("#start-time"),
    duration: document.querySelector("#duration"),
    patientName: document.querySelector("#patient-name"),
    hn: document.querySelector("#hn"),
    doctor: document.querySelector("#doctor"),
    procedure: document.querySelector("#procedure"),
    anesthesia: document.querySelector("#anesthesia"),
    status: document.querySelector("#status"),
    deleteModal: document.querySelector("#delete-modal"),
    keepCaseButton: document.querySelector("#keep-case-button"),
    confirmDeleteButton: document.querySelector("#confirm-delete-button"),
    authModal: document.querySelector("#auth-modal"),
    authForm: document.querySelector("#auth-form"),
    authIdentity: document.querySelector("#auth-identity"),
    authPassword: document.querySelector("#auth-password"),
    authError: document.querySelector("#auth-error"),
    closeAuth: document.querySelector("#close-auth"),
    loginButton: document.querySelector("#login-button"),
    logoutButton: document.querySelector("#logout-button"),
    toast: document.querySelector("#toast"),
    emptyTemplate: document.querySelector("#empty-state-template"),
  };

  const state = {
    selectedDate: todayISO(),
    view: "daily",
    cases: [],
    editingId: null,
    loading: false,
    toastTimer: null,
  };

  class AuthenticationError extends Error {}
  class AuthorizationError extends Error {}

  class LocalCaseStore {
    constructor() {
      this.kind = "local";
    }

    get isAuthenticated() {
      return true;
    }

    async list() {
      try {
        const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
        return Array.isArray(saved) ? saved.map(normalizeRecord) : [];
      } catch {
        return [];
      }
    }

    async create(data) {
      const items = await this.list();
      const now = new Date().toISOString();
      const record = {
        ...data,
        id: createLocalId(),
        created: now,
        updated: now,
      };
      items.push(record);
      this.save(items);
      return record;
    }

    async update(id, data) {
      const items = await this.list();
      const index = items.findIndex((item) => item.id === id);
      if (index < 0) throw new Error("ไม่พบเคสที่ต้องการแก้ไข");
      items[index] = { ...items[index], ...data, updated: new Date().toISOString() };
      this.save(items);
      return items[index];
    }

    async delete(id) {
      const items = await this.list();
      this.save(items.filter((item) => item.id !== id));
    }

    save(items) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    }
  }

  class PocketBaseCaseStore {
    constructor(options) {
      this.kind = "pocketbase";
      this.baseUrl = options.pocketBaseUrl.replace(/\/+$/, "");
      this.collection = options.collection;
      this.authCollection = options.authCollection;
      this.requireAuth = Boolean(options.requireAuth);
      this.writeRoles = Array.isArray(options.writeRoles) ? options.writeRoles : ["admin", "editor"];
      this.authKey = `or-planning-board-auth:${this.baseUrl}:${this.authCollection}`;
      this.auth = this.readAuth();
    }

    get isAuthenticated() {
      return Boolean(this.auth?.token);
    }

    get authRecord() {
      return this.auth?.record || null;
    }

    get canChange() {
      return this.isAuthenticated && this.authRecord?.active !== false && this.writeRoles.includes(this.authRecord?.role);
    }

    readAuth() {
      try {
        return JSON.parse(sessionStorage.getItem(this.authKey) || "null");
      } catch {
        return null;
      }
    }

    async login(identity, password) {
      const result = await this.request(
        `/api/collections/${encodeURIComponent(this.authCollection)}/auth-with-password`,
        {
          method: "POST",
          body: JSON.stringify({ identity, password }),
          skipAuth: true,
        },
      );
      this.auth = { token: result.token, record: result.record };
      sessionStorage.setItem(this.authKey, JSON.stringify(this.auth));
      return result.record;
    }

    logout() {
      this.auth = null;
      sessionStorage.removeItem(this.authKey);
    }

    async list() {
      const items = [];
      let page = 1;
      let totalPages = 1;
      do {
        const params = new URLSearchParams({
          page: String(page),
          perPage: "500",
          sort: "surgery_date,start_time",
        });
        const result = await this.request(
          `/api/collections/${encodeURIComponent(this.collection)}/records?${params}`,
        );
        items.push(...(result.items || []));
        totalPages = Number(result.totalPages || 1);
        page += 1;
      } while (page <= totalPages);
      return items.map(normalizeRecord);
    }

    async create(data) {
      return normalizeRecord(
        await this.request(`/api/collections/${encodeURIComponent(this.collection)}/records`, {
          method: "POST",
          body: JSON.stringify(data),
        }),
      );
    }

    async update(id, data) {
      return normalizeRecord(
        await this.request(
          `/api/collections/${encodeURIComponent(this.collection)}/records/${encodeURIComponent(id)}`,
          { method: "PATCH", body: JSON.stringify(data) },
        ),
      );
    }

    async delete(id) {
      await this.request(
        `/api/collections/${encodeURIComponent(this.collection)}/records/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
    }

    async request(path, options = {}) {
      const headers = { ...(options.body ? { "Content-Type": "application/json" } : {}) };
      if (!options.skipAuth && this.auth?.token) headers.Authorization = this.auth.token;
      if (!options.skipAuth && this.requireAuth && !this.auth?.token) {
        throw new AuthenticationError("กรุณาเข้าสู่ระบบก่อนใช้งานฐานข้อมูลส่วนกลาง");
      }

      let response;
      try {
        response = await fetch(`${this.baseUrl}${path}`, {
          method: options.method || "GET",
          headers,
          body: options.body,
        });
      } catch {
        throw new Error("เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบ URL และเครือข่าย");
      }

      let payload = null;
      if (response.status !== 204) {
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }
      }

      if (!response.ok) {
        if (response.status === 401) {
          if (!options.skipAuth) this.logout();
          throw new AuthenticationError(payload?.message || "บัญชีนี้ไม่มีสิทธิ์เข้าถึงข้อมูล");
        }
        if (response.status === 403) {
          throw new AuthorizationError(payload?.message || "บัญชีนี้ไม่มีสิทธิ์เปลี่ยนแปลงข้อมูล");
        }
        const fieldMessage = payload?.data
          ? Object.values(payload.data).find((item) => item?.message)?.message
          : null;
        throw new Error(fieldMessage || payload?.message || `PocketBase ตอบกลับ ${response.status}`);
      }
      return payload;
    }
  }

  const store = config.pocketBaseUrl
    ? new PocketBaseCaseStore(config)
    : new LocalCaseStore();

  function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  }

  function timeToMinutes(value) {
    const [hours, minutes] = String(value).split(":").map(Number);
    return hours * 60 + minutes;
  }

  function todayISO() {
    const now = new Date();
    return toISODate(now);
  }

  function toISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseISODate(value) {
    const [year, month, day] = String(value).split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  function addDays(value, amount) {
    const date = parseISODate(value);
    date.setDate(date.getDate() + amount);
    return toISODate(date);
  }

  function addMonths(value, amount) {
    const date = parseISODate(value);
    const originalDay = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + amount);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0, 12).getDate();
    date.setDate(Math.min(originalDay, lastDay));
    return toISODate(date);
  }

  function formatThaiDate(value, options = {}) {
    return new Intl.DateTimeFormat("th-TH", {
      weekday: options.short ? "short" : "long",
      day: "numeric",
      month: options.short ? "short" : "long",
      year: options.hideYear ? undefined : "numeric",
    }).format(parseISODate(value));
  }

  function formatThaiMonth(value) {
    return new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric" }).format(
      parseISODate(value),
    );
  }

  function normalizeRecord(record) {
    return {
      id: String(record.id || ""),
      surgery_date: String(record.surgery_date || ""),
      operating_room: record.operating_room === "OR 2" ? "OR 2" : "OR 1",
      start_time: String(record.start_time || "08:00").slice(0, 5),
      duration: Number(record.duration || 60),
      patient_name: String(record.patient_name || ""),
      hn: String(record.hn || ""),
      doctor: String(record.doctor || ""),
      procedure: String(record.procedure || ""),
      anesthesia: String(record.anesthesia || "general"),
      status: STATUS_META[record.status] ? record.status : "coordination",
      created: record.created || "",
      updated: record.updated || "",
    };
  }

  function createLocalId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `case-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function buildEmptyState(message) {
    const node = elements.emptyTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector("p").textContent = message;
    return node;
  }

  function setSyncState(type, label) {
    if (store.kind === "pocketbase") {
      elements.syncStatus.hidden = !store.isAuthenticated;
    }
    elements.syncStatus.classList.toggle("loading", type === "loading");
    elements.syncStatus.classList.toggle("error", type === "error");
    elements.syncStatusLabel.textContent = label;
  }

  function updateSyncLabel() {
    if (store.kind === "local") {
      elements.syncStatus.hidden = false;
      elements.syncStatus.disabled = true;
      setSyncState("ready", "บันทึกในเครื่องนี้");
      return;
    }
    elements.syncStatus.disabled = false;
    if (store.isAuthenticated) {
      const name = store.authRecord?.name || store.authRecord?.email || "PocketBase";
      const role = roleLabel(store.authRecord?.role);
      setSyncState("ready", `เข้าสู่ระบบแล้ว · ${name}${role ? ` · ${role}` : ""}`);
    } else if (config.requireAuth) {
      setSyncState("error", "ต้องเข้าสู่ระบบก่อน");
    } else {
      setSyncState("ready", "เข้าสู่ระบบ");
    }
  }

  function roleLabel(role) {
    return { admin: "ผู้ดูแล", editor: "ผู้จัดตาราง", viewer: "ดูอย่างเดียว" }[role] || "";
  }

  function canChangeData() {
    return store.kind === "local" ? true : store.canChange;
  }

  function updatePermissionState() {
    const allowed = canChangeData();
    const needsLogin = store.kind === "pocketbase" && !store.isAuthenticated;
    const label = needsLogin
      ? "เข้าสู่ระบบ"
      : allowed
        ? "เพิ่มเคสผ่าตัด"
        : "บัญชีนี้ดูข้อมูลได้อย่างเดียว";
    elements.addButton.disabled = !needsLogin && !allowed;
    elements.addButton.title = label;
    elements.addButton.setAttribute("aria-label", label);
    elements.addButtonIcon.setAttribute(
      "d",
      needsLogin
        ? "M10 17l5-5-5-5M15 12H3M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"
        : "M12 5v14M5 12h14",
    );
  }

  async function loadCases({ quiet = false } = {}) {
    if (state.loading) return;
    state.loading = true;
    if (!quiet) setSyncState("loading", "กำลังซิงก์ข้อมูล");
    try {
      state.cases = (await store.list()).sort(compareCases);
      render();
      updateSyncLabel();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        state.cases = [];
        render();
        updateSyncLabel();
        if (!quiet) openAuthModal();
      } else {
        setSyncState("error", "ยังไม่ได้เข้าสู่ระบบ");
        if (!quiet) showToast(error.message, "error");
      }
    } finally {
      state.loading = false;
    }
  }

  function compareCases(a, b) {
    return `${a.surgery_date}-${a.start_time}-${a.operating_room}`.localeCompare(
      `${b.surgery_date}-${b.start_time}-${b.operating_room}`,
    );
  }

  function populateStartTimes() {
    elements.startTime.replaceChildren();
    START_TIMES.forEach((time) => {
      const option = createElement("option", "", `${time} น.`);
      option.value = time;
      elements.startTime.append(option);
    });
  }

  function setView(view) {
    if (!['daily', 'monthly', 'dashboard'].includes(view)) return;
    state.view = view;
    elements.viewTabs.forEach((tab) => {
      const active = tab.dataset.view === view;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-pressed", String(active));
    });
    elements.dailyView.hidden = view !== "daily";
    elements.monthlyView.hidden = view !== "monthly";
    elements.dashboardView.hidden = view !== "dashboard";
    render();
  }

  function render() {
    updatePermissionState();
    updateDateDisplay();
    renderDailyView();
    renderMonthlyView();
    renderDashboard();
  }

  function updateDateDisplay() {
    elements.dateDisplay.textContent =
      state.view === "daily" ? formatThaiDate(state.selectedDate) : formatThaiMonth(state.selectedDate);
  }

  function renderDailyView() {
    const grid = elements.calendarGrid;
    grid.replaceChildren();
    grid.style.setProperty("--slot-count", String(START_TIMES.length));

    ["เวลา", "OR 1", "OR 2"].forEach((label, columnIndex) => {
      const header = createElement(
        "div",
        `grid-header${columnIndex === 0 ? " time-header" : ""}`,
        label,
      );
      header.style.gridColumn = String(columnIndex + 1);
      header.style.gridRow = "1";
      grid.append(header);
    });

    START_TIMES.forEach((time, slotIndex) => {
      const row = slotIndex + 2;
      const timeCell = createElement(
        "div",
        `time-cell${time.endsWith(":00") ? " full-hour" : ""}`,
        time,
      );
      timeCell.style.gridColumn = "1";
      timeCell.style.gridRow = String(row);
      grid.append(timeCell);

      ["OR 1", "OR 2"].forEach((room, roomIndex) => {
        const slot = createElement("button", `slot-cell ${room === "OR 2" ? "room-two" : "room-one"}`);
        slot.type = "button";
        slot.style.gridColumn = String(roomIndex + 2);
        slot.style.gridRow = String(row);
        slot.dataset.room = room;
        slot.dataset.time = time;
        slot.disabled = !canChangeData();
        slot.setAttribute("aria-label", `${room} เวลา ${time} น. เพิ่มเคส`);
        slot.addEventListener("click", () => openCaseModal({ operating_room: room, start_time: time }));
        grid.append(slot);
      });
    });

    const dayCases = state.cases.filter((item) => item.surgery_date === state.selectedDate);
    dayCases.forEach((item) => {
      const start = timeToMinutes(item.start_time);
      const slotIndex = Math.floor((start - START_HOUR * 60) / SLOT_MINUTES);
      if (slotIndex < 0 || slotIndex >= START_TIMES.length) return;

      const visibleSlots = Math.min(
        Math.max(1, Math.ceil(item.duration / SLOT_MINUTES)),
        START_TIMES.length - slotIndex,
      );
      const card = createElement("button", `case-card ${item.status}`);
      card.type = "button";
      card.style.gridColumn = item.operating_room === "OR 2" ? "3" : "2";
      card.style.gridRow = `${slotIndex + 2} / span ${visibleSlots}`;
      card.setAttribute(
        "aria-label",
        `${item.patient_name} ${item.procedure} ${item.operating_room} เวลา ${item.start_time} น.`,
      );
      card.title = `${item.patient_name}\n${item.procedure}\n${item.doctor}`;
      card.append(
        createElement("span", "case-time", `${item.start_time} · ${item.duration} นาที`),
        createElement("strong", "case-patient", item.patient_name),
        createElement("span", "case-procedure", item.procedure),
      );
      card.addEventListener("click", () => editCase(item.id));
      grid.append(card);
    });

    if (dayCases.length === 0) {
      const hint = createElement("p", "daily-empty", "ยังไม่มีเคสในวันนี้ — เลือกช่องเวลา หรือกด “เพิ่มเคส” เพื่อเริ่มต้น");
      grid.append(hint);
    }
  }

  function renderMonthlyView() {
    const selected = parseISODate(state.selectedDate);
    const year = selected.getFullYear();
    const month = selected.getMonth();
    elements.monthlyHeading.textContent = formatThaiMonth(state.selectedDate);

    const monthCases = state.cases.filter((item) => {
      const date = parseISODate(item.surgery_date);
      return date.getFullYear() === year && date.getMonth() === month;
    });
    const monthMinutes = monthCases.reduce((sum, item) => sum + item.duration, 0);
    elements.monthSummary.textContent = `${monthCases.length} เคส · ${formatHours(monthMinutes)} ชั่วโมง`;

    elements.monthGrid.replaceChildren();
    ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].forEach((day) => {
      elements.monthGrid.append(createElement("div", "weekday", day));
    });

    const firstCell = new Date(year, month, 1, 12);
    firstCell.setDate(firstCell.getDate() - firstCell.getDay());

    for (let index = 0; index < 42; index += 1) {
      const date = new Date(firstCell);
      date.setDate(firstCell.getDate() + index);
      const iso = toISODate(date);
      const outside = date.getMonth() !== month;
      const dayCases = state.cases.filter((item) => item.surgery_date === iso);
      const dayButton = createElement(
        "button",
        `month-day${outside ? " outside" : ""}${iso === state.selectedDate ? " selected" : ""}${iso === todayISO() ? " today" : ""}`,
      );
      dayButton.type = "button";
      dayButton.setAttribute("aria-label", `${formatThaiDate(iso)} ${dayCases.length} เคส`);
      dayButton.append(createElement("span", "day-number", String(date.getDate())));

      if (dayCases.length > 0) {
        dayButton.append(createElement("span", "day-case-count", `${dayCases.length} เคส`));
        const preview = createElement("span", "month-cases");
        dayCases.slice(0, 2).forEach((item) => {
          const row = createElement("span", "month-case");
          row.append(
            createElement("i", item.status),
            createElement("span", "", `${item.start_time} ${item.patient_name}`),
          );
          preview.append(row);
        });
        if (dayCases.length > 2) {
          preview.append(createElement("span", "more-cases", `+${dayCases.length - 2} เคส`));
        }
        dayButton.append(preview);
      }

      dayButton.addEventListener("click", () => {
        state.selectedDate = iso;
        setView("daily");
      });
      elements.monthGrid.append(dayButton);
    }
  }

  function renderDashboard() {
    const selected = parseISODate(state.selectedDate);
    const year = selected.getFullYear();
    const month = selected.getMonth();
    const monthCases = state.cases.filter((item) => {
      const date = parseISODate(item.surgery_date);
      return date.getFullYear() === year && date.getMonth() === month;
    });

    elements.dashboardHeading.textContent = formatThaiMonth(state.selectedDate);
    elements.metricTotal.textContent = String(monthCases.length);
    elements.metricConfirmed.textContent = String(countStatus(monthCases, "confirmed"));
    elements.metricWaitlist.textContent = String(countStatus(monthCases, "waitlist"));
    elements.metricCoordination.textContent = String(countStatus(monthCases, "coordination"));

    elements.statusBreakdown.replaceChildren();
    Object.entries(STATUS_META).forEach(([status, meta]) => {
      const count = countStatus(monthCases, status);
      const percent = monthCases.length ? Math.round((count / monthCases.length) * 100) : 0;
      const row = createElement("div", "breakdown-row");
      const label = createElement("span", "breakdown-label");
      const dot = createElement("i", status);
      dot.style.background = meta.color;
      label.append(dot, document.createTextNode(meta.label));
      const track = createElement("div", "breakdown-track");
      const bar = createElement("div", "breakdown-bar");
      bar.style.width = `${percent}%`;
      bar.style.background = meta.color;
      track.append(bar);
      row.append(label, track, createElement("span", "breakdown-number", `${count} · ${percent}%`));
      elements.statusBreakdown.append(row);
    });

    const dayCounts = new Map();
    monthCases.forEach((item) => dayCounts.set(item.surgery_date, (dayCounts.get(item.surgery_date) || 0) + 1));
    const busiest = Array.from(dayCounts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 4);
    elements.busyDaysList.replaceChildren();
    if (busiest.length === 0) {
      elements.busyDaysList.append(buildEmptyState("ยังไม่มีข้อมูลเคสสำหรับเดือนนี้"));
    } else {
      busiest.forEach(([date, count], index) => {
        const row = createElement("div", "busy-day");
        row.append(
          createElement("span", "busy-rank", String(index + 1)),
          createElement("p", "busy-date", formatThaiDate(date, { short: true })),
          createElement("span", "busy-count", `${count} เคส`),
        );
        elements.busyDaysList.append(row);
      });
    }

    const roomMinutes = {
      "OR 1": monthCases.filter((item) => item.operating_room === "OR 1").reduce((sum, item) => sum + item.duration, 0),
      "OR 2": monthCases.filter((item) => item.operating_room === "OR 2").reduce((sum, item) => sum + item.duration, 0),
    };
    const maxMinutes = Math.max(1, ...Object.values(roomMinutes));
    elements.roomUsage.replaceChildren();
    Object.entries(roomMinutes).forEach(([room, minutes]) => {
      const item = createElement("div", "usage-item");
      const track = createElement("div", "usage-track");
      const bar = createElement("div", "usage-bar");
      bar.style.width = `${Math.round((minutes / maxMinutes) * 100)}%`;
      bar.style.background = room === "OR 1" ? "var(--teal)" : "var(--coordination)";
      track.append(bar);
      item.append(
        createElement("span", "usage-room", room),
        track,
        createElement("span", "usage-value", `${formatHours(minutes)} ชั่วโมง`),
      );
      elements.roomUsage.append(item);
    });
  }

  function countStatus(items, status) {
    return items.filter((item) => item.status === status).length;
  }

  function formatHours(minutes) {
    return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 1 }).format(minutes / 60);
  }

  function openCaseModal(prefill = {}) {
    if (store.kind === "pocketbase" && !store.isAuthenticated) {
      openAuthModal();
      showToast("เข้าสู่ระบบก่อนเพิ่มหรือแก้ไขเคส", "error");
      return;
    }
    if (!canChangeData()) {
      showToast("บัญชีนี้มีสิทธิ์ดูข้อมูลอย่างเดียว", "error");
      return;
    }

    state.editingId = null;
    setCaseFormReadOnly(false);
    elements.caseForm.reset();
    elements.caseFormTitle.textContent = "เพิ่มเคสผ่าตัด";
    elements.deleteCaseButton.hidden = true;
    elements.surgeryDate.value = prefill.surgery_date || state.selectedDate;
    elements.operatingRoom.value = prefill.operating_room || "OR 1";
    elements.startTime.value = prefill.start_time || "08:00";
    elements.duration.value = "60";
    elements.anesthesia.value = "general";
    elements.status.value = "confirmed";
    clearFormError();
    showModal(elements.caseModal);
    window.setTimeout(() => elements.patientName.focus(), 20);
  }

  function editCase(id) {
    const item = state.cases.find((record) => record.id === id);
    if (!item) return;
    if (store.kind === "pocketbase" && config.requireAuth && !store.isAuthenticated) {
      openAuthModal();
      return;
    }

    state.editingId = id;
    const readOnly = !canChangeData();
    setCaseFormReadOnly(readOnly);
    elements.caseFormTitle.textContent = readOnly ? "รายละเอียดเคสผ่าตัด" : "แก้ไขเคสผ่าตัด";
    elements.deleteCaseButton.hidden = readOnly;
    elements.surgeryDate.value = item.surgery_date;
    elements.operatingRoom.value = item.operating_room;
    elements.startTime.value = item.start_time;
    elements.duration.value = String(item.duration);
    elements.patientName.value = item.patient_name;
    elements.hn.value = item.hn;
    elements.doctor.value = item.doctor;
    elements.procedure.value = item.procedure;
    elements.anesthesia.value = item.anesthesia;
    elements.status.value = item.status;
    clearFormError();
    showModal(elements.caseModal);
    window.setTimeout(() => elements.patientName.focus(), 20);
  }

  function setCaseFormReadOnly(readOnly) {
    elements.caseForm.querySelectorAll("input, select, textarea").forEach((control) => {
      control.disabled = readOnly;
    });
    elements.saveCaseButton.hidden = readOnly;
    elements.cancelButton.textContent = readOnly ? "ปิด" : "ยกเลิก";
  }

  function collectFormData() {
    return {
      surgery_date: elements.surgeryDate.value,
      operating_room: elements.operatingRoom.value,
      start_time: elements.startTime.value,
      duration: Number(elements.duration.value),
      patient_name: elements.patientName.value.trim(),
      hn: elements.hn.value.trim().toUpperCase(),
      doctor: elements.doctor.value.trim(),
      procedure: elements.procedure.value.trim(),
      anesthesia: elements.anesthesia.value,
      status: elements.status.value,
    };
  }

  function findConflict(candidate) {
    const candidateStart = timeToMinutes(candidate.start_time);
    const candidateEnd = candidateStart + candidate.duration;
    return state.cases.find((item) => {
      if (item.id === state.editingId) return false;
      if (item.surgery_date !== candidate.surgery_date || item.operating_room !== candidate.operating_room) {
        return false;
      }
      const itemStart = timeToMinutes(item.start_time);
      const itemEnd = itemStart + item.duration;
      return candidateStart < itemEnd && candidateEnd > itemStart;
    });
  }

  async function saveCase(event) {
    event.preventDefault();
    if (!elements.caseForm.checkValidity()) {
      elements.caseForm.reportValidity();
      return;
    }

    const data = collectFormData();
    const conflict = findConflict(data);
    if (conflict) {
      showFormError(
        `เวลานี้ทับกับเคส ${conflict.patient_name} (${conflict.start_time}–${minutesToTime(
          timeToMinutes(conflict.start_time) + conflict.duration,
        )} น.) ใน ${conflict.operating_room}`,
      );
      return;
    }

    const wasEditing = Boolean(state.editingId);
    setSaving(true);
    try {
      if (state.editingId) {
        await store.update(state.editingId, data);
      } else {
        await store.create(data);
      }
      state.selectedDate = data.surgery_date;
      await loadCases({ quiet: true });
      closeCaseModal();
      setView("daily");
      showToast(wasEditing ? "อัปเดตเคสเรียบร้อยแล้ว" : "เพิ่มเคสลงตารางเรียบร้อยแล้ว");
    } catch (error) {
      if (error instanceof AuthenticationError) {
        closeCaseModal();
        openAuthModal();
      } else if (error instanceof AuthorizationError) {
        showFormError("บัญชีนี้ไม่มีสิทธิ์เปลี่ยนแปลงข้อมูล");
      } else {
        showFormError(error.message);
      }
    } finally {
      setSaving(false);
    }
  }

  function setSaving(saving) {
    elements.saveCaseButton.disabled = saving;
    elements.saveCaseButton.classList.toggle("loading", saving);
  }

  function showFormError(message) {
    elements.formError.textContent = message;
    elements.formError.hidden = false;
  }

  function clearFormError() {
    elements.formError.textContent = "";
    elements.formError.hidden = true;
  }

  function closeCaseModal() {
    hideModal(elements.caseModal);
    state.editingId = null;
    setCaseFormReadOnly(false);
    clearFormError();
  }

  function openDeleteModal() {
    if (!state.editingId) return;
    elements.caseModal.inert = true;
    elements.caseModal.setAttribute("aria-hidden", "true");
    showModal(elements.deleteModal);
  }

  function closeDeleteModal() {
    hideModal(elements.deleteModal);
    elements.caseModal.inert = false;
    elements.caseModal.removeAttribute("aria-hidden");
  }

  async function confirmDelete() {
    if (!state.editingId) return;
    const id = state.editingId;
    elements.confirmDeleteButton.disabled = true;
    try {
      await store.delete(id);
      closeDeleteModal();
      closeCaseModal();
      await loadCases({ quiet: true });
      showToast("ลบเคสออกจากตารางแล้ว");
    } catch (error) {
      if (error instanceof AuthenticationError) {
        closeDeleteModal();
        closeCaseModal();
        openAuthModal();
      } else if (error instanceof AuthorizationError) {
        closeDeleteModal();
        showFormError("บัญชีนี้ไม่มีสิทธิ์ลบเคส");
      } else {
        showToast(error.message, "error");
      }
    } finally {
      elements.confirmDeleteButton.disabled = false;
    }
  }

  function openAuthModal() {
    if (store.kind !== "pocketbase") return;
    elements.authError.hidden = true;
    elements.authPassword.value = "";
    elements.logoutButton.hidden = !store.isAuthenticated;
    elements.loginButton.textContent = store.isAuthenticated ? "เข้าสู่ระบบบัญชีอื่น" : "เข้าสู่ระบบ";
    showModal(elements.authModal);
    window.setTimeout(() => elements.authIdentity.focus(), 20);
  }

  function closeAuthModal() {
    hideModal(elements.authModal);
    elements.authError.hidden = true;
  }

  async function login(event) {
    event.preventDefault();
    elements.authError.hidden = true;
    elements.loginButton.disabled = true;
    try {
      await store.login(elements.authIdentity.value.trim(), elements.authPassword.value);
      closeAuthModal();
      await loadCases();
      showToast("เข้าสู่ระบบเรียบร้อยแล้ว");
    } catch (error) {
      elements.authError.textContent = error.message || "เข้าสู่ระบบไม่สำเร็จ";
      elements.authError.hidden = false;
    } finally {
      elements.loginButton.disabled = false;
    }
  }

  function logout() {
    if (store.kind !== "pocketbase") return;
    store.logout();
    state.cases = [];
    render();
    closeAuthModal();
    updateSyncLabel();
    showToast("ออกจากระบบแล้ว");
  }

  function showModal(modal) {
    modal.hidden = false;
    document.body.classList.add("modal-open");
  }

  function hideModal(modal) {
    modal.hidden = true;
    if (![elements.caseModal, elements.deleteModal, elements.authModal].some((item) => !item.hidden)) {
      document.body.classList.remove("modal-open");
    }
  }

  function showToast(message, type = "success") {
    window.clearTimeout(state.toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.toggle("error", type === "error");
    elements.toast.classList.add("show");
    state.toastTimer = window.setTimeout(() => elements.toast.classList.remove("show"), 3200);
  }

  function changePeriod(amount) {
    state.selectedDate = state.view === "daily"
      ? addDays(state.selectedDate, amount)
      : addMonths(state.selectedDate, amount);
    render();
  }

  function bindEvents() {
    elements.addButton.addEventListener("click", () => {
      if (store.kind === "pocketbase" && !store.isAuthenticated) {
        openAuthModal();
        return;
      }
      openCaseModal();
    });
    elements.printButton.addEventListener("click", () => window.print());
    elements.syncStatus.addEventListener("click", openAuthModal);
    elements.viewTabs.forEach((tab) => tab.addEventListener("click", () => setView(tab.dataset.view)));
    elements.previousPeriod.addEventListener("click", () => changePeriod(-1));
    elements.nextPeriod.addEventListener("click", () => changePeriod(1));
    elements.todayButton.addEventListener("click", () => {
      state.selectedDate = todayISO();
      render();
    });
    elements.caseForm.addEventListener("submit", saveCase);
    elements.closeModal.addEventListener("click", closeCaseModal);
    elements.cancelButton.addEventListener("click", closeCaseModal);
    elements.deleteCaseButton.addEventListener("click", openDeleteModal);
    document.querySelector("[data-close-modal]").addEventListener("click", closeCaseModal);
    elements.keepCaseButton.addEventListener("click", closeDeleteModal);
    elements.confirmDeleteButton.addEventListener("click", confirmDelete);
    document.querySelector("[data-close-delete]").addEventListener("click", closeDeleteModal);
    elements.authForm.addEventListener("submit", login);
    elements.closeAuth.addEventListener("click", closeAuthModal);
    elements.logoutButton.addEventListener("click", logout);
    document.querySelector("[data-close-auth]").addEventListener("click", closeAuthModal);

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (!elements.deleteModal.hidden) closeDeleteModal();
      else if (!elements.authModal.hidden) closeAuthModal();
      else if (!elements.caseModal.hidden) closeCaseModal();
    });

    if (store.kind === "local") {
      window.addEventListener("storage", (event) => {
        if (event.key === LOCAL_STORAGE_KEY) loadCases({ quiet: true });
      });
    }
  }

  async function initialize() {
    populateStartTimes();
    bindEvents();
    render();
    await loadCases();

    if (store.kind === "pocketbase" && config.requireAuth && !store.isAuthenticated) {
      openAuthModal();
    }

    if (store.kind === "pocketbase" && Number(config.refreshIntervalMs) > 0) {
      window.setInterval(() => {
        if (document.visibilityState === "visible" && (store.isAuthenticated || !config.requireAuth)) {
          loadCases({ quiet: true });
        }
      }, Number(config.refreshIntervalMs));
    }
  }

  initialize();
})();
