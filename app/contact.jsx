import { StyleSheet, Text, View } from 'react-native'
import { Link } from "expo-router"

const Contact = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Contact Page</Text>
            <Link href="/" style={styles.link}>Back Home</Link>
        </View>
    )
}
// index is the home page so we just use / to get back to the home page
export default Contact

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

    link: {
        margin: 10,
        borderBottomWidth: 1
    }
})