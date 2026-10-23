/* Design-only fixtures and interactions. No API calls or application session access. */
(() => {
  "use strict";

  const STORE_KEY = "cuways-sprint3-design-v1";
  const THEME_KEY = "cuways-sprint3-design-theme";
  const ROLE_KEY = "cuways-sprint3-design-role";
  const USER_ID = 101;
  const PAGE = document.body.dataset.page;
  const files = {
    payment: "us-029-payment-recording.html",
    history: "us-032-transaction-history.html",
    review: "us-033-submit-review.html",
  };
  const methods = ["PromptPay", "Bank Transfer", "Credit Card"];
  const queryJob = new URLSearchParams(location.search).get("job");
  const jobId = queryJob || (PAGE === "review" ? "1038" : "1042");
  const main = document.querySelector("#main");
  const dialog = document.querySelector("#confirmation");
  const icons = {
    arrow: '<path d="m12 19-7-7 7-7M5 12h14"/>',
    forward: '<path d="M5 12h14m-7-7 7 7-7 7"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    close: '<path d="m18 6-12 12M6 6l12 12"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    check: '<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    card: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/>',
    bank: '<path d="m3 10 9-7 9 7M4 10h16M6 10v8M10 10v8M14 10v8M18 10v8M3 21h18"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
    receipt: '<path d="M4 3v18l4-2 4 2 4-2 4 2V3l-4 2-4-2-4 2-4-2ZM8 9h8M8 13h5"/>',
    external:
      '<path d="M15 3h6v6m0-6L10 14M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4"/>',
    star: '<path d="m12 3 2.8 5.7 6.3.9-4.6 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2-4.6-4.4 6.3-.9L12 3Z"/>',
    brief:
      '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>',
  };
  const icon = (name) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.info}</svg>`;
  const escape = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
    );
  const money = (cents) =>
    `THB ${new Intl.NumberFormat("en-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100)}`;
  const date = (value) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Bangkok",
    }).format(new Date(value));
  const time = (value) =>
    `${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" }).format(new Date(value))} (Bangkok)`;
  const href = (page, id = jobId) => `${files[page]}?job=${encodeURIComponent(id)}`;
  const jobHref = (id = jobId) => `${href("payment", id)}&view=job`;
  const status = (value, label = value) =>
    `<span class="status" data-status="${escape(value)}">${escape(label)}</span>`;
  const currentUser = { id: USER_ID, name: "Alex Kim" };
  const marketer = { id: 202, name: "Narin Suk" };
  const isoNow = () => new Date().toISOString();

  function jobFixture(id, title, cents, creator = currentUser, worker = marketer) {
    return {
      id,
      title,
      cents,
      creator,
      marketer: worker,
      offerId: `offer-${id}`,
      offerStatus: "Accepted",
      status: "Accepted",
      payment: null,
      proof: null,
      completedAt: null,
      review: null,
    };
  }
  function paidFixture(job, method = "Bank Transfer") {
    job.payment = {
      status: "Paid",
      method,
      cents: job.cents,
      paidAt: "2026-10-19T03:15:00Z",
      payout: "Held",
      releasedAt: null,
    };
    return job;
  }
  function completedFixture(job, method) {
    paidFixture(job, method);
    job.status = "Completed";
    job.proof = { url: "https://example.com/", submittedAt: "2026-10-20T07:00:00Z" };
    job.completedAt = "2026-10-21T09:30:00Z";
    job.payment.payout = "Released";
    job.payment.releasedAt = job.completedAt;
    return job;
  }
  function seed() {
    return {
      version: 1,
      jobs: [
        jobFixture("1042", "Campus travel habits survey", 250000),
        completedFixture(jobFixture("1038", "Student cafe preferences", 180000), "PromptPay"),
        completedFixture(
          jobFixture("1035", "Sustainable shopping research", 320000),
          "Bank Transfer",
        ),
        completedFixture(jobFixture("1031", "Study space discovery", 150000), "Credit Card"),
        completedFixture(jobFixture("1026", "Campus event feedback", 225000), "PromptPay"),
        completedFixture(
          jobFixture(
            "1024",
            "Student transport study",
            280000,
            { id: 303, name: "Mali Wong" },
            currentUser,
          ),
          "Bank Transfer",
        ),
        completedFixture(
          jobFixture(
            "1020",
            "Library services research",
            120000,
            { id: 404, name: "Arun Lee" },
            currentUser,
          ),
          "PromptPay",
        ),
        // Never shown in the current user's history. Used to verify involvement filtering.
        completedFixture(
          jobFixture(
            "1001",
            "Private research project",
            900000,
            { id: 303, name: "Mali Wong" },
            marketer,
          ),
          "Credit Card",
        ),
      ],
    };
  }
  let memoryOnly = false;
  function readPreference(key, fallback) {
    try {
      return localStorage.getItem(key) || fallback;
    } catch {
      memoryOnly = true;
      return fallback;
    }
  }
  function preference(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      memoryOnly = true;
    }
  }
  function readStore() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY));
      if (
        saved?.version === 1 &&
        Array.isArray(saved.jobs) &&
        saved.jobs.every(
          (job) =>
            job?.creator &&
            job?.marketer &&
            typeof job.cents === "number" &&
            typeof job.id === "string",
        )
      )
        return saved;
    } catch {
      /* A blocked store or invalid preview is replaced with safe fixtures. */
    }
    return seed();
  }
  let store = readStore();
  let role = readPreference(ROLE_KEY, "Creator") === "Marketer" ? "Marketer" : "Creator";
  let theme = readPreference(
    THEME_KEY,
    matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  );
  if (!["light", "dark"].includes(theme)) theme = "light";
  document.documentElement.dataset.theme = theme;
  let scenario = "normal";
  let failNext = false;
  let busy = false;
  let search = "";
  let pageNumber = 1;
  const pageSize = 4;
  const activeJob = () => store.jobs.find((job) => job.id === jobId);
  const workspaceJobId = () =>
    (role === "Creator"
      ? store.jobs.find((job) => job.creator.id === USER_ID)
      : store.jobs.find((job) => job.marketer.id === USER_ID)
    )?.id || "1042";
  const owns = (job) =>
    job?.creator.id === USER_ID && role === "Creator" && scenario !== "unauthorized";
  const involved = (job) =>
    role === "Creator" ? job.creator.id === USER_ID : job.marketer.id === USER_ID;
  const canComplete = (job) =>
    owns(job) &&
    job.status === "In Progress" &&
    job.offerStatus === "Accepted" &&
    Boolean(job.offerId && job.proof) &&
    job.payment?.status === "Paid" &&
    job.payment.cents === job.cents &&
    job.payment.payout === "Held";

  function persist(next) {
    if (!memoryOnly) localStorage.setItem(STORE_KEY, JSON.stringify(next));
    store = next;
  }
  function updateJob(id, change) {
    const next = structuredClone(store);
    const job = next.jobs.find((entry) => entry.id === id);
    change(job);
    persist(next);
  }
  function heading(title, description, back = true) {
    return `<div class="heading${back ? " heading-row" : ""}">${back ? `<a class="icon-button" href="${jobHref()}" aria-label="Back to job details">${icon("arrow")}</a>` : ""}<div><h1>${title}</h1><p class="muted">${description}</p></div></div>`;
  }
  function jobSummary(job) {
    return `<section class="card" aria-label="Job summary"><div class="card-top"><p class="eyebrow">Job #${escape(job.id)}</p>${status(job.status)}</div><h2>${escape(job.title)}</h2><dl class="details"><div><dt>Creator</dt><dd>${escape(job.creator.name)}</dd></div><div><dt>Marketer</dt><dd>${escape(job.marketer.name)}</dd></div><div><dt>Accepted price</dt><dd>${money(job.cents)}</dd></div></dl></section>`;
  }
  function empty(title, message, action = "", symbol = "receipt") {
    return `<section class="card empty">${icon(symbol)}<h2>${title}</h2><p class="muted">${message}</p>${action}</section>`;
  }
  function renderHeader() {
    document.querySelector("#app-header").innerHTML =
      `<div class="header-inner"><a class="brand" href="${href("history")}" aria-label="CU Ways transactions"><img class="logo-light" src="../public/marketer-assets/logo.svg" alt="CU Ways" width="124" height="34"><img class="logo-dark" src="../public/marketer-assets/logo-dark.svg" alt="CU Ways" width="124" height="34"></a><div class="header-actions"><span class="workspace-caption">${role} workspace</span><button class="icon-button" id="theme-toggle" aria-label="Switch to ${theme === "light" ? "dark" : "light"} theme">${icon(theme === "light" ? "moon" : "sun")}</button><button class="icon-button role-button" id="role-toggle" aria-label="Switch to ${role === "Creator" ? "Marketer" : "Creator"}, current: ${role}"><img src="assets/role-${role.toLowerCase()}.svg" alt="" width="44" height="30"></button><button class="icon-button menu-button" id="menu-toggle" aria-label="Open navigation" aria-controls="main-menu" aria-expanded="false">${icon("menu")}</button></div><nav class="menu" id="main-menu" aria-label="Main navigation" hidden><p>${role} workspace</p><a href="${href("payment", workspaceJobId())}" ${PAGE === "payment" ? 'aria-current="page"' : ""}>${icon("brief")}Job &amp; payment</a><a href="${href("history")}" ${PAGE === "history" ? 'aria-current="page"' : ""}>${icon("receipt")}Transactions</a></nav></div>`;
    document.querySelector("#theme-toggle").onclick = () => {
      theme = theme === "light" ? "dark" : "light";
      preference(THEME_KEY, theme);
      document.documentElement.dataset.theme = theme;
      renderHeader();
      document.querySelector("#theme-toggle").focus();
    };
    document.querySelector("#role-toggle").onclick = () => {
      role = role === "Creator" ? "Marketer" : "Creator";
      preference(ROLE_KEY, role);
      location.href = href("history");
    };
    document.querySelector("#menu-toggle").onclick = () => toggleMenu();
  }
  function toggleMenu(close = false) {
    const menu = document.querySelector("#main-menu");
    const trigger = document.querySelector("#menu-toggle");
    menu.hidden = close || !menu.hidden;
    trigger.setAttribute("aria-expanded", String(!menu.hidden));
    trigger.setAttribute("aria-label", menu.hidden ? "Open navigation" : "Close navigation");
  }
  document.addEventListener("click", (event) => {
    if (!event.target.closest("#main-menu, #menu-toggle")) toggleMenu(true);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !document.querySelector("#main-menu").hidden) {
      toggleMenu(true);
      document.querySelector("#menu-toggle").focus();
    }
  });

  function renderPayment(job) {
    if (new URLSearchParams(location.search).get("view") === "job") {
      main.innerHTML = heading("Job details", "Payment and delivery overview.", false);
      if (!job || !involved(job)) {
        main.insertAdjacentHTML(
          "beforeend",
          empty(
            "Job unavailable",
            "You can only view jobs you are involved in.",
            `<a class="button" href="${href("history")}">Transactions</a>`,
            "info",
          ),
        );
        return;
      }
      main.insertAdjacentHTML(
        "beforeend",
        `<div class="stack">${jobSummary(job)}<section class="card"><h2>Payment &amp; delivery</h2><p class="muted">${job.payment ? `Payment recorded. Marketer payout: ${job.payment.payout.toLowerCase()}.` : owns(job) ? "Record the agreed payment when the job starts." : "Waiting for the Creator to record payment."}</p>${job.payment || owns(job) ? `<div class="actions"><a class="button primary" href="${href("payment")}">${job.payment ? "View payment & delivery" : "Record payment"}</a></div>` : ""}${owns(job) && job.status === "Completed" ? `<a class="text-link" href="${href("review")}">${job.review ? "View review" : "Write a review"} ${icon("star")}</a>` : ""}<a class="text-link" href="${href("history")}">Transactions ${icon("receipt")}</a></section></div>`,
      );
      return;
    }
    const title = job?.payment ? "Payment details" : "Record payment";
    main.innerHTML =
      heading(title, "Keep payment and delivery in one place.") +
      '<div id="page-content" class="stack"></div>';
    const content = document.querySelector("#page-content");
    if (!job) {
      content.innerHTML = empty(
        "Job not found",
        "This job is unavailable. Return to your transactions.",
        `<a class="button" href="${href("history")}">Back to transactions</a>`,
      );
      return;
    }
    if (!owns(job) && !(involved(job) && job.payment)) {
      content.innerHTML = empty(
        "Payment is unavailable",
        "Only this job's Creator can record its payment.",
        `<a class="button" href="${href("history")}">Back to transactions</a>`,
        "info",
      );
      return;
    }
    content.innerHTML = jobSummary(job);
    if (job.payment) {
      renderRecordedPayment(content, job);
      return;
    }
    if (
      !["Accepted", "In Progress"].includes(job.status) ||
      job.offerStatus !== "Accepted" ||
      !job.offerId
    ) {
      content.insertAdjacentHTML(
        "beforeend",
        empty(
          "Payment is not available yet",
          "An accepted offer is required before you can record a payment.",
          "",
          "info",
        ),
      );
      return;
    }
    content.insertAdjacentHTML(
      "beforeend",
      `<form id="payment-form" class="card" novalidate><h2>Payment record</h2><p class="muted small">Choose the method used for the agreed amount.</p><fieldset class="form-section" aria-describedby="method-error"><legend>Payment method <span class="muted small">(required)</span></legend><div class="method-list">${methods.map((method, i) => `<label class="method-option"><input type="radio" name="method" value="${method}" required><span>${method}</span>${icon(["phone", "bank", "card"][i])}</label>`).join("")}</div><p class="field-error" id="method-error" aria-live="polite"></p></fieldset><div class="form-section"><label class="field-label" for="amount">Amount <span class="muted small">(required)</span></label><div class="money-field"><input class="input" id="amount" name="amount" type="text" inputmode="decimal" autocomplete="off" placeholder="${(job.cents / 100).toFixed(2)}" aria-describedby="amount-help amount-error" required><span>THB</span></div><p class="help" id="amount-help">Must match the accepted price of ${money(job.cents)}.</p><p id="amount-error" class="field-error" aria-live="polite"></p></div><div class="notice form-section">${icon("info")}<p>This records a payment only. No money is collected or transferred.</p></div><p class="action-error" id="action-error" role="alert"></p><button class="button primary full form-section" type="submit">Review payment</button></form>`,
    );
    const form = document.querySelector("#payment-form");
    const validate = () => {
      const method = form.elements.method.value;
      const raw = form.elements.amount.value.trim();
      const validNumber = /^\d+(\.\d{1,2})?$/.test(raw);
      const cents = validNumber ? Math.round(Number(raw) * 100) : NaN;
      const amountError = !raw
        ? "Enter the payment amount."
        : !validNumber || !Number.isSafeInteger(cents) || cents <= 0
          ? "Enter a positive amount with up to two decimal places."
          : cents !== job.cents
            ? `The amount must be exactly ${money(job.cents)}.`
            : "";
      document.querySelector("#amount-error").textContent = amountError;
      form.elements.amount.setAttribute("aria-invalid", String(Boolean(amountError)));
      document.querySelector("#method-error").textContent = method
        ? ""
        : "Choose a payment method.";
      for (const radio of form.querySelectorAll('[name="method"]'))
        radio.setAttribute("aria-invalid", String(!method));
      return { valid: Boolean(method) && !amountError, method, cents };
    };
    form.addEventListener("input", () => {
      if (form.dataset.validated) validate();
    });
    form.onsubmit = (event) => {
      event.preventDefault();
      form.dataset.validated = "true";
      const data = validate();
      if (!data.valid) {
        form.querySelector('[aria-invalid="true"]').focus();
        return;
      }
      openDialog({
        title: "Record this payment?",
        description:
          "The record will be marked Paid. Payout stays Held until you complete the job. This does not move money.",
        body: `<dl class="details"><div><dt>Marketer</dt><dd>${escape(job.marketer.name)}</dd></div><div><dt>Method</dt><dd>${data.method}</dd></div><div><dt>Amount</dt><dd>${money(data.cents)}</dd></div></dl>`,
        confirm: "Confirm record",
        pending: "Recording...",
        onConfirm: () => {
          const latest = activeJob();
          if (
            !owns(latest) ||
            latest.payment ||
            latest.offerStatus !== "Accepted" ||
            !latest.offerId ||
            !["Accepted", "In Progress"].includes(latest.status) ||
            latest.cents !== data.cents
          )
            throw new Error("This job has changed. Close this dialog and refresh the page.");
          updateJob(jobId, (record) => {
            record.payment = {
              status: "Paid",
              method: data.method,
              cents: data.cents,
              paidAt: isoNow(),
              payout: "Held",
              releasedAt: null,
            };
          });
        },
        success: "Payment recorded. Payout is held.",
      });
    };
  }
  function renderRecordedPayment(content, job) {
    const payment = job.payment;
    content.insertAdjacentHTML(
      "beforeend",
      `<section class="card" aria-labelledby="payment-record-title"><div class="card-top"><h2 id="payment-record-title">Payment recorded</h2>${status(payment.status)}</div><p class="amount">${money(payment.cents)}</p><dl class="details"><div><dt>Payment method</dt><dd>${escape(payment.method)}</dd></div><div><dt>Recorded on</dt><dd>${time(payment.paidAt)}</dd></div><div><dt>Marketer payout</dt><dd>${status(payment.payout)}</dd></div>${payment.releasedAt ? `<div><dt>Released on</dt><dd>${time(payment.releasedAt)}</dd></div>` : ""}</dl><p class="help divider">${payment.payout === "Held" ? "The recorded amount stays held until the Creator completes the job." : "The payout was recorded when the Creator completed the job."} No money is collected or transferred.</p></section>`,
    );
    if (job.status === "Completed") {
      content.insertAdjacentHTML(
        "beforeend",
        `<section class="card"><h2>Job completed</h2><p class="muted">${date(job.completedAt)}. The payout has been released.</p><div class="actions"><a class="button ${owns(job) ? "" : "primary"}" href="${href("history")}">Transactions</a>${owns(job) ? `<a class="button primary" href="${href("review")}">${job.review ? "View review" : "Write a review"}</a>` : ""}</div></section>`,
      );
      return;
    }
    content.insertAdjacentHTML(
      "beforeend",
      `<section class="card" aria-labelledby="delivery-title"><h2 id="delivery-title">Delivery &amp; completion</h2><ol class="timeline"><li>${icon("check")}<div><strong>Payment recorded</strong><p class="muted small">${money(payment.cents)} held for this job.</p></div></li><li class="${job.proof ? "" : "waiting"}">${icon(job.proof ? "check" : "clock")}<div><strong>${job.proof ? "Delivery submitted" : "Waiting for delivery"}</strong><p class="muted small">${job.proof ? "Review the Marketer's proof before completing." : "The Marketer will submit proof when the work is ready."}</p>${job.proof ? `<a class="proof-link" href="https://example.com/" target="_blank" rel="noopener noreferrer">Open delivery proof ${icon("external")}</a>` : ""}</div></li><li class="waiting">${icon("clock")}<div><strong>Complete job &amp; release payout</strong><p class="muted small">The Creator confirms delivery to finish the job.</p></div></li></ol>${owns(job) ? `<p class="action-error" id="action-error" role="alert"></p><button id="complete-job" class="button primary full form-section" ${canComplete(job) ? "" : "disabled"} aria-describedby="complete-help">Complete job</button><p class="help" id="complete-help">${canComplete(job) ? "Completion also records the payout as Released." : "Available when the job is In Progress, payment is recorded, and delivery proof is submitted."}</p>` : ""}</section>`,
    );
    const button = document.querySelector("#complete-job");
    if (button)
      button.onclick = () =>
        openDialog({
          title: "Complete this job?",
          description:
            "Confirm that you have reviewed and accepted the delivery. This completes the job and records the held payout as Released.",
          body: `<dl class="details"><div><dt>Marketer</dt><dd>${escape(job.marketer.name)}</dd></div><div><dt>Payout to release</dt><dd>${money(payment.cents)}</dd></div></dl><p class="help">This records the payout only. No money is transferred.</p>`,
          confirm: "Complete & release",
          pending: "Completing...",
          onConfirm: () => {
            if (!canComplete(activeJob()))
              throw new Error(
                "This job is no longer ready to complete. Refresh the page to check its status.",
              );
            updateJob(jobId, (record) => {
              const now = isoNow();
              record.status = "Completed";
              record.completedAt = now;
              record.payment.payout = "Released";
              record.payment.releasedAt = now;
            });
          },
          success: "Job completed. Payout released.",
        });
  }

  function renderHistory() {
    main.innerHTML =
      heading("Transactions", "Payment records for your completed jobs.", false) +
      `<label class="search"><span class="sr-only">Search transactions by job, person or payment method</span><input id="transaction-search" class="input" type="search" placeholder="Search job or person" autocomplete="off" value="${escape(search)}">${icon("search")}</label><div id="history-results" aria-live="polite"></div>`;
    document.querySelector("#transaction-search").oninput = (event) => {
      search = event.target.value;
      pageNumber = 1;
      renderHistoryResults();
    };
    renderHistoryResults();
  }
  function renderHistoryResults() {
    const results = document.querySelector("#history-results");
    if (scenario === "history-error") {
      results.innerHTML = empty(
        "Could not load transactions",
        "Your records could not be loaded. Please try again.",
        '<button class="button" id="retry-history">Try again</button>',
        "info",
      );
      document.querySelector("#retry-history").onclick = () => {
        scenario = "normal";
        renderPage();
      };
      return;
    }
    const completed =
      scenario === "history-empty"
        ? []
        : store.jobs.filter(
            (job) => involved(job) && job.status === "Completed" && job.payment?.status === "Paid",
          );
    const filtered = completed
      .filter((job) =>
        `${job.id} ${job.title} ${job.creator.name} ${job.marketer.name} ${job.payment.method}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      )
      .sort(
        (a, b) => new Date(b.completedAt) - new Date(a.completedAt) || b.id.localeCompare(a.id),
      );
    if (!completed.length) {
      results.innerHTML = empty(
        "No transactions yet",
        "Completed jobs will appear here with the agreed price and payment method.",
        `<a class="button" href="${href("payment", workspaceJobId())}">View current job</a>`,
      );
      return;
    }
    if (!filtered.length) {
      results.innerHTML = empty(
        "No matching transactions",
        "Try another job title, name or payment method.",
        '<button class="button" id="clear-search">Clear search</button>',
        "search",
      );
      document.querySelector("#clear-search").onclick = () => {
        search = "";
        pageNumber = 1;
        renderHistory();
        document.querySelector("#transaction-search").focus();
      };
      return;
    }
    const pages = Math.ceil(filtered.length / pageSize);
    pageNumber = Math.min(pageNumber, pages);
    const slice = filtered.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
    results.innerHTML = `<div class="list-summary"><p class="muted small">${filtered.length} completed ${filtered.length === 1 ? "job" : "jobs"}</p><p class="muted small">${role} workspace</p></div><div class="transactions">${slice.map((job) => `<article class="card transaction"><div class="card-top"><p class="eyebrow">Job #${escape(job.id)}</p>${status(job.status)}</div><h2>${escape(job.title)}</h2><p class="amount">${money(job.cents)}</p><p class="muted small">Accepted price</p><dl class="details"><div><dt>Creator</dt><dd>${escape(job.creator.name)}</dd></div><div><dt>Marketer</dt><dd>${escape(job.marketer.name)}</dd></div><div><dt>Payment method</dt><dd>${escape(job.payment.method)}</dd></div><div><dt>Marketer payout</dt><dd>${status(job.payment.payout)}</dd></div><div><dt>Completed</dt><dd>${date(job.completedAt)}</dd></div></dl><div class="transaction-footer"><a class="text-link" href="${href("payment", job.id)}">View payment ${icon("forward")}</a>${owns(job) ? `<a class="text-link" href="${href("review", job.id)}">${job.review ? "View review" : "Write a review"} ${icon("star")}</a>` : ""}</div></article>`).join("")}</div>${pages > 1 ? `<nav class="pagination" aria-label="Transaction pages"><button class="button" id="prev-page" ${pageNumber === 1 ? "disabled" : ""}>Previous</button><span class="small">Page ${pageNumber} of ${pages}</span><button class="button" id="next-page" ${pageNumber === pages ? "disabled" : ""}>Next</button></nav>` : ""}`;
    for (const [id, delta] of [
      ["prev-page", -1],
      ["next-page", 1],
    ]) {
      const button = document.getElementById(id);
      if (button)
        button.onclick = () => {
          pageNumber += delta;
          renderHistoryResults();
          document.querySelector("#transaction-search").focus();
          main.scrollIntoView({ block: "start" });
        };
    }
  }

  function renderReview(job) {
    main.innerHTML =
      heading(
        job?.review ? "Your review" : "Write a review",
        "Share your experience with the Marketer.",
      ) + '<div id="page-content" class="stack"></div>';
    const content = document.querySelector("#page-content");
    if (!job) {
      content.innerHTML = empty(
        "Job not found",
        "This job is unavailable.",
        `<a class="button" href="${href("history")}">Back to transactions</a>`,
      );
      return;
    }
    if (!owns(job)) {
      content.innerHTML = empty(
        "Review is unavailable",
        "Only the Creator of this job can submit its review.",
        `<a class="button" href="${href("history")}">Back to transactions</a>`,
        "info",
      );
      return;
    }
    content.innerHTML = jobSummary(job);
    if (job.status !== "Completed") {
      content.insertAdjacentHTML(
        "beforeend",
        empty(
          "Complete the job first",
          "You can review the Marketer after the job is completed.",
          `<a class="button" href="${href("payment")}">View job &amp; payment</a>`,
          "clock",
        ),
      );
      return;
    }
    if (job.review) {
      content.insertAdjacentHTML(
        "beforeend",
        `<section class="card"><div class="card-top"><h2>Review submitted</h2>${status("Completed", "Submitted")}</div><p class="muted small">For ${escape(job.marketer.name)} on ${date(job.review.createdAt)}</p><div class="saved-stars" aria-label="${job.review.rating} out of 5 stars">${Array.from({ length: job.review.rating }, () => icon("star")).join("")}</div><p>${job.review.rating} out of 5</p>${job.review.comment ? `<p class="comment">${escape(job.review.comment)}</p>` : '<p class="muted small">No written comment.</p>'}<p class="help divider">One review can be submitted for each completed job.</p><a class="button full form-section" href="${href("history")}">Back to transactions</a></section>`,
      );
      return;
    }
    content.insertAdjacentHTML(
      "beforeend",
      `<form class="card" id="review-form" novalidate><h2>How was your experience?</h2><p class="muted small">Your review will appear on ${escape(job.marketer.name)}'s profile.</p><fieldset class="form-section" aria-describedby="rating-help rating-error"><legend>Rating <span class="muted small">(required)</span></legend><div class="rating">${[1, 2, 3, 4, 5].map((n) => `<label><input type="radio" name="rating" value="${n}" aria-label="${n} ${n === 1 ? "star" : "stars"}" required>${icon("star")}</label>`).join("")}</div><p id="rating-help" class="help" aria-live="polite">Select 1 to 5 stars.</p><p class="field-error" id="rating-error" aria-live="polite"></p></fieldset><div class="form-section"><label class="field-label" for="comment">Comment <span class="muted small">(optional)</span></label><textarea id="comment" name="comment" placeholder="What went well? What could be better?" aria-describedby="comment-help"></textarea><p class="help" id="comment-help">Share feedback about the work. Avoid personal or payment details.</p></div><p class="help form-section">You can submit one review for this job. Check your rating and comment before submitting.</p><p class="action-error" id="action-error" role="alert"></p><button class="button primary full form-section" type="submit">Review &amp; submit</button></form>`,
    );
    const form = document.querySelector("#review-form");
    form.onchange = (event) => {
      if (event.target.name !== "rating") return;
      const rating = Number(form.elements.rating.value);
      for (const label of form.querySelectorAll(".rating label"))
        label.dataset.filled = String(Number(label.querySelector("input").value) <= rating);
      document.querySelector("#rating-help").textContent = `${rating} out of 5 stars`;
      document.querySelector("#rating-error").textContent = "";
      for (const input of form.querySelectorAll('[name="rating"]'))
        input.removeAttribute("aria-invalid");
    };
    form.onsubmit = (event) => {
      event.preventDefault();
      const rating = Number(form.elements.rating.value);
      const comment = form.elements.comment.value.trim();
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        document.querySelector("#rating-error").textContent = "Choose a rating from 1 to 5 stars.";
        for (const input of form.querySelectorAll('[name="rating"]'))
          input.setAttribute("aria-invalid", "true");
        form.querySelector('[name="rating"]').focus();
        return;
      }
      openDialog({
        title: "Submit your review?",
        description:
          "Your review will be shown on the Marketer's profile. One review can be submitted for this job.",
        body: `<dl class="details"><div><dt>Marketer</dt><dd>${escape(job.marketer.name)}</dd></div><div><dt>Rating</dt><dd>${rating} out of 5 stars</dd></div></dl>${comment ? `<p class="comment dialog-comment">${escape(comment)}</p>` : '<p class="help">No written comment.</p>'}`,
        confirm: "Submit review",
        pending: "Submitting...",
        onConfirm: () => {
          const latest = activeJob();
          if (!owns(latest) || latest.status !== "Completed" || latest.review)
            throw new Error(
              "This job cannot receive another review. Close this dialog and refresh the page.",
            );
          updateJob(jobId, (record) => {
            record.review = {
              rating,
              comment,
              createdAt: isoNow(),
              creatorId: USER_ID,
              marketerId: record.marketer.id,
            };
          });
        },
        success: "Review submitted. Thank you for your feedback.",
      });
    };
  }

  function openDialog({ title, description, body, confirm, pending, onConfirm, success }) {
    const trigger = document.activeElement;
    dialog.innerHTML = `<h2 id="dialog-title">${title}</h2><p id="dialog-description" class="muted">${description}</p>${body}<p class="action-error" id="dialog-error" role="alert"></p><div class="actions"><button class="button" id="dialog-cancel" autofocus>Go back</button><button class="button primary" id="dialog-confirm">${confirm}</button></div>`;
    dialog.showModal();
    const cancel = document.querySelector("#dialog-cancel");
    const submit = document.querySelector("#dialog-confirm");
    cancel.onclick = () => dialog.close();
    dialog.oncancel = (event) => {
      if (busy) event.preventDefault();
    };
    dialog.onclose = () => {
      if (trigger?.isConnected) trigger.focus();
    };
    submit.onclick = async () => {
      if (busy) return;
      busy = true;
      cancel.disabled = true;
      submit.disabled = true;
      submit.textContent = pending;
      dialog.setAttribute("aria-busy", "true");
      document.querySelector("#dialog-error").textContent = "";
      try {
        await new Promise((resolve) => setTimeout(resolve, 450));
        if (failNext) {
          failNext = false;
          throw new Error("Could not save. Your entries are still here. Please try again.");
        }
        onConfirm();
        dialog.close();
        renderPage();
        main.focus({ preventScroll: true });
        toast(success);
      } catch (error) {
        document.querySelector("#dialog-error").textContent =
          error instanceof Error ? error.message : "Could not save. Please try again.";
      } finally {
        busy = false;
        cancel.disabled = false;
        submit.disabled = false;
        submit.textContent = confirm;
        if (dialog.open) submit.focus();
        dialog.removeAttribute("aria-busy");
        const failureControl = document.querySelector("#fail-next");
        if (failureControl) failureControl.checked = failNext;
      }
    };
  }
  let cleanupToast = () => {};
  function toast(message) {
    cleanupToast();
    const region = document.querySelector("#toast-region");
    region.innerHTML = `<div class="toast" role="status">${icon("check")}<p>${escape(message)}</p><button class="icon-button" aria-label="Dismiss notification">${icon("close")}</button></div>`;
    const notification = region.firstElementChild;
    let timer;
    let exitTimer;
    let remaining = 5000;
    let started;
    let closing = false;
    let hovered = false;
    let focused = false;
    const pause = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
        remaining = Math.max(0, remaining - (Date.now() - started));
      }
    };
    const dismiss = () => {
      if (closing) return;
      closing = true;
      pause();
      notification.dataset.closing = "true";
      exitTimer = setTimeout(
        () => notification.remove(),
        matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180,
      );
    };
    const resume = () => {
      if (closing || hovered || focused || timer) return;
      started = Date.now();
      timer = setTimeout(dismiss, remaining);
    };
    notification.onmouseenter = () => {
      hovered = true;
      pause();
    };
    notification.onmouseleave = () => {
      hovered = false;
      resume();
    };
    notification.onfocusin = () => {
      focused = true;
      pause();
    };
    notification.onfocusout = (event) => {
      if (notification.contains(event.relatedTarget)) return;
      focused = false;
      resume();
    };
    notification.querySelector("button").onclick = dismiss;
    cleanupToast = () => {
      clearTimeout(timer);
      clearTimeout(exitTimer);
      notification.remove();
    };
    resume();
  }

  function renderTools() {
    const scenarios =
      PAGE === "history"
        ? [
            ["normal", "Completed jobs"],
            ["history-empty", "No completed jobs"],
            ["history-error", "Loading failed"],
          ]
        : [
            ["normal", "Saved state"],
            ["unpaid", "Accepted, not paid"],
            ["held", "In Progress, payout held"],
            ["delivery", "Delivery submitted"],
            ["completed", "Completed, payout released"],
            ["reviewed", "Review already submitted"],
            ["unauthorized", "Not the owning Creator"],
            ["no-offer", "No accepted offer"],
          ];
    const route =
      PAGE === "payment"
        ? `/${role.toLowerCase()}/jobs/${jobId}${new URLSearchParams(location.search).get("view") === "job" ? "" : "/payment"}`
        : PAGE === "review"
          ? `/creator/jobs/${jobId}/review`
          : `/${role.toLowerCase()}/transactions`;
    document.querySelector("#preview-controls").innerHTML =
      `<details><summary>Prototype controls</summary><p>Design preview with fictional data. These controls are for review only and do not belong in the product.</p><p>Intended route: <code>${escape(route)}</code></p><p>Signed in as Alex Kim. Switching workspace keeps the same account.</p><div class="tools-grid"><label>Preview state<select id="scenario">${scenarios.map(([value, label]) => `<option value="${value}" ${scenario === value ? "selected" : ""}>${label}</option>`).join("")}</select></label><div><label class="check"><input type="checkbox" id="fail-next" ${failNext ? "checked" : ""}>Fail the next save to check retry</label><button id="reset-preview" class="button">Reset all preview data</button></div></div><nav aria-label="Design previews"><a href="${href("payment", workspaceJobId())}">US029 Payment</a><a href="${href("history")}">US032 Transactions</a><a href="${href("review", "1038")}">US033 Review</a></nav><p>To follow the full flow: record payment for job #1042, choose Delivery submitted here, then complete the job and write its review. Proof links use an example page.</p></details>`;
    document.querySelector("#scenario").onchange = (event) => {
      scenario = event.target.value;
      const job = activeJob();
      if (job && !["normal", "unauthorized", "history-empty", "history-error"].includes(scenario)) {
        updateJob(jobId, (record) => {
          record.offerId = `offer-${record.id}`;
          record.offerStatus = "Accepted";
          record.review = null;
          record.completedAt = null;
          record.proof = null;
          if (["unpaid", "no-offer"].includes(scenario)) {
            record.status = "Accepted";
            record.payment = null;
          } else {
            if (!record.payment) paidFixture(record);
            record.payment.payout = "Held";
            record.payment.releasedAt = null;
            record.status = "In Progress";
            if (["delivery", "completed", "reviewed"].includes(scenario))
              record.proof = { url: "https://example.com/", submittedAt: isoNow() };
            if (["completed", "reviewed"].includes(scenario)) {
              record.status = "Completed";
              record.completedAt = isoNow();
              record.payment.payout = "Released";
              record.payment.releasedAt = record.completedAt;
            }
            if (scenario === "reviewed")
              record.review = {
                rating: 4,
                comment: "Clear updates and the work was delivered on time.",
                createdAt: isoNow(),
                creatorId: record.creator.id,
                marketerId: record.marketer.id,
              };
          }
          if (scenario === "no-offer") {
            record.offerId = null;
            record.offerStatus = "Pending";
          }
        });
      }
      renderPage();
    };
    document.querySelector("#fail-next").onchange = (event) => {
      failNext = event.target.checked;
    };
    document.querySelector("#reset-preview").onclick = () => {
      persist(seed());
      scenario = "normal";
      search = "";
      pageNumber = 1;
      failNext = false;
      role = "Creator";
      preference(ROLE_KEY, role);
      cleanupToast();
      renderHeader();
      renderPage();
    };
  }
  function renderPage() {
    main.setAttribute("aria-busy", "false");
    if (PAGE === "payment") renderPayment(activeJob());
    if (PAGE === "history") renderHistory();
    if (PAGE === "review") renderReview(activeJob());
    renderTools();
  }
  window.addEventListener("storage", (event) => {
    if (event.key !== STORE_KEY) return;
    store = readStore();
    if (dialog.open) return; // Confirmation rechecks the updated record before saving.
    renderPage();
  });
  renderHeader();
  renderPage();
})();
