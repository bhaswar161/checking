# Studyhub Authentication UI

A polished login/create-account page with:
- Email + phone input
- OTP verification
- Social sign-in options (Google/Facebook) with access consent

## OTP to Gmail (real delivery)
This project now sends OTP codes to the provided Gmail address via SMTP.

### 1) Configure Gmail App Password
1. Enable 2-Step Verification on your Gmail account.
2. Generate an **App Password** for Mail.
3. Copy `.env.example` to `.env` and fill values:

```bash
cp .env.example .env
```

### 2) Install and run
```bash
npm install
npm start
```

Then open `http://localhost:4173`.

## Notes
- OTP is valid for 5 minutes.
- OTP is stored in-memory (demo use). For production, use Redis/DB and rate limiting.
