import { StyleSheet, Text, View, Image } from 'react-native'
import React from 'react'

const Home = () => {
    return (
        <View style={styles.container}>
            <Image source={require("../assets/favicon.png")}></Image>
            <Text style={styles.title}>The Number 1</Text>
            <Text style={{ marginTop: 10, marginBottom: 30 }}>Reading List App</Text>
            <View style={styles.card}>
                <Text>Hello, This is a Card</Text>
            </View>
        </View>
    )
}

export default Home

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },

    title: {
        fontWeight: 'bold',
        fontSize: 18
    },

    card: {
        backgroundColor: "#eee",
        padding: 20,
        borderRadius: 5,
        boxShadow: "4px 4px rgba(0,0,0,0.1)"
    }
})