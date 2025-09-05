import Constants from "expo-constants";

const getEnvValue = (key:string, defaultValue = "") => {
    return process.env[key] || Constants.expoConfig?.extra?.[key] || defaultValue
} 

const getBoolValue = (key:string, defaultValue = "") => {
    const value = getEnvValue(key, defaultValue);
    return value === "true" || value === "1";
}

export const config = {
    api: {
        baseUrl: getEnvValue('EXPO_PUBLIC_API_BASE_URL', "http://127.0.0.1:8000")
    }
}