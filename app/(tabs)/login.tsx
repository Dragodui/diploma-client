import { Stack } from 'expo-router';

import { StyleSheet, View } from 'react-native';

import { ScreenContent } from '~/components/ScreenContent';

export default function Login() {
  return (
    <>
      <Stack.Screen />
      <View style={styles.container}>
        
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
});
