import { Stack } from 'expo-router';
import { StyleSheet, SafeAreaView } from 'react-native';
import { Colors } from '../constants/colors';

const RootLayout = () => {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: styles.container
            }}
        />
    );
};

export default RootLayout;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.container.backgroundColor
    }
});