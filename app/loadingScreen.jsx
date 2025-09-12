import { SafeAreaView, StyleSheet, Platform, StatusBar } from 'react-native'
import { Image } from "expo-image"


const loadingScreen = () => {
    return (
        <SafeAreaView style={{ justifyContent: 'center' }}>
            <Image style={styles.image} source={require("../assets/bible_flipping.gif")} />
        </SafeAreaView>
    )
}

export default loadingScreen

const styles = StyleSheet.create({
    image: {
        top: Platform.OS === "android" ? StatusBar.currentHeight + 201 : 201, // Safe area view is only for IOS so this is checking is os is android, get height and 30 for correct location. else just place it 30 from the top
        width: 256,
        height: 256,
    }
})