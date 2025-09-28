import { StyleSheet, TextInput, TouchableOpacity, Text, View, ScrollView, Pressable, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useHeaderHeight } from '@react-navigation/elements'
import { Colors } from '../constants/colors'
import { useState, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const STYLES = ['Painterly', 'Minimalist', 'Watercolor', 'Realistic', 'Iconography']
const LAST_STYLE_KEY = 'sa_last_style'

export default function Home() {
    const router = useRouter()
    const headerHeight = useHeaderHeight()
    const [userInput, setUserInput] = useState('')
    const [selectedStyle, setSelectedStyle] = useState(STYLES[0])

    useFocusEffect(useCallback(() => {
        let mounted = true
        AsyncStorage.getItem(LAST_STYLE_KEY).then(v => {
            if (mounted && v && STYLES.includes(v)) setSelectedStyle(v)
        })
        return () => { mounted = false }
    }, []))

    const pickStyle = (label) => {
        setSelectedStyle(label)
        AsyncStorage.setItem(LAST_STYLE_KEY, label).catch(() => { })
    }

    function onGenerate() {
        if (!userInput.trim()) return Alert.alert('Verse needed', 'Type a verse (e.g., John 3:16) first.')
        router.navigate({ pathname: '/promptViewer', params: { verseToGenerate: userInput, style: selectedStyle } })
    }

    return (
        <View style={[styles.screen, { paddingTop: headerHeight + 10 }]}>
            <TextInput
                value={userInput}
                onChangeText={setUserInput}
                style={styles.inputFormat}
                placeholder="John 3:16"
                placeholderTextColor="#7A5C58"
            />

            <View style={styles.centerBlock}>
                <Text style={styles.stylesHeader}>STYLES</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stylesRow}>
                    {STYLES.map((label, i) => {
                        const selected = selectedStyle === label
                        return (
                            <Pressable
                                key={label}
                                onPress={() => pickStyle(label)}
                                android_ripple={{ color: `${Colors.primaryColorText.color}22`, borderless: false }}
                                style={[
                                    styles.styleCard,
                                    selected && styles.styleCardSelected,
                                    i === STYLES.length - 1 && { marginRight: 0 }
                                ]}
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
    screen: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingBottom: 36 },
    inputFormat: {
        borderRadius: 50, borderWidth: 1, width: 350, height: 58, fontSize: 20, paddingHorizontal: 16,
        backgroundColor: Colors.primaryColorBackground.backgroundColor,
        color: Colors.secondaryColorText.color,
        borderColor: (Colors.border?.color ?? '#5A6472'),
    },
    centerBlock: { width: '100%', alignItems: 'center' },
    stylesHeader: { marginTop: 6, marginBottom: 8, textAlign: 'center', fontSize: 20, color: Colors.secondaryColorText.color },
    stylesRow: { paddingRight: 16, paddingLeft: 24, alignItems: 'center' },

    styleCard: {
        width: 140, height: 100, borderRadius: 20, borderWidth: 1,
        borderColor: (Colors.border?.color ?? '#5A6472'),
        backgroundColor: Colors.primaryColorBackground.backgroundColor,
        alignItems: 'center', justifyContent: 'center', marginRight: 12
    },
    styleCardSelected: {
        borderColor: Colors.primaryColorText.color, borderWidth: 2,
        backgroundColor: `${Colors.primaryColorText.color}22`,
        shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 3
    },
    styleText: { fontSize: 16, color: Colors.secondaryColorText.color },
    styleTextSelected: { color: Colors.primaryColorText.color, fontWeight: '600' },
    styleSelectedBadge: { marginTop: 6, fontSize: 11, opacity: 0.9, color: Colors.primaryColorText.color },

    button: {
        marginBottom: 36, width: 244, height: 116, borderRadius: 50, justifyContent: 'center', alignItems: 'center',
        backgroundColor: Colors.primaryColorBackground.backgroundColor, borderWidth: 1, borderColor: (Colors.border?.color ?? '#5A6472')
    },
    buttonText: { fontSize: 20, color: Colors.secondaryColorText.color, fontWeight: '600' },
})
