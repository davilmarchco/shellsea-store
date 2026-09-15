import { MercadoPagoConfig } from "mercadopago";

const accessToken = process.env["MERCADO_PAGO_ACCESS_TOKEN"];

/** Null when the Mercado Pago access token isn't configured yet. */
export const mercadoPagoConfig = accessToken ? new MercadoPagoConfig({ accessToken }) : null;

/** Test (`TEST-...`) tokens must redirect buyers to the sandbox checkout URL. */
export const isMercadoPagoTestToken = accessToken?.startsWith("TEST-") ?? false;

export const mercadoPagoWebhookSecret = process.env["MERCADO_PAGO_WEBHOOK_SECRET"];
