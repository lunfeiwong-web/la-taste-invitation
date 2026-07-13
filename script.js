(function () {
  const mapsUrl = "https://www.google.com/maps/search/?api=1&query=La%20Taste%20Riverfront%20City%2C%20No.%20218%20%26%20219%2C%20Jalan%20Mawar%203%2F2%2C%20Taman%20Pekan%20Baru%2C%2008000%20Sungai%20Petani%2C%20Kedah";
  const restaurantWhatsapp = "60124633400";
  const publicSiteUrl = "https://la-taste-e-invitation-card.netlify.app/";
  const storageKey = "laTasteBookingsV2";
  const floorKey = "laTasteFloorNotesV1";
  const tables = ["Event Space 1", "阁楼", "Event Space C", "Event Space D"];
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
  const publicPageUrl = (path) => isLocalPreview() ? new URL(path, publicSiteUrl) : new URL(path, window.location.href);

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
        "包厢 A": "Event Space 1",
        "包厢 B": "阁楼",
        "大厅 T1": "Event Space C",
        "大厅 T2": "阁楼",
        "大厅 T3": "Event Space D",
        "活动区": "Event Space C"
      };
      const migrated = existing.map((booking) => ({
        ...booking,
        table: tableMap[booking.table] || booking.table
      }));
      if (JSON.stringify(existing) !== JSON.stringify(migrated)) saveBookings(migrated);
      return migrated;
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
        type: "Birthday",
        table: "Event Space 1",
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
        type: "Private Gathering",
        table: "阁楼",
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
        type: "Company Dinner",
        table: "Event Space C",
        status: "Confirmed",
        anniversary: "",
        tag: "企业客户",
        dietary: "",
        note: "需要投影和茶水",
        createdAt: new Date().toISOString()
      }
    ];

    writeJson(storageKey, demo);
    return demo;
  }

  function saveBookings(bookings) {
    writeJson(storageKey, bookings);
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
    if (lowerType.includes("baby") || lowerType.includes("full moon") || lowerType.includes("捉周")) return "baby";
    if (lowerType.includes("company") || lowerType.includes("product") || lowerType.includes("workshop")) return "company";
    if (lowerType.includes("wedding") || lowerType.includes("rom")) return "wedding";
    if (lowerType.includes("private")) return "private";
    return "restaurant";
  }

  function welcomeByType(type, host) {
    const name = host || "我们";
    const lowerType = (type || "").toLowerCase();
    if (lowerType.includes("birthday")) {
      return {
        headline: "生日宴会邀请",
        title: "欢迎大家一起来庆祝这份生日喜悦",
        message: `${name} 诚挚邀请您一起出席这场生日宴。希望大家带着轻松开心的心情来到 La Taste x 3悦，一起吃饭、聊天、拍照，把这一晚变成温暖又难忘的回忆。`
      };
    }
    if (lowerType.includes("baby") || lowerType.includes("full moon")) {
      return {
        headline: "满月宴邀请",
        title: "欢迎大家来分享宝宝成长的第一份喜悦",
        message: `${name} 诚挚邀请您一起见证这份珍贵的小幸福。感谢大家的祝福与陪伴，期待在 La Taste x 3悦 与您相聚。`
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
        headline: "喜宴邀请",
        title: "诚邀您一起见证这份幸福",
        message: `${name} 诚挚邀请您一起出席这场温暖的喜宴。您的到来，会让这一天更完整、更值得纪念。`
      };
    }
    return {
      headline: "诚邀您一起相聚",
      title: "欢迎大家来参与这场温暖的宴会",
      message: `${name} 想把这一刻，与重要的家人和朋友一起分享。期待您带着轻松愉快的心情来到 La Taste x 3悦，一起吃一顿好饭，留下一段值得记住的相聚时光。`
    };
  }

  function buildInvitationUrl() {
    const base = publicPageUrl("invitation.html");
    const noteParts = [$("#note")?.value.trim(), $("#dietary")?.value.trim() ? `忌口：${$("#dietary").value.trim()}` : ""].filter(Boolean);
    const fields = ["name", "phone", "date", "time", "pax", "type", "host", "welcome", "photo"];

    fields.forEach((field) => {
      const input = document.getElementById(field);
      if (input && input.value.trim()) {
        base.searchParams.set(field, input.value.trim());
      }
    });

    const cover = coverFromType($("#type")?.value || "", $("#cover")?.value || "auto");
    if (cover) base.searchParams.set("cover", cover);
    if (noteParts.length) base.searchParams.set("note", noteParts.join(" / "));
    return base.toString();
  }

  function bookingFromForm() {
    return {
      id: makeId(),
      name: $("#name")?.value.trim() || "",
      phone: $("#phone")?.value.trim() || "",
      date: $("#date")?.value || todayIso(),
      time: $("#time")?.value.trim() || "",
      pax: $("#pax")?.value.trim() || "",
      type: $("#type")?.value || "",
      table: $("#table")?.value || "",
      status: $("#status")?.value || "Pending",
      anniversary: $("#anniversary")?.value || "",
      tag: $("#tag")?.value || "",
      host: $("#host")?.value.trim() || "",
      cover: coverFromType($("#type")?.value || "", $("#cover")?.value || "auto"),
      photo: $("#photo")?.value.trim() || "",
      welcome: $("#welcome")?.value.trim() || "",
      dietary: $("#dietary")?.value.trim() || "",
      note: $("#note")?.value.trim() || "",
      createdAt: new Date().toISOString()
    };
  }

  function buildInviteMessage(booking, invitationUrl) {
    return `您好 ${booking.name || "Guest"}，这是 La Taste x 3悦 为您准备的电子预订邀请函：${invitationUrl}`;
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
    ["name", "phone", "date", "time", "pax", "type", "host", "cover", "photo", "welcome", "note"].forEach((field) => {
      const value = field === "note"
        ? [booking.note, booking.dietary ? `忌口：${booking.dietary}` : ""].filter(Boolean).join(" / ")
        : booking[field];
      if (value) invitationUrl.searchParams.set(field, value);
    });

    return `
      <article class="booking-item">
        <div class="booking-main">
          <span class="status-dot ${booking.status.toLowerCase()}">${booking.status}</span>
          <h3>${booking.time || "-"} · ${booking.name || "Guest"}</h3>
          <p>${booking.table || "未安排桌位"} · ${booking.pax || "-"} pax · ${booking.type || "聚会"}</p>
          <div class="tag-row">
            <span>${customer?.segment || "新客户"}</span>
            ${booking.dietary ? `<span>忌口：${booking.dietary}</span>` : ""}
            ${booking.note ? `<span>${booking.note}</span>` : ""}
          </div>
        </div>
        <div class="booking-actions">
          <a href="${confirmUrl}" target="_blank" rel="noopener">核餐</a>
          <a href="${invitationUrl.toString()}" target="_blank" rel="noopener">邀请函</a>
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
  }

  function initAdmin() {
    const form = $("#bookingForm");
    if (!form) return;

    $("#date").value = todayIso();
    $("#viewDate").value = todayIso();

    $$(".tab-btn").forEach((btn) => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));
    form.addEventListener("input", updateLink);
    form.addEventListener("change", updateLink);
    $("#viewDate")?.addEventListener("change", renderAdmin);
    $("#copyLink")?.addEventListener("click", () => copyText($("#generatedLink").value, $("#copyStatus"), "已复制邀请函链接。"));
    $("#saveBooking")?.addEventListener("click", () => {
      const booking = bookingFromForm();
      if (!booking.name || !booking.phone || !booking.date || !booking.time) {
        $("#copyStatus").textContent = "请至少填写姓名、电话、日期和时间。";
        return;
      }
      const bookings = getBookings();
      bookings.push(booking);
      saveBookings(bookings);
      $("#viewDate").value = booking.date;
      $("#copyStatus").textContent = "预订已保存到本机电子预订本。";
      renderAdmin();
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

  function initInvitation() {
    const params = new URLSearchParams(window.location.search);
    const guestName = valueOrDash(params.get("name") || "Guest");
    const hostName = valueOrDash(params.get("host"));
    const phone = valueOrDash(params.get("phone"));
    const date = valueOrDash(params.get("date"));
    const time = valueOrDash(params.get("time"));
    const pax = valueOrDash(params.get("pax"));
    const type = valueOrDash(params.get("type"));
    const note = valueOrDash(params.get("note"));
    const customWelcome = valueOrDash(params.get("welcome"));
    const coverKey = coverFromType(type, params.get("cover") || "auto");
    const photoUrl = valueOrDash(params.get("photo"));
    const shareBtn = $("#shareInvite");
    const copyInviteBtn = $("#copyInviteLink");
    const shareWhatsappBtn = $("#shareInviteWhatsapp");
    const inviteLinkOutput = $("#inviteLinkOutput");
    const shareStatus = $("#shareStatus");
    const mapBtn = document.querySelector("[data-map-link]");
    const whatsappBtn = document.querySelector("[data-whatsapp-link]");
    const inviteCover = $("#inviteCover");
    const welcome = welcomeByType(type, hostName === "-" ? "" : hostName);

    const coverUrl = photoUrl !== "-" ? photoUrl : coverImages[coverKey] || coverImages.restaurant;
    if (inviteCover) {
      inviteCover.style.backgroundImage = `linear-gradient(rgba(23, 63, 52, 0.1), rgba(23, 63, 52, 0.1)), url("${coverUrl}")`;
    }

    setText("inviteHeadline", welcome.headline);
    setText("inviteHost", hostName === "-" ? "A Warm Invitation" : `Hosted by ${hostName}`);
    setText("inviteSubline", type === "-" ? "悦人 · 悦己 · 悦食" : type);
    setText("welcomeTitle", welcome.title);
    setText("welcomeMessage", customWelcome === "-" ? welcome.message : customWelcome);
    setText("publicEventDate", date === "-" ? "日期待确认" : date);
    setText("publicEventTime", time === "-" ? "时间待确认" : time);
    setText("publicEventType", type === "-" ? "Private Event" : type);
    setText("guestName", guestName);
    setText("guestPhone", phone);
    setText("eventDate", date);
    setText("eventTime", time);
    setText("eventPax", pax === "-" ? "-" : `${pax} pax`);
    setText("eventType", type);
    setText("eventNote", note);

    if (mapBtn) mapBtn.href = mapsUrl;
    if (whatsappBtn) {
      const message = "您好，我想询问 La Taste x 3悦 活动预订。";
      whatsappBtn.href = `https://wa.me/${restaurantWhatsapp}?text=${encodeURIComponent(message)}`;
    }

    const inviteUrl = isLocalPreview() ? publicPageUrl(`invitation.html${window.location.search}`).toString() : window.location.href;
    const localNotice = "已改用 Netlify 正式链接。请确认 Netlify 站点已经发布后再发给顾客。";
    const inviteMessage = `${welcome.headline} - ${hostName === "-" ? guestName : hostName}\n${customWelcome === "-" ? welcome.message : customWelcome}\n${inviteUrl}`;

    if (inviteLinkOutput) {
      inviteLinkOutput.value = inviteUrl;
      inviteLinkOutput.addEventListener("click", () => inviteLinkOutput.select());
    }

    if (shareWhatsappBtn) {
      shareWhatsappBtn.href = `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`;
      shareWhatsappBtn.textContent = "WhatsApp 分享邀请函";
    }

    if (copyInviteBtn) {
      copyInviteBtn.addEventListener("click", () => {
        copyText(inviteUrl, shareStatus, isLocalPreview() ? localNotice : "邀请函链接已复制，可以直接粘贴到 WhatsApp。");
        if (inviteLinkOutput) inviteLinkOutput.select();
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupRevealAnimation();
    initAdmin();
    initInvitation();
  });
})();
