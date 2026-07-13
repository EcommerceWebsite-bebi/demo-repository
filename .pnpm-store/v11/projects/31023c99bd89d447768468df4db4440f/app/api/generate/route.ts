import { NextResponse } from "next/server";

function escapeXml(str: string) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const prompt = url.searchParams.get("prompt") || "";
  const style = url.searchParams.get("style") || "Minimalist";
  const baseColor = url.searchParams.get("baseColor") || "transparent";
  const size = url.searchParams.get("size") || "medium";

  const dim = size === "small" ? 512 : size === "large" ? 1200 : 800;
  const width = dim;
  const height = dim;

  const fontSizeTitle = Math.round(width / 18);
  const fontSizeBody = Math.round(width / 40);

  // Simple wrap by character count approximation
  const maxWidth = width * 0.8;
  const avgCharWidth = fontSizeBody * 0.6;
  const maxChars = Math.max(20, Math.floor(maxWidth / avgCharWidth));

  const words = (prompt || "Your design prompt...").split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).trim().length > maxChars && current) {
      lines.push(current.trim());
      current = w;
    } else {
      current = current ? current + " " + w : w;
    }
  }
  if (current) lines.push(current.trim());
  // limit lines
  const limited = lines.slice(0, 12);

  const startY = Math.round(height * 0.25);
  const lineHeight = Math.round(width / 28);

  const tspanLines = limited
    .map((ln, i) => {
      const y = startY + i * lineHeight;
      return `<tspan x="${width / 2}" y="${y}">${escapeXml(ln)}</tspan>`;
    })
    .join("");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${escapeXml(baseColor)}" />
  <text x="50%" y="${Math.round(height * 0.12)}" text-anchor="middle" font-family="Playfair Display, serif" font-size="${fontSizeTitle}" fill="#000">${escapeXml(style)}</text>
  <text font-family="Hanken Grotesk, sans-serif" font-size="${fontSizeBody}" fill="#111" text-anchor="middle">
    ${tspanLines}
  </text>
  <text x="50%" y="${height - 30}" text-anchor="middle" font-family="Hanken Grotesk, sans-serif" font-size="${Math.round(
    width / 36
  )}" fill="#333">Size: ${escapeXml(size)}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store",
    },
  });
}
