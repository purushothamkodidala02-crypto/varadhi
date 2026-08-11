import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Varadhi Prep",
    short_name: "Varadhi",
    description: "Smart mock tests for career growth.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#020617",
    icons: [{ src: "/varadhi-mark.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
