const STORE_KEY = "ermiPrototypeStateV3";
const DEMO_PASSWORD = "demo1234";
const ROLES = ["patient", "clinician", "support", "admin", "super_admin"];
let heroTickerInterval = null;

const quizSteps = [
  {
    id: "location",
    title: "Location and account fit",
    intro: "ERMI starts in Ontario. This screen checks basic care fit before a clinician review.",
    fields: [
      { id: "age", label: "Age", type: "number", value: "42" },
      { id: "province", label: "Province", type: "select", options: ["Ontario", "British Columbia", "Alberta", "Quebec", "Other"] },
      { id: "phone", label: "Phone", type: "text", value: "+1 416 742 8916" },
      { id: "condition", label: "Condition", type: "select", options: ["weight_loss", "ed", "hair_loss"] },
    ],
  },
  {
    id: "metrics",
    title: "Body metrics",
    intro: "These inputs prepare the intake summary. BMI is a screening number, not a diagnosis.",
    fields: [
      { id: "heightFt", label: "Height feet", type: "number", value: "5" },
      { id: "heightIn", label: "Height inches", type: "number", value: "8" },
      { id: "weightLb", label: "Current weight in lb", type: "number", value: "214" },
      { id: "highestWeight", label: "Highest adult weight in lb", type: "number", value: "238" },
    ],
    computed: true,
  },
  {
    id: "history",
    title: "Health history",
    intro: "Select all that apply. Answers support triage and clinician review.",
    options: ["No major conditions", "Type 2 diabetes", "High blood pressure", "High cholesterol", "Sleep apnea", "PCOS", "Heart disease", "Kidney disease", "Liver disease"],
    multi: true,
  },
  {
    id: "safety",
    title: "Safety screening",
    intro: "These answers do not automatically approve or reject care. A clinician makes the decision.",
    options: ["None of these apply", "Pregnant, breastfeeding, or trying to conceive", "History of pancreatitis", "Gallbladder disease", "Personal or family history of medullary thyroid cancer or MEN2", "Severe gastrointestinal disease", "Eating disorder history", "Major recent surgery"],
    multi: true,
  },
  {
    id: "medications",
    title: "Medications and allergies",
    intro: "List medications, supplements, allergies, and anything you want the clinician to review.",
    fields: [
      { id: "medicationList", label: "Current medications and supplements", type: "textarea", value: "Type here", full: true },
      { id: "allergies", label: "Allergies or adverse reactions", type: "textarea", value: "Type here", full: true },
    ],
  },
  {
    id: "consult",
    title: "Consultation preference",
    intro: "Secure messaging may be enough, but phone or video can be required by the clinician.",
    fields: [
      { id: "consultType", label: "Preferred consult style", type: "select", options: ["Secure messaging first", "Video if required", "Phone if required"] },
      { id: "consultTime", label: "Preferred time", type: "select", options: ["Weekday morning", "Weekday afternoon", "Weekday evening", "Weekend"] },
      { id: "questionForClinician", label: "Question for clinician", type: "textarea", value: "Ask about risks, options, labs, pricing, or follow-up.", full: true },
    ],
  },
  {
    id: "pharmacy",
    title: "Pharmacy choice",
    intro: "The patient controls where a prescription is sent if the clinician decides one is appropriate.",
    options: ["Partner pharmacy fulfillment", "Send to my own licensed pharmacy", "I already have a prescription and want transfer support"],
  },
  {
    id: "consent",
    title: "Consent",
    intro: "Submit the assessment only after accepting the care and privacy acknowledgements.",
    options: ["Prescription treatment is not guaranteed", "Medication is dispensed by a licensed pharmacy", "Clinical decisions are made by the clinician", "Patients may choose any licensed pharmacy"],
    multi: true,
  },
];

const state = loadState();

function nowIso() {
  return new Date().toISOString();
}

