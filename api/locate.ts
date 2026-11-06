// Vercel equivalent of the Netlify location edge function. The platform adds
// these approximate IP-geolocation headers to function requests.
type HeaderValue = string | string[] | undefined;

interface VercelRequest {
  headers: Record<string, HeaderValue>;
}

interface VercelResponse {
  setHeader(name: string, value: string): void;
  status(code: number): VercelResponse;
  json(body: unknown): void;
}

function decodeHeader(value: HeaderValue): string | null {
  if (Array.isArray(value)) value = value[0];
  if (!value) return null;
  try {
    return decodeURIComponent(value.replace(/\+/g, "%20"));
  } catch {
    return value;
  }
}

function displayRegion(countryCode: string | null, regionCode: HeaderValue): string | null {
  if (Array.isArray(regionCode)) regionCode = regionCode[0];
  if (!regionCode) return null;
  if (!countryCode) return regionCode;

  try {
    const names = new Intl.DisplayNames(["en"], { type: "region" });
    return names.of(`${countryCode}-${regionCode}`) || regionCode;
  } catch {
    return regionCode;
  }
}

export default function handler(request: VercelRequest, response: VercelResponse): void {
  const headers = request.headers;
  const countryCode = headers["x-vercel-ip-country"] as string | null | undefined;
  const regionCode = headers["x-vercel-ip-country-region"];
  const country = countryCode
    ? new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) || countryCode
    : null;
  const latitude = Number(headers["x-vercel-ip-latitude"]);
  const longitude = Number(headers["x-vercel-ip-longitude"]);

  const body = {
    city: decodeHeader(headers["x-vercel-ip-city"]),
    region: displayRegion(countryCode, regionCode),
    country,
    countryCode,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    timezone: headers["x-vercel-ip-timezone"] || null,
  };

  response.setHeader("Cache-Control", "private, no-store");
  response.status(200).json(body);
}
