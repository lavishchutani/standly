// Returns the visitor's approximate location from Netlify's edge geolocation.
// No third-party service or API key is involved; nothing is stored server-side.
export default async (_req: Request, context: { geo?: Record<string, any> }) => {
  const geo = context.geo || {};
  const body = {
    city: geo.city || null,
    region: geo.subdivision?.name || null,
    country: geo.country?.name || null,
    countryCode: geo.country?.code || null,
    latitude: typeof geo.latitude === "number" ? geo.latitude : null,
    longitude: typeof geo.longitude === "number" ? geo.longitude : null,
    timezone: geo.timezone || null,
  };
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json", "cache-control": "private, no-store" },
  });
};

export const config = { path: "/api/locate" };
