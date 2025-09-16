import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from "expo-router"
import { Colors } from "../constants/colors"

const promptViewer = () => {
    const router = useRouter()
    const { verseToGenerate = "" } = useLocalSearchParams()

    function onGenerate() {
        router.navigate({
            pathname: "/loadingScreen",
            params: { verseToGenerate: userInput }
        })
    }

    return (
        <View style={styles.screen}>
            <Text style={styles.title}>Preview</Text>
            <Text style={styles.promptpreview}></Text>
            <TouchableOpacity style={[Colors.primaryColorBackground, styles.button]} onPress={onGenerate}>
                <Text style={styles.buttonText}>{"Generate \n   Image"}</Text>
            </TouchableOpacity>

        </View>
    )
}

export default promptViewer

const styles = StyleSheet.create(
    {
        screen: {
            flex: 1,
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 60
        },

        title: {
            fontSize: 50,
            color: Colors.primaryColorText.color
        },

        promptpreview:
        {
            backgroundColor: "#D9D9D9",
            opacity: 23,
            width: 309,
            height: 204,
            borderRadius: 30
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

