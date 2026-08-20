import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Account, cart, checkout, and auth pages are user-specific/private —
        // no value being indexed, and checkout in particular shouldn't be
        // crawlable at all.
        disallow: ["/account", "/account/", "/cart", "/checkout", "/auth/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
