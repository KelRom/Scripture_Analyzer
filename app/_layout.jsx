import { Slot } from 'expo-router'
import { StyleSheet, Text, SafeAreaView } from 'react-native'
import { Colors } from "../constants/colors"
const RootLayout = () => {
    return (
        <SafeAreaView style={[Colors.container, styles.container]}>
            <Slot></Slot>
        </SafeAreaView>
    )
}

export default RootLayout

const styles = StyleSheet.create({
    container: {
        alignItems: 'center'
    }
})