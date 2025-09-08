import { Slot, Stack } from 'expo-router'
import { StyleSheet, Text, useColorScheme, View } from 'react-native'

const _layout = () => {
    const colorScheme = useColorScheme()
    return (
        <View style={{ flex: 1 }}>
            <Stack />
            <Text>Footer</Text>
        </View>
    )
}

export default _layout

const styles = StyleSheet.create({})