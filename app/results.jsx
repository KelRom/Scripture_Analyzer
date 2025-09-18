// app/results.jsx
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors } from "../constants/colors"
import * as FileSystem from 'expo-file-system'
import * as MediaLibrary from 'expo-media-library'
import * as Sharing from 'expo-sharing'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useState } from 'react'

const HISTORY_KEY = "sa_history"

const Results = () => {
    const router = useRouter()
    const { img = "", ref = "", prompt = "" } = useLocalSearchParams()
    const [busy, setBusy] = useState(false)

    function onRegenerate() {
        router.replace({ pathname: "/loadingScreen", params: { prompt, ref } })
    }

    async function ensureLocalFileFromImg(imgStr) {
        const dir = FileSystem.cacheDirectory + "scripture-analyzer/"
        try { await FileSystem.makeDirectoryAsync(dir, { intermediates: true }) } catch { }
        if (typeof imgStr === "string" && imgStr.startsWith("data:")) {
            const mimeMatch = imgStr.match(/^data:(.*?);base64,/)
            const mime = mimeMatch?.[1] || "image/png"
            const ext = mime.includes("png") ? "png" : (mime.includes("jpeg") || mime.includes("jpg")) ? "jpg" : "png"
            const base64 = imgStr.split(",")[1]
            const fileUri = `${dir}verse-${Date.now()}.${ext}`
            await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 })
            return fileUri
        }
        if (typeof imgStr === "string" && (imgStr.startsWith("http://") || imgStr.startsWith("https://"))) {
            const target = `${dir}verse-${Date.now()}.png`
            const dl = await FileSystem.downloadAsync(imgStr, target)
            return dl.uri
        }
        return imgStr
    }

    async function onSave() {
        try {
            setBusy(true)
            // Save to Photos
            const { status } = await MediaLibrary.requestPermissionsAsync()
            if (status !== "granted") throw new Error("Please allow Photo Library access to save images.")
            const fileUri = await ensureLocalFileFromImg(String(img))
            const asset = await MediaLibrary.createAssetAsync(fileUri)
            const albumName = "Scripture Analyzer"
            let album = await MediaLibrary.getAlbumAsync(albumName)
            if (!album) await MediaLibrary.createAlbumAsync(albumName, asset, false)
            else await MediaLibrary.addAssetsToAlbumAsync([asset], album, false)

            // Save to History (keep last 10)
            const rec = { uri: fileUri, ref: String(ref || ""), prompt: String(prompt || ""), ts: Date.now() }
            try {
                const hRaw = await AsyncStorage.getItem(HISTORY_KEY)
                const arr = Array.isArray(JSON.parse(hRaw || "[]")) ? JSON.parse(hRaw || "[]") : []
                const next = [rec, ...arr].slice(0, 10)
                await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next))
            } catch { }

            Alert.alert("Saved ✅", "Image saved to your Photos and added to History.")
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
            const fileUri = await ensureLocalFileFromImg(String(img))
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
                <Image source={{ uri: String(img) }} style={styles.image} />
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
export default Results

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        justifyContent: 'space-evenly',
        alignItems: 'center',
    },
    title: {
        fontSize: 50,
        color: Colors.primaryColorText.color
    },
    center: { alignItems: 'center' },
    image: {
        width: 320,
        height: 320,
        borderRadius: 50,
        backgroundColor: '#eee'
    },
    verse: { marginTop: 10, textAlign: 'center' },
    row: { flexDirection: 'row', justifyContent: "space-evenly", width: '100%' },
    button: {
        marginBottom: 100,
        width: 100,
        height: 50,
        borderRadius: 50,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.primaryColorBackground.backgroundColor
    },
    buttonDisabled: { opacity: 0.6 },
})
