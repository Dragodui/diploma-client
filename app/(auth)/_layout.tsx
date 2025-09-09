import { Stack } from "expo-router"
import { useState } from "react"

export default function RootLayout() {
    return (
        <Stack screenOptions={{headerShown: false}}>
           <Stack.Screen name="login" options={{title:"Login"}}/>
           <Stack.Screen name="register" options={{title:"Register"}}/>
        </Stack>
    )
}