// app/history.jsx
import { useCallback, useMemo, useState } from 'react'
import { View, Text, StyleSheet, FlatList, Image, Pressable, Alert, Dimensions, TouchableOpacity } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Colors } from '../constants/colors'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useHeaderHeight } from '@react-navigation/elements'

const HISTORY_KEY = 'sa_history'
const TOP_OFFSET = -6 // pull up to match Preview title

export default function HistoryScreen() {
    const [items, setItems] = useState([])
    const router = useRouter()
    const headerHeight = useHeaderHeight()

    const tileSize = useMemo(() => {
        const w = Dimensions.get('window').width
        return Math.min(309, Math.round(w - 32)) // match Preview box width
    }, [])

    const load = useCallback(async () => {
        try {
            const hRaw = await AsyncStorage.getItem(HISTORY_KEY)
            const arr = Array.isArray(JSON.parse(hRaw || '[]')) ? JSON.parse(hRaw || '[]') : []
            setItems(arr.slice(0, 10))
        } catch { setItems([]) }
    }, [])

    useFocusEffect(useCallback(() => { load() }, [load]))

    function openItem(item) {
        router.navigate({ pathname: '/results', params: { img: item.uri, ref: item.ref || '', prompt: item.prompt || '' } })
    }

    async function deleteItem(ts) {
        Alert.alert('Delete this?', 'This removes the image from History (not from your Photos).', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    const hRaw = await AsyncStorage.getItem(HISTORY_KEY)
                    const arr = Array.isArray(JSON.parse(hRaw || '[]')) ? JSON.parse(hRaw || '[]') : []
                    const next = arr.filter(x => x.ts !== ts).slice(0, 10)
                    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next))
                    setItems(next)
                }
            }
        ])
    }

    async function clearAll() {
        Alert.alert('Clear all history?', 'This only clears in-app History.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Clear All', style: 'destructive', onPress: async () => {
                    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify([]))
                    setItems([])
                }
            }
        ])
    }

    const renderItem = ({ item }) => (
        <Pressable
            onPress={() => openItem(item)}
            onLongPress={() => deleteItem(item.ts)}
            style={[styles.card, { width: tileSize, height: tileSize }]}
        >
            <Image source={{ uri: item.uri }} style={styles.img} />
            <View style={styles.badge}><Text style={styles.badgeTxt}>Hold to delete</Text></View>
        </Pressable>
    )

    return (
        <SafeAreaView
            style={[styles.screen, { paddingTop: Math.max(0, headerHeight + TOP_OFFSET) }]}
            edges={['bottom']} // avoid double top inset
        >
            <View style={styles.headerRow}>
                <Text style={styles.title}>History</Text>
                {items.length > 0 && (
                    <Pressable onPress={clearAll} style={styles.clearBtn}>
                        <Text style={styles.clearTxt}>Clear</Text>
                    </Pressable>
                )}
            </View>

            <FlatList
                data={items}
                keyExtractor={(it) => String(it.ts)}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
                numColumns={1}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.muted}>No history yet</Text>
                        <TouchableOpacity onPress={() => router.navigate('/')} style={styles.emptyBtn}>
                            <Text style={styles.emptyBtnText}>Create your first image</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    headerRow: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        marginBottom: 4
    },
    title: {
        textAlign: 'center',
        fontSize: 50,
        color: Colors.primaryColorText.color,
        marginTop: 0
    },
    clearBtn: {
        position: 'absolute',
        right: 16,
        top: 0,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: `${Colors.primaryColorText.color}22`
    },
    clearTxt: { color: Colors.primaryColorText.color },

    list: {
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingBottom: 16,
        gap: 12
    },

    card: {
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: (Colors.border && Colors.border.color) || '#3B424C',
        backgroundColor: Colors.primaryColorBackground.backgroundColor,
    },
    img: { width: '100%', height: '100%' },

    badge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: '#0007',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10
    },
    badgeTxt: { color: '#fff', fontSize: 11 },

    empty: { alignItems: 'center', marginTop: 24 },
    muted: { textAlign: 'center', color: Colors.primaryColorText.color, opacity: 0.7, marginBottom: 12 },
    emptyBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: Colors.primaryColorText.color
    },
    emptyBtnText: { color: Colors.primaryColorText.color }
})
