import { Stack } from "expo-router"
import { useEffect, useState } from "react"
import * as Font from "expo-font"
import AppLoading from "expo-app-loading"
import "../global.css"

export default function RootLayout() {
    const [isLoggedIn] = useState(false)
    const [fontsLoaded, setFontsLoaded] = useState(false);
    useEffect(() => {
        async function loadFonts() {
            await Font.loadAsync({
                "Nunito": require("../assets/fonts/nunito/Nunito-VariableFont_wght.ttf"),
                "Nunito-Italic": require("../assets/fonts/nunito/Nunito-Italic-VariableFont_wght.ttf"),
            });
            setFontsLoaded(true);
        }
        loadFonts()
    }, [])

    if (!fontsLoaded) return <AppLoading/>;
  

    return (
        <Stack screenOptions={{headerShown: false}}>
            {
                isLoggedIn ? (<Stack.Screen name="(tabs)"/>) : (<Stack.Screen name="(auth)"/>)
            }
        </Stack>
    )
}