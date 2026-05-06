# ERMI Security And Compliance Skeleton

This static prototype demonstrates UX and product architecture only. It is not a secure medical system.

## Production Auth

- Use Clerk, Supabase Auth, Auth0, or another audited auth provider.
- Enable Google OAuth through the provider.
- Use email/password or magic links through the provider.
- Do not store raw passwords in application tables.
- Require MFA for `admin` and `super_admin`.
- New self-service users must always start as `patient`.
- Clinician/support/admin/super_admin roles must be granted by seed, invite, or super_admin action.

## Server-Side RBAC

All protected routes and API handlers must verify role server-side.

- `patient`: own profile, own assessments, own consultations, own messages, own subscriptions.
- `clinician`: assigned patients only.
- `support`: operational/support view; avoid sensitive medical notes where possible.
- `admin`: operations, billing, support, assignments, status changes.
- `super_admin`: full access, role management, impersonation.

Frontend hiding is not security.

## Audit Logs

Write audit events for:

- admin views patient;
- clinician opens patient chart;
- admin changes status;
- role changes;
- impersonation start and stop;
- secure message access or send;
- subscription/payment operational changes;
- pharmacy status changes.

## Impersonation

- Only `super_admin` can impersonate.
- Require a reason before starting.
- Show a visible banner during the session.
- Record start and stop timestamps.
- Record actions taken during the session.
- Never reveal or reset patient passwords during impersonation.

## Health Data Storage

- Store PHI/PII in encrypted database storage where possible.
- Use row-level security or equivalent policy checks.
- Keep audit logs append-only.
- Separate clinical notes from support/admin operational notes.
- Use HTTPS, secure cookies, CSRF protection, and strict session handling.
- Complete PHIPA/PIPEDA legal and privacy review before handling real Canadian patient data.

## Product Language

Use:

- clinician-guided care;
- treatment options if clinically appropriate;
- prescription treatment is not guaranteed;
- patients may choose any licensed pharmacy;
- medication dispensed by licensed pharmacy.

Avoid:

- drug-name hero claims;
- promised clinical outcomes;
- direct prescription sales language;
- pharmacy steering without choice.
