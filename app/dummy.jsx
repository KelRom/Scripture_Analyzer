// App.js — Scripture Visualizer (Demo Only)
// Screens: Verse → Preview → Loading → Results
// Features: verse input, smart prompt (keywords), staged loading,
// OpenAI image gen with safe fallback, save to gallery, share, verse overlay toggle.

import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

/* ================== CONFIG ================== */

// Leave blank for mock images; put your real key to try OpenAI.
const OPENAI_API_KEY = ''; // e.g., 'sk-...'

// Small sample verse text map for preview (you can add more)
const DEMO_VERSES = {
    'John 3:16': 'For God so loved the world, that he gave his only begotten Son...',
    'Psalms 23:1': 'The Lord is my shepherd; I shall not want.',
    'Genesis 1:1': 'In the beginning God created the heaven and the earth.'
};

/* ================== HELPERS ================== */

// Safer trim that won’t crash if the value is undefined or not a string
const safeTrim = (v) => (typeof v === 'string' ? v.trim() : '');

// Minimal map so "jn 3:16" → "John 3:16", etc.
const BOOK_MAP = {
    jn: 'John', jhn: 'John', john: 'John',
    ps: 'Psalms', psa: 'Psalms', psalm: 'Psalms', psalms: 'Psalms',
    gen: 'Genesis', gn: 'Genesis', genesis: 'Genesis'
};

// Standardize common input forms into "Book C:V"
function normalizeReference(input) {
    const trimmed = safeTrim(input).replace(/\s+/g, ' ');
    if (!trimmed) return '';
    // Accept "Book Chap:Verse" with loose book names (e.g., "jn 3:16")
    const m = trimmed.match(/^([1-3]?\s?[A-Za-z]+)\s+(\d+):(\d+)$/);
    if (!m) return trimmed; // pass through if pattern not matched
    const rawBook = m[1];
    const chap = m[2], verse = m[3];
    const key = rawBook.toLowerCase().replace(/\s+/g, '');
    const niceBook = BOOK_MAP[key] || (rawBook.charAt(0).toUpperCase() + rawBook.slice(1));
    return `${niceBook} ${chap}:${verse}`;
}

/* ======== Tiny "NLP": keyword extraction (client only) ======== */

// Very small set of stopwords for demo
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
    for (const w of words) freq[w] = (freq[w] || 0) + 1;
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([w]) => w);
    const uniq = [];
    const seen = new Set();
    for (const w of sorted) {
        if (!seen.has(w)) { seen.add(w); uniq.push(w); }
        if (uniq.length >= limit) break;
    }
    return uniq.length ? uniq : ['symbolism', 'faith', 'light']; // fallback keywords
}

/* ================== Prompt Builder ================== */

function buildPrompt(verseText, keywords, useSmart = true) {
    const base = `Create an evocative illustration inspired by this Bible verse: "${verseText}".`;
    if (!useSmart || !keywords?.length) {
        return `${base} Emphasize respectful symbolism and uplifting composition.`;
    }
    const focus = `Focus on: ${keywords.slice(0, 5).join(', ')}.`;
    return `${base} ${focus} Use tasteful, reverent imagery; prioritize symbolism over photorealism.`;
}

/* ============ Image Generation (with fallback) ============ */

// If API key missing or request fails, download 1 placeholder image to cache
async function generateMockImage() {
    const url = 'https://placehold.co/1024x1024/png?text=Verse+Art';
    const filePath = FileSystem.cacheDirectory + `mock_${Date.now()}.png`;
    const res = await FileSystem.downloadAsync(url, filePath);
    return res.uri;
}

async function generateImageWithOpenAI(prompt) {
    // no key → use mock
    if (!OPENAI_API_KEY) {
        return await generateMockImage();
    }

    try {
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
            // Any error → fallback to mock so demo still works
            return await generateMockImage();
        }

        const json = await resp.json();
        const b64 = json?.data?.[0]?.b64_json;
        if (!b64) {
            return await generateMockImage();
        }

        const filePath = FileSystem.cacheDirectory + `gen_${Date.now()}.png`;
        await FileSystem.writeAsStringAsync(filePath, b64, { encoding: FileSystem.EncodingType.Base64 });
        return filePath;
    } catch (e) {
        // Network or billing error → fallback
        return await generateMockImage();
    }
}

/* ================== Main App (simple state router) ================== */