function id(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function demoHash(value) {
  return `demo_hash_${btoa(unescape(encodeURIComponent(value))).slice(0, 18)}`;
}

function loadState() {
  const saved = safeJson(localStorage.getItem(STORE_KEY));
  if (saved && saved.version === 3) return saved;
  const seeded = seedState();
  localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function safeJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function seedState() {
  const created = nowIso();
  const users = [
    makeUser("patient_1", "patient@ermi.care", "patient", "Mara", "Kowalski", "email_password", created),
    makeUser("patient_2", "patient2@ermi.care", "patient", "Devon", "Arora", "email_password", created),
    makeUser("clinician_1", "clinician@ermi.care", "clinician", "Renata", "Ellis", "email_password", created),
    makeUser("support_1", "support@ermi.care", "support", "Nadia", "Mercer", "email_password", created),
    makeUser("admin_1", "admin@ermi.care", "admin", "Oliver", "Grant", "email_password", created),
    makeUser("super_1", "super@ermi.care", "super_admin", "Clara", "Bennett", "email_password", created),
  ];

  return {
    version: 3,
    route: "home",
    authMode: "signin",
    activeUserId: "",
    adminViewPatientId: "",
    portalTab: "overview",
    clinicianTab: "queue",
    adminTab: "patients",
    selectedPatientId: "patient_1",
    selectedClinicianPatientId: "patient_1",
    quizStep: 0,
    draftQuiz: {},
    impersonation: null,
    users,
    patient_profiles: [
      { id: "pp_1", user_id: "patient_1", first_name: "Mara", last_name: "Kowalski", date_of_birth: "1984-03-14", phone: "+1 416 742 8916", province: "Ontario", created_at: created },
      { id: "pp_2", user_id: "patient_2", first_name: "Devon", last_name: "Arora", date_of_birth: "1978-09-22", phone: "+1 647 318 6042", province: "Ontario", created_at: created },
    ],
    clinician_profiles: [
      { id: "cp_1", user_id: "clinician_1", display_name: "Dr. Renata Ellis", license_province: "Ontario", license_status: "active", specialty: "Family medicine" },
    ],
    quiz_responses: [
      { id: "qr_1", patient_id: "patient_1", condition: "weight_loss", answers_json: { age: "42", province: "Ontario", weightLb: "214", heightFt: "5", heightIn: "8", safety: ["None of these apply"] }, status: "quiz_submitted", created_at: created },
      { id: "qr_2", patient_id: "patient_2", condition: "weight_loss", answers_json: { age: "47", province: "Ontario", weightLb: "231", heightFt: "6", heightIn: "0", safety: ["High blood pressure"] }, status: "clinician_review", created_at: created },
    ],
    consultations: [
      { id: "consult_1", patient_id: "patient_1", clinician_id: "clinician_1", scheduled_at: "2026-05-09T15:30:00.000Z", status: "consult_booked", notes: "Review safety screen and medication list before treatment discussion.", created_at: created },
      { id: "consult_2", patient_id: "patient_2", clinician_id: "clinician_1", scheduled_at: "2026-05-10T18:00:00.000Z", status: "clinician_review", notes: "Patient reports high blood pressure. Ask for readings and medication list.", created_at: created },
    ],
    prescription_statuses: [
      { id: "ps_1", patient_id: "patient_1", status: "clinical_review_pending", note: "No prescription decision has been made.", updated_at: created },
      { id: "ps_2", patient_id: "patient_2", status: "needs_clinician_follow_up", note: "Placeholder only. Prescription treatment is not guaranteed.", updated_at: created },
    ],
    pharmacy_orders: [
      { id: "pharm_1", patient_id: "patient_1", pharmacy_name: "Partner pharmacy placeholder", pharmacy_choice_type: "partner", status: "not_started", tracking_number: "", created_at: created },
      { id: "pharm_2", patient_id: "patient_2", pharmacy_name: "Patient-selected licensed pharmacy", pharmacy_choice_type: "own_pharmacy", status: "transfer_requested", tracking_number: "", created_at: created },
    ],
    subscriptions: [
      { id: "sub_1", patient_id: "patient_1", stripe_customer_id: "cus_mock_mara", stripe_subscription_id: "sub_mock_mara", plan_name: "Weight care membership", status: "active_subscription", monthly_price_cents: 59900, created_at: created },
      { id: "sub_2", patient_id: "patient_2", stripe_customer_id: "cus_mock_devon", stripe_subscription_id: "sub_mock_devon", plan_name: "Weight care membership", status: "active_subscription", monthly_price_cents: 69900, created_at: created },
    ],
    payments: [
      { id: "pay_1", patient_id: "patient_1", amount_cents: 59900, status: "paid", item: "Monthly care plan", created_at: created },
      { id: "pay_2", patient_id: "patient_2", amount_cents: 69900, status: "paid", item: "Monthly care plan", created_at: created },
    ],
    support_tickets: [
      { id: "ticket_1", patient_id: "patient_1", subject: "Update pharmacy preference", status: "open", created_at: created },
      { id: "ticket_2", patient_id: "patient_2", subject: "Billing receipt request", status: "waiting_on_support", created_at: created },
    ],
    messages: [
      { id: "msg_1", patient_id: "patient_1", from_user_id: "clinician_1", body: "Please confirm your current medications before I complete my review.", created_at: created },
      { id: "msg_2", patient_id: "patient_1", from_user_id: "patient_1", body: "I added my medication list in the assessment.", created_at: created },
      { id: "msg_3", patient_id: "patient_2", from_user_id: "clinician_1", body: "Please upload recent blood pressure readings if available.", created_at: created },
    ],
    consents: [
      { id: "consent_1", patient_id: "patient_1", consent_type: "telehealth_consent", version: "2026.05", accepted_at: created, ip_address: "127.0.0.1" },
      { id: "consent_2", patient_id: "patient_1", consent_type: "pharmacy_choice_acknowledgement", version: "2026.05", accepted_at: created, ip_address: "127.0.0.1" },
    ],
    admin_notes: [
      { id: "note_1", patient_id: "patient_1", author_user_id: "admin_1", body: "Patient requested partner pharmacy delivery path.", visibility: "operations_only", created_at: created },
    ],
    audit_logs: [
      { id: "audit_seed", actor_user_id: "system", target_user_id: "", action: "seed_demo_data", reason: "Initial prototype data", metadata_json: {}, created_at: created },
    ],
  };
}

function currentUser() {
  return state.users.find((user) => user.id === state.activeUserId) || null;
}

function effectivePatientId() {
  const user = currentUser();
  if (!user) return "";
  if (state.impersonation?.target_user_id) return state.impersonation.target_user_id;
  if (state.adminViewPatientId && can(["support", "admin", "super_admin"])) return state.adminViewPatientId;
  return user.role === "patient" ? user.id : "";
}

function can(roleSet) {
  const user = currentUser();
  if (!user) return false;
  return roleSet.includes(user.role);
}

function isAdminLike() {
  return can(["admin", "super_admin"]);
}

function addAudit(action, targetUserId = "", reason = "", metadata = {}) {
  state.audit_logs.unshift({
    id: id("audit"),
    actor_user_id: currentUser()?.id || "anonymous",
    target_user_id: targetUserId,
    action,
    reason,
    metadata_json: metadata,
    created_at: nowIso(),
  });
  saveState();
}

function routeTo(route, patch = {}) {
  state.route = route;
  if (!["patient"].includes(route) && !state.impersonation) state.adminViewPatientId = "";
  Object.assign(state, patch);
  saveState();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function formatDate(value) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });
}

function money(cents) {
  return `CAD $${(cents / 100).toFixed(0)}`;
}

function userName(userId) {
  const user = state.users.find((item) => item.id === userId);
  return user ? `${user.first_name} ${user.last_name}` : "Unknown user";
}

function patientProfile(patientId) {
  return state.patient_profiles.find((profile) => profile.user_id === patientId);
}

function patientRow(patientId) {
  const user = state.users.find((item) => item.id === patientId);
  const profile = patientProfile(patientId);
  const quiz = state.quiz_responses.find((item) => item.patient_id === patientId);
  const consult = state.consultations.find((item) => item.patient_id === patientId);
  const rx = state.prescription_statuses.find((item) => item.patient_id === patientId);
  const pharmacy = state.pharmacy_orders.find((item) => item.patient_id === patientId);
  const subscription = state.subscriptions.find((item) => item.patient_id === patientId);
  return { user, profile, quiz, consult, rx, pharmacy, subscription };
}

function assignedPatientsFor(clinicianId) {
  return state.consultations
    .filter((consult) => consult.clinician_id === clinicianId)
    .map((consult) => consult.patient_id)
    .filter((value, index, array) => array.indexOf(value) === index);
}

function appLayout(content) {
  const user = currentUser();
  const navItems = [
    ["home", "Home"],
    ["quiz", "Assessment"],
    ["patient", "Patient"],
    ["clinician", "Clinician"],
    ["admin", "Admin"],
  ];
  return `
    <div class="app-shell">
      <header class="topbar">
        <button class="brand" data-route="home" type="button"><span class="brand-mark">E</span><span>ERMI</span></button>
        <nav class="nav" aria-label="Primary navigation">
          ${navItems.map(([route, label]) => `<button class="${state.route === route ? "active" : ""}" data-route="${route}" type="button">${label}</button>`).join("")}
        </nav>
        <div class="topbar-actions">
          ${user ? `
            <span class="role-badge">${user.role}</span>
            <button class="button ghost small" data-route="${defaultRouteFor(user.role)}" type="button">${user.first_name}</button>
            <button class="button small" id="signOut" type="button">Sign out</button>
          ` : `
            <button class="button ghost small" data-auth="signin" type="button">Sign in</button>
            <button class="button small" data-auth="signup" type="button">Create account</button>
          `}
        </div>
      </header>
      ${state.impersonation ? renderImpersonationBanner() : ""}
      ${state.adminViewPatientId && !state.impersonation ? renderAdminReadOnlyBanner() : ""}
      ${content}
      <footer class="footer">
        <div class="container footer-inner">
          <strong>ERMI</strong>
          <span>Prototype only. Use server-side auth, encrypted storage, MFA, audit logs, and PHIPA/PIPEDA review before handling real health data.</span>
        </div>
      </footer>
    </div>
  `;
}

