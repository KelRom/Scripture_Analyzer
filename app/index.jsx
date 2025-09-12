import { StyleSheet, TextInput, Platform, StatusBar, SafeAreaView } from 'react-native'
import { Colors } from "../constants/colors"
const Home = () => {
    return (

        <SafeAreaView>
            <TextInput style={[styles.inputFormat]} placeholder="John 3:16" >
            </TextInput>
        </SafeAreaView>
    )
}

export default Home

const styles = StyleSheet.create(
    {
        inputFormat: {
            top: Platform.OS === "android" ? StatusBar.currentHeight + 30 : 30, // Safe area view is only for IOS so this is checking is os is android, get height and 30 for correct location. else just place it 30 from the top

        }
    })