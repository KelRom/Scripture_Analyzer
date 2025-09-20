// app/_layout.jsx
import { Drawer } from 'expo-router/drawer'
import { ThemeProvider, DarkTheme } from '@react-navigation/native'
import { Colors } from '../constants/colors'

const AppTheme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        // Global backgrounds + accents
        background: Colors.container.backgroundColor,              // <- main screen background
        card: Colors.primaryColorBackground.backgroundColor,       // headers/cards/drawer surface
        text: Colors.secondaryColorText.color,
        border: Colors.border?.color || '#3B424C',
        primary: Colors.primaryColorText.color,
    },
}

export default function RootLayout() {
    return (
        <ThemeProvider value={AppTheme}>
            <Drawer
                screenOptions={{
                    headerShown: false,
                    // Let the theme background show through:
                    sceneContainerStyle: { backgroundColor: 'transparent' },

                    // Drawer panel styling
                    drawerStyle: {
                        width: 260,
                        backgroundColor: Colors.container.backgroundColor,
                    },
                    drawerLabelStyle: {
                        color: Colors.primaryColorText.color,
                        fontSize: 16,
                    },
                    // makes the swipe much easier to trigger
                    swipeEnabled: true,
                    swipeEdgeWidth: 120,   // default is small
                    swipeMinDistance: 10,  // start recognizing sooner
                    drawerType: 'front',   // best “feel” for edge pull
                }}
            >
                {/* Drawer items */}
                <Drawer.Screen name="index" options={{ drawerLabel: 'New Image', title: '' }} />
                <Drawer.Screen name="history" options={{ drawerLabel: 'History', title: '' }} />

                {/* Hidden but routable */}
                <Drawer.Screen name="promptViewer" options={{ drawerItemStyle: { display: 'none' } }} />
                <Drawer.Screen name="loadingScreen" options={{ drawerItemStyle: { display: 'none' } }} />
                <Drawer.Screen name="results" options={{ drawerItemStyle: { display: 'none' } }} />
            </Drawer>
        </ThemeProvider>
    )
}