function defaultRouteFor(role) {
  if (role === "clinician") return "clinician";
  if (["support", "admin", "super_admin"].includes(role)) return "admin";
  return "patient";
}

function renderImpersonationBanner() {
  return `
    <div class="impersonation-banner">
      <strong>You are viewing this account as an administrator.</strong>
      <span>Target: ${userName(state.impersonation.target_user_id)}. Reason: ${state.impersonation.reason}</span>
      <button class="button small" id="stopImpersonation" type="button">Stop impersonation</button>
    </div>
  `;
}

function renderAdminReadOnlyBanner() {
  return `
    <div class="impersonation-banner read-only">
      <strong>You are viewing this patient record as an administrator.</strong>
      <span>Read-only operational view. Full impersonation requires super_admin approval and a reason.</span>
      <button class="button small" id="closeAdminPatientView" type="button">Close patient view</button>
    </div>
  `;
}

function renderHome() {
  return appLayout(`
    <main>
      <section class="video-hero" aria-label="ERMI clinician-guided care introduction">
        <video class="hero-video" autoplay muted loop playsinline preload="metadata" poster="./assets/images/hero-poster.jpg" aria-hidden="true">
          <source src="./assets/videos/hero-care.mp4" type="video/mp4" />
        </video>
        <div class="hero-video-overlay" aria-hidden="true"></div>
        <div class="container video-hero-content">
          <p class="video-kicker">Canadian virtual care and medical concierge</p>
          <h1>Clinician-guided care, delivered with discretion.</h1>
          <p class="video-lede">Online assessment, licensed Canadian providers, and pharmacy fulfillment coordination when treatment is clinically appropriate.</p>
          <div class="hero-actions">
            <button class="button video-primary" data-start-flow type="button">Start assessment</button>
            <button class="button video-secondary" data-scroll-target="platform-architecture" type="button">See platform skeleton</button>
          </div>
          <p class="hero-trust-line">Prescription treatment is not guaranteed. Patients may choose any licensed pharmacy.</p>
          <div class="video-trust-chips"><span>Role-based portals</span><span>Audit-log ready</span><span>Pharmacy choice</span></div>
        </div>
      </section>

      <section class="section" id="platform-architecture">
        <div class="container">
          <div class="section-head">
            <div>
              <p class="eyebrow">Secure product skeleton</p>
              <h2>Patient, clinician, support, admin, and super admin workflows.</h2>
            </div>
            <p>The browser prototype demonstrates the flows. The included SQL schema and security notes show how to move these checks server-side.</p>
          </div>
          <div class="grid three">
            <article class="card primary"><p class="eyebrow">Patient</p><h3>Private care dashboard</h3><p>Assessment status, consultations, subscription, pharmacy choice, support tickets, messages, and consents.</p></article>
            <article class="card"><p class="eyebrow">Clinician</p><h3>Assigned charts only</h3><p>Assigned patients, intake summary, notes, eligibility status placeholders, and follow-up tasks.</p></article>
            <article class="card"><p class="eyebrow">Admin</p><h3>Operations control</h3><p>Patients, clinicians, subscriptions, support, pharmacy statuses, role management, impersonation, and audit logs.</p></article>
          </div>
        </div>
      </section>
    </main>
  `);
}

function renderAuth() {
  const mode = state.authMode;
  return appLayout(`
    <main class="container auth-layout">
      <section>
        <p class="eyebrow">Authentication skeleton</p>
        <h1>${mode === "signup" ? "Create a patient account." : "Sign in to ERMI."}</h1>
        <p class="lead">New registrations are always patient accounts. Clinician, support, admin, and super admin roles are seeded or changed by a super admin only.</p>
        <div class="panel">
          <h3>Demo credentials</h3>
          <p>Use password <strong>${DEMO_PASSWORD}</strong> for any seeded account.</p>
          <div class="demo-grid">
            ${["patient@ermi.care", "clinician@ermi.care", "support@ermi.care", "admin@ermi.care", "super@ermi.care"].map((email) => `<button class="demo-login" data-fill-email="${email}" type="button">${email}</button>`).join("")}
          </div>
        </div>
      </section>
      <section class="auth-card">
        <div class="auth-tabs">
          <button class="tab ${mode === "signin" ? "active" : ""}" data-auth="signin" type="button">Email/password</button>
          <button class="tab ${mode === "signup" ? "active" : ""}" data-auth="signup" type="button">Register</button>
          <button class="tab ${mode === "magic" ? "active" : ""}" data-auth="magic" type="button">Magic link</button>
        </div>
        <form id="authForm" class="form-grid">
          ${mode === "signup" ? `
            <div class="question-grid">
              <div class="field"><label for="firstName">First name</label><input id="firstName" name="firstName" value="Avery" /></div>
              <div class="field"><label for="lastName">Last name</label><input id="lastName" name="lastName" value="Miller" /></div>
              <div class="field"><label for="province">Province</label><select id="province" name="province"><option>Ontario</option><option>British Columbia</option><option>Alberta</option></select></div>
              <div class="field"><label for="phone">Phone</label><input id="phone" name="phone" value="+1 416 555 0144" /></div>
            </div>
          ` : ""}
          <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" value="patient@ermi.care" autocomplete="email" /></div>
          ${mode !== "magic" ? `<div class="field"><label for="password">Password</label><input id="password" name="password" type="password" value="${DEMO_PASSWORD}" /><small>Prototype hash only. Production uses Clerk/Supabase Auth and never stores passwords manually.</small></div>` : ""}
          <div class="error" id="authError"></div>
          <button class="button full" type="submit">${mode === "magic" ? "Send magic link mock" : mode === "signup" ? "Create patient account" : "Sign in"}</button>
        </form>
        <div class="auth-divider">or</div>
        <button class="button secondary full" id="googleMock" type="button">Continue with Google OAuth mock</button>
      </section>
    </main>
  `);
}

