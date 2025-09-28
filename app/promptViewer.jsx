import { StyleSheet, Text, View, TouchableOpacity, Switch, ScrollView, Pressable, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useHeaderHeight } from '@react-navigation/elements'
import { Colors } from '../constants/colors'
import { useMemo, useState } from 'react'

export default function PromptViewer() {
    const router = useRouter()
    const headerHeight = useHeaderHeight()
    const { verseToGenerate = '', style: styleParam = '' } = useLocalSearchParams()
    const styleName = String(styleParam || '')
    const hasStyle = !!styleName.trim()

    const [smartPrompt, setSmartPrompt] = useState(true)
    const [size, setSize] = useState('1024')
    const [quality, setQuality] = useState('standard')

    const prompt = useMemo(() => {
        const stylePart = hasStyle ? `${styleName} ` : ''
        if (!verseToGenerate.trim()) return ''
        if (!smartPrompt) return `Create a ${size}x${size} ${stylePart}illustration inspired by the Bible verse "${verseToGenerate}".`
        return (
            `Create a ${size}x${size} ${stylePart}illustration inspired by the Bible verse "${verseToGenerate}". ` +
            `Focus on reverent, clear subject silhouettes; pleasing composition with depth. ` +
            `Natural, soft lighting; gentle color palette; subtle texture; no text, no watermarks. ` +
            `High detail, clean edges, coherent anatomy and perspective. Keep it biblically accurate. ` +
            `Make it impactful and true to the scripture.`
        )
    }, [styleName, hasStyle, smartPrompt, verseToGenerate, size])

    function onGenerate() {
        if (!verseToGenerate.trim()) return Alert.alert('Verse needed', 'Go back and enter a verse first.')
        const diversity = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        router.navigate({
            pathname: '/loadingScreen',
            params: { prompt, ref: verseToGenerate, size, quality, diversity }
        })
    }

    return (
        <View style={[styles.screen, { paddingTop: headerHeight + 10 }]}>
            <Text style={styles.title}>Preview</Text>

            <View style={styles.previewBox}>
                <Text style={styles.previewLabel}>Final Prompt</Text>
                <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator>
                    <Text style={styles.promptText}>{prompt || 'No verse provided'}</Text>
                </ScrollView>
                {hasStyle && (
                    <View style={styles.stylePill}>
                        <Text style={styles.stylePillText}>{styleName}</Text>
                    </View>
                )}
            </View>

            <View style={styles.optionsRow}>
                <Text style={styles.toggleLabel}>Smart Prompt</Text>
                <Switch
                    value={smartPrompt}
                    onValueChange={setSmartPrompt}
                    trackColor={{ false: '#B0B7C3', true: '#9BB6FF' }}
                    thumbColor="#fff"
                />
            </View>

            <View style={styles.segmentRow}>
                <Text style={styles.segmentLabel}>Quality</Text>
                <View style={styles.segmentWrap}>
                    {['fast', 'standard', 'high'].map(q => (
                        <Pressable key={q} onPress={() => setQuality(q)} style={[styles.segment, quality === q && styles.segmentOn]}>
                            <Text style={[styles.segmentText, quality === q && styles.segmentTextOn]}>{q}</Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            <View style={styles.segmentRow}>
                <Text style={styles.segmentLabel}>Size</Text>
                <View style={styles.segmentWrap}>
                    {['512', '768', '1024'].map(s => (
                        <Pressable key={s} onPress={() => setSize(s)} style={[styles.segment, size === s && styles.segmentOn]}>
                            <Text style={[styles.segmentText, size === s && styles.segmentTextOn]}>{s}</Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={onGenerate}>
                <Text style={styles.buttonText}>{'Generate \n   Image'}</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingBottom: 36 },
    title: { fontSize: 50, color: Colors.primaryColorText.color, marginTop: 6 },

    // translucent surface, text stays dark
    previewBox: {
        backgroundColor: `${Colors.secondaryColorText.color}CC`,
        width: 309, minHeight: 204, borderRadius: 30, padding: 16, justifyContent: 'center',
        borderWidth: 1, borderColor: (Colors.border?.color ?? '#5A6472')
    },
    previewLabel: { fontSize: 20, color: Colors.primaryColorText.color, marginBottom: 6 },
    promptText: { fontSize: 14, color: Colors.primaryColorText.color, lineHeight: 22 },

    stylePill: {
        alignSelf: 'flex-start', marginTop: 10, paddingVertical: 6, paddingHorizontal: 12,
        borderRadius: 999, borderWidth: 1, borderColor: Colors.primaryColorText.color,
        backgroundColor: `${Colors.primaryColorText.color}22`
    },
    stylePillText: { color: Colors.primaryColorText.color, fontSize: 12 },

    optionsRow: { width: '85%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    toggleLabel: { fontSize: 16, color: Colors.secondaryColorText.color },

    segmentRow: { width: '85%', marginTop: 12 },
    segmentLabel: { color: Colors.secondaryColorText.color, marginBottom: 6 },
    segmentWrap: { flexDirection: 'row', gap: 8 },
    segment: {
        paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1,
        borderColor: (Colors.border?.color ?? '#5A6472'),
        backgroundColor: Colors.primaryColorBackground.backgroundColor
    },
    segmentOn: {
        backgroundColor: `${Colors.primaryColorText.color}22`,
        borderColor: Colors.primaryColorText.color
    },
    segmentText: { color: Colors.secondaryColorText.color },
    segmentTextOn: { color: Colors.primaryColorText.color, fontWeight: '600' },

    button: {
        marginBottom: 36, width: 244, height: 116, borderRadius: 50, justifyContent: 'center', alignItems: 'center',
        backgroundColor: Colors.primaryColorBackground.backgroundColor, borderWidth: 1, borderColor: (Colors.border?.color ?? '#5A6472')
    },
    buttonText: { fontSize: 20, color: Colors.secondaryColorText.color, fontWeight: '600' }
})
