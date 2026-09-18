import * as React from "react";
import { render } from "@react-email/render";
import { TEMPLATES } from "./registry";

const SITE_NAME = "PaslaugosGrožiui";
const FROM_ADDRESS = process.env["EMAIL_FROM"] || "info@testinispuslapis.online";

export type SendTemplateEmailResult =
  | { sent: true }
  | { sent: false; reason: "recipient_suppressed" };

export interface SendTemplateEmailOptions {
  templateData?: Record<string, any>;
  idempotencyKey?: string;
  replyTo?: string;
}

export async function sendTemplateEmail(
  templateName: string,
  to: string,
  options: SendTemplateEmailOptions = {},
): Promise<SendTemplateEmailResult> {
  const apiKey = process.env["EMAIL_API_KEY"];
  const endpoint = process.env["EMAIL_API_URL"];

  if (!apiKey || !endpoint) {
    throw new Error("Email provider is not configured");
  }

  const template = TEMPLATES[templateName];
  if (!template) {
    throw new Error(
      `Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(", ")}`,
    );
  }

  const recipient = template.to || to;
  if (!recipient) {
    throw new Error("Recipient is required");
  }

  const templateData = options.templateData ?? {};
  const element = React.createElement(template.component, templateData);
  const html = await render(element);
  const text = await render(element, { plainText: true });
  const subject =
    typeof template.subject === "function"
      ? template.subject(templateData)
      : template.subject;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(options.idempotencyKey
        ? { "Idempotency-Key": options.idempotencyKey }
        : {}),
    },
    body: JSON.stringify({
      from: `${SITE_NAME} <${FROM_ADDRESS}>`,
      to: recipient,
      subject,
      html,
      text,
      reply_to: options.replyTo,
      label: templateName,
    }),
  });

  if (response.status === 429) {
    return { sent: false, reason: "recipient_suppressed" };
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Email provider returned ${response.status}${detail ? `: ${detail}` : ""}`);
  }

  return { sent: true };
}
