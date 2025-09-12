import { StyleSheet, TextInput, Platform, StatusBar, SafeAreaView, TouchableOpacity, Text } from 'react-native'
import { useRouter } from "expo-router"
import { Colors } from "../constants/colors"
const Home = () => {
    return (

        <SafeAreaView>
            <TextInput style={[styles.inputFormat, Colors.primaryColorBackground, Colors.secondaryColorText]}
                placeholder="John 3:16" placeholderTextColor="#0434EF">
            </TextInput>
            <TouchableOpacity style={[Colors.primaryColorBackground, styles.button]} onPress={() => useRouter().navigate("/promptViewer")}>
                <Text style={[Colors.secondaryColorText, styles.buttonText]}>{"Generate \n   Image"}</Text>
            </TouchableOpacity>
        </SafeAreaView >
    )
}

export default Home

const styles = StyleSheet.create(
    {
        inputFormat: {
            top: Platform.OS === "android" ? StatusBar.currentHeight + 76 : 76, // Safe area view is only for IOS so this is checking is os is android, get height and 30 for correct location. else just place it 30 from the top
            borderRadius: 50,
            borderWidth: 1,
            width: 350,
            height: 58,
            fontSize: 20,

        },

        button: {
            top: Platform.OS === "android" ? StatusBar.currentHeight + 544 : 544,
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