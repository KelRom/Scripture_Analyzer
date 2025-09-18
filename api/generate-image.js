// api/generate-image.js
const OpenAI = require("openai");

module.exports = async (req, res) => {
    // CORS for web; harmless on native
    if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        return res.status(204).end();
    }
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (req.method !== "POST") {
        res.setHeader("Allow", "POST, OPTIONS");
        return res.status(405).json({ error: "Method Not Allowed" });
    }
    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: "OPENAI_API_KEY is missing on the server" });
    }

    try {
        const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
        const { prompt, ref } = body;
        if (!prompt?.trim()) return res.status(400).json({ error: "Missing prompt" });

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const result = await openai.images.generate({
            model: "gpt-image-1",
            prompt,
            size: "1024x1024",
        });

        const b64 = result?.data?.[0]?.b64_json;
        if (!b64) return res.status(502).json({ error: "No image returned" });

        return res.status(200).json({ image_b64: b64, mime: "image/png", prompt, ref: ref || "" });
    } catch (e) {
        const status = e?.status || e?.response?.status || 500;
        const message = e?.response?.data?.error?.message || e?.message || "Image generation failed";
        console.error("OpenAI error:", status, message);
        return res.status(status).json({ error: message });
    }
};
