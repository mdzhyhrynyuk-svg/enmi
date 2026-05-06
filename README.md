# ERMI Prototype

ERMI is a clickable static MVP prototype for a Canadian virtual care and medical concierge platform.

## Current Scope

- English-only customer experience.
- Email/password demo account creation using browser localStorage.
- Weight-management funnel first.
- Expandable condition model for ED and hair loss.
- Detailed eligibility intake inspired by Canadian DTC telehealth flows.
- Patient dashboard with purchases, subscriptions, consultations, chat, profile, and documents.
- Clinician/admin/pharmacy coordination mock views.
- Role-based account skeleton for patient, clinician, support, admin, and super_admin.
- Super admin impersonation flow with reason capture and audit logs.
- Admin/support read-only patient view.
- Production-oriented PostgreSQL schema in `schema.sql`.
- Security/compliance implementation notes in `SECURITY.md`.
- Reusable photography placeholders on the landing page.
- Full-bleed hero background video with poster fallback and reduced-motion handling.
- Compliance-aware wording:
  - prescription not guaranteed;
  - patient may choose any licensed pharmacy;
  - medication dispensed by licensed pharmacy;
  - clinician makes independent clinical decisions.

## Open Locally

Open `index.html` in a browser.

For Netlify Drop, upload a folder where `index.html`, `styles.css`, and `app.js` are directly in the root.
Keep the `assets/` folder beside those files so the hero video and poster load after deploy.

Demo seeded accounts all use password `demo1234`:

- `patient@ermi.care`
- `clinician@ermi.care`
- `support@ermi.care`
- `admin@ermi.care`
- `super@ermi.care`

## Recommended Next Build Step

Move this prototype into a production app stack:

- Next.js or React Router for real routes.
- Supabase or Postgres for data.
- Stripe for care-plan billing.
- Calendly/Cal.com or a custom booking layer for consultations.
- Twilio/SendGrid for reminders.
- A Canadian privacy/compliance review before handling real health data.
