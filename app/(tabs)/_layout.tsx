import { Tabs } from 'expo-router';
import {User, House} from "lucide-react-native"
import { TouchableOpacity, View, Text  } from 'react-native';


export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
      headerShown: false,
      tabBarStyle: {
        display: "none"
      }
      }} tabBar={({state, descriptors, navigation}) => {
        return (
          <View className='flex-row justify-between gap-5 bg-white border-t px-4 border-gray-200'>
            {
              state.routes.map((route, index) => {
                const {options} = descriptors[route.key]
                const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name
                const isFocused = state.index === index
                const Icon = options.tabBarIcon ? options.tabBarIcon({
                  focused: isFocused,
                  color: isFocused ? "#2563eb" : "#6d7280", size: 24
                }) : null

                return (
                  <TouchableOpacity key={route.key} className={` flex items-center justify-center py-3 `} onPress={() => {
                    const event = navigation.emit({
                      type: "tabPress",
                      target: route.key,
                      canPreventDefault: true,
                    });
                    if (!isFocused && !event.defaultPrevented) {
                      navigation.navigate(route.name)
                    }
                  }}>
                    {Icon}
                    <Text className={`${isFocused ? "font-bold" : ""}`}>{label}</Text>
                  </TouchableOpacity>
                )
              })
            }
          </View>
        )
      }}>
      <Tabs.Screen
        name="login"
        options={{
          title: 'Login',
          tabBarIcon: () => <User size={24}/>,
        }}
      />
       <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: () => <House  size={24} />,
        }}
      />
    </Tabs>
  );
}
