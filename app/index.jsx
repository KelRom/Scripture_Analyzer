// app/index.jsx
import { StyleSheet, TextInput, TouchableOpacity, Text, View, ScrollView, Pressable, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useHeaderHeight } from '@react-navigation/elements'
import { Colors } from '../constants/colors'
import { useState } from 'react'
import useClickSound from '../hooks/useClickSound'

const STYLES = ['Painterly', 'Minimalist', 'Watercolor', 'Realistic', 'Iconography']

export default function Home() {
    const router = useRouter()
    const headerHeight = useHeaderHeight()          // 👈 get actual header (hamburger) height
    const [userInput, setUserInput] = useState('')
    const [selectedStyle, setSelectedStyle] = useState(STYLES[0])
    const click = useClickSound()

    function onGenerate() {
        if (!userInput.trim()) return Alert.alert('Verse needed', 'Type a verse (e.g., John 3:16) first.')
        click()
        router.navigate({ pathname: '/promptViewer', params: { verseToGenerate: userInput, style: selectedStyle } })
    }

    return (
        <View style={[styles.screen, { paddingTop: headerHeight + 10 }]}>
            {/* ^ push content just below the hamburger/header */}

            <TextInput
                value={userInput}
                onChangeText={setUserInput}
                style={styles.inputFormat}
                placeholder="John 3:16"
                placeholderTextColor="#0434EF"
            />

            <View style={styles.centerBlock}>
                <Text style={styles.stylesHeader}>STYLES</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stylesRow}>
                    {STYLES.map((label, i) => {
                        const selected = selectedStyle === label
                        return (
                            <Pressable
                                key={label}
                                onPress={() => { click(); setSelectedStyle(label) }}
                                style={[styles.styleCard, selected && styles.styleCardSelected, i === STYLES.length - 1 && { marginRight: 0 }]}
                            >
                                <Text style={[styles.styleText, selected && styles.styleTextSelected]}>{label}</Text>
                                {selected && <Text style={styles.styleSelectedBadge}>Selected</Text>}
                            </Pressable>
                        )
                    })}
                </ScrollView>
            </View>

            <TouchableOpacity style={styles.button} onPress={onGenerate}>
                <Text style={styles.buttonText}>{'Generate \n   Image'}</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 36, // keep the lower spacing we set earlier
    },
    inputFormat: {
        borderRadius: 50, borderWidth: 1, width: 350, height: 58, fontSize: 20, paddingHorizontal: 16,
        backgroundColor: Colors.primaryColorBackground.backgroundColor, color: Colors.secondaryColorText.color
    },
    centerBlock: { width: '100%', alignItems: 'center' },
    stylesHeader: { marginTop: 6, marginBottom: 8, textAlign: 'center', fontSize: 20, color: Colors.primaryColorText.color },
    stylesRow: { paddingRight: 16, paddingLeft: 24, alignItems: 'center' },
    styleCard: {
        width: 140, height: 100, borderRadius: 20, borderWidth: 1, borderColor: '#666',
        backgroundColor: Colors.primaryColorBackground.backgroundColor, alignItems: 'center', justifyContent: 'center', marginRight: 12
    },
    styleCardSelected: { borderColor: Colors.primaryColorText.color, borderWidth: 2, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
    styleText: { fontSize: 16, color: Colors.secondaryColorText.color },
    styleTextSelected: { color: Colors.primaryColorText.color },
    styleSelectedBadge: { marginTop: 6, fontSize: 11, opacity: 0.8, color: Colors.primaryColorText.color },
    button: {
        marginBottom: 36, width: 244, height: 116, borderRadius: 50, justifyContent: 'center', alignItems: 'center',
        backgroundColor: Colors.primaryColorBackground.backgroundColor
    },
    buttonText: { fontSize: 20, color: Colors.secondaryColorText.color },
})
