// app/index.jsx
import { StyleSheet, TextInput, TouchableOpacity, Text, View, ScrollView, Pressable, Alert } from 'react-native'
import { useRouter } from "expo-router"
import { Colors } from "../constants/colors"
import { useState } from 'react'

const STYLES = ["Painterly", "Minimalist", "Watercolor", "Realistic", "Iconography"]

const Home = () => {
    const router = useRouter()
    const [userInput, setUserInput] = useState("")
    const [selectedStyle, setSelectedStyle] = useState(STYLES[0])

    function onGenerate() {
        if (!userInput.trim()) return Alert.alert("Verse needed", "Type a verse (e.g., John 3:16) first.")
        // Pass style if you want to use it later in promptViewer:
        router.navigate({ pathname: "/promptViewer", params: { verseToGenerate: userInput, style: selectedStyle } })
    }

    return (
        <View style={styles.screen}>
            {/* Top: verse input */}
            <TextInput
                value={userInput}
                onChangeText={setUserInput}
                style={styles.inputFormat}
                placeholder="John 3:16"
                placeholderTextColor="#0434EF"
            />

            {/* Middle: centered STYLES header + carousel */}
            <View style={styles.centerBlock}>
                <Text style={styles.stylesHeader}>STYLES</Text>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.stylesRow}
                >
                    {STYLES.map((label, i) => (
                        <Pressable
                            key={label}
                            onPress={() => setSelectedStyle(label)}
                            style={[
                                styles.styleCard,
                                selectedStyle === label && styles.styleCardSelected,
                                i === STYLES.length - 1 && { marginRight: 0 }
                            ]}
                        >
                            <Text style={styles.styleText}>{label}</Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            {/* Bottom: generate button */}
            <TouchableOpacity style={styles.button} onPress={onGenerate}>
                <Text style={styles.buttonText}>{"Generate \n   Image"}</Text>
            </TouchableOpacity>
        </View>
    )
}

export default Home

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        justifyContent: 'space-between',     // keeps input at top, button at bottom
        alignItems: 'center',
        paddingVertical: 60                  // preserves your original top/bottom spacing
    },
    inputFormat: {
        borderRadius: 50,
        borderWidth: 1,
        width: 350,
        height: 58,
        fontSize: 20,
        paddingHorizontal: 16,
        backgroundColor: Colors.primaryColorBackground.backgroundColor,
        color: Colors.secondaryColorText.color
    },

    // —— center block ——
    centerBlock: {
        width: '100%',
        alignItems: 'center'
    },
    stylesHeader: {
        marginBottom: 8,
        textAlign: 'center',
        fontSize: 20,
        color: Colors.primaryColorText.color   // primary text color, centered
    },
    stylesRow: {
        paddingHorizontal: 16,
        alignItems: 'center'
    },
    styleCard: {
        width: 140,
        height: 100,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#888',
        backgroundColor: Colors.primaryColorBackground.backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12                         // simple spacing between cards
    },
    styleCardSelected: {
        borderColor: Colors.primaryColorText.color
    },
    styleText: {
        fontSize: 16,
        color: Colors.secondaryColorText.color
    },

    // —— bottom button ——
    button: {
        marginBottom: 100,
        width: 244,
        height: 116,
        borderRadius: 50,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.primaryColorBackground.backgroundColor
    },
    buttonText: {
        fontSize: 20,
        color: Colors.secondaryColorText.color
    }
})
