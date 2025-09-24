import { StyleSheet, Text, View, TouchableOpacity, Switch, ScrollView, Pressable } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors } from '../constants/colors'
import { useMemo, useState } from 'react'
import useClickSound from '../hooks/useClickSound'

const SIZES = ['512', '768', '1024']
const QUALITIES = ['fast', 'standard', 'high']

export default function PromptViewer() {
    const router = useRouter()
    const click = useClickSound()
    const { verseToGenerate = '', style = '' } = useLocalSearchParams()

    const hasStyle = !!String(style).trim()
    const [smartPrompt, setSmartPrompt] = useState(true)
    const [size, setSize] = useState('1024')
    const [quality, setQuality] = useState('standard')

    const prompt = useMemo(() => {
        const stylePart = hasStyle ? `${style} ` : ''
        if (!verseToGenerate.trim()) return ''
        if (!smartPrompt) return `Create a ${size}x${size} ${stylePart}illustration inspired by the Bible verse "${verseToGenerate}".`
        return (
            `Create a ${size}x${size} ${stylePart}illustration inspired by the Bible verse "${verseToGenerate}". ` +
            `Focus on reverent, clear subject silhouettes; pleasing composition with depth. ` +
            `Natural, soft lighting; gentle color palette; subtle texture; no text, no watermarks. ` +
            `High detail, clean edges, coherent anatomy and perspective. Keep it biblically accurate. ` +
            `Make it impactful and true to the scripture.`
        )
    }, [style, hasStyle, smartPrompt, verseToGenerate, size])

    function onGenerate() {
        if (!verseToGenerate.trim()) return
        click()
        router.navigate({ pathname: '/loadingScreen', params: { prompt, ref: verseToGenerate, size, quality } })
    }

    return (
        <View style={styles.screen}>
            <Text style={styles.title}>Preview</Text>

            {/* Scrollable prompt box for long text */}
            <View style={styles.previewBox}>
                <Text style={styles.previewLabel}>Final Prompt</Text>
                <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator>
                    <Text style={styles.promptText}>{prompt || 'No verse provided'}</Text>
                </ScrollView>

                {hasStyle && (
                    <View style={styles.stylePill}>
                        <Text style={styles.stylePillText}>{String(style)}</Text>
                    </View>
                )}
            </View>

            {/* Toggles / Options */}
            <View style={styles.optionsRow}>
                <Text style={styles.toggleLabel}>Smart Prompt</Text>
                <Switch
                    value={smartPrompt}
                    onValueChange={(v) => { click(); setSmartPrompt(v) }}
                    trackColor={{ false: '#555', true: Colors.primaryColorText.color }}
                    thumbColor={smartPrompt ? '#fff' : '#ccc'}
                />
            </View>

            <View style={styles.segmentRow}>
                <Text style={styles.segmentLabel}>Quality</Text>
                <View style={styles.segmentWrap}>
                    {QUALITIES.map(q => (
                        <Pressable key={q} onPress={() => { click(); setQuality(q) }} style={[styles.segment, quality === q && styles.segmentOn]}>
                            <Text style={[styles.segmentText, quality === q && styles.segmentTextOn]}>{q}</Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            <View style={styles.segmentRow}>
                <Text style={styles.segmentLabel}>Size</Text>
                <View style={styles.segmentWrap}>
                    {SIZES.map(s => (
                        <Pressable key={s} onPress={() => { click(); setSize(s) }} style={[styles.segment, size === s && styles.segmentOn]}>
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
    screen: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 60 },
    title: { fontSize: 50, color: Colors.primaryColorText.color, marginTop: 6 },
    previewBox: { backgroundColor: '#D9D9D9', width: 309, minHeight: 204, borderRadius: 30, padding: 16, justifyContent: 'center' },
    previewLabel: { fontSize: 12, color: '#333', marginBottom: 6 },
    promptText: { fontSize: 14, color: '#000', lineHeight: 20 },
    stylePill: {
        alignSelf: 'flex-start', marginTop: 10, paddingVertical: 6, paddingHorizontal: 12,
        borderRadius: 999, borderWidth: 1, borderColor: Colors.primaryColorText.color, backgroundColor: 'transparent'
    },
    stylePillText: { color: Colors.primaryColorText.color, fontSize: 12 },

    optionsRow: { width: '85%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    toggleLabel: { fontSize: 16, color: Colors.primaryColorText.color },

    segmentRow: { width: '85%', marginTop: 12 },
    segmentLabel: { color: Colors.primaryColorText.color, marginBottom: 6 },
    segmentWrap: { flexDirection: 'row', gap: 8 },
    segment: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: '#666' },
    segmentOn: { backgroundColor: `${Colors.primaryColorText.color}22`, borderColor: Colors.primaryColorText.color },
    segmentText: { color: Colors.primaryColorText.color },
    segmentTextOn: { color: Colors.primaryColorText.color },

    button: {
        marginBottom: 36, width: 244, height: 116, borderRadius: 50, justifyContent: 'center', alignItems: 'center',
        backgroundColor: Colors.primaryColorBackground.backgroundColor
    },
    buttonText: { fontSize: 20, color: Colors.secondaryColorText.color }
})
