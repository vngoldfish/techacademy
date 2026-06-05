import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bawuiacademy.vn";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/courses", "/blog", "/roadmap"],
      disallow: ["/admin/", "/api/", "/dashboard/", "/learn/", "/quiz/", "/profile/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
