import { StyleSheet, Text, SafeAreaView, Platform, StatusBar, } from 'react-native'
import { Colors } from "../constants/colors"
import React from 'react'

const promptViewer = () => {
    return (
        <SafeAreaView>
            <Text styles={Colors.primaryColorText}>Preview</Text>
        </SafeAreaView>
    )
}

export default promptViewer

const styles = StyleSheet.create(
    {
        title: {
            top: Platform.OS === "android" ? StatusBar.currentHeight + 76 : 76, // Safe area view is only for IOS so this is checking is os is android, get height and 30 for correct location. else just place it 30 from the top

        }
    })

