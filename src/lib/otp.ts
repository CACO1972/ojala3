import { ApiError } from "./errors";

export type OtpChannel = "sms";

export interface OtpProvider {
  requestOtp(params: { to: string; channel?: OtpChannel }): Promise<void>;
  verifyOtp(params: { to: string; code: string }): Promise<boolean>;
}

function hasTwilio() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_VERIFY_SERVICE_SID
  );
}

async function twilioRequest(path: string, body: URLSearchParams): Promise<any> {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const url = `https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID!}/${path}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!res.ok) {
    throw new ApiError("No fue posible enviar/verificar OTP", 500, "OTP_PROVIDER_ERROR");
  }

  return res.json().catch(() => ({}));
}

class TwilioVerifyProvider implements OtpProvider {
  async requestOtp({ to, channel = "sms" }: { to: string; channel?: OtpChannel }) {
    await twilioRequest("Verifications", new URLSearchParams({ To: to, Channel: channel }));
  }

  async verifyOtp({ to, code }: { to: string; code: string }) {
    const data = await twilioRequest(
      "VerificationCheck",
      new URLSearchParams({ To: to, Code: code })
    );
    return data?.status === "approved";
  }
}

// Mock simple para desarrollo / sin credenciales
const mockCodes = new Map<string, string>();

class MockOtpProvider implements OtpProvider {
  async requestOtp({ to }: { to: string }) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    mockCodes.set(to, code);
    // Sólo log server-side
    console.log(`[OTP MOCK] to=${to} code=${code}`);
  }

  async verifyOtp({ to, code }: { to: string; code: string }) {
    const expected = mockCodes.get(to);
    return Boolean(expected && expected === code);
  }
}

export function getOtpProvider(): OtpProvider {
  return hasTwilio() ? new TwilioVerifyProvider() : new MockOtpProvider();
}
