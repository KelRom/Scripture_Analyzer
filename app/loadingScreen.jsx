import React, { useEffect, useRef, useState, useMemo } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { View, Text, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { Colors } from '../constants/colors'

const API_URL = 'https://scripture-analyzer.vercel.app/api/generate-image'
const RANDOM_VERSE_URL = 'https://beta.ourmanna.com/api/v1/get/?format=json&order=random'

export default function LoadingScreen() {
    const router = useRouter()
    const { prompt = '', ref = '', size = '1024', quality = 'standard', diversity = '' } = useLocalSearchParams()

    const [verseText, setVerseText] = useState('')
    const [verseRef, setVerseRef] = useState('')
    const [busy, setBusy] = useState(false)
    const verseTimer = useRef(null)

    // random Bible verse rotation
    const fetchVerse = async () => {
        try {
            const r = await fetch(RANDOM_VERSE_URL)
            const j = await r.json()
            const v = j?.verse?.details
            if (v?.text) setVerseText(String(v.text).trim())
            if (v?.reference) setVerseRef(String(v.reference).trim())
        } catch { }
    }

    useEffect(() => {
        fetchVerse()
        verseTimer.current = setInterval(fetchVerse, 5000)
        return () => clearInterval(verseTimer.current)
    }, [])

    const hasVerse = useMemo(() => verseText || verseRef, [verseText, verseRef])

    // generate whenever this screen focuses
    useFocusEffect(
        React.useCallback(() => {
            let active = true
            const ctrl = new AbortController()

            const run = async () => {
                try {
                    setBusy(true)
                    const resp = await fetch(`${API_URL}?ts=${Date.now()}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Cache-Control': 'no-cache',
                            'Pragma': 'no-cache',
                            'X-Run-Id': String(Date.now())
                        },
                        body: JSON.stringify({ prompt, ref, size, quality, diversity }),
                        signal: ctrl.signal
                    })
                    if (!resp.ok) {
                        const errTxt = await resp.text().catch(() => '')
                        throw new Error(errTxt || `HTTP ${resp.status}`)
                    }
                    const data = await resp.json().catch(() => ({}))
                    const uri =
                        data?.image ||
                        data?.url ||
                        (data?.mime && data?.image_b64
                            ? `data:${data.mime};base64,${data.image_b64}`
                            : '')

                    if (!uri) throw new Error('No image returned.')

                    if (!active) return
                    router.replace({
                        pathname: '/results',
                        params: {
                            img: String(uri),
                            ref: String(data.ref || ref || ''),
                            prompt: String(data.prompt || prompt || ''),
                            size: String(size || '1024'),
                            quality: String(quality || 'standard'),
                            source: 'generated'
                        }
                    })
                } catch (e) {
                    if (!active) return
                    Alert.alert('Generation error', String(e?.message || e))
                    router.back()
                } finally {
                    if (active) setBusy(false)
                }
            }

            run()
            return () => { active = false; ctrl.abort() }
        }, [router, prompt, ref, size, quality, diversity])
    )

    return (
        <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
            {/* Centered loader image */}
            <Image
                source={require('../assets/bible_flipping.gif')}
                style={styles.image}
                resizeMode="contain"
            />

            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primaryColorText.color} />
                <Text style={styles.loadingText}>{busy ? 'Generating…' : 'Almost there…'}</Text>

                {/* Random motivational Bible verse */}
                {hasVerse ? (
                    <View style={styles.verseWrap}>
                        {!!verseText && <Text style={styles.verseText} numberOfLines={4}>{`“${verseText}”`}</Text>}
                        {!!verseRef && <Text style={styles.verseRef}>— {verseRef}</Text>}
                    </View>
                ) : (
                    <Text style={styles.verseHint}>Fetching a verse…</Text>
                )}
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: Colors.container.backgroundColor,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24
    },
    image: {
        width: '70%',
        aspectRatio: 1,
        alignSelf: 'center',
        marginBottom: 16
    },
    center: { width: '85%', alignItems: 'center', gap: 10 },

    loadingText: { fontSize: 16, color: Colors.primaryColorText.color, opacity: 0.95 },

    verseWrap: { marginTop: 6, maxWidth: 560, alignItems: 'center' },
    verseText: { textAlign: 'center', fontSize: 14, lineHeight: 20, color: Colors.secondaryColorText.color },
    verseRef: { marginTop: 6, fontSize: 13, color: Colors.primaryColorText.color, opacity: 0.9 },

    verseHint: { marginTop: 6, fontSize: 12, color: Colors.secondaryColorText.color, opacity: 0.8 }
})