function renderQuiz() {
  if (!currentUser()) return renderAuthRequired("Create an account before starting the medical assessment.");
  if (!can(["patient"]) && !state.impersonation) return renderAccessDenied("Only patient accounts can submit patient assessments.");
  const step = quizSteps[state.quizStep];
  return appLayout(`
    <main class="container quiz-layout">
      <aside class="quiz-progress">
        <p class="eyebrow">Eligibility assessment</p>
        ${quizSteps.map((item, index) => `<div class="progress-row ${index < state.quizStep ? "done" : ""} ${index === state.quizStep ? "active" : ""}"><span>${index + 1}</span><strong>${item.title}</strong></div>`).join("")}
      </aside>
      <section class="quiz-card">
        <p class="eyebrow">Step ${state.quizStep + 1} of ${quizSteps.length}</p>
        <h2>${step.title}</h2>
        <p>${step.intro}</p>
        <form id="quizForm" class="form-grid">
          ${renderQuizStep(step)}
          <div class="form-actions">
            <button class="button secondary" id="quizBack" type="button" ${state.quizStep === 0 ? "disabled" : ""}>Back</button>
            <button class="button" type="submit">${state.quizStep === quizSteps.length - 1 ? "Submit assessment" : "Save and continue"}</button>
          </div>
        </form>
      </section>
    </main>
  `);
}

function renderQuizStep(step) {
  if (step.options) {
    const selected = state.draftQuiz[step.id] || (step.multi ? [] : "");
    return `<div class="choice-list">${step.options.map((option) => {
      const active = Array.isArray(selected) ? selected.includes(option) : selected === option;
      return `<button class="choice ${active ? "active" : ""}" data-choice="${escapeAttr(option)}" data-step="${step.id}" type="button">${option}</button>`;
    }).join("")}</div>`;
  }
  return `<div class="question-grid">${step.fields.map(renderField).join("")}${step.computed ? `<div class="computed-box full"><span>Estimated BMI</span><br><strong id="bmiValue">${calculateBmi()}</strong><p>BMI is only a screening number.</p></div>` : ""}</div>`;
}

function renderField(field) {
  const value = state.draftQuiz[field.id] ?? field.value ?? "";
  if (field.type === "select") {
    return `<div class="field ${field.full ? "full" : ""}"><label for="${field.id}">${field.label}</label><select id="${field.id}" name="${field.id}">${field.options.map((option) => `<option ${value === option ? "selected" : ""}>${option}</option>`).join("")}</select></div>`;
  }
  if (field.type === "textarea") {
    return `<div class="field ${field.full ? "full" : ""}"><label for="${field.id}">${field.label}</label><textarea id="${field.id}" name="${field.id}" placeholder="${field.value || ""}">${state.draftQuiz[field.id] || ""}</textarea></div>`;
  }
  return `<div class="field ${field.full ? "full" : ""}"><label for="${field.id}">${field.label}</label><input id="${field.id}" name="${field.id}" type="${field.type}" value="${value}" /></div>`;
}

function renderPatientDashboard() {
  const patientId = effectivePatientId();
  if (!patientId) return renderAuthRequired("Sign in as a patient or start an approved super admin impersonation session.");
  const user = state.users.find((item) => item.id === patientId);
  if (!user) return renderAccessDenied("Patient not found.");
  const profile = patientProfile(patientId);
  const tabs = ["overview", "profile", "assessment", "consultations", "pharmacy", "subscription", "messages", "consents"];
  return appLayout(`
    <main class="container portal-layout">
      <section class="portal-shell">
        <aside class="portal-sidebar">
          <div class="user-card"><div class="avatar">${user.first_name[0]}</div><strong>${userName(patientId)}</strong><p>${user.email}</p><span class="badge green">patient</span></div>
          <div class="portal-tabs">${tabs.map((tab) => `<button class="tab ${state.portalTab === tab ? "active" : ""}" data-portal-tab="${tab}" type="button">${tab}</button>`).join("")}</div>
        </aside>
        <section class="portal-main">${renderPatientTab(patientId, profile)}</section>
      </section>
    </main>
  `);
}

function renderPatientTab(patientId, profile) {
  const row = patientRow(patientId);
  if (state.portalTab === "profile") return renderPatientProfile(patientId, profile);
  if (state.portalTab === "assessment") return renderAssessment(patientId);
  if (state.portalTab === "consultations") return renderPatientConsultations(patientId);
  if (state.portalTab === "pharmacy") return renderPatientPharmacy(patientId);
  if (state.portalTab === "subscription") return renderPatientSubscription(patientId);
  if (state.portalTab === "messages") return renderPatientMessages(patientId);
  if (state.portalTab === "consents") return renderPatientConsents(patientId);
  return `
    <div class="section-head"><div><p class="eyebrow">Patient dashboard</p><h2>${userName(patientId)}</h2></div><button class="button small" data-route="quiz" type="button">Update assessment</button></div>
    <div class="stats-grid">
      <div class="stat"><span>Quiz</span><strong>${row.quiz?.status || "not_started"}</strong></div>
      <div class="stat"><span>Consult</span><strong>${row.consult?.status || "none"}</strong></div>
      <div class="stat"><span>Review</span><strong>${row.rx?.status || "pending"}</strong></div>
      <div class="stat"><span>Subscription</span><strong>${row.subscription?.status || "inactive"}</strong></div>
    </div>
    <div class="grid two">
      <article class="panel"><h3>Status timeline</h3><div class="status-track">${patientStatuses(row).map((status) => `<div class="status-item ${status.done ? "done" : ""}">${status.label}</div>`).join("")}</div></article>
      <article class="panel"><h3>Compliance reminders</h3><p>Prescription treatment is not guaranteed. Patients may choose any licensed pharmacy. ERMI coordinates care and support; licensed pharmacies dispense medication.</p></article>
    </div>
  `;
}

function patientStatuses(row) {
  const labels = ["quiz_submitted", "consult_booked", "clinician_review", "prescription_pending", "pharmacy_processing", "refill_due"];
  const current = [row.quiz?.status, row.consult?.status, row.rx?.status, row.pharmacy?.status, row.subscription?.status].filter(Boolean);
  return labels.map((label, index) => ({ label, done: current.includes(label) || index < 2 }));
}

function renderPatientProfile(patientId, profile) {
  if (state.adminViewPatientId && !state.impersonation) {
    return `
      <p class="eyebrow">Read-only profile</p><h2>Basic profile</h2>
      <div class="panel">
        <p>Name: ${profile?.first_name || ""} ${profile?.last_name || ""}</p>
        <p>Phone: ${profile?.phone || ""}</p>
        <p>Province: ${profile?.province || ""}</p>
      </div>
    `;
  }
  return `
    <p class="eyebrow">Profile</p><h2>Basic profile</h2>
    <form id="profileForm" class="panel form-grid" data-patient-id="${patientId}">
      <div class="question-grid">
        <div class="field"><label for="first_name">First name</label><input id="first_name" name="first_name" value="${profile?.first_name || ""}" /></div>
        <div class="field"><label for="last_name">Last name</label><input id="last_name" name="last_name" value="${profile?.last_name || ""}" /></div>
        <div class="field"><label for="phone">Phone</label><input id="phone" name="phone" value="${profile?.phone || ""}" /></div>
        <div class="field"><label for="province">Province</label><input id="province" name="province" value="${profile?.province || ""}" /></div>
      </div>
      <button class="button" type="submit">Save profile</button>
    </form>
  `;
}

