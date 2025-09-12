import { Slot } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { Colors } from "../constants/colors"
const RootLayout = () => {
    return (
        <View style={Colors.container}>
            <Slot></Slot>
        </View>
    )
}

export default RootLayout