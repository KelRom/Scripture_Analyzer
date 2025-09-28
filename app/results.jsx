import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useHeaderHeight } from '@react-navigation/elements'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors } from '../constants/colors'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as MediaLibrary from 'expo-media-library'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system/legacy'

const HISTORY_KEY = 'sa_history'

export default function Results() {
    const headerHeight = useHeaderHeight()
    const router = useRouter()
    const {
        img = '',
        ref = '',
        prompt = '',
        size = '1024',
        quality = 'standard',
        source = 'generated', // 'generated' | 'history'
        skipHistory = '0'
    } = useLocalSearchParams()

    const [busy, setBusy] = useState(false)
    const addedRef = useRef(false)

    async function ensureLocalFileFromImg(uri) {
        if (!uri) throw new Error('No image URI')
        let u = String(uri)

        // handle encoded data URLs
        if (u.startsWith('data%3Aimage') || u.includes('%2C')) {
            try { u = decodeURIComponent(u) } catch { }
        }

        const target = FileSystem.cacheDirectory + `sa_${Date.now()}.png`

        if (u.startsWith('file://')) return u

        if (u.startsWith('data:image')) {
            const base64 = u.split(',')[1] || ''
            await FileSystem.writeAsStringAsync(target, base64, { encoding: FileSystem.EncodingType.Base64 })
            return target
        }

        if (/^https?:/i.test(u)) {
            const { uri: dl } = await FileSystem.downloadAsync(u, target)
            return dl
        }

        throw new Error('Unsupported image URI scheme')
    }

    const minTxt = (s, n) => {
        const t = String(s || '')
        return t.length > n ? t.slice(0, n) + '…' : t
    }

    // Auto-add to History if not opened from History
    useEffect(() => {
        if (addedRef.current) return
        addedRef.current = true

        const openedFromHistory =
            source === 'history' ||
            skipHistory === '1' || skipHistory === 'true' || skipHistory === true

        if (openedFromHistory) return

            ; (async () => {
                let localPath = String(img)
                try {
                    localPath = await ensureLocalFileFromImg(String(img))

                    const hRaw = await AsyncStorage.getItem(HISTORY_KEY)
                    const arr = Array.isArray(JSON.parse(hRaw || '[]')) ? JSON.parse(hRaw || '[]') : []

                    if (arr.some(x => String(x.uri) === String(localPath))) return

                    const rec = {
                        ts: Date.now(),
                        uri: localPath,
                        ref: minTxt(ref, 120),
                        prompt: minTxt(prompt, 400)
                    }
                    const next = [rec, ...arr].slice(0, 10)
                    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next))
                } catch (e) {
                    console.warn('Auto-history add failed:', e?.message || e)
                }
            })()
    }, [img, ref, prompt, source, skipHistory])

    function onRegenerate() {
        if (busy) return
        const diversity = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        router.replace({
            pathname: '/loadingScreen',
            params: {
                prompt: String(prompt || ''),
                ref: String(ref || ''),
                size: String(size || '1024'),
                quality: String(quality || 'standard'),
                diversity
            }
        })
    }

    async function onSave() {
        if (busy) return
        try {
            setBusy(true)
            const { granted } = await MediaLibrary.requestPermissionsAsync()
            if (!granted) { Alert.alert('Permission needed', 'Please allow Photos access to save images.'); return }
            const localPath = await ensureLocalFileFromImg(String(img))
            await MediaLibrary.saveToLibraryAsync(localPath)
            Alert.alert('Saved', 'Image saved to your Photos.')
        } catch (e) {
            Alert.alert('Save failed', String(e?.message || e))
        } finally { setBusy(false) }
    }

    async function onShare() {
        if (busy) return
        try {
            setBusy(true)
            const localPath = await ensureLocalFileFromImg(String(img))
            if (!(await Sharing.isAvailableAsync())) { Alert.alert('Sharing unavailable', 'Sharing is not available on this device.'); return }
            await Sharing.shareAsync(localPath)
        } catch (e) {
            Alert.alert('Share failed', String(e?.message || e))
        } finally { setBusy(false) }
    }

    return (
        <View style={[styles.screen, { paddingTop: headerHeight + 10 }]}>
            <Text style={styles.title}>Result</Text>

            <View style={styles.center}>
                <Image source={{ uri: String(img) }} style={styles.image} />
                {!!ref && <Text style={styles.verse}>“{String(ref)}”</Text>}
            </View>

            <View style={styles.row}>
                <TouchableOpacity style={[styles.button, busy && styles.buttonDisabled]} onPress={onRegenerate} disabled={busy}>
                    <Text style={styles.buttonText}>Regenerate</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, busy && styles.buttonDisabled]} onPress={onSave} disabled={busy}>
                    <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, busy && styles.buttonDisabled]} onPress={onShare} disabled={busy}>
                    <Text style={styles.buttonText}>Share</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingBottom: 36 },
    title: { fontSize: 50, color: Colors.primaryColorText.color, marginTop: 6 },
    center: { alignItems: 'center' },
    image: {
        width: 320, height: 320, borderRadius: 30,
        backgroundColor: Colors.primaryColorBackground.backgroundColor,
        borderWidth: 1, borderColor: (Colors.border?.color ?? '#5A6472')
    },
    verse: { marginTop: 10, textAlign: 'center', color: Colors.secondaryColorText.color },
    row: { flexDirection: 'row', justifyContent: 'space-evenly', width: '100%' },
    button: {
        marginBottom: 36, width: 110, height: 50, borderRadius: 50,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: Colors.primaryColorBackground.backgroundColor,
        borderWidth: 1, borderColor: (Colors.border?.color ?? '#5A6472')
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: Colors.secondaryColorText.color, fontWeight: '600' }
})
