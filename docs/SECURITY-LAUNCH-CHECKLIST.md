# Varadhi Prep security launch checklist

Complete these dashboard settings before pointing `varadhiprep.in` to production.

## Supabase Authentication

- Keep **Confirm email** enabled after Brevo SMTP is working.
- Set minimum password length to **10** and enable leaked-password protection.
- Create a free Cloudflare Turnstile Managed widget for `varadhiprep.in` and `www.varadhiprep.in`.
- Add its public site key to Vercel as `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
- In Supabase **Authentication → Attack Protection**, enable CAPTCHA, choose Cloudflare Turnstile, and paste the private Turnstile secret. Never add that secret to source code or a `NEXT_PUBLIC_` variable.
- Review Auth rate limits for sign-in, sign-up, resend and password recovery. Begin conservatively and monitor legitimate failures.
- Restrict redirect URLs to `https://varadhiprep.in/**`, `https://www.varadhiprep.in/**`, the active Vercel production URL, and localhost development URLs only.
- Require MFA for every administrator account. Student MFA can remain optional.

## Database

- Apply every migration through `20260811170000_launch_security_hardening.sql`.
- Verify `profiles` has no INSERT, UPDATE or DELETE grant for `anon` or `authenticated`.
- Verify students cannot select `questions`, `mock_test_questions`, session snapshots, or another student's attempts directly.
- Enable Supabase backups and record a restore test before launch.

## Vercel and domain

- Store secrets only in Vercel environment variables; never use `NEXT_PUBLIC_` for private keys.
- Keep Preview and Production environment variables separate.
- Confirm HTTPS before enabling the domain for students. The application sends HSTS in production.
- Redirect `www.varadhiprep.in` to the chosen canonical host.

## Operations

- Review Supabase Auth and Database logs weekly and after every suspicious report.
- Remove unused admin accounts immediately.
- Rotate Brevo and Supabase credentials if they are ever pasted into chat, source code, or screenshots.
- Run `npm audit`, lint and the production build before every deployment.
