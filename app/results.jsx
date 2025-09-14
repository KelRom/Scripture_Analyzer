// app/results.jsx
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, StatusBar, SafeAreaView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'

const Results = () => {
    const router = useRouter()
    const { img = "", ref = "", prompt = "" } = useLocalSearchParams()

    function onRegenerate() {
        router.replace({ pathname: "/loadingScreen", params: { prompt, ref } })
    }

    return (
        <SafeAreaView>
            <Text style={styles.title}>Result</Text>

            <View style={styles.center}>
                <Image source={{ uri: String(img) }} style={styles.image} />
                <Text style={styles.verse}>“{String(ref)}”</Text>
            </View>

            <View style={styles.row}>
                <TouchableOpacity style={styles.btnOutline} onPress={onRegenerate}>
                    <Text>Regenerate</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}
export default Results

const styles = StyleSheet.create({
    title: { top: Platform.OS === "android" ? StatusBar.currentHeight + 36 : 36, fontSize: 32, fontWeight: '700' },
    center: {
        top: Platform.OS === "android" ? StatusBar.currentHeight + 56 : 56,
        alignItems: 'center'
    },
    image: { width: 320, height: 320, borderRadius: 8, backgroundColor: '#eee' },
    verse: { marginTop: 10, textAlign: 'center' },
    row: {
        top: Platform.OS === "android" ? StatusBar.currentHeight + 84 : 84,
        flexDirection: 'row', justifyContent: 'center', gap: 16
    },
    btnOutline: { padding: 12, borderWidth: 1, borderRadius: 8 }
})
