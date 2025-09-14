// app/results.jsx
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, StatusBar, SafeAreaView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors } from "../constants/colors"

const Results = () => {
    const router = useRouter()
    const { img = "", ref = "", prompt = "" } = useLocalSearchParams()

    function onRegenerate() {
        router.replace({ pathname: "/loadingScreen", params: { prompt, ref } })
    }

    function onSave() {

    }

    function onShare() {

    }

    return (
        <View style={styles.screen}>
            <Text style={styles.title}>Result</Text>

            <View style={styles.center}>
                <Image source={{ uri: String(img) }} style={styles.image} />
                <Text style={styles.verse}>“{String(ref)}”</Text>
            </View>

            <View style={styles.row}>
                <TouchableOpacity style={styles.button} onPress={onRegenerate}>
                    <Text style={{ color: Colors.secondaryColorText.color }}>Regenerate</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={onSave}>
                    <Text style={{ color: Colors.secondaryColorText.color }}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={onShare}>
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

    center: {
        alignItems: 'center'
    },

    image: {
        width: 320,
        height: 320, borderRadius: 50,
        backgroundColor: '#eee'
    },

    verse: {
        marginTop: 10,
        textAlign: 'center'
    },

    row: {
        flexDirection: 'row',
        justifyContent: "space-evenly",
        width: '100%'
    },

    button: {
        marginBottom: 100,
        width: 100,
        height: 50,
        borderRadius: 50,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.primaryColorBackground.backgroundColor
    },
})
