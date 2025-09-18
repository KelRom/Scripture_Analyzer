// app/promptViewer.jsx
import { StyleSheet, Text, View, TouchableOpacity, Switch } from 'react-native'
import { useLocalSearchParams, useRouter } from "expo-router"
import { Colors } from "../constants/colors"
import { useMemo, useState } from 'react'

export default function PromptViewer() {
    const router = useRouter()
    const { verseToGenerate = "", style = "" } = useLocalSearchParams()

    const hasStyle = !!String(style).trim()
    const [smartPrompt, setSmartPrompt] = useState(true) // Smart Prompt toggle

    const prompt = useMemo(() => {
        const stylePart = hasStyle ? `${style} ` : ""
        if (!verseToGenerate.trim()) return ""
        if (!smartPrompt) {
            // Simple prompt (short)
            return `Create a 1024x1024 ${stylePart}illustration inspired by the Bible verse "${verseToGenerate}".`
        }
        // Smart prompt (richer guidance)
        return (
            `Create a 1024x1024 ${stylePart}illustration inspired by the Bible verse "${verseToGenerate}". ` +
            `Focus on reverent, clear subject silhouettes; pleasing composition with depth. ` +
            `Natural, soft lighting; gentle color palette; subtle texture; no text, no watermarks. ` +
            `High detail, clean edges, coherent anatomy and perspective. Keep it biblically accurate.` +
            `Make it so that it can really drive the verse home, making it impactful.`
        )
    }, [style, hasStyle, smartPrompt, verseToGenerate])

    function onGenerate() {
        if (!verseToGenerate.trim()) return
        router.navigate({
            pathname: "/loadingScreen",
            params: { prompt, ref: verseToGenerate }
        })
    }

    return (
        <View style={styles.screen}>
            <Text style={styles.title}>Preview</Text>

            {/* Light prompt preview box (same color/opacity feel as before) */}
            <View style={styles.previewBox}>
                <Text style={styles.previewLabel}>Final Prompt</Text>
                <Text style={styles.promptText}>
                    {prompt || "No verse provided"}
                </Text>

                {/* Optional: show chosen style as a pill (always in use if provided) */}
                {hasStyle && (
                    <View style={styles.stylePill}>
                        <Text style={styles.stylePillText}>{String(style)}</Text>
                    </View>
                )}
            </View>

            {/* Smart Prompt toggle */}
            <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Smart Prompt</Text>
                <Switch
                    value={smartPrompt}
                    onValueChange={setSmartPrompt}
                    trackColor={{ false: '#555', true: Colors.primaryColorText.color }}
                    thumbColor={smartPrompt ? '#fff' : '#ccc'}
                />
            </View>

            {/* Generate */}
            <TouchableOpacity style={styles.button} onPress={onGenerate}>
                <Text style={styles.buttonText}>{"Generate \n   Image"}</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 60
    },
    title: {
        fontSize: 50,
        color: Colors.primaryColorText.color
    },

    // Light preview box like your original
    previewBox: {
        backgroundColor: '#D9D9D9',   // original light box color
        width: 309,
        minHeight: 204,
        borderRadius: 30,
        padding: 16,
        justifyContent: "center"
    },
    previewLabel: {
        fontSize: 12,
        color: '#333',
        marginBottom: 6
    },
    promptText: {
        fontSize: 14,
        color: '#000'                  // dark text for readability on light box
    },

    // Style pill (always used if provided)
    stylePill: {
        alignSelf: 'flex-start',
        marginTop: 10,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: Colors.primaryColorText.color,
        backgroundColor: 'transparent'
    },
    stylePillText: {
        color: Colors.primaryColorText.color,
        fontSize: 12
    },

    // Toggle row
    toggleRow: {
        width: '85%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    toggleLabel: {
        fontSize: 16,
        color: Colors.primaryColorText.color
    },

    // Bottom button
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
