# Lab 6 (Variant 10)

Node.js backend service for a static CV website:

- Framework: hapi
- Email sending: Nodemailer + Brevo SMTP
- Tunneling: localtunnel

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment variables

Create a `.env` file based on `.env.example` and fill in your credentials.

Required variables:

- `BREVO_SMTP_USER`
- `BREVO_SMTP_PASS`
- `MAIL_FROM`
- `MAIL_TO`

Optional variables:

- `PORT` (default: `3000`)
- `HOST` (default: `0.0.0.0`)
- `BREVO_SMTP_HOST` (default: `smtp-relay.brevo.com`)
- `BREVO_SMTP_PORT` (default: `587`)

## 3. Run server

```bash
npm start
```

The static site is served from `public/`.
Main page is available at `GET /`.

## 4. Contact API

Endpoint: `POST /api/contact`

JSON body:

```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "Question about your CV",
    "message": "Hello! I want to discuss collaboration."
}
```

Validation is included for required fields, string lengths, and email format.

## 5. Start public tunnel (localtunnel)

In a second terminal run:

```bash
npm run tunnel
```

You will get a public URL like `https://<random-name>.loca.lt` that points to your local server.
