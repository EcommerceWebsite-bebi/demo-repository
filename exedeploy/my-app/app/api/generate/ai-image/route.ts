import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { Jimp, intToRGBA, rgbaToInt, JimpMime } from "jimp";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Suffix appended to every user prompt for best sticker results
const STICKER_SUFFIX =
  "transparent background, isolated PNG, vector illustration, sticker design, die-cut sticker, centered composition, no background, high resolution";

/**
 * Remove background using flood-fill from all 4 corners.
 * Works best for cartoon stickers with uniform white/solid backgrounds.
 * Preserves inner content (white fur, sticker borders, etc.)
 */
async function removeBackgroundFloodFill(buffer: Buffer): Promise<Buffer> {
  const img = await Jimp.read(buffer);
  const width = img.width;
  const height = img.height;

  // Color similarity threshold per total RGB diff
  const TOLERANCE = 35;

  // Sample background color from all 4 corners (average)
  const corners = [
    intToRGBA(img.getPixelColor(0, 0)),
    intToRGBA(img.getPixelColor(width - 1, 0)),
    intToRGBA(img.getPixelColor(0, height - 1)),
    intToRGBA(img.getPixelColor(width - 1, height - 1)),
  ];
  const bgR = Math.round(corners.reduce((s, c) => s + c.r, 0) / 4);
  const bgG = Math.round(corners.reduce((s, c) => s + c.g, 0) / 4);
  const bgB = Math.round(corners.reduce((s, c) => s + c.b, 0) / 4);

  // BFS flood fill starting from all 4 corners
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

  const seed = (x: number, y: number) => {
    const idx = y * width + x;
    if (!visited[idx]) {
      visited[idx] = 1;
      queue.push(x, y);
    }
  };
  seed(0, 0);
  seed(width - 1, 0);
  seed(0, height - 1);
  seed(width - 1, height - 1);

  let qi = 0;
  while (qi < queue.length) {
    const x = queue[qi++];
    const y = queue[qi++];

    const { r, g, b, a } = intToRGBA(img.getPixelColor(x, y));

    // Skip already-transparent pixels
    if (a === 0) continue;

    // Stop if pixel is too different from background color
    const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
    if (diff > TOLERANCE * 3) continue;

    // Make pixel fully transparent
    img.setPixelColor(rgbaToInt(r, g, b, 0), x, y);

    // Queue 4 neighbors
    if (x + 1 < width) { const ni = y * width + (x + 1); if (!visited[ni]) { visited[ni] = 1; queue.push(x + 1, y); } }
    if (x - 1 >= 0) { const ni = y * width + (x - 1); if (!visited[ni]) { visited[ni] = 1; queue.push(x - 1, y); } }
    if (y + 1 < height) { const ni = (y + 1) * width + x; if (!visited[ni]) { visited[ni] = 1; queue.push(x, y + 1); } }
    if (y - 1 >= 0) { const ni = (y - 1) * width + x; if (!visited[ni]) { visited[ni] = 1; queue.push(x, y - 1); } }
  }

  // Soften edges: fade near-bg pixels close to transparent areas
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const { r, g, b, a } = intToRGBA(img.getPixelColor(x, y));
      if (a === 0) continue;
      const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
      if (diff < TOLERANCE * 4) {
        const fadeAlpha = Math.round((diff / (TOLERANCE * 4)) * 255);
        img.setPixelColor(rgbaToInt(r, g, b, fadeAlpha), x, y);
      }
    }
  }

  return Buffer.from(await img.getBuffer(JimpMime.png));
}


// Upload a PNG Buffer to Cloudinary and return a secure URL
async function uploadBufferToCloudinary(
  buffer: Buffer,
  index: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "ai-designs",
        public_id: `ai-design-${Date.now()}-${index}`,
        resource_type: "image",
        format: "png",
      },
      (error, result) => {
        if (error || !result)
          return reject(error || new Error("Cloudinary upload failed"));
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
}

// Upload an image from URL to Cloudinary and return a secure URL
async function uploadUrlToCloudinary(
  imageUrl: string,
  index: number
): Promise<string> {
  const result = await cloudinary.uploader.upload(imageUrl, {
    folder: "ai-designs",
    public_id: `ai-design-${Date.now()}-${index}`,
    resource_type: "image",
    format: "png",
  });
  return result.secure_url;
}

