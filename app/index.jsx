import { StyleSheet, TextInput, TouchableOpacity, Text, View } from 'react-native'
import { useRouter } from "expo-router"
import { Colors } from "../constants/colors"

const Home = () => {
    const router = useRouter()

    return (
        <View style={styles.screen}>
            <TextInput
                style={[styles.inputFormat, Colors.primaryColorBackground, Colors.secondaryColorText]}
                placeholder="John 3:16"
                placeholderTextColor="#0434EF"
            />

            <TouchableOpacity
                style={[Colors.primaryColorBackground, styles.button]}
                onPress={() => router.navigate("/promptViewer")}
            >
                <Text style={[Colors.secondaryColorText, styles.buttonText]}>{"Generate \n   Image"}</Text>
            </TouchableOpacity>
        </View>
    )
}

export default Home

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 60
    },
    inputFormat: {
        borderRadius: 50,
        borderWidth: 1,
        width: 350,
        height: 58,
        fontSize: 20
    },
    button: {
        marginBottom: 100,
        width: 244,
        height: 116,
        borderRadius: 50,
        justifyContent: "center",
        alignItems: "center",
    },
    buttonText: {
        fontSize: 20
    }
})