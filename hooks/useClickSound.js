// hooks/useClickSound.js
import { useEffect, useRef, useCallback } from 'react'
import { Platform } from 'react-native'
import * as Haptics from 'expo-haptics'
import { Audio } from 'expo-av'

export default function useClickSound() {
    const soundRef = useRef(null)

    useEffect(() => {
        let mounted = true
            ; (async () => {
                try {
                    const { sound } = await Audio.Sound.createAsync(
                        require('../assets/tap.mp3'),
                        { volume: 0.3, shouldPlay: false }
                    )
                    if (mounted) soundRef.current = sound
                } catch {
                    // no sound asset? we’ll just use haptics
                }
            })()
        return () => { mounted = false; soundRef.current?.unloadAsync() }
    }, [])

    return useCallback(() => {
        // try sound
        if (soundRef.current) {
            soundRef.current.replayAsync().catch(() => { })
        } else {
            // fallback haptic
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { })
        }
    }, [])
}
