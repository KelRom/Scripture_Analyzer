import { StyleSheet, TextInput, TouchableOpacity, Text, View } from 'react-native'
import { useRouter } from "expo-router"
import { Colors } from "../constants/colors"
import { useState } from 'react'


const Home = () => {
    const router = useRouter()
    const [userInput, setUserInput] = useState("")

    function onGenerate() {
        if (!userInput.trim()) return
        router.navigate({
            pathname: "/promptViewer",
            params: { verseToGenerate: userInput }
        })
    }
    return (
        <View style={styles.screen}>
            <TextInput
                value={userInput}
                onChangeText={setUserInput}
                style={styles.inputFormat}
                placeholder="John 3:16"
                placeholderTextColor="#0434EF"
            />

            <TouchableOpacity
                style={styles.button}
                onPress={onGenerate}
            >
                <Text style={styles.buttonText}>{"Generate \n   Image"}</Text>
            </TouchableOpacity>
        </View >
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
        fontSize: 20,
        backgroundColor: Colors.primaryColorBackground.backgroundColor,
        color: Colors.secondaryColorText.color
    },
    button: {
        marginBottom: 100,
        width: 244,
        height: 116,
        borderRadius: 50,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.primaryColorBackground.backgroundColor
    },
    buttonText: {
        fontSize: 20,
        color: Colors.secondaryColorText.color
    }
})