function renderAssessment(patientId) {
  const quiz = state.quiz_responses.find((item) => item.patient_id === patientId);
  if (currentUser()?.role === "support" && state.adminViewPatientId) {
    return `<p class="eyebrow">Assessment</p><h2>Restricted view</h2><div class="panel"><p>Support users cannot view detailed quiz answers in this prototype. Admin or clinician access is required.</p></div>`;
  }
  return `<p class="eyebrow">Assessment</p><h2>${quiz?.condition || "No assessment yet"}</h2><div class="panel"><pre class="json-block">${JSON.stringify(quiz?.answers_json || {}, null, 2)}</pre></div>`;
}

function renderPatientConsultations(patientId) {
  const rows = state.consultations.filter((item) => item.patient_id === patientId);
  return `<p class="eyebrow">Consultations</p><h2>Clinical review</h2>${renderTable(["Scheduled", "Clinician", "Status", "Notes"], rows.map((row) => [formatDate(row.scheduled_at), userName(row.clinician_id), badge(row.status), row.notes]))}`;
}

function renderPatientPharmacy(patientId) {
  const order = state.pharmacy_orders.find((item) => item.patient_id === patientId);
  return `<p class="eyebrow">Pharmacy choice</p><h2>Fulfillment coordination</h2><div class="panel"><p>Choice: <strong>${order?.pharmacy_choice_type || "not_selected"}</strong></p><p>Pharmacy: ${order?.pharmacy_name || "Not selected"}</p><p>Status: ${badge(order?.status || "not_started")}</p><p>Licensed pharmacy dispensing and counselling remains pharmacy responsibility.</p></div>`;
}

function renderPatientSubscription(patientId) {
  const sub = state.subscriptions.find((item) => item.patient_id === patientId);
  const payments = state.payments.filter((item) => item.patient_id === patientId);
  return `<p class="eyebrow">Subscription</p><h2>${sub?.plan_name || "No plan"}</h2><div class="grid two"><article class="panel"><h3>Status</h3><p>${badge(sub?.status || "inactive")}</p><p>${sub ? money(sub.monthly_price_cents) : "CAD $0"} / month</p><p>Stripe customer: ${sub?.stripe_customer_id || "not connected"}</p></article><article class="panel table-wrap">${renderTable(["Item", "Amount", "Status"], payments.map((pay) => [pay.item, money(pay.amount_cents), badge(pay.status)]), false)}</article></div>`;
}

function renderPatientMessages(patientId) {
  if (state.adminViewPatientId && !state.impersonation) {
    return `<p class="eyebrow">Messages</p><h2>Restricted operational view</h2><div class="panel"><p>Administrators can see ticket status from the admin panel. Secure clinical messages remain in the patient/clinician workspace unless a policy-approved access event is logged.</p></div>`;
  }
  const messages = state.messages.filter((item) => item.patient_id === patientId);
  return `
    <p class="eyebrow">Secure messages</p><h2>Clinician and support chat</h2>
    <div class="chat-shell"><div class="chat-list">${messages.map((msg) => `<div class="message ${msg.from_user_id === patientId ? "patient" : ""}"><small>${userName(msg.from_user_id)}</small>${msg.body}</div>`).join("")}</div><form id="messageForm" class="chat-compose" data-patient-id="${patientId}"><input id="messageBody" placeholder="Write a secure message..." /><button class="button" type="submit">Send</button></form></div>
  `;
}

function renderPatientConsents(patientId) {
  const consents = state.consents.filter((item) => item.patient_id === patientId);
  return `<p class="eyebrow">Consents</p><h2>Privacy and care acknowledgements</h2>${renderTable(["Consent", "Version", "Accepted", "IP"], consents.map((item) => [item.consent_type, item.version, formatDate(item.accepted_at), item.ip_address]))}<div class="panel"><p>Prescription treatment is not guaranteed. Patients may choose any licensed pharmacy.</p></div>`;
}

function renderClinicianDashboard() {
  if (!can(["clinician", "super_admin"])) return renderAccessDenied("Clinician workspace requires clinician or super admin role.");
  const clinicianId = currentUser().role === "clinician" ? currentUser().id : "clinician_1";
  const patientIds = assignedPatientsFor(clinicianId);
  const selectedId = patientIds.includes(state.selectedClinicianPatientId) ? state.selectedClinicianPatientId : patientIds[0];
  const row = patientRow(selectedId);
  return appLayout(`
    <main class="container section">
      <div class="section-head"><div><p class="eyebrow">Clinician dashboard</p><h1>Assigned patients</h1></div><p>Prescription-related actions are placeholders only. Clinical decisions remain independent.</p></div>
      <div class="dashboard-layout">
        <aside class="panel dense-list">${patientIds.map((pid) => `<button class="list-button ${pid === selectedId ? "active" : ""}" data-clinician-patient="${pid}" type="button"><strong>${userName(pid)}</strong><span>${patientRow(pid).consult?.status || "No consult"}</span></button>`).join("")}</aside>
        <section class="panel">
          <p class="eyebrow">Assigned chart</p><h2>${userName(selectedId)}</h2>
          <div class="detail-grid">
            <div><strong>Intake</strong><p>${row.quiz?.status || "No quiz"}</p></div>
            <div><strong>Consult</strong><p>${row.consult?.status || "No consult"}</p></div>
            <div><strong>Prescription status</strong><p>${row.rx?.status || "No decision"}</p></div>
            <div><strong>Pharmacy</strong><p>${row.pharmacy?.pharmacy_choice_type || "No choice"}</p></div>
          </div>
          <h3>Quiz answers</h3><pre class="json-block">${JSON.stringify(row.quiz?.answers_json || {}, null, 2)}</pre>
          <form id="clinicianForm" class="form-grid" data-patient-id="${selectedId}">
            <div class="field"><label for="clinicalNotes">Clinical notes placeholder</label><textarea id="clinicalNotes" name="clinicalNotes">${row.consult?.notes || ""}</textarea></div>
            <div class="question-grid">
              <div class="field"><label for="consultStatus">Consult status</label><select id="consultStatus" name="consultStatus">${["consult_booked", "consult_completed", "clinician_review", "follow_up_needed"].map((value) => `<option ${row.consult?.status === value ? "selected" : ""}>${value}</option>`).join("")}</select></div>
              <div class="field"><label for="prescriptionStatus">Prescription placeholder</label><select id="prescriptionStatus" name="prescriptionStatus">${["clinical_review_pending", "not_clinically_appropriate", "prescription_pending", "sent_to_patient_chosen_pharmacy"].map((value) => `<option ${row.rx?.status === value ? "selected" : ""}>${value}</option>`).join("")}</select></div>
            </div>
            <button class="button" type="submit">Save clinician update</button>
          </form>
        </section>
      </div>
    </main>
  `);
}

