import { StyleSheet, Text, View, Image, Pressable, TextInput } from 'react-native'
import { Link } from 'expo-router'

const Home = () => {
    return (
        <View style={styles.container}>
            <Image style={styles.img} source={require("../assets/favicon.png")}></Image>
            <Text style={styles.title}>The Number 1</Text>
            <Text style={{ marginTop: 10, marginBottom: 30 }}>Reading List App</Text>
            <View style={styles.card}>
                <Text>Hello, This is a Card</Text>
            </View>
            <Link href="/about" style={styles.link}>About</Link>
            <Link href="/contact" style={styles.link}>Contact</Link>
            <Pressable backgroundColor={"#333"}>
                <Text>PRESS ME</Text>
            </Pressable>
            <TextInput placeholder='Enter Verse' style={backgroundColor = "#ddd"}></TextInput>
        </View>
    )
}
// expo router generates /about by itself because it can see the about.jsx
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
    },

    img: {
        marginVertical: 20
    },

    link: {
        margin: 10,
        borderBottomWidth: 1
    }
})