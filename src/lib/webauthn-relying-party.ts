export function resolveWebauthnRelyingParty(request: Request) {
  const configuredUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL;

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const normalizedForwardedHost = forwardedHost ? forwardedHost.split(",")[0].trim() : null;
  const rawHost = normalizedForwardedHost || request.headers.get("host");
  const host = rawHost ? rawHost.split(",")[0].trim() : null;
  const requestProto = forwardedProto || (new URL(request.url)).protocol.replace(":", "") || "https";
  const requestRpID = host ? host.split(":")[0] : new URL(request.url).hostname;
  const requestOrigin = host ? `${requestProto}://${host}` : new URL(request.url).origin;

  if (configuredUrl) {
    try {
      const parsed = new URL(configuredUrl);

      // If request host and configured host differ (e.g., ngrok dev), prefer request host.
      if (requestRpID && parsed.hostname !== requestRpID) {
        return {
          origin: requestOrigin,
          rpID: requestRpID,
        };
      }

      return {
        origin: parsed.origin,
        rpID: parsed.hostname,
      };
    } catch {
      // Fall through to request-derived host when configured URL is malformed.
    }
  }

  if (host) {
    const origin = `${requestProto}://${host}`;
    return {
      origin,
      rpID: requestRpID,
    };
  }

  const fallback = new URL(request.url);
  return {
    origin: fallback.origin,
    rpID: fallback.hostname,
  };
}
