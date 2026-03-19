const Hapi = require("@hapi/hapi");
const Inert = require("@hapi/inert");
const nodemailer = require("nodemailer");
const path = require("path");

require("dotenv").config();

const PUBLIC_DIR = path.join(__dirname, "public");

function normalizeText(value) {
    return typeof value === "string" ? value.trim() : "";
}

function validateContactPayload(payload) {
    const name = normalizeText(payload.name);
    const email = normalizeText(payload.email).toLowerCase();
    const subject = normalizeText(payload.subject);
    const message = normalizeText(payload.message);

    const errors = [];

    if (!name || name.length < 2 || name.length > 80) {
        errors.push("Name must be between 2 and 80 characters.");
    }

    if (!email || email.length > 120) {
        errors.push("Email is required and must be at most 120 characters.");
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errors.push("Email format is invalid.");
        }
    }

    if (!subject || subject.length < 3 || subject.length > 120) {
        errors.push("Subject must be between 3 and 120 characters.");
    }

    if (!message || message.length < 10 || message.length > 2000) {
        errors.push("Message must be between 10 and 2000 characters.");
    }

    return {
        isValid: errors.length === 0,
        errors,
        normalized: { name, email, subject, message },
    };
}

function buildTransporter() {
    const host = process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com";
    const port = Number(process.env.BREVO_SMTP_PORT || 587);
    const user = process.env.BREVO_SMTP_USER || "";
    const pass = process.env.BREVO_SMTP_PASS || "";

    if (!user || !pass) {
        return null;
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
    });
}

async function createServer() {
    const server = Hapi.server({
        port: Number(process.env.PORT || 3000),
        host: process.env.HOST || "0.0.0.0",
        routes: {
            cors: {
                origin: ["*"],
            },
        },
    });

    await server.register(Inert);

    server.route({
        method: "POST",
        path: "/api/contact",
        handler: async (request, h) => {
            const validation = validateContactPayload(request.payload || {});

            if (!validation.isValid) {
                return h
                    .response({
                        ok: false,
                        message: "Validation failed.",
                        errors: validation.errors,
                    })
                    .code(400);
            }

            const transporter = buildTransporter();
            const mailTo = process.env.MAIL_TO || "";
            const mailFrom =
                process.env.MAIL_FROM || process.env.BREVO_SMTP_USER || "";

            if (!transporter || !mailTo || !mailFrom) {
                return h
                    .response({
                        ok: false,
                        message:
                            "Email service is not configured. Set BREVO_SMTP_USER, BREVO_SMTP_PASS, MAIL_TO, MAIL_FROM.",
                    })
                    .code(500);
            }

            const { name, email, subject, message } = validation.normalized;

            try {
                await transporter.sendMail({
                    from: mailFrom,
                    to: mailTo,
                    replyTo: email,
                    subject: `[CV Contact] ${subject}`,
                    text: [
                        `Name: ${name}`,
                        `Email: ${email}`,
                        "",
                        "Message:",
                        message,
                    ].join("\n"),
                    html: `
                        <h2>New message from CV site</h2>
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Subject:</strong> ${subject}</p>
                        <p><strong>Message:</strong></p>
                        <p>${message.replace(/\n/g, "<br>")}</p>
                    `,
                });

                return h
                    .response({
                        ok: true,
                        message: "Message sent successfully.",
                    })
                    .code(200);
            } catch (error) {
                console.error("Email send error:", error);
                return h
                    .response({
                        ok: false,
                        message: "Failed to send email. Try again later.",
                    })
                    .code(502);
            }
        },
    });

    server.route({
        method: "GET",
        path: "/",
        handler: {
            file: path.join(PUBLIC_DIR, "index.html"),
        },
    });

    server.route({
        method: "GET",
        path: "/{param*}",
        handler: {
            directory: {
                path: PUBLIC_DIR,
                listing: false,
                index: false,
            },
        },
    });

    return server;
}

async function start() {
    const server = await createServer();
    await server.start();
    console.log(`Server started at ${server.info.uri}`);
}

process.on("unhandledRejection", (error) => {
    console.error(error);
    process.exit(1);
});

start();