// Generate a single image via Pollinations.ai (FREE — no API key needed)
// Removes background automatically before uploading to Cloudinary
async function generateViaPollinations(
  fullPrompt: string,
  index: number
): Promise<string> {
  const seed = Math.floor(Math.random() * 999999) + index * 100000;
  const encodedPrompt = encodeURIComponent(fullPrompt);

  const pollinationsUrl =
    `https://image.pollinations.ai/prompt/${encodedPrompt}` +
    `?width=1024&height=1024&seed=${seed}&nologo=true&model=flux`;

  const imgRes = await fetch(pollinationsUrl, {
    signal: AbortSignal.timeout(90_000),
  });

  if (!imgRes.ok) {
    throw new Error(`Pollinations.ai failed with status ${imgRes.status}`);
  }

  const arrayBuffer = await imgRes.arrayBuffer();
  const rawBuffer = Buffer.from(arrayBuffer);

  // Remove white/solid background using flood-fill
  let processedBuffer: Buffer;
  try {
    processedBuffer = await removeBackgroundFloodFill(rawBuffer);
    console.log(`Background removed for image ${index}`);
  } catch (e) {
    console.warn(`Background removal failed for image ${index}, using original:`, e);
    processedBuffer = rawBuffer;
  }

  // Upload transparent PNG to Cloudinary
  return await uploadBufferToCloudinary(processedBuffer, index);
}

// Generate via OpenAI (optional — requires funded account)
async function generateViaOpenAI(
  fullPrompt: string,
  index: number,
  apiKey: string
): Promise<string> {
  try {
    const body = JSON.stringify({
      model: "gpt-image-1",
      prompt: fullPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      background: "transparent",
      output_format: "png",
    });

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body,
      signal: AbortSignal.timeout(60_000),
    });

    if (response.ok) {
      const data = await response.json();
      const imageData = data.data?.[0];
      if (imageData?.b64_json) {
        const buffer = Buffer.from(imageData.b64_json, "base64");
        return await uploadBufferToCloudinary(buffer, index);
      } else if (imageData?.url) {
        return await uploadUrlToCloudinary(imageData.url, index);
      }
    }
  } catch {
    // fall through to dall-e-3
  }

  const fallbackBody = JSON.stringify({
    model: "dall-e-3",
    prompt: fullPrompt,
    n: 1,
    size: "1024x1024",
    quality: "standard",
  });

  const fallbackRes = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: fallbackBody,
    signal: AbortSignal.timeout(60_000),
  });

  if (!fallbackRes.ok) {
    const err = await fallbackRes.json();
    throw new Error(err.error?.message || "OpenAI image generation failed");
  }

  const fallbackData = await fallbackRes.json();
  const fallbackImageData = fallbackData.data?.[0];

  if (fallbackImageData?.b64_json) {
    const buffer = Buffer.from(fallbackImageData.b64_json, "base64");
    return await uploadBufferToCloudinary(buffer, index);
  } else if (fallbackImageData?.url) {
    return await uploadUrlToCloudinary(fallbackImageData.url, index);
  }

  throw new Error("No image data returned from OpenAI");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "A prompt is required." }, { status: 400 });
    }

    const fullPrompt = `${prompt.trim()}, ${STICKER_SUFFIX}`;
    const openaiKey = process.env.OPENAI_API_KEY;
    const hasOpenAI =
      openaiKey &&
      openaiKey !== "your_openai_api_key_here" &&
      openaiKey.startsWith("sk-");

    const generateImage = async (index: number): Promise<string> => {
      if (hasOpenAI) {
        try {
          return await generateViaOpenAI(fullPrompt, index, openaiKey!);
        } catch (e) {
          console.warn(`OpenAI failed, falling back to Pollinations:`, e);
        }
      }
      return await generateViaPollinations(fullPrompt, index);
    };

    // Generate 1 image
    const results = await Promise.allSettled([generateImage(0)]);

    const imageUrls: string[] = [];
    const errors: string[] = [];

    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        imageUrls.push(result.value);
      } else {
        console.error(`Image ${i} failed:`, result.reason);
        errors.push(`Image ${i + 1}: ${result.reason?.message || "unknown error"}`);
      }
    });

    if (imageUrls.length === 0) {
      return NextResponse.json(
        { error: "Image generation failed.", details: errors },
        { status: 500 }
      );
    }

    return NextResponse.json({
      images: imageUrls,
      errors,
      provider: hasOpenAI ? "openai" : "pollinations",
    });
  } catch (error: any) {
    console.error("AI Image generation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
