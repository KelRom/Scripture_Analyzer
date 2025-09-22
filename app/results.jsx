// app/results.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors } from '../constants/colors'

import { File, Directory, Paths } from 'expo-file-system'
import * as MediaLibrary from 'expo-media-library'
import * as Sharing from 'expo-sharing'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'

const HISTORY_KEY = 'sa_history'
const ALBUM_NAME = 'Scripture Analyzer'
const isExpoGo = Constants.appOwnership === 'expo'

// --- base64 → Uint8Array (no Buffer/atob)
const _b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
function base64ToBytes(b64) {
    const clean = b64.replace(/^data:.*?;base64,/, '').replace(/[\r\n\s]/g, '')
    let len = clean.length * 0.75
    if (clean.endsWith('==')) len -= 2
    else if (clean.endsWith('=')) len -= 1
    const out = new Uint8Array(len)
    let p = 0
    for (let i = 0; i < clean.length; i += 4) {
        const e1 = _b64chars.indexOf(clean[i])
        const e2 = _b64chars.indexOf(clean[i + 1])
        const e3 = _b64chars.indexOf(clean[i + 2])
        const e4 = _b64chars.indexOf(clean[i + 3])
        const c1 = (e1 << 2) | (e2 >> 4)
        const c2 = ((e2 & 15) << 4) | (e3 >> 2)
        const c3 = ((e3 & 3) << 6) | e4
        out[p++] = c1
        if (clean[i + 2] !== '=' && e3 !== 64) out[p++] = c2
        if (clean[i + 3] !== '=' && e4 !== 64) out[p++] = c3
    }
    return out
}

export default function Results() {
    const router = useRouter()
    const { img = '', ref = '', prompt = '' } = useLocalSearchParams()

    const imageUri = useMemo(() => {
        try { return decodeURIComponent(String(img)) } catch { return String(img) }
    }, [img])

    const [busy, setBusy] = useState(false)
    const [cachedUri, setCachedUri] = useState('')
    const cachedForRef = useRef('')        // which imageUri the cache belongs to
    const addedOnceRef = useRef(false)     // history guard per image

    function onRegenerate() {
        router.replace({
            pathname: '/loadingScreen',
            params: { prompt: String(prompt || ''), ref: String(ref || '') }
        })
    }

    // ---------- File helpers ----------
    const outDir = new Directory(Paths.cache, 'scripture-analyzer')
    function uniqueName(ext) {
        return `verse-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    }
    async function ensureOutDir() {
        try { await outDir.create() } catch (e) {
            const msg = String(e?.message || '').toLowerCase()
            if (!msg.includes('already exists')) throw e
        }
    }
    async function ensureLocalFileFromImg(uriStr) {
        await ensureOutDir()

        if (uriStr.startsWith('data:')) {
            const [, mime = 'image/png'] = uriStr.match(/^data:(.*?);base64,/) || []
            const ext = mime.includes('png') ? 'png' : (mime.includes('jpeg') || mime.includes('jpg')) ? 'jpg' : 'png'
            const base64 = uriStr.split(',')[1] || ''
            const bytes = base64ToBytes(base64)
            const outFile = outDir.createFile(uniqueName(ext), mime)
            await outFile.write(bytes)
            return outFile.uri
        }

        if (/^https?:\/\//i.test(uriStr)) {
            const res = await fetch(uriStr)
            if (!res.ok) throw new Error(`Download failed: ${res.status}`)
            const buf = await res.arrayBuffer()
            const bytes = new Uint8Array(buf)
            const outFile = outDir.createFile(uniqueName('png'), 'image/png')
            await outFile.write(bytes)
            return outFile.uri
        }

        return uriStr // already local
    }

    // ---------- Reset cache when the displayed image changes ----------
    useEffect(() => {
        setCachedUri('')
        cachedForRef.current = ''
        addedOnceRef.current = false
    }, [imageUri])

    // ---------- Auto-add NEW (data:) images to History ----------
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
                cachedForRef.current = imageUri

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
        if (isExpoGo && Platform.OS === 'android') return false // Expo Go can't apply plugin perms
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync(false, ['photo'])
            return status === 'granted'
        } catch {
            const { status } = await MediaLibrary.requestPermissionsAsync()
            return status === 'granted'
        }
    }

    // Always use the file for the CURRENT imageUri
    async function getCurrentFileUri() {
        if (cachedUri && cachedForRef.current === imageUri) return cachedUri
        const uri = await ensureLocalFileFromImg(String(imageUri))
        setCachedUri(uri)
        cachedForRef.current = imageUri
        return uri
    }

    async function onSave() {
        try {
            setBusy(true)
            if (Platform.OS === 'web') { Alert.alert('Not supported on web'); return }
            if (isExpoGo && Platform.OS === 'android') {
                Alert.alert('Use a development build', 'Saving to Photos can’t be fully tested in Expo Go on Android.')
                return
            }

            const granted = await requestPhotoPermissionOnly()
            if (!granted) throw new Error('Please allow photo access to save images.')

            const fileUri = await getCurrentFileUri()
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
            if (!available) { Alert.alert('Sharing not available'); return }
            const fileUri = await getCurrentFileUri()
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
    title: { fontSize: 50, color: Colors.primaryColorText.color, marginTop: 6 },
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
