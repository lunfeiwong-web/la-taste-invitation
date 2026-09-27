(function () {
  const mapsUrl = "https://www.google.com/maps/search/?api=1&query=La%20Taste%203%20%E6%82%A6%20Riverfront%20City%20Sungai%20Petani";
  const restaurantWhatsapp = "60124633400";
  const publicSiteUrl = "https://la-taste-e-invitation-card.netlify.app/";
  const storageKey = "laTasteBookingsV2";
  const floorKey = "laTasteFloorNotesV1";
  const tables = ["La Taste X 3 悦", "La Taste Event Space"];
  const fixedBookings = [
    {
      id: "fixed-jasper-nyiew-2026-09-26-birthday",
      name: "Jasper Nyiew",
      phone: "0194777947",
      date: "2026-09-26",
      time: "7.00pm to 10.00pm",
      pax: "",
      type: "Birthday / 生日",
      festivalType: "Birthday / 生日",
      table: "",
      status: "Confirmed",
      anniversary: "",
      tag: "",
      cover: "birthday",
      photo: "",
      welcome: "Welcome To Jasper Nyiew 21st Birthday Party",
      dietary: "",
      note: "",
      createdAt: "2026-09-24T00:00:00.000+08:00",
      source: "fixed-invitation-link"
    }
  ];
  const coverImages = {
    restaurant: "images/la-taste-cover.png",
    birthday: "images/event-birthday-backdrop.png",
    baby: "images/event-baby-fullmoon-eggs.png",
    company: "images/event-canape-dessert-bites.png",
    wedding: "images/event-dessert-table-lace.png",
    private: "images/event-party-setup-arch.png",
    buffet: "images/event-space-buffet-canape.png"
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const valueOrDash = (value) => value && value.trim() ? value.trim() : "-";
  const todayIso = () => new Date().toISOString().slice(0, 10);
  const makeId = () => window.crypto?.randomUUID ? window.crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const isLocalPreview = () => ["127.0.0.1", "localhost", ""].includes(window.location.hostname);
  const publicPageUrl = (path) => isLocalPreview() ? new URL(path, window.location.href) : new URL(path, window.location.href);
  const isFestivalBooking = (booking) => booking?.bookingMode === "festival" || Boolean(booking?.festivalType);

  function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value || "";
  }

  function resetBookingForm() {
    const form = $("#bookingForm");
    if (!form) return;
    form.reset();
    setValue("editingId", "");
    setValue("date", todayIso());
    setValue("bookingMode", "normal");
    setValue("festivalType", "");
    const saveButton = $("#saveBooking");
    if (saveButton) saveButton.textContent = "保存预订 / Save";
    const cancelButton = $("#cancelEdit");
    if (cancelButton) cancelButton.hidden = true;
    updateLink();
  }

  function setupRevealAnimation() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    items.forEach((item) => observer.observe(item));
  }

  function copyText(text, statusEl, successMessage) {
    if (!text) return;

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        if (statusEl) statusEl.textContent = successMessage;
      }).catch(() => fallbackCopy(text, statusEl, successMessage));
      return;
    }

    fallbackCopy(text, statusEl, successMessage);
  }

  function fallbackCopy(text, statusEl, successMessage) {
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
    if (statusEl) statusEl.textContent = successMessage;
  }

  function normalisePhone(phone) {
    const digits = (phone || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("60")) return digits;
    if (digits.startsWith("0")) return "6" + digits;
    return digits;
  }

  function bookingKey(booking) {
    return [
      normalisePhone(booking.phone),
      booking.date || "",
      (booking.time || "").toLowerCase().replace(/\s+/g, ""),
      (booking.name || "").toLowerCase().replace(/\s+/g, "")
    ].join("|");
  }

  function mergeFixedBookings(bookings) {
    const merged = Array.isArray(bookings) ? bookings.slice() : [];
    const keys = new Set(merged.map(bookingKey));
    fixedBookings.forEach((booking) => {
      if (!keys.has(bookingKey(booking))) {
        merged.push({ ...booking });
        keys.add(bookingKey(booking));
      }
    });
    return merged;
  }

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  function formatShortDate(iso) {
    if (!iso) return "-";
    const date = new Date(`${iso}T00:00:00`);
    return date.toLocaleDateString("zh-MY", { month: "short", day: "numeric" });
  }

  function getBookings() {
    const existing = readJson(storageKey, null);
    if (existing) {
      const tableMap = {
        "包厢 A": "La Taste Event Space",
        "包厢 B": "La Taste X 3 悦",
        "大厅 T1": "La Taste X 3 悦",
        "大厅 T2": "La Taste X 3 悦",
        "大厅 T3": "La Taste X 3 悦",
        "活动区": "La Taste Event Space",
        "Event Space 1": "La Taste Event Space",
        "阁楼": "La Taste X 3 悦",
        "Event Space C": "La Taste Event Space",
        "Event Space D": "La Taste Event Space"
      };
      const migrated = existing.map((booking) => ({
        ...booking,
        table: tableMap[booking.table] || booking.table
      }));
      const merged = mergeFixedBookings(migrated);
      if (JSON.stringify(existing) !== JSON.stringify(merged)) saveBookings(merged);
      return merged;
    }

    const today = todayIso();
    const demo = [
      {
        id: makeId(),
        name: "Mr Tan",
        phone: "0123456789",
        date: today,
        time: "7:00pm",
        pax: "10",
        type: "Birthday / 生日",
        festivalType: "Birthday / 生日",
        table: "La Taste Event Space",
        status: "Confirmed",
        anniversary: `${new Date().getFullYear()}-08-18`,
        tag: "熟客",
        dietary: "不吃牛",
        note: "需要靠近舞台、加毛巾",
        createdAt: new Date().toISOString()
      },
      {
        id: makeId(),
        name: "Ms Lee",
        phone: "0168882233",
        date: today,
        time: "8:15pm",
        pax: "4",
        type: "Private Party / 私人派对",
        festivalType: "Private Party / 私人派对",
        table: "La Taste X 3 悦",
        status: "Pending",
        anniversary: `${new Date().getFullYear()}-07-12`,
        tag: "",
        dietary: "花生过敏",
        note: "宝宝椅 1 张",
        createdAt: new Date().toISOString()
      },
      {
        id: makeId(),
        name: "J&F Team",
        phone: "0193337788",
        date: addDays(new Date(), 1).toISOString().slice(0, 10),
        time: "12:30pm",
        pax: "18",
        type: "Company Celebration / 公司庆祝",
        festivalType: "Company Celebration / 公司庆祝",
        table: "La Taste Event Space",
        status: "Confirmed",
        anniversary: "",
        tag: "企业客户",
        dietary: "",
        note: "需要投影和茶水",
        createdAt: new Date().toISOString()
      }
    ];

    const seeded = mergeFixedBookings(demo);
    writeJson(storageKey, seeded);
    return seeded;
  }

  function saveBookings(bookings) {
    writeJson(storageKey, mergeFixedBookings(bookings));
  }

  function getFloorNotes() {
    return readJson(floorKey, []);
  }

  function saveFloorNotes(notes) {
    writeJson(floorKey, notes);
  }

  function coverFromType(type, selectedCover) {
    if (selectedCover && selectedCover !== "auto") return selectedCover;
    const lowerType = (type || "").toLowerCase();
    if (lowerType.includes("birthday")) return "birthday";
    if (lowerType.includes("baby") || lowerType.includes("full moon") || lowerType.includes("gender") || lowerType.includes("捉周")) return "baby";
    if (lowerType.includes("company") || lowerType.includes("product") || lowerType.includes("workshop")) return "company";
    if (lowerType.includes("wedding") || lowerType.includes("rom")) return "wedding";
    if (lowerType.includes("private")) return "private";
    return "restaurant";
  }

  function welcomeByType(type, host) {
    const name = host || "我们";
    const lowerType = (type || "").toLowerCase();
    if (lowerType.includes("gender")) {
      return {
        headline: "Gender Reveal Party",
        title: `欢迎来到 ${name} 派对`,
        message: `亲爱的家人朋友，诚邀您来到 ${name} 的 Gender Reveal 派对，一起见证这个甜蜜又期待的时刻。\nDear family and friends, you are warmly invited to ${name}'s Gender Reveal party. Let us celebrate this lovely moment together.`
      };
    }
    if (lowerType.includes("birthday")) {
      return {
        headline: "Birthday Party",
        title: `欢迎来到 ${name} 派对`,
        message: `亲爱的家人朋友，诚邀您来到 ${name} 的生日派对，一起吃饭、聊天、拍照，把这一刻变成温暖的回忆。\nDear family and friends, you are warmly invited to ${name}'s birthday party. Let us enjoy good food, laughter and a memorable celebration together.`
      };
    }
    if (lowerType.includes("baby") || lowerType.includes("full moon")) {
      return {
        headline: "Baby Celebration",
        title: `欢迎来到 ${name} 派对`,
        message: `亲爱的家人朋友，诚邀您来到 ${name} 的宝宝庆祝派对，一起分享这份珍贵的小幸福。\nDear family and friends, you are warmly invited to ${name}'s baby celebration. Thank you for sharing this beautiful joy with us.`
      };
    }
    if (lowerType.includes("company") || lowerType.includes("product") || lowerType.includes("workshop")) {
      return {
        headline: "活动邀请",
        title: "欢迎大家一起参与这场特别活动",
        message: `${name} 诚挚邀请您出席这场活动。期待在舒适的空间里交流、分享与相聚，也谢谢每一位来宾的支持。`
      };
    }
    if (lowerType.includes("wedding") || lowerType.includes("rom")) {
      return {
        headline: "Wedding Celebration",
        title: `欢迎来到 ${name} 派对`,
        message: `亲爱的家人朋友，诚邀您来到 ${name} 的庆祝派对，一起见证这份幸福。\nDear family and friends, you are warmly invited to ${name}'s celebration. Your presence will make the day even more meaningful.`
      };
    }
    return {
      headline: "诚邀您一起相聚",
      title: `欢迎来到 ${name} 派对`,
      message: `亲爱的家人朋友，诚邀您来到 ${name} 的派对，在 La Taste 3悦 一起分享温暖的相聚时光。\nDear family and friends, you are warmly invited to ${name}'s party at La Taste 3悦. We look forward to sharing this special moment with you.`
    };
  }

  function buildInvitationUrl() {
    const base = publicPageUrl("invitation.html");
    const fields = ["name", "date", "time", "table", "welcome", "bookingMode", "festivalType"];

    fields.forEach((field) => {
      const input = document.getElementById(field);
      if (input && input.value.trim()) {
        base.searchParams.set(field, input.value.trim());
      }
    });

    const cover = coverFromType($("#festivalType")?.value || "", "auto");
    if (cover) base.searchParams.set("cover", cover);
    return base.toString();
  }

  function bookingFromForm() {
    const bookingMode = $("#bookingMode")?.value || "normal";
    const festivalType = $("#festivalType")?.value || "";
    return {
      id: $("#editingId")?.value || makeId(),
      bookingMode,
      festivalType,
      name: $("#name")?.value.trim() || "",
      phone: $("#phone")?.value.trim() || "",
      date: $("#date")?.value || todayIso(),
      time: $("#time")?.value.trim() || "",
      pax: $("#pax")?.value.trim() || "",
      type: festivalType || (bookingMode === "normal" ? "Normal Reservation / 普通预订" : ""),
      table: $("#table")?.value || "",
      status: $("#status")?.value || "Pending",
      anniversary: $("#anniversary")?.value || "",
      tag: $("#tag")?.value || "",
      cover: coverFromType(festivalType, "auto"),
      photo: "",
      welcome: $("#welcome")?.value.trim() || "",
      dietary: $("#dietary")?.value.trim() || "",
      note: $("#note")?.value.trim() || "",
      createdAt: new Date().toISOString()
    };
  }

  function bookingFromInvitationParams(params) {
    const name = (params.get("name") || "").trim();
    const phone = (params.get("phone") || "").trim();
    const date = (params.get("date") || "").trim();
    const time = (params.get("time") || "").trim();
    if (!name || !phone || !date || !time) return null;

    return {
      id: `invite-${date}-${normalisePhone(phone)}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name,
      phone,
      date,
      time,
      pax: "",
      type: (params.get("festivalType") || params.get("type") || "").trim(),
      bookingMode: (params.get("bookingMode") || "normal").trim(),
      festivalType: (params.get("festivalType") || "").trim(),
      table: (params.get("table") || "").trim(),
      status: "Confirmed",
      anniversary: "",
      tag: "",
      cover: coverFromType(params.get("festivalType") || params.get("type") || "", params.get("cover") || "auto"),
      photo: "",
      welcome: (params.get("welcome") || "").trim(),
      dietary: "",
      note: (params.get("note") || "").trim(),
      createdAt: new Date().toISOString(),
      source: "invitation-url"
    };
  }

  function importBookingFromInvitationParams(params) {
    const booking = bookingFromInvitationParams(params);
    if (!booking) return false;
    const bookings = getBookings();
    const key = bookingKey(booking);
    if (bookings.some((item) => bookingKey(item) === key)) return false;
    bookings.push(booking);
    saveBookings(bookings);
    return true;
  }

  function buildInviteMessage(booking, invitationUrl) {
    return [
      "邀请函链接 / Invitation link:",
      invitationUrl,
      "",
      `您好 ${booking.name || "Guest"}，这是 La Taste 3悦 为您准备的电子邀请函。`,
      `Hi ${booking.name || "Guest"}, here is your invitation from La Taste 3悦.`
    ].join("\n");
  }

  function buildConfirmMessage(booking) {
    return [
      `您好 ${booking.name || "Guest"}，这里是 La Taste x 3悦。`,
      `跟您确认预订：${booking.date || "-"} ${booking.time || "-"}，${booking.pax || "-"} pax，${booking.type || "聚会"}。`,
      booking.table ? `安排：${booking.table}。` : "",
      booking.dietary ? `忌口/过敏：${booking.dietary}。` : "",
      booking.note ? `备注：${booking.note}。` : "",
      "如资料正确，回复 OK 即可，谢谢。"
    ].filter(Boolean).join("\n");
  }

  function updateLink() {
    const output = $("#generatedLink");
    const whatsappBtn = $("#sendWhatsapp");
    const confirmBtn = $("#confirmWhatsapp");
    if (!output || !whatsappBtn) return;

    const booking = bookingFromForm();
    const invitationUrl = buildInvitationUrl();
    const phone = normalisePhone(booking.phone);
    output.value = invitationUrl;

    whatsappBtn.href = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(buildInviteMessage(booking, invitationUrl))}`
      : `https://wa.me/?text=${encodeURIComponent(buildInviteMessage(booking, invitationUrl))}`;

    if (confirmBtn) {
      confirmBtn.href = phone
        ? `https://wa.me/${phone}?text=${encodeURIComponent(buildConfirmMessage(booking))}`
        : `https://wa.me/?text=${encodeURIComponent(buildConfirmMessage(booking))}`;
    }
  }

  function switchTab(targetId) {
    $$(".tab-btn").forEach((btn) => btn.classList.toggle("is-active", btn.dataset.tab === targetId));
    $$(".tab-panel").forEach((panel) => panel.classList.toggle("is-active", panel.id === targetId));
  }

  function classifyCustomers(bookings) {
    const byPhone = new Map();
    bookings.forEach((booking) => {
      const key = normalisePhone(booking.phone) || booking.name;
      if (!key) return;
      if (!byPhone.has(key)) {
        byPhone.set(key, { name: booking.name, phone: booking.phone, count: 0, lastDate: "", tags: new Set(), anniversary: "" });
      }
      const customer = byPhone.get(key);
      customer.count += 1;
      customer.name = booking.name || customer.name;
      customer.phone = booking.phone || customer.phone;
      customer.lastDate = !customer.lastDate || booking.date > customer.lastDate ? booking.date : customer.lastDate;
      if (booking.tag) customer.tags.add(booking.tag);
      if (booking.anniversary) customer.anniversary = booking.anniversary;
    });

    return Array.from(byPhone.values()).map((customer) => {
      const daysSince = customer.lastDate ? Math.floor((new Date(todayIso()) - new Date(`${customer.lastDate}T00:00:00`)) / 86400000) : 0;
      let segment = "新客户";
      if (customer.tags.has("VIP") || customer.count >= 4) segment = "VIP";
      else if (customer.tags.has("熟客") || customer.count >= 2) segment = "熟客";
      if (daysSince > 45) segment = "沉睡客户";
      return { ...customer, segment, daysSince, tags: Array.from(customer.tags) };
    }).sort((a, b) => b.count - a.count);
  }

  function renderMiniCalendar(bookings, selectedDate) {
    const container = $("#miniCalendar");
    if (!container) return;
    const base = new Date(`${selectedDate}T00:00:00`);
    container.innerHTML = "";

    for (let i = -3; i <= 3; i += 1) {
      const date = addDays(base, i).toISOString().slice(0, 10);
      const count = bookings.filter((booking) => booking.date === date).length;
      const button = document.createElement("button");
      button.type = "button";
      button.className = `day-card${date === selectedDate ? " is-selected" : ""}`;
      button.innerHTML = `<span>${formatShortDate(date)}</span><strong>${count}</strong><small>预订</small>`;
      button.addEventListener("click", () => {
        $("#viewDate").value = date;
        renderAdmin();
      });
      container.appendChild(button);
    }
  }

  function renderRooms(dayBookings) {
    const roomGrid = $("#roomGrid");
    if (!roomGrid) return;
    roomGrid.innerHTML = tables.map((table) => {
      const booking = dayBookings.find((item) => item.table === table);
      const status = booking ? "busy" : "free";
      return `
        <article class="room-card ${status}">
          <span>${table}</span>
          <strong>${booking ? booking.name : "空着"}</strong>
          <small>${booking ? `${booking.time || "-"} · ${booking.pax || "-"} pax` : "可安排预订"}</small>
          ${booking?.note ? `<em>${booking.note}</em>` : ""}
        </article>
      `;
    }).join("");
  }

  function bookingCard(booking, customers) {
    const customer = customers.find((item) => normalisePhone(item.phone) === normalisePhone(booking.phone));
    const phone = normalisePhone(booking.phone);
    const confirmUrl = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(buildConfirmMessage(booking))}` : "#";
    const invitationUrl = publicPageUrl("invitation.html");
    ["name", "date", "time", "table", "cover", "welcome", "bookingMode", "festivalType"].forEach((field) => {
      const value = booking[field];
      if (value) invitationUrl.searchParams.set(field, value);
    });

    return `
      <article class="booking-item">
        <div class="booking-main">
          <span class="status-dot ${(booking.status || "pending").toLowerCase()}">${booking.status || "Pending"}</span>
          <h3>${booking.time || "-"} · ${booking.name || "Guest"}</h3>
          <p>${booking.table || "未安排桌位"} · ${booking.pax || "-"} pax · ${booking.festivalType || booking.type || "普通预订"} · ${isFestivalBooking(booking) ? "节日预订" : "普通预订"}</p>
          <div class="tag-row">
            <span>${customer?.segment || "新客户"}</span>
            ${booking.festivalType ? `<span>${booking.festivalType}</span>` : ""}
            ${booking.dietary ? `<span>忌口：${booking.dietary}</span>` : ""}
            ${booking.note ? `<span>${booking.note}</span>` : ""}
          </div>
        </div>
        <div class="booking-actions">
          <a href="${confirmUrl}" target="_blank" rel="noopener">核餐</a>
          <a href="${invitationUrl.toString()}" target="_blank" rel="noopener">邀请函</a>
          <button type="button" data-edit-booking="${booking.id}">修改</button>
          <button type="button" data-delete-booking="${booking.id}">撤回</button>
        </div>
      </article>
    `;
  }

  function renderBookings(dayBookings, customers) {
    const list = $("#bookingList");
    if (!list) return;
    if (!dayBookings.length) {
      list.innerHTML = `<div class="empty-state">这一天还没有预订。</div>`;
      return;
    }
    list.innerHTML = dayBookings
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""))
      .map((booking) => bookingCard(booking, customers))
      .join("");
  }

  function renderCustomers(customers) {
    const list = $("#customerList");
    if (!list) return;
    if (!customers.length) {
      list.innerHTML = `<div class="empty-state">保存预订后，这里会自动整理客户。</div>`;
      return;
    }

    list.innerHTML = customers.map((customer) => {
      const phone = normalisePhone(customer.phone);
      const message = `${customer.name} 您好，La Taste x 3悦 最近有适合老客户的活动配套，欢迎回来聚餐。`;
      return `
        <article class="customer-card">
          <div>
            <span class="customer-segment">${customer.segment}</span>
            <h3>${customer.name || "Guest"}</h3>
            <p>${customer.count} 次预订 · 最近：${customer.lastDate || "-"}</p>
          </div>
          <a href="${phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : "#"}" target="_blank" rel="noopener">联系</a>
        </article>
      `;
    }).join("");
  }

  function renderAnniversaries(customers) {
    const list = $("#anniversaryList");
    if (!list) return;
    const current = new Date(todayIso());
    const upcoming = customers
      .filter((customer) => customer.anniversary)
      .map((customer) => {
        const [, month, day] = customer.anniversary.split("-");
        let next = new Date(`${current.getFullYear()}-${month}-${day}T00:00:00`);
        if (next < current) next = new Date(`${current.getFullYear() + 1}-${month}-${day}T00:00:00`);
        return { ...customer, nextDate: next.toISOString().slice(0, 10), days: Math.ceil((next - current) / 86400000) };
      })
      .filter((customer) => customer.days <= 30)
      .sort((a, b) => a.days - b.days);

    if (!upcoming.length) {
      list.innerHTML = `<div class="empty-state">未来 30 天没有纪念日提醒。</div>`;
      return;
    }

    list.innerHTML = upcoming.map((customer) => {
      const phone = normalisePhone(customer.phone);
      const message = `${customer.name} 您好，La Taste x 3悦 记得您的纪念日快到了。祝您纪念日快乐，也欢迎回来一起庆祝。`;
      return `
        <article class="reminder-card">
          <strong>${customer.name}</strong>
          <span>${customer.nextDate} · 还有 ${customer.days} 天</span>
          <a href="${phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : "#"}" target="_blank" rel="noopener">发祝福</a>
        </article>
      `;
    }).join("");
  }

  function renderCouponList() {
    const list = $("#couponList");
    if (!list) return;
    const customers = classifyCustomers(getBookings()).filter((customer) => ["VIP", "熟客", "沉睡客户"].includes(customer.segment));
    if (!customers.length) {
      list.innerHTML = `<div class="empty-state">暂时没有适合发券的客户。</div>`;
      return;
    }
    list.innerHTML = customers.map((customer) => {
      const phone = normalisePhone(customer.phone);
      const message = `${customer.name} 您好，La Taste x 3悦 本月准备了一张老客户 8 折回店券给您。想预订可以直接回复这个 WhatsApp。`;
      return `
        <article class="customer-card">
          <div>
            <span class="customer-segment">${customer.segment}</span>
            <h3>${customer.name}</h3>
            <p>${customer.count} 次预订 · ${customer.daysSince > 45 ? "建议唤醒" : "适合回店券"}</p>
          </div>
          <a href="${phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : "#"}" target="_blank" rel="noopener">发券</a>
        </article>
      `;
    }).join("");
  }

  function renderFloor(dayBookings) {
    const select = $("#floorBooking");
    const floorLog = $("#floorLog");
    if (!select || !floorLog) return;

    select.innerHTML = dayBookings.length
      ? dayBookings.map((booking) => `<option value="${booking.id}">${booking.time || "-"} · ${booking.name} · ${booking.table || "未安排"}</option>`).join("")
      : `<option value="">今天没有预订</option>`;

    const notes = getFloorNotes();
    floorLog.innerHTML = notes.length
      ? notes.slice().reverse().map((note) => `
        <article class="booking-item">
          <div class="booking-main">
            <h3>${note.bookingName}</h3>
            <p>${note.createdAt.slice(0, 16).replace("T", " ")}</p>
            <div class="tag-row"><span>${note.note}</span></div>
          </div>
        </article>
      `).join("")
      : `<div class="empty-state">还没有巡台记录。</div>`;
  }

  function fillBookingForm(booking) {
    if (!booking) return;
    setValue("editingId", booking.id);
    setValue("bookingMode", booking.bookingMode || (booking.festivalType ? "festival" : "normal"));
    setValue("festivalType", booking.festivalType || "");
    setValue("name", booking.name);
    setValue("phone", booking.phone);
    setValue("date", booking.date);
    setValue("time", booking.time);
    setValue("pax", booking.pax);
    setValue("welcome", booking.welcome);
    setValue("table", booking.table);
    setValue("status", booking.status || "Pending");
    setValue("anniversary", booking.anniversary);
    setValue("tag", booking.tag);
    setValue("dietary", booking.dietary);
    setValue("note", booking.note);
    const saveButton = $("#saveBooking");
    if (saveButton) saveButton.textContent = "更新预订 / Update";
    const cancelButton = $("#cancelEdit");
    if (cancelButton) cancelButton.hidden = false;
    updateLink();
    switchTab("booking");
  }

  function deleteBooking(id) {
    if (!id) return;
    const bookings = getBookings();
    const booking = bookings.find((item) => item.id === id);
    if (!booking) return;
    const ok = window.confirm(`撤回 ${booking.name || "Guest"} 的预订吗？\nCancel this reservation?`);
    if (!ok) return;
    saveBookings(bookings.filter((item) => item.id !== id));
    if ($("#editingId")?.value === id) resetBookingForm();
    $("#copyStatus").textContent = "预订已撤回。Reservation cancelled.";
    renderAdmin();
  }

  function renderAdmin() {
    const bookings = getBookings();
    const viewDate = $("#viewDate")?.value || todayIso();
    const dayBookings = bookings.filter((booking) => booking.date === viewDate);
    const customers = classifyCustomers(bookings);

    if ($("#todayLabel")) $("#todayLabel").textContent = formatShortDate(todayIso());
    if ($("#todayCount")) $("#todayCount").textContent = `${bookings.filter((booking) => booking.date === todayIso()).length} 桌`;
    if ($("#metricBookings")) $("#metricBookings").textContent = dayBookings.length;
    if ($("#metricPax")) $("#metricPax").textContent = dayBookings.reduce((sum, booking) => sum + Number(booking.pax || 0), 0);
    if ($("#metricConfirmed")) $("#metricConfirmed").textContent = dayBookings.filter((booking) => booking.status === "Confirmed").length;

    renderMiniCalendar(bookings, viewDate);
    renderRooms(dayBookings);
    renderBookings(dayBookings, customers);
    renderCustomers(customers);
    renderAnniversaries(customers);
    renderFloor(dayBookings);

    $("#bookingList")?.querySelectorAll("[data-edit-booking]").forEach((button) => {
      button.addEventListener("click", () => fillBookingForm(bookings.find((booking) => booking.id === button.dataset.editBooking)));
    });
    $("#bookingList")?.querySelectorAll("[data-delete-booking]").forEach((button) => {
      button.addEventListener("click", () => deleteBooking(button.dataset.deleteBooking));
    });
  }

  function initAdmin() {
    const form = $("#bookingForm");
    if (!form) return;

    $("#date").value = todayIso();
    $("#viewDate").value = todayIso();

    $$(".tab-btn").forEach((btn) => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));
    form.addEventListener("input", updateLink);
    form.addEventListener("change", updateLink);
    $("#bookingMode")?.addEventListener("change", () => {
      if ($("#bookingMode").value === "festival" && !$("#festivalType")?.value) {
        setValue("festivalType", "Birthday / 生日");
      }
      updateLink();
    });
    $("#festivalType")?.addEventListener("change", () => {
      if ($("#festivalType").value) setValue("bookingMode", "festival");
      updateLink();
    });
    $("#viewDate")?.addEventListener("change", renderAdmin);
    $("#copyLink")?.addEventListener("click", () => copyText($("#generatedLink").value, $("#copyStatus"), "已复制邀请函链接。"));
    $("#cancelEdit")?.addEventListener("click", resetBookingForm);
    $("#saveBooking")?.addEventListener("click", () => {
      const booking = bookingFromForm();
      if (!booking.name || !booking.phone || !booking.date || !booking.time) {
        $("#copyStatus").textContent = "请至少填写姓名、电话、日期和时间。Please fill name, phone, date and time.";
        return;
      }
      const bookings = getBookings();
      const existingIndex = bookings.findIndex((item) => item.id === booking.id);
      if (existingIndex >= 0) {
        bookings[existingIndex] = { ...bookings[existingIndex], ...booking, updatedAt: new Date().toISOString() };
      } else {
        bookings.push(booking);
      }
      saveBookings(bookings);
      $("#viewDate").value = booking.date;
      $("#copyStatus").textContent = "预订已保存到本机电子预订本，并自动记录到日历。Saved to local calendar.";
      renderAdmin();
      resetBookingForm();
      switchTab("calendar");
    });

    $("#clearDemo")?.addEventListener("click", () => {
      saveBookings([]);
      saveFloorNotes([]);
      renderAdmin();
    });

    $("#buildCouponList")?.addEventListener("click", renderCouponList);

    $("#saveFloorNote")?.addEventListener("click", () => {
      const bookingId = $("#floorBooking")?.value;
      const text = $("#floorNote")?.value.trim();
      if (!bookingId || !text) return;
      const booking = getBookings().find((item) => item.id === bookingId);
      const notes = getFloorNotes();
      notes.push({ id: makeId(), bookingId, bookingName: booking?.name || "预订", note: text, createdAt: new Date().toISOString() });
      saveFloorNotes(notes);
      $("#floorNote").value = "";
      renderAdmin();
    });

    updateLink();
    renderAdmin();
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function createInviteMusic(toggleButton) {
    const audio = new Audio("audio/paulyudin-happy-birthday-birthday-music-595942.mp3?v=paulyudin-20260927");
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.72;
    let playing = false;

    function start() {
      if (playing) return;
      playing = true;
      toggleButton?.classList.add("is-playing");
      const playPromise = audio.play();
      if (playPromise?.catch) {
        playPromise.catch(() => {
          playing = false;
          toggleButton?.classList.remove("is-playing");
        });
      }
    }

    function stop() {
      playing = false;
      toggleButton?.classList.remove("is-playing");
      audio.pause();
    }

    function toggle() {
      if (playing) stop();
      else start();
    }

    return { start, stop, toggle };
  }

  function initInvitation() {
    const params = new URLSearchParams(window.location.search);
    importBookingFromInvitationParams(params);
    const guestName = valueOrDash(params.get("name") || "Guest");
    const date = valueOrDash(params.get("date"));
    const time = valueOrDash(params.get("time"));
    const venue = valueOrDash(params.get("table"));
    const type = valueOrDash(params.get("festivalType") || params.get("type"));
    const bookingMode = (params.get("bookingMode") || "normal").trim();
    const festivalType = (params.get("festivalType") || "").trim();
    const displayType = festivalType || (type === "-" ? "Normal Reservation / 普通预订" : type);
    const customWelcome = valueOrDash(params.get("welcome"));
    const coverKey = coverFromType(displayType, params.get("cover") || "auto");
    const copyInviteBtn = $("#copyInviteLink");
    const shareWhatsappBtn = $("#shareInviteWhatsapp");
    const shareWhatsappTop = $("#shareInviteWhatsappTop");
    const inviteLinkOutput = $("#inviteLinkOutput");
    const shareStatus = $("#shareStatus");
    const mapBtn = document.querySelector("[data-map-link]");
    const inviteCover = $("#inviteCover");
    const envelopeStage = $(".invite-envelope-stage");
    const openEnvelopeBtn = $("#openInviteEnvelope");
    const musicToggle = $("#inviteMusicToggle");
    const stageLabel = $("#inviteStageLabel");
    const inviteMusic = createInviteMusic(musicToggle);
    const partyName = guestName;
    const isFestival = bookingMode === "festival" || festivalType;
    const welcome = welcomeByType(displayType, partyName === "-" ? "" : partyName);
    const normalMessage = [
      `您好 ${guestName === "-" ? "Guest" : guestName}，这是您的 La Taste 3悦 预订确认。`,
      "Hi, this is your La Taste 3悦 booking confirmation.",
      "请按以下日期、时间和地点前来。"
    ].join("\n");

    const coverUrl = coverImages[coverKey] || coverImages.restaurant;
    if (inviteCover) {
      inviteCover.style.backgroundImage = `linear-gradient(rgba(23, 63, 52, 0.1), rgba(23, 63, 52, 0.1)), url("${coverUrl}")`;
    }

    if (envelopeStage) {
      envelopeStage.classList.toggle("normal-invite", !isFestival);
      envelopeStage.classList.toggle("festival-invite", isFestival);
      if (!isFestival) envelopeStage.classList.add("is-open");
    }
    if (openEnvelopeBtn && !isFestival) openEnvelopeBtn.hidden = true;
    if (musicToggle && !isFestival) musicToggle.hidden = true;

    if (stageLabel) stageLabel.textContent = isFestival ? "Event Invitation" : "Booking Confirmation";
    setText("inviteModeLabel", isFestival ? "Party Invitation / 节日邀请函" : "");
    setText("inviteHeadline", welcome.headline);
    setText("inviteSubline", displayType === "-" ? "悦人 · 悦己 · 悦食" : displayType);
    setText("welcomeTitle", isFestival ? welcome.title : "La Taste 3悦 预订确认 / Booking Confirmation");
    setText("welcomeMessage", isFestival ? (customWelcome === "-" ? welcome.message : customWelcome) : normalMessage);
    setText("publicEventDate", date === "-" ? "日期待确认" : date);
    setText("publicEventTime", time === "-" ? "时间待确认" : time);
    setText("publicEventVenue", venue === "-" ? "La Taste Event Space" : venue);

    if (mapBtn) mapBtn.href = mapsUrl;

    const inviteUrl = window.location.href;
    const localNotice = "本地邀请函链接已复制。发给别人之前，需要同一台电脑或部署到网上才可打开。";
    const inviteMessage = [
      "邀请函链接 / Invitation link:",
      inviteUrl,
      "",
      `${isFestival ? welcome.headline : "La Taste 3悦 Booking Confirmation"} - ${partyName === "-" ? guestName : partyName}`,
      isFestival ? (customWelcome === "-" ? welcome.message : customWelcome) : normalMessage,
      `Date: ${date === "-" ? "TBC" : date}`,
      `Time: ${time === "-" ? "TBC" : time}`,
      `Venue: ${venue === "-" ? "La Taste Event Space" : venue}`,
      `Event: ${displayType}`
    ].join("\n");

    if (inviteLinkOutput) {
      inviteLinkOutput.value = inviteUrl;
      inviteLinkOutput.addEventListener("click", () => inviteLinkOutput.select());
    }

    if (shareWhatsappBtn) {
      shareWhatsappBtn.href = `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`;
      shareWhatsappBtn.textContent = "WhatsApp 分享邀请函";
    }
    if (shareWhatsappTop) {
      shareWhatsappTop.href = `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`;
    }

    if (copyInviteBtn) {
      copyInviteBtn.addEventListener("click", () => {
        copyText(inviteUrl, shareStatus, isLocalPreview() ? localNotice : "邀请函链接已复制，可以直接粘贴到 WhatsApp。");
        if (inviteLinkOutput) inviteLinkOutput.select();
      });
    }

    if (openEnvelopeBtn && envelopeStage) {
      openEnvelopeBtn.addEventListener("click", () => {
        envelopeStage.classList.add("is-open");
        inviteMusic.start();
      });
    }

    if (musicToggle) {
      musicToggle.addEventListener("click", () => inviteMusic.toggle());
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupRevealAnimation();
    initAdmin();
    initInvitation();
  });
})();
