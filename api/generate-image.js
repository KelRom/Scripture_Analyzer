// Place this at /api/generate-image.js
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function hashToInt(str) {
    let h = 2166136261
    const s = String(str || '')
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i)
        h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)
    }
    return Math.abs(h >>> 0)
}

export default async function handler(req, res) {
    try {
        const isJSON = (req.headers['content-type'] || '').includes('application/json')
        const body = isJSON ? req.body : {}
        const { prompt = '', ref = '', size = '1024', quality = 'standard', diversity = '' } = body || {}

        const VARIATIONS = [
            'low-angle perspective',
            'bird’s-eye view',
            'eye-level composition',
            'golden hour lighting',
            'soft overcast lighting',
            'dramatic rim light',
            'wide-angle depth',
            'telephoto compression',
            '35mm lens feel',
            'isometric framing',
            'subtle film grain',
            'soft vignette'
        ]
        const idx = hashToInt(diversity) % VARIATIONS.length
        const spice = VARIATIONS[idx]

        const finalPrompt =
            `${prompt}\n\n` +
            `Visual variation: ${spice}. ` +
            `Use a noticeably different composition from any prior attempts. ` +
            `Do not repeat the exact subject pose or camera placement. ` +
            `(variation-id: ${diversity || Date.now()})`

        const response = await openai.responses.create({
            model: 'gpt-5',
            input: finalPrompt,
            tools: [{ type: 'image_generation' }],
            metadata: { ref: String(ref || ''), size: String(size || '1024'), quality: String(quality || 'standard') }
        })

        const imageB64 = response.output
            ?.filter(o => o.type === 'image_generation_call')
            ?.map(o => o.result)[0]

        if (!imageB64) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            return res.status(502).json({ error: 'No image returned from model' })
        }

        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        return res.status(200).json({
            mime: 'image/png',
            image_b64: imageB64,
            ref,
            prompt: finalPrompt
        })
    } catch (err) {
        console.error(err)
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        return res.status(500).json({ error: String(err?.message || err) })
    }
}

export const config = { api: { bodyParser: true } }
