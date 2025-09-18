// app/history.jsx
import { useEffect, useState, useCallback } from "react"
import { View, Text, StyleSheet, FlatList, Image, Pressable } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Colors } from "../constants/colors"
import { useRouter } from "expo-router"
import { useFocusEffect } from "@react-navigation/native"

const HISTORY_KEY = "sa_history"

export default function HistoryScreen() {
    const [items, setItems] = useState([])
    const router = useRouter()

    const load = useCallback(async () => {
        try {
            const hRaw = await AsyncStorage.getItem(HISTORY_KEY)
            const arr = Array.isArray(JSON.parse(hRaw || "[]")) ? JSON.parse(hRaw || "[]") : []
            setItems(arr.slice(0, 10))
        } catch { setItems([]) }
    }, [])

    useFocusEffect(useCallback(() => { load() }, [load]))

    function openItem(item) {
        router.navigate({ pathname: "/results", params: { img: item.uri, ref: item.ref || "", prompt: item.prompt || "" } })
    }

    return (
        <View style={styles.screen}>
            <Text style={styles.title}>History</Text>
            <FlatList
                contentContainerStyle={styles.grid}
                data={items}
                keyExtractor={(it) => String(it.ts)}
                numColumns={2}
                renderItem={({ item }) => (
                    <Pressable onPress={() => openItem(item)} style={styles.card}>
                        <Image source={{ uri: item.uri }} style={styles.img} />
                    </Pressable>
                )}
                ListEmptyComponent={<Text style={styles.muted}>No history yet</Text>}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, padding: 16 },
    title: { fontSize: 22, textAlign: 'center', color: Colors.primaryColorText.color, marginBottom: 12 },
    grid: { gap: 12 },
    card: { flex: 1, aspectRatio: 1, borderRadius: 16, overflow: 'hidden', margin: 6, borderWidth: 1, borderColor: '#777' },
    img: { width: '100%', height: '100%' },
    muted: { textAlign: 'center', color: Colors.secondaryColorText.color, opacity: 0.7, marginTop: 24 }
})
