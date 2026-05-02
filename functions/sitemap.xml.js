export async function onRequest({ next, env }) {
  const url = new URL(env.CF_PAGES_URL || "https://inlogistic.puertocarreno.gov.co");
  const origin = `${url.protocol}//${url.host}`;

  const staticRoutes = [
    { loc: origin + "/", priority: "1.0", changefreq: "weekly" },
  ];

  const res = await next();
  const html = await res.text();

  const slugRegex = /<a[^>]+href="([^"]+)"[^>]*>/g;
  const seen = new Set([origin + "/"]);
  let match;
  while ((match = slugRegex.exec(html)) !== null) {
    const href = match[1];
    if (href.startsWith("/") && !href.startsWith("//") && !seen.has(origin + href)) {
      seen.add(origin + href);
      staticRoutes.push({ loc: origin + href, priority: "0.8", changefreq: "monthly" });
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticRoutes.map(r => `  <url>
    <loc>${r.loc}</loc>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}