function renderAdminPanel() {
  if (!can(["support", "admin", "super_admin"])) return renderAccessDenied("Admin panel requires support, admin, or super admin role.");
  const tabs = ["patients", "clinicians", "consultations", "pharmacy", "subscriptions", "support", "roles", "audit"];
  return appLayout(`
    <main class="container section">
      <div class="section-head"><div><p class="eyebrow">Admin panel</p><h1>Operations workspace</h1></div><p>Admin tools are operational. Super admin controls roles and impersonation.</p></div>
      <div class="tabs">${tabs.map((tab) => `<button class="tab ${state.adminTab === tab ? "active" : ""}" data-admin-tab="${tab}" type="button">${tab}</button>`).join("")}</div>
      ${renderAdminTab()}
      ${state.impersonationModalTarget ? renderImpersonationModal() : ""}
    </main>
  `);
}

function renderAdminTab() {
  if (state.adminTab === "clinicians") return renderCliniciansAdmin();
  if (state.adminTab === "consultations") return renderConsultationsAdmin();
  if (state.adminTab === "pharmacy") return renderPharmacyAdmin();
  if (state.adminTab === "subscriptions") return renderSubscriptionsAdmin();
  if (state.adminTab === "support") return renderSupportAdmin();
  if (state.adminTab === "roles") return renderRolesAdmin();
  if (state.adminTab === "audit") return renderAuditAdmin();
  return renderPatientsAdmin();
}

function renderPatientsAdmin() {
  const patients = state.users.filter((user) => user.role === "patient");
  return `<div class="panel table-wrap">${renderTable(["Patient", "Province", "Quiz", "Consult", "Subscription", "Actions"], patients.map((user) => {
    const row = patientRow(user.id);
    return [userName(user.id), row.profile?.province || "", badge(row.quiz?.status || "not_started"), badge(row.consult?.status || "none"), badge(row.subscription?.status || "inactive"), adminPatientActions(user.id)];
  }), false)}</div>`;
}

function adminPatientActions(patientId) {
  const view = `<button class="button ghost small" data-admin-view-patient="${patientId}" type="button">View</button>`;
  const impersonate = can(["super_admin"]) ? `<button class="button small" data-impersonate="${patientId}" type="button">Impersonate</button>` : "";
  return `<div class="button-row">${view}${impersonate}</div>`;
}

function renderCliniciansAdmin() {
  const clinicians = state.users.filter((user) => user.role === "clinician");
  return `<div class="panel table-wrap">${renderTable(["Clinician", "License", "Assigned patients", "Status"], clinicians.map((user) => {
    const profile = state.clinician_profiles.find((item) => item.user_id === user.id);
    return [userName(user.id), `${profile?.license_province || "N/A"} / ${profile?.specialty || "N/A"}`, assignedPatientsFor(user.id).length, badge(profile?.license_status || "unknown", "green")];
  }), false)}</div>`;
}

function renderConsultationsAdmin() {
  return `<div class="panel table-wrap">${renderTable(["Patient", "Clinician", "Scheduled", "Status"], state.consultations.map((item) => [userName(item.patient_id), userName(item.clinician_id), formatDate(item.scheduled_at), badge(item.status)]), false)}</div>`;
}

function renderPharmacyAdmin() {
  return `<div class="panel table-wrap">${renderTable(["Patient", "Choice", "Pharmacy", "Status", "Tracking"], state.pharmacy_orders.map((item) => [userName(item.patient_id), item.pharmacy_choice_type, item.pharmacy_name, badge(item.status), item.tracking_number || "N/A"]), false)}</div>`;
}

function renderSubscriptionsAdmin() {
  return `<div class="panel table-wrap">${renderTable(["Patient", "Plan", "Status", "Stripe", "Price"], state.subscriptions.map((item) => [userName(item.patient_id), item.plan_name, badge(item.status, "green"), item.stripe_subscription_id, money(item.monthly_price_cents)]), false)}</div>`;
}

function renderSupportAdmin() {
  return `<div class="panel table-wrap">${renderTable(["Patient", "Ticket", "Status", "Created"], state.support_tickets.map((item) => [userName(item.patient_id), item.subject, badge(item.status), formatDate(item.created_at)]), false)}</div>`;
}

function renderRolesAdmin() {
  if (!can(["super_admin"])) return `<div class="panel"><h3>Role management locked</h3><p>Only super_admin can change roles. Support/admin cannot elevate themselves.</p></div>`;
  return `<div class="panel table-wrap">${renderTable(["User", "Current role", "Change role"], state.users.map((user) => [user.email, badge(user.role), `<select class="role-select" data-user-id="${user.id}">${ROLES.map((role) => `<option ${user.role === role ? "selected" : ""}>${role}</option>`).join("")}</select>`]), false)}</div>`;
}

function renderAuditAdmin() {
  return `<div class="panel table-wrap">${renderTable(["Time", "Actor", "Target", "Action", "Reason"], state.audit_logs.slice(0, 60).map((log) => [formatDate(log.created_at), userName(log.actor_user_id), log.target_user_id ? userName(log.target_user_id) : "N/A", log.action, log.reason || "N/A"]), false)}</div>`;
}

function renderImpersonationModal() {
  return `
    <div class="modal-backdrop">
      <form class="modal" id="impersonationForm" data-target-user-id="${state.impersonationModalTarget}">
        <p class="eyebrow">Super admin action</p>
        <h2>Reason required</h2>
        <p>Impersonation creates audit events for start, stop, and sensitive actions.</p>
        <div class="field"><label for="impersonationReason">Reason</label><textarea id="impersonationReason" name="reason" required placeholder="Example: Patient requested support with account settings."></textarea></div>
        <div class="button-row"><button class="button" type="submit">Start impersonation</button><button class="button secondary" id="cancelImpersonation" type="button">Cancel</button></div>
      </form>
    </div>
  `;
}

function renderAuthRequired(message) {
  return appLayout(`<main class="container section"><p class="eyebrow">Authentication required</p><h1>${message}</h1><button class="button" data-auth="signin" type="button">Sign in</button></main>`);
}

function renderAccessDenied(message) {
  return appLayout(`<main class="container section"><p class="eyebrow">Access denied</p><h1>${message}</h1><p>Production routes must enforce this server-side, not only in the browser.</p></main>`);
}

