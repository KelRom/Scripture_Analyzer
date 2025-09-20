// app/results.jsx
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors } from "../constants/colors"
import * as FileSystem from 'expo-file-system'
import * as MediaLibrary from 'expo-media-library'
import * as Sharing from 'expo-sharing'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useMemo, useRef, useState } from 'react'

const HISTORY_KEY = "sa_history"

export default function Results() {
    const router = useRouter()
    const { img = "", ref = "", prompt = "" } = useLocalSearchParams()

    // Decode long/URL-encoded params safely
    const imageUri = useMemo(() => {
        try { return decodeURIComponent(String(img)) } catch { return String(img) }
    }, [img])

    const [busy, setBusy] = useState(false)
    const [cachedUri, setCachedUri] = useState("")      // local file we can reuse for Save/Share
    const addedOnceRef = useRef(false)                  // guard to prevent duplicate history writes

    function onRegenerate() {
        router.replace({ pathname: "/loadingScreen", params: { prompt: String(prompt || ""), ref: String(ref || "") } })
    }


    // Ensure we have a local file path for any image (data: / http(s) / file:)
    async function ensureLocalFileFromImg(uriStr) {
        const dir = FileSystem.cacheDirectory + "scripture-analyzer/"
        try { await FileSystem.makeDirectoryAsync(dir, { intermediates: true }) } catch { }
        // data URI -> write to file
        if (uriStr.startsWith("data:")) {
            const mimeMatch = uriStr.match(/^data:(.*?);base64,/)
            const mime = mimeMatch?.[1] || "image/png"
            const ext = mime.includes("png") ? "png" : (mime.includes("jpeg") || mime.includes("jpg")) ? "jpg" : "png"
            const base64 = uriStr.split(",")[1]
            const fileUri = `${dir}verse-${Date.now()}.${ext}`
            await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 })
            return fileUri
        }
        // remote URL -> download
        if (uriStr.startsWith("http://") || uriStr.startsWith("https://")) {
            const target = `${dir}verse-${Date.now()}.png`
            const dl = await FileSystem.downloadAsync(uriStr, target)
            return dl.uri
        }
        // already a local file path
        return uriStr
    }

    useEffect(() => {
        let cancelled = false
        async function addToHistoryOnce() {
            if (addedOnceRef.current) return

            // Only auto-add if this looks like a newly generated data URI
            if (!String(imageUri).startsWith("data:")) return
            addedOnceRef.current = true
            try {
                const fileUri = await ensureLocalFileFromImg(String(imageUri))
                if (cancelled) return
                setCachedUri(fileUri)
                const rec = { uri: fileUri, ref: String(ref || ""), prompt: String(prompt || ""), ts: Date.now() }
                const hRaw = await AsyncStorage.getItem(HISTORY_KEY)
                const arr = Array.isArray(JSON.parse(hRaw || "[]")) ? JSON.parse(hRaw || "[]") : []
                const next = [rec, ...arr].slice(0, 10)
                await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next))
            } catch (e) {
                console.warn("Auto-history add failed:", e?.message || e)
            }
        }
        addToHistoryOnce()
        return () => { cancelled = true }
    }, [imageUri, ref, prompt])

    async function onSave() {
        try {
            setBusy(true)
            const { status } = await MediaLibrary.requestPermissionsAsync()
            if (status !== "granted") throw new Error("Please allow Photo Library access to save images.")

            // Reuse cached file if available; otherwise ensure one
            const fileUri = cachedUri || await ensureLocalFileFromImg(String(imageUri))
            if (!cachedUri) setCachedUri(fileUri)

            const asset = await MediaLibrary.createAssetAsync(fileUri)
            const albumName = "Scripture Analyzer"
            let album = await MediaLibrary.getAlbumAsync(albumName)
            if (!album) await MediaLibrary.createAlbumAsync(albumName, asset, false)
            else await MediaLibrary.addAssetsToAlbumAsync([asset], album, false)

            Alert.alert("Saved ✅", "Image saved to your Photos.")
        } catch (e) {
            console.error(e)
            Alert.alert("Save failed", e?.message || "Could not save the image.")
        } finally {
            setBusy(false)
        }
    }

    async function onShare() {
        try {
            setBusy(true)
            const available = await Sharing.isAvailableAsync()
            if (!available) return Alert.alert("Sharing not available", "This device doesn’t support the native share dialog.")
            const fileUri = cachedUri || await ensureLocalFileFromImg(String(imageUri))
            if (!cachedUri) setCachedUri(fileUri)
            await Sharing.shareAsync(fileUri)
        } catch (e) {
            console.error(e)
            Alert.alert("Share failed", e?.message || "Could not open the share dialog.")
        } finally {
            setBusy(false)
        }
    }

    return (
        <View style={styles.screen}>
            <Text style={styles.title}>Result</Text>

            <View style={styles.center}>
                <Image source={{ uri: imageUri }} style={styles.image} />
                <Text style={styles.verse}>“{String(ref)}”</Text>
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
    row: { flexDirection: 'row', justifyContent: "space-evenly", width: '100%' },
    button: {
        marginBottom: 100, width: 100, height: 50, borderRadius: 50,
        justifyContent: "center", alignItems: "center",
        backgroundColor: Colors.primaryColorBackground.backgroundColor
    },
    buttonDisabled: { opacity: 0.6 },
})
