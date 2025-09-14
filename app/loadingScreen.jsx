import { SafeAreaView, StyleSheet, Platform, StatusBar } from 'react-native'
import { Image } from "expo-image"
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect } from 'react'

// mock image helper (until OpenAI is wired)
const MOCK = "https://placehold.co/1024x1024/png?text=Verse+Art"

const LoadingScreen = () => {
    const router = useRouter()
    const { prompt = "", ref = "" } = useLocalSearchParams()

    useEffect(() => {
        // simulate generation time, then navigate to results with a mock image URL
        const t = setTimeout(() => {
            router.replace({ pathname: "/results", params: { img: MOCK, ref, prompt } })
        }, 2200)
        return () => clearTimeout(t)
    }, [router, ref, prompt])

    return (
        <SafeAreaView style={styles.screen}>
            <Image style={styles.image} source={require("../assets/bible_flipping.gif")} />
        </SafeAreaView>
    )
}
export default LoadingScreen

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    image: {
        width: 256,
        height: 256,
    }
})