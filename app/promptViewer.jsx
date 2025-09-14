import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import { useRouter } from "expo-router"
import { Colors } from "../constants/colors"

const promptViewer = () => {
    return (
        <View style={styles.screen}>
            <Text style={[Colors.primaryColorText, styles.title]}>Preview</Text>

            <TouchableOpacity style={[Colors.primaryColorBackground, styles.button]} onPress={() => useRouter().navigate("/loadingScreen")}>
                <Text style={[Colors.secondaryColorText, styles.buttonText]}>{"Generate \n   Image"}</Text>
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
        },

        button: {
            marginBottom: 100,
            width: 244,
            height: 116,
            borderRadius: 50,
            justifyContent: "center",
            alignItems: "center"
        },

        buttonText: {
            fontSize: 20,
        }
    })

