import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

// ====================== CONFIG ======================
const OPENAI_API_KEY = 'INPUT KEY'; // demo only (use a proxy in real apps)

// Optional small verse text map for demo preview (use full text if you have it)
const DEMO_VERSES = {
    'John 3:16': 'For God so loved the world, that he gave his only begotten Son...',
    'Psalms 23:1': 'The Lord is my shepherd; I shall not want.',
    'Genesis 1:1': 'In the beginning God created the heaven and the earth.'
};

// ====================== UTIL: Verse Reference ======================
const BOOK_MAP = {
    'jn': 'John', 'jhn': 'John', 'john': 'John',
    'ps': 'Psalms', 'psa': 'Psalms', 'psalm': 'Psalms', 'psalms': 'Psalms',
    'gen': 'Genesis', 'gn': 'Genesis', 'genesis': 'Genesis',
    // add more as needed
};

function normalizeReference(input) {
    if (!input) return '';
    const trimmed = input.tarim().replace(/\s+/g, ' ');
    const trimmed = input.tarim().replace(/\s+/g, ' ');
    const m = trimmed.match(/^([1-3]?\s?[A-Za-z]+)\s+(\d+):(\d+)$/);
    if (!m) return trimmed; // fallback: pass through
    let bookKey = m[1].toLowerCase().replace(/\s+/g, '');
    const chap = m[2], verse = m[3];
    const niceBook = BOOK_MAP[bookKey] || (m[1].charAt(0).toUpperCase() + m[1].slice(1));
    return `${niceBook} ${chap}:${verse}`;
}

// ====================== UTIL: Simple NLP ======================
// Minimal keyword extractor (client-side only; no extra libs)
// 1) split words
// 2) remove punctuation/short tokens/stopwords
// 3) count frequency & return top N
const STOPWORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'to', 'for', 'is', 'are', 'that', 'this', 'with', 'by', 'from', 'as',
    'be', 'was', 'were', 'it', 'he', 'she', 'they', 'them', 'his', 'her', 'their', 'we', 'you', 'your', 'our', 'at', 'not',
    'but', 'so', 'if', 'then', 'there', 'here', 'which', 'who', 'whom', 'what', 'why', 'how', 'will', 'shall'
]);

function extractKeywordsSimple(text, limit = 6) {
    const freq = {};
    const words = (text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter(w => w && w.length >= 3 && !STOPWORDS.has(w));

    for (const w of words) {
        freq[w] = (freq[w] || 0) + 1;
    }
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([w]) => w);
    const uniq = [];
    const seen = new Set();
    for (const w of sorted) {
        if (!seen.has(w)) { seen.add(w); uniq.push(w); }
        if (uniq.length >= limit) break;
    }
    return uniq.length ? uniq : ['symbolism', 'faith', 'light']; // fallback
}

// ====================== PROMPT BUILDER ======================
function buildPrompt(verseText, keywords, useSmart = true) {
    const base = `Create an evocative illustration inspired by this Bible verse: "${verseText}".`;
    if (!useSmart || !keywords?.length) {
        return `${base} Emphasize composition and respectful symbolism.`;
    }
    const focus = `Focus on: ${keywords.slice(0, 5).join(', ')}.`;
    return `${base} ${focus} Use tasteful, respectful imagery; prioritize symbolism over photorealism.`;
}

// ====================== OPENAI IMAGE GEN ======================
async function generateImageWithOpenAI(prompt) {
    if (!OPENAI_API_KEY) throw new Error('Missing OpenAI API key.');
    const resp = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-image-1',
            prompt,
            size: '1024x1024'
        })
    });
    if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`OpenAI error: ${err}`);
    }
    const json = await resp.json();
    const b64 = json?.data?.[0]?.b64_json;
    if (!b64) throw new Error('No image returned.');
    // Return a local file URI RN can use (convert data URL -> file)
    const filePath = FileSystem.cacheDirectory + `gen_${Date.now()}.png`;
    await FileSystem.writeAsStringAsync(filePath, b64, { encoding: FileSystem.EncodingType.Base64 });
    return filePath;
}

