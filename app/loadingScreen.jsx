import { SafeAreaView, StyleSheet, Alert } from 'react-native'
import { Image } from "expo-image"
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect } from 'react'

const API_URL = "https://scripture-analyzer.vercel.app/api/generate-image"

const LoadingScreen = () => {
    const router = useRouter()
    const { prompt = "", ref = "" } = useLocalSearchParams()

    useEffect(() => {
        let cancelled = false

        async function run() {
            try {
                const resp = await fetch(API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt, ref })
                })

                if (!resp.ok) {
                    const err = await resp.json().catch(() => ({}))
                    throw new Error(err?.error || `HTTP ${resp.status}`)
                }

                const data = await resp.json()
                const uri = `data:${data.mime || "image/png"};base64,${data.image_b64}`

                if (!cancelled) {
                    router.replace({ pathname: "/results", params: { img: uri, ref: data.ref || ref, prompt: data.prompt || prompt } })
                }
            } catch (e) {
                console.error(e)
                if (!cancelled) {
                    Alert.alert("Generation failed", "Please try again.")
                    router.back()
                }
            }
        }

        run()
        return () => { cancelled = true }
    }, [router, prompt, ref])

    return (
        <SafeAreaView style={styles.screen}>
            <Image style={styles.image} source={require("../assets/bible_flipping.gif")} />
        </SafeAreaView>
    )
}
export default LoadingScreen

const styles = StyleSheet.create({
    screen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    image: { width: 256, height: 256 }
})