function renderTable(headers, rows, wrap = true) {
  const table = `<table><thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  return wrap ? `<div class="panel table-wrap">${table}</div>` : table;
}

function badge(text, variant = "") {
  return `<span class="badge ${variant}">${text}</span>`;
}

function escapeAttr(value) {
  return String(value).replaceAll('"', "&quot;");
}

function calculateBmi() {
  const ft = Number(state.draftQuiz.heightFt || 5);
  const inches = Number(state.draftQuiz.heightIn || 8);
  const weight = Number(state.draftQuiz.weightLb || 214);
  const total = ft * 12 + inches;
  if (!total || !weight) return "Add height and weight";
  return ((weight / (total * total)) * 703).toFixed(1);
}

function handleAuth(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const email = String(data.get("email") || "").trim().toLowerCase();
  const password = String(data.get("password") || "");
  const error = document.querySelector("#authError");
  if (!email.includes("@")) {
    error.textContent = "Enter a valid email.";
    return;
  }

  if (state.authMode === "magic") {
    let user = state.users.find((item) => item.email === email);
    if (!user) {
      user = createPatientFromForm({ email, firstName: "Magic", lastName: "Patient", authProvider: "magic_link_mock" });
      state.users.push(user);
    }
    state.activeUserId = user.id;
    addAudit("magic_link_login_mock", user.id, "Prototype magic link login");
    routeTo(defaultRouteFor(user.role));
    return;
  }

  if (state.authMode === "signup") {
    if (state.users.some((item) => item.email === email)) {
      error.textContent = "This account already exists. Sign in instead.";
      return;
    }
    if (password.length < 6) {
      error.textContent = "Password must be at least 6 characters in this prototype.";
      return;
    }
    const user = createPatientFromForm({
      email,
      firstName: String(data.get("firstName") || "Patient"),
      lastName: String(data.get("lastName") || "Member"),
      authProvider: "email_password",
      password,
      province: String(data.get("province") || "Ontario"),
      phone: String(data.get("phone") || ""),
    });
    state.users.push(user);
    state.activeUserId = user.id;
    addAudit("patient_registered", user.id, "Self registration; default role patient");
    routeTo("quiz");
    return;
  }

  const user = state.users.find((item) => item.email === email);
  if (!user || user.password_hash !== demoHash(password)) {
    error.textContent = "No matching demo account found.";
    return;
  }
  state.activeUserId = user.id;
  addAudit("user_login", user.id, "Email/password login");
  routeTo(defaultRouteFor(user.role));
}

function createPatientFromForm({ email, firstName, lastName, authProvider, password = DEMO_PASSWORD, province = "Ontario", phone = "" }) {
  const userId = id("patient");
  const created = nowIso();
  state.patient_profiles.push({ id: id("pp"), user_id: userId, first_name: firstName, last_name: lastName, date_of_birth: "", phone, province, created_at: created });
  state.consents.push({ id: id("consent"), patient_id: userId, consent_type: "telehealth_consent", version: "2026.05", accepted_at: created, ip_address: "127.0.0.1" });
  return makeUser(userId, email, "patient", firstName, lastName, authProvider, created, password);
}

function submitQuiz(event) {
  event.preventDefault();
  const step = quizSteps[state.quizStep];
  if (step.fields) {
    const data = new FormData(event.currentTarget);
    step.fields.forEach((field) => {
      state.draftQuiz[field.id] = String(data.get(field.id) || "").trim();
    });
  }
  if (state.quizStep < quizSteps.length - 1) {
    state.quizStep += 1;
    saveState();
    render();
    return;
  }
  const patientId = effectivePatientId() || currentUser().id;
  const created = nowIso();
  const condition = state.draftQuiz.condition || "weight_loss";
  state.quiz_responses = state.quiz_responses.filter((item) => item.patient_id !== patientId);
  state.quiz_responses.push({ id: id("qr"), patient_id: patientId, condition, answers_json: { ...state.draftQuiz }, status: "quiz_submitted", created_at: created });
  if (!state.subscriptions.some((item) => item.patient_id === patientId)) {
    state.subscriptions.push({ id: id("sub"), patient_id: patientId, stripe_customer_id: `cus_mock_${patientId}`, stripe_subscription_id: `sub_mock_${patientId}`, plan_name: "Weight care membership", status: "active_subscription", monthly_price_cents: 59900, created_at: created });
  }
  if (!state.consultations.some((item) => item.patient_id === patientId)) {
    state.consultations.push({ id: id("consult"), patient_id: patientId, clinician_id: "clinician_1", scheduled_at: "2026-05-12T15:30:00.000Z", status: "consult_booked", notes: "New assessment submitted. Clinician review required.", created_at: created });
  }
  if (!state.prescription_statuses.some((item) => item.patient_id === patientId)) {
    state.prescription_statuses.push({ id: id("ps"), patient_id: patientId, status: "clinical_review_pending", note: "No prescription decision has been made.", updated_at: created });
  }
  addAudit("quiz_submitted", patientId, "Patient submitted assessment", { condition });
  state.portalTab = "overview";
  routeTo("patient");
}

function makeUser(userId, email, role, firstName, lastName, authProvider, created, password = DEMO_PASSWORD) {
  return {
    id: userId,
    email,
    role,
    auth_provider: authProvider,
    first_name: firstName,
    last_name: lastName,
    password_hash: demoHash(password),
    mfa_required: ["admin", "super_admin"].includes(role),
    created_at: created,
    updated_at: created,
  };
}

function bindEvents() {
  document.querySelectorAll("[data-route]").forEach((button) => button.addEventListener("click", () => routeTo(button.dataset.route)));
  document.querySelectorAll("[data-auth]").forEach((button) => button.addEventListener("click", () => routeTo("auth", { authMode: button.dataset.auth })));
  document.querySelectorAll("[data-start-flow]").forEach((button) => button.addEventListener("click", () => routeTo(currentUser() ? "quiz" : "auth", { authMode: currentUser() ? state.authMode : "signup" })));
  document.querySelectorAll("[data-scroll-target]").forEach((button) => button.addEventListener("click", () => document.querySelector(`#${button.dataset.scrollTarget}`)?.scrollIntoView({ behavior: "smooth" })));
  document.querySelectorAll("[data-fill-email]").forEach((button) => button.addEventListener("click", () => {
    const email = document.querySelector("#email");
    const password = document.querySelector("#password");
    if (email) email.value = button.dataset.fillEmail;
    if (password) password.value = DEMO_PASSWORD;
  }));
  document.querySelector("#authForm")?.addEventListener("submit", handleAuth);
  document.querySelector("#googleMock")?.addEventListener("click", () => {
    const email = `google.patient.${Date.now()}@ermi.care`;
    const user = createPatientFromForm({ email, firstName: "Google", lastName: "Patient", authProvider: "google_oauth_mock" });
    state.users.push(user);
    state.activeUserId = user.id;
    addAudit("google_oauth_login_mock", user.id, "Prototype Google OAuth login");
    routeTo("quiz");
  });
  document.querySelector("#signOut")?.addEventListener("click", () => {
    if (state.impersonation) stopImpersonation();
    addAudit("user_logout", state.activeUserId, "User signed out");
    state.activeUserId = "";
    saveState();
    routeTo("home");
  });
  document.querySelector("#closeAdminPatientView")?.addEventListener("click", () => {
    addAudit("admin_closed_patient_view", state.adminViewPatientId, "Read-only patient view closed");
    state.adminViewPatientId = "";
    saveState();
    routeTo("admin");
  });
  document.querySelector("#quizForm")?.addEventListener("submit", submitQuiz);
  document.querySelector("#quizBack")?.addEventListener("click", () => {
    state.quizStep = Math.max(0, state.quizStep - 1);
    saveState();
    render();
  });
  document.querySelectorAll("[data-choice]").forEach((button) => button.addEventListener("click", () => {
    const step = quizSteps[state.quizStep];
    const value = button.dataset.choice;
    if (step.multi) {
      const existing = Array.isArray(state.draftQuiz[step.id]) ? state.draftQuiz[step.id] : [];
      state.draftQuiz[step.id] = existing.includes(value) ? existing.filter((item) => item !== value) : [...existing, value];
    } else {
      state.draftQuiz[step.id] = value;
    }
    saveState();
    render();
  }));
  ["heightFt", "heightIn", "weightLb"].forEach((inputId) => document.querySelector(`#${inputId}`)?.addEventListener("input", (event) => {
    state.draftQuiz[inputId] = event.target.value;
    const bmi = document.querySelector("#bmiValue");
    if (bmi) bmi.textContent = calculateBmi();
    saveState();
  }));
  document.querySelectorAll("[data-portal-tab]").forEach((button) => button.addEventListener("click", () => {
    state.portalTab = button.dataset.portalTab;
    saveState();
    render();
  }));
  document.querySelectorAll("[data-admin-tab]").forEach((button) => button.addEventListener("click", () => {
    state.adminTab = button.dataset.adminTab;
    saveState();
    render();
  }));
  document.querySelectorAll("[data-clinician-patient]").forEach((button) => button.addEventListener("click", () => {
    state.selectedClinicianPatientId = button.dataset.clinicianPatient;
    addAudit("clinician_opened_patient_chart", button.dataset.clinicianPatient, "Assigned chart opened");
    saveState();
    render();
  }));
  document.querySelector("#clinicianForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const patientId = event.currentTarget.dataset.patientId;
    const data = new FormData(event.currentTarget);
    state.consultations = state.consultations.map((item) => item.patient_id === patientId ? { ...item, status: data.get("consultStatus"), notes: data.get("clinicalNotes") } : item);
    state.prescription_statuses = state.prescription_statuses.map((item) => item.patient_id === patientId ? { ...item, status: data.get("prescriptionStatus"), updated_at: nowIso() } : item);
    addAudit("clinician_updated_chart_status", patientId, "Clinician saved review placeholders", { consultStatus: data.get("consultStatus"), prescriptionStatus: data.get("prescriptionStatus") });
    render();
  });
  document.querySelector("#profileForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const patientId = event.currentTarget.dataset.patientId;
    const data = new FormData(event.currentTarget);
    state.patient_profiles = state.patient_profiles.map((profile) => profile.user_id === patientId ? { ...profile, first_name: data.get("first_name"), last_name: data.get("last_name"), phone: data.get("phone"), province: data.get("province") } : profile);
    addAudit("patient_profile_updated", patientId, "Basic profile update");
    render();
  });
  document.querySelector("#messageForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.querySelector("#messageBody");
    const body = input.value.trim();
    const patientId = event.currentTarget.dataset.patientId;
    if (!body) return;
    state.messages.push({ id: id("msg"), patient_id: patientId, from_user_id: currentUser().id, body, created_at: nowIso() });
    addAudit("secure_message_sent", patientId, "Message sent in portal");
    render();
  });
  document.querySelectorAll("[data-admin-view-patient]").forEach((button) => button.addEventListener("click", () => {
    state.selectedPatientId = button.dataset.adminViewPatient;
    state.adminViewPatientId = button.dataset.adminViewPatient;
    state.portalTab = "overview";
    addAudit("admin_viewed_patient", state.selectedPatientId, "Admin opened patient overview", { read_only: currentUser().role !== "super_admin" });
    routeTo("patient");
  }));
  document.querySelectorAll("[data-impersonate]").forEach((button) => button.addEventListener("click", () => {
    if (!can(["super_admin"])) return;
    state.impersonationModalTarget = button.dataset.impersonate;
    saveState();
    render();
  }));
  document.querySelector("#cancelImpersonation")?.addEventListener("click", () => {
    state.impersonationModalTarget = "";
    saveState();
    render();
  });
  document.querySelector("#impersonationForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const reason = new FormData(event.currentTarget).get("reason");
    const target = event.currentTarget.dataset.targetUserId;
    state.impersonation = { id: id("imp"), admin_id: currentUser().id, target_user_id: target, reason, started_at: nowIso(), actions_taken: [] };
    state.impersonationModalTarget = "";
    addAudit("impersonation_started", target, reason);
    state.portalTab = "overview";
    routeTo("patient");
  });
  document.querySelector("#stopImpersonation")?.addEventListener("click", stopImpersonation);
  document.querySelectorAll(".role-select").forEach((select) => select.addEventListener("change", (event) => {
    if (!can(["super_admin"])) return;
    const userId = event.target.dataset.userId;
    const oldRole = state.users.find((user) => user.id === userId)?.role;
    state.users = state.users.map((user) => user.id === userId ? { ...user, role: event.target.value, updated_at: nowIso() } : user);
    addAudit("role_changed", userId, "Super admin role management", { oldRole, newRole: event.target.value });
    render();
  }));
  const heroVideo = document.querySelector(".hero-video");
  if (heroVideo && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    heroVideo.removeAttribute("autoplay");
    heroVideo.pause();
  }
}

