import { StyleSheet, Text, SafeAreaView, Platform, StatusBar, TouchableOpacity } from 'react-native'
import { useRouter } from "expo-router"
import { Colors } from "../constants/colors"
import React from 'react'

const promptViewer = () => {
    return (
        <SafeAreaView>
            <Text style={[Colors.primaryColorText, styles.title,]}>Preview</Text>

            <TouchableOpacity style={[Colors.primaryColorBackground, styles.button]} onPress={() => useRouter().navigate("/loadingScreen")}>
                <Text style={[Colors.secondaryColorText, styles.buttonText]}>{"Generate \n   Image"}</Text>
            </TouchableOpacity>

        </SafeAreaView>
    )
}

export default promptViewer

const styles = StyleSheet.create(
    {
        title: {
            top: Platform.OS === "android" ? StatusBar.currentHeight + 36 : 36, // Safe area view is only for IOS so this is checking is os is android, get height and 30 for correct location. else just place it 30 from the top
            fontSize: 50,
            justifyItems: 'center'
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

