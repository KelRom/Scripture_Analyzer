import { StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

const API_URL = 'https://scripture-analyzer.vercel.app/api/generate-image'

export default function LoadingScreen() {
    const router = useRouter()
    const { prompt = '', ref = '', size = '1024', quality = 'standard' } = useLocalSearchParams()

    useEffect(() => {
        let cancelled = false
        async function run() {
            try {
                const resp = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt, ref, size, quality }) // ← include
                })
                if (!resp.ok) {
                    const err = await resp.json().catch(() => ({}))
                    throw new Error(err?.error || `HTTP ${resp.status}`)
                }
                const data = await resp.json()
                const uri = `data:${data.mime || 'image/png'};base64,${data.image_b64}`
                if (!cancelled) {
                    const imgParam = encodeURIComponent(String(uri))
                    router.replace({
                        pathname: '/results',
                        params: { img: imgParam, ref: String(data.ref || ref || ''), prompt: String(data.prompt || prompt || '') }
                    })
                }
            } catch (e) {
                console.error(e)
                if (!cancelled) router.back()
            }
        }
        run()
        return () => { cancelled = true }
    }, [router, prompt, ref, size, quality])

    return (
        <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
            <Image style={styles.image} source={require('../assets/bible_flipping.gif')} />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    image: { width: 256, height: 256 }
})
