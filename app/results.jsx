// app/results.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors } from '../constants/colors'

// ✅ SDK 54 new FileSystem API
import { File, Directory, Paths } from 'expo-file-system'
import * as MediaLibrary from 'expo-media-library'
import * as Sharing from 'expo-sharing'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'

const HISTORY_KEY = 'sa_history'
const ALBUM_NAME = 'Scripture Analyzer'
const isExpoGo = Constants.appOwnership === 'expo'

export default function Results() {
    const router = useRouter()
    const { img = '', ref = '', prompt = '' } = useLocalSearchParams()

    const imageUri = useMemo(() => {
        try { return decodeURIComponent(String(img)) } catch { return String(img) }
    }, [img])

    const [busy, setBusy] = useState(false)
    const [cachedUri, setCachedUri] = useState('')
    const addedOnceRef = useRef(false)

    function onRegenerate() {
        router.replace({
            pathname: '/loadingScreen',
            params: { prompt: String(prompt || ''), ref: String(ref || '') }
        })
    }

    // ---------- FS helpers (SDK 54) ----------
    const outDir = new Directory(Paths.cache, 'scripture-analyzer')
    async function ensureOutDir() {
        try {
            await outDir.create() // may throw if exists
        } catch (e) {
            // ignore "it already exists"
            if (!String(e?.message || '').toLowerCase().includes('already exists')) {
                throw e
            }
        }
    }

    async function ensureLocalFileFromImg(uriStr) {
        await ensureOutDir()

        // data: URI → base64 write
        if (uriStr.startsWith('data:')) {
            const [, mime = 'image/png'] = uriStr.match(/^data:(.*?);base64,/) || []
            const ext = mime.includes('png') ? 'png' : (mime.includes('jpeg') || mime.includes('jpg')) ? 'jpg' : 'png'
            const base64 = uriStr.split(',')[1] || ''
            const outFile = outDir.createFile(`verse-${Date.now()}.${ext}`, mime)
            await outFile.write(base64, { encoding: 'base64' })
            return outFile.uri
        }

        // http(s) → download and write bytes
        if (/^https?:\/\//i.test(uriStr)) {
            const res = await fetch(uriStr)
            if (!res.ok) throw new Error(`Download failed: ${res.status}`)
            const buf = await res.arrayBuffer()
            const bytes = new Uint8Array(buf)
            const outFile = outDir.createFile(`verse-${Date.now()}.png`, 'image/png')
            await outFile.write(bytes)
            return outFile.uri
        }

        // already local
        return uriStr
    }

    // ---------- Auto-add NEW images (data: URIs) to History once ----------
    useEffect(() => {
        let cancelled = false
        async function addToHistoryOnce() {
            if (addedOnceRef.current) return
            if (!String(imageUri).startsWith('data:')) return
            addedOnceRef.current = true
            try {
                const fileUri = await ensureLocalFileFromImg(String(imageUri))
                if (cancelled) return
                setCachedUri(fileUri)

                const rec = { uri: fileUri, ref: String(ref || ''), prompt: String(prompt || ''), ts: Date.now() }
                const raw = await AsyncStorage.getItem(HISTORY_KEY)
                const arr = Array.isArray(JSON.parse(raw || '[]')) ? JSON.parse(raw || '[]') : []
                const next = [rec, ...arr].slice(0, 10)
                await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next))
            } catch (e) {
                console.warn('Auto-history add failed:', e?.message || e)
            }
        }
        addToHistoryOnce()
        return () => { cancelled = true }
    }, [imageUri, ref, prompt])

    // ---------- MediaLibrary ----------
    async function requestPhotoPermissionOnly() {
        // Expo Go on Android: plugin isn’t applied → granular request can cause AUDIO error.
        if (isExpoGo && Platform.OS === 'android') {
            return false // force the “use dev build” message below
        }
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync(false, ['photo']) // Android 13+: photos only
            return status === 'granted'
        } catch {
            const { status } = await MediaLibrary.requestPermissionsAsync() // iOS / older Android
            return status === 'granted'
        }
    }

    async function onSave() {
        try {
            setBusy(true)
            if (Platform.OS === 'web') {
                Alert.alert('Not supported on web', 'Saving to Photos is only available on iOS/Android.')
                return
            }
            if (isExpoGo && Platform.OS === 'android') {
                Alert.alert(
                    'Use a development build',
                    'Due to Android’s new media permissions, saving to Photos can’t be fully tested in Expo Go. Build a dev client to continue.'
                )
                return
            }

            const granted = await requestPhotoPermissionOnly()
            if (!granted) throw new Error('Please allow photo access to save images.')

            const fileUri = cachedUri || await ensureLocalFileFromImg(String(imageUri))
            if (!cachedUri) setCachedUri(fileUri)

            const asset = await MediaLibrary.createAssetAsync(fileUri)
            let album = await MediaLibrary.getAlbumAsync(ALBUM_NAME)
            if (!album) await MediaLibrary.createAlbumAsync(ALBUM_NAME, asset, false)
            else await MediaLibrary.addAssetsToAlbumAsync([asset], album, false)

            Alert.alert('Saved ✅', 'Image saved to your Photos.')
        } catch (e) {
            console.error(e)
            Alert.alert('Save failed', e?.message || 'Could not save the image.')
        } finally {
            setBusy(false)
        }
    }

    async function onShare() {
        try {
            setBusy(true)
            const available = await Sharing.isAvailableAsync()
            if (!available) {
                Alert.alert('Sharing not available', 'This device does not support the native share dialog.')
                return
            }
            const fileUri = cachedUri || await ensureLocalFileFromImg(String(imageUri))
            if (!cachedUri) setCachedUri(fileUri)
            await Sharing.shareAsync(fileUri)
        } catch (e) {
            console.error(e)
            Alert.alert('Share failed', e?.message || 'Could not open the share dialog.')
        } finally {
            setBusy(false)
        }
    }

    return (
        <View style={styles.screen}>
            <Text style={styles.title}>Result</Text>

            <View style={styles.center}>
                <Image source={{ uri: imageUri }} style={styles.image} />
                {!!ref && <Text style={styles.verse}>“{String(ref)}”</Text>}
            </View>

            <View style={styles.row}>
                <TouchableOpacity style={[styles.button, busy && styles.buttonDisabled]} onPress={onRegenerate} disabled={busy}>
                    <Text style={{ color: Colors.secondaryColorText.color }}>Regenerate</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, busy && styles.buttonDisabled]} onPress={onSave} disabled={busy}>
                    <Text style={{ color: Colors.secondaryColorText.color }}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, busy && styles.buttonDisabled]} onPress={onShare} disabled={busy}>
                    <Text style={{ color: Colors.secondaryColorText.color }}>Share</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, justifyContent: 'space-evenly', alignItems: 'center' },
    title: { fontSize: 50, color: Colors.primaryColorText.color },
    center: { alignItems: 'center' },
    image: {
        width: 320, height: 320, borderRadius: 30,
        backgroundColor: Colors.primaryColorBackground.backgroundColor,
        borderWidth: 1, borderColor: (Colors.border && Colors.border.color) || '#3B424C'
    },
    verse: { marginTop: 10, textAlign: 'center', color: Colors.secondaryColorText.color },
    row: { flexDirection: 'row', justifyContent: 'space-evenly', width: '100%' },
    button: {
        marginBottom: 100, width: 110, height: 50, borderRadius: 50,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: Colors.primaryColorBackground.backgroundColor
    },
    buttonDisabled: { opacity: 0.6 },
})