export default function App() {
    // "Screens" managed by state
    const [screen, setScreen] = useState('verse'); // 'verse' | 'preview' | 'loading' | 'results'

    // Verse input + normalized ref + smart prompt toggle
    const [refInput, setRefInput] = useState('');
    const [normalizedRef, setNormalizedRef] = useState('');
    const [useSmart, setUseSmart] = useState(true);

    // Verse text used in prompt (from demo map or the normalizedRef)
    const [verseText, setVerseText] = useState('');

    // Derived: keywords and final prompt
    const keywords = useMemo(() => extractKeywordsSimple(verseText), [verseText]);
    const prompt = useMemo(
        () => buildPrompt(verseText || normalizedRef, keywords, useSmart),
        [verseText, normalizedRef, keywords, useSmart]
    );

    // Loading stages + result image + overlay toggle
    const [loadingStage, setLoadingStage] = useState(0); // 0..2
    const [imageUri, setImageUri] = useState(null);
    const [overlay, setOverlay] = useState(false);

    // Move to preview after validating input
    function goToPreview() {
        const norm = normalizeReference(refInput);
        // require something like Book 1:1
        if (!/\d+:\d+$/.test(norm)) {
            Alert.alert('Format needed', 'Enter like "John 3:16" (Book Chapter:Verse).');
            return;
        }
        setNormalizedRef(norm);
        setVerseText(DEMO_VERSES[norm] || norm);
        setScreen('preview');
    }

    // Start generation: show staged loading, then call API (or fallback)
    function goGenerate() {
        setScreen('loading');
        setLoadingStage(0);
        setImageUri(null);
        setOverlay(false);

        // staged labels timing
        setTimeout(() => setLoadingStage(1), 800);   // Opening Bible…
        setTimeout(() => setLoadingStage(2), 1600);  // Turning pages…

        // do the work after a short delay (feel of "Crafting artwork…")
        setTimeout(async () => {
            const uri = await generateImageWithOpenAI(prompt);
            setImageUri(uri);
            setScreen('results');
        }, 2400);
    }

    // Regenerate with the same prompt (demo)
    function regenerate() {
        goGenerate();
    }

    // Save to Photos (ask permission if needed)
    async function onSave() {
        if (!imageUri) return;
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow photo access to save images.');
            return;
        }
        try {
            await MediaLibrary.saveToLibraryAsync(imageUri);
            Alert.alert('Saved', 'Image saved to your gallery.');
        } catch {
            Alert.alert('Error', 'Could not save image.');
        }
    }

    // Share via OS share sheet
    async function onShare() {
        if (!imageUri) return;
        try {
            const available = await Sharing.isAvailableAsync();
            if (!available) {
                Alert.alert('Not available', 'Sharing is not available on this device.');
                return;
            }
            await Sharing.shareAsync(imageUri);
        } catch {
            Alert.alert('Error', 'Could not share image.');
        }
    }

    /* ================== RENDER SCREENS ================== */

    if (screen === 'verse') {
        return (
            <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
                <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: 16 }}>Scripture Visualizer</Text>
                <Text style={{ marginBottom: 8 }}>Enter verse (e.g., John 3:16)</Text>
                <TextInput
                    value={refInput}
                    onChangeText={setRefInput}
                    placeholder="John 3:16"
                    style={{ borderWidth: 1, borderColor: '#999', borderRadius: 8, padding: 12, marginBottom: 14 }}
                />
                <TouchableOpacity
                    onPress={goToPreview}
                    style={{ backgroundColor: '#222', padding: 16, borderRadius: 10, alignItems: 'center' }}
                >
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

                {/* Smart Prompt toggle */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 16, marginRight: 10 }}>Smart Prompt</Text>
                    <TouchableOpacity
                        onPress={() => setUseSmart(v => !v)}
                        style={{
                            width: 64, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#333',
                            justifyContent: 'center', padding: 4, backgroundColor: useSmart ? '#cde' : '#eee'
                        }}
                    >
                        <View
                            style={{
                                width: 24, height: 24, borderRadius: 12, backgroundColor: '#333',
                                alignSelf: useSmart ? 'flex-end' : 'flex-start'
                            }}
                        />
                    </TouchableOpacity>
                    <Text style={{ marginLeft: 8 }}>{useSmart ? 'ON' : 'OFF'}</Text>
                </View>

                {/* Keyword chips */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                    {extractKeywordsSimple(verseText).map(k => (
                        <View
                            key={k}
                            style={{
                                paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1,
                                borderColor: '#999', borderRadius: 999, marginRight: 8, marginBottom: 8
                            }}
                        >
                            <Text>{k}</Text>
                        </View>
                    ))}
                </View>

                {/* Prompt text box */}
                <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 20 }}>
                    <Text style={{ fontWeight: '700', marginBottom: 8 }}>Final Prompt</Text>
                    <Text>{prompt}</Text>
                </View>

                {/* Buttons */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <TouchableOpacity
                        onPress={() => setScreen('verse')}
                        style={{ padding: 14, borderWidth: 1, borderColor: '#333', borderRadius: 10 }}
                    >
                        <Text>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={goGenerate}
                        style={{ padding: 14, borderRadius: 10, backgroundColor: '#222' }}
                    >
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
                {/* You can replace this box with a Lottie page-turn animation later */}
                <View style={{ width: 200, height: 140, borderWidth: 1, borderColor: '#333', borderRadius: 8, marginBottom: 16 }} />
                <Text style={{ fontSize: 16, marginBottom: 8 }}>{messages[loadingStage]}</Text>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    // Results screen
    return (
        <View style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Result</Text>

            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                {!imageUri ? (
                    <Text>Failed to load image.</Text>
                ) : (
                    <View>
                        <Image
                            source={{ uri: imageUri }}
                            style={{ width: 320, height: 320, borderRadius: 8, backgroundColor: '#eee' }}
                            resizeMode="cover"
                        />

                        {/* Verse overlay toggle */}
                        <TouchableOpacity onPress={() => setOverlay(v => !v)} style={{ marginTop: 10, alignSelf: 'center' }}>
                            <Text style={{ textDecorationLine: 'underline' }}>
                                {overlay ? 'Show verse below' : 'Overlay verse on image'}
                            </Text>
                        </TouchableOpacity>

                        {overlay ? (
                            <View
                                style={{
                                    position: 'absolute', bottom: 16, left: 16, right: 16,
                                    backgroundColor: 'rgba(0,0,0,0.45)', padding: 8, borderRadius: 6
                                }}
                            >
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
                )}
            </View>

            {/* Actions */}
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