function stopImpersonation() {
  const imp = state.impersonation;
  if (!imp) return;
  addAudit("impersonation_stopped", imp.target_user_id, imp.reason, { started_at: imp.started_at, ended_at: nowIso() });
  state.impersonation = null;
  saveState();
  render();
}

function startHeroTicker() {
  if (heroTickerInterval) clearInterval(heroTickerInterval);
  const ticker = document.querySelector("#heroTicker");
  if (!ticker) return;
  const lines = ["Assessment saved to patient portal", "Clinician message ready", "Pharmacy choice stays with patient", "Monthly care plan active"];
  let index = 0;
  heroTickerInterval = setInterval(() => {
    if (!document.querySelector("#heroTicker")) return;
    index = (index + 1) % lines.length;
    ticker.textContent = lines[index];
  }, 2200);
}

function render() {
  const app = document.querySelector("#app");
  if (state.route === "auth") app.innerHTML = renderAuth();
  else if (state.route === "quiz") app.innerHTML = renderQuiz();
  else if (state.route === "patient") app.innerHTML = renderPatientDashboard();
  else if (state.route === "clinician") app.innerHTML = renderClinicianDashboard();
  else if (state.route === "admin") app.innerHTML = renderAdminPanel();
  else app.innerHTML = renderHome();
  bindEvents();
  startHeroTicker();
}

render();
