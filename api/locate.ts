// Vercel equivalent of the Netlify location edge function. The platform adds
// these approximate IP-geolocation headers to function requests.
function decodeHeader(value: string | null): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value.replace(/\+/g, "%20"));
  } catch {
    return value;
  }
}

function displayRegion(countryCode: string | null, regionCode: string | null): string | null {
  if (!regionCode) return null;
  if (!countryCode) return regionCode;

  try {
    const names = new Intl.DisplayNames(["en"], { type: "region" });
    return names.of(`${countryCode}-${regionCode}`) || regionCode;
  } catch {
    return regionCode;
  }
}

export default function handler(request: Request): Response {
  const headers = request.headers;
  const countryCode = headers.get("x-vercel-ip-country");
  const regionCode = headers.get("x-vercel-ip-country-region");
  const country = countryCode
    ? new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) || countryCode
    : null;
  const latitude = Number(headers.get("x-vercel-ip-latitude"));
  const longitude = Number(headers.get("x-vercel-ip-longitude"));

  return Response.json({
    city: decodeHeader(headers.get("x-vercel-ip-city")),
    region: displayRegion(countryCode, regionCode),
    country,
    countryCode,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    timezone: headers.get("x-vercel-ip-timezone"),
  }, {
    headers: { "cache-control": "private, no-store" },
  });
}
