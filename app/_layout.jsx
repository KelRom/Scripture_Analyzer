// app/_layout.jsx
import { Drawer } from 'expo-router/drawer'
import { ThemeProvider, DarkTheme } from '@react-navigation/native'
import { Pressable, Text } from 'react-native'
import { Colors } from '../constants/colors'

const AppTheme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        background: Colors.container.backgroundColor,
        card: Colors.primaryColorBackground.backgroundColor,
        text: Colors.secondaryColorText.color,
        border: Colors.border?.color || '#3B424C',
        primary: Colors.primaryColorText.color,
    },
}

export default function RootLayout() {
    return (
        <ThemeProvider value={AppTheme}>
            <Drawer
                screenOptions={({ navigation }) => ({
                    headerShown: true,
                    headerTitle: '',
                    headerTransparent: true,
                    headerShadowVisible: false,
                    headerTintColor: Colors.primaryColorText.color,
                    headerLeftContainerStyle: { paddingLeft: 8 },

                    // ↓ tiny nudge down
                    headerLeft: () => (
                        <Pressable
                            onPress={() => navigation.openDrawer()}
                            hitSlop={12}
                            style={{ padding: 8, marginTop: 8 }}
                        >
                            <Text style={{ fontSize: 24, color: Colors.primaryColorText.color }}>☰</Text>
                        </Pressable>
                    ),

                    sceneContainerStyle: { backgroundColor: 'transparent' },
                    overlayColor: 'rgba(0,0,0,0.45)',
                    drawerStyle: { width: 260, backgroundColor: Colors.container.backgroundColor },
                    drawerLabelStyle: { color: Colors.primaryColorText.color, fontSize: 16 },
                    drawerActiveBackgroundColor: `${Colors.primaryColorText.color}22`,
                    swipeEnabled: true,
                    swipeEdgeWidth: 120,
                    swipeMinDistance: 10,
                    drawerType: 'front',
                })}
            >
                <Drawer.Screen name="index" options={{ drawerLabel: 'New Image', title: '' }} />
                <Drawer.Screen name="history" options={{ drawerLabel: 'History', title: '' }} />
                <Drawer.Screen name="promptViewer" options={{ drawerItemStyle: { display: 'none' } }} />
                <Drawer.Screen name="results" options={{ drawerItemStyle: { display: 'none' } }} />
                {/* Loading: no header, no drawer */}
                <Drawer.Screen
                    name="loadingScreen"
                    options={{ drawerItemStyle: { display: 'none' }, headerShown: false, swipeEnabled: false }}
                />
            </Drawer>
        </ThemeProvider>
    )
}