// ====================== MAIN APP (single-file "screens") ======================
export default function App() {
    const [screen, setScreen] = useState('verse'); // 'verse' | 'preview' | 'loading' | 'results'
    const [refInput, setRefInput] = useState('');
    const [normalizedRef, setNormalizedRef] = useState('');
    const [useSmart, setUseSmart] = useState(true);

    const [verseText, setVerseText] = useState('');
    const keywords = useMemo(() => extractKeywordsSimple(verseText), [verseText]);
    const prompt = useMemo(() => buildPrompt(verseText || normalizedRef, keywords, useSmart), [verseText, normalizedRef, keywords, useSmart]);

    const [loadingStage, setLoadingStage] = useState(0); // 0,1,2
    const [imageUri, setImageUri] = useState(null);
    const [overlay, setOverlay] = useState(false);
    const [busy, setBusy] = useState(false);

    // ------- "Navigation" helpers -------
    function goToPreview() {
        const norm = normalizeReference(refInput);
        if (!/\d+:\d+$/.test(norm)) {
            Alert.alert('Format needed', 'Enter like "John 3:16" (Book Chapter:Verse).');
            return;
        }
        setNormalizedRef(norm);
        // Use a simple text if we have it, else fallback to reference as text
        setVerseText(DEMO_VERSES[norm] || norm);
        setScreen('preview');
    }

    function goGenerate() {
        setScreen('loading');
        setLoadingStage(0);
        setImageUri(null);
        setBusy(true);
        // staged loading (bible page-turn "feel")
        setTimeout(() => setLoadingStage(1), 900);    // Opening Bible…
        setTimeout(() => setLoadingStage(2), 1800);   // Turning pages…
        setTimeout(async () => {
            try {
                const uri = await generateImageWithOpenAI(prompt);
                setImageUri(uri);
                setScreen('results');
            } catch (e) {
                Alert.alert('Generation error', e.message);
                setScreen('preview');
            } finally {
                setBusy(false);
            }
        }, 3000); // Crafting artwork…
    }

    function regenerate() {
        goGenerate(); // reuse same prompt for demo; you can vary seed if you add it
    }

    async function onSave() {
        if (!imageUri) return;
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') return Alert.alert('Permission needed to save image.');
        await MediaLibrary.saveToLibraryAsync(imageUri);
        Alert.alert('Saved', 'Image saved to your library.');
    }

    async function onShare() {
        if (!imageUri) return;
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(imageUri);
        } else {
            Alert.alert('Sharing not available on this device');
        }
    }

    // ====================== RENDER ======================
    if (screen === 'verse') {
        return (
            <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
                <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: 20 }}>Scripture Visualizer</Text>
                <Text style={{ marginBottom: 8 }}>Enter verse (e.g., John 3:16)</Text>
                <TextInput
                    value={refInput}
                    onChangeText={setRefInput}
                    placeholder="John 3:16"
                    style={{ borderWidth: 1, borderColor: '#999', borderRadius: 8, padding: 12, marginBottom: 16 }}
                />
                <TouchableOpacity onPress={goToPreview}
                    style={{ backgroundColor: '#222', padding: 16, borderRadius: 10, alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Next</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (screen === 'preview') {
        return (
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 4 }}>Prompt Preview</Text>
                <Text style={{ color: '#666', marginBottom: 12 }}>{normalizedRef}</Text>

                {/* Smart Prompt Toggle */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 16, marginRight: 10 }}>Smart Prompt</Text>
                    <TouchableOpacity
                        onPress={() => setUseSmart(v => !v)}
                        style={{
                            width: 64, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#333',
                            justifyContent: 'center', padding: 4, backgroundColor: useSmart ? '#cde' : '#eee'
                        }}
                    >
                        <View style={{
                            width: 24, height: 24, borderRadius: 12, backgroundColor: '#333',
                            alignSelf: useSmart ? 'flex-end' : 'flex-start'
                        }} />
                    </TouchableOpacity>
                    <Text style={{ marginLeft: 8 }}>{useSmart ? 'ON' : 'OFF'}</Text>
                </View>

                {/* Keyword chips */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                    {keywords.map(k => (
                        <View key={k} style={{
                            paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1,
                            borderColor: '#999', borderRadius: 999, marginRight: 8, marginBottom: 8
                        }}>
                            <Text>{k}</Text>
                        </View>
                    ))}
                </View>

                {/* Prompt box */}
                <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 20 }}>
                    <Text style={{ fontWeight: '700', marginBottom: 8 }}>Final Prompt</Text>
                    <Text>{prompt}</Text>
                </View>

                {/* Buttons */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <TouchableOpacity onPress={() => setScreen('verse')}
                        style={{ padding: 14, borderWidth: 1, borderColor: '#333', borderRadius: 10 }}>
                        <Text>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={goGenerate}
                        style={{ padding: 14, borderRadius: 10, backgroundColor: '#222' }}>
                        <Text style={{ color: '#fff' }}>Generate</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    }

    if (screen === 'loading') {
        const messages = ['Opening Bible…', 'Turning pages…', 'Crafting artwork…'];
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                {/* Bible page-turn feel: placeholder box — swap for GIF/Lottie if desired */}
                <View style={{ width: 200, height: 140, borderWidth: 1, borderColor: '#333', borderRadius: 8, marginBottom: 20 }} />
                <Text style={{ fontSize: 18 }}>{messages[loadingStage]}</Text>
            </View>
        );
    }

    // results
    return (
        <View style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Result</Text>

            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                {busy ? (
                    <Text>Painting your image…</Text>
                ) : imageUri ? (
                    <View>
                        <Image source={{ uri: imageUri }} style={{ width: 320, height: 320, borderRadius: 8 }} resizeMode="cover" />
                        {/* Verse overlay toggle (demo text) */}
                        <TouchableOpacity onPress={() => setOverlay(v => !v)} style={{ marginTop: 10, alignSelf: 'center' }}>
                            <Text style={{ textDecorationLine: 'underline' }}>
                                {overlay ? 'Show verse below' : 'Overlay verse on image'}
                            </Text>
                        </TouchableOpacity>
                        {overlay ? (
                            <View style={{
                                position: 'absolute', bottom: 16, left: 16, right: 16,
                                backgroundColor: 'rgba(0,0,0,0.45)', padding: 8, borderRadius: 6
                            }}>
                                <Text style={{ color: '#fff' }} numberOfLines={2}>
                                    “{(DEMO_VERSES[normalizedRef] || normalizedRef)}” — {normalizedRef}
                                </Text>
                            </View>
                        ) : (
                            <Text style={{ marginTop: 10, textAlign: 'center' }}>
                                “{(DEMO_VERSES[normalizedRef] || normalizedRef)}” — {normalizedRef}
                            </Text>
                        )}
                    </View>
                ) : (
                    <Text>Failed to load image.</Text>
                )}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <TouchableOpacity onPress={regenerate} style={{ padding: 12, borderWidth: 1, borderColor: '#333', borderRadius: 8 }}>
                    <Text>Regenerate</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onSave} style={{ padding: 12, borderWidth: 1, borderColor: '#333', borderRadius: 8 }}>
                    <Text>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onShare} style={{ padding: 12, borderWidth: 1, borderColor: '#333', borderRadius: 8 }}>
                    <Text>Share</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
//