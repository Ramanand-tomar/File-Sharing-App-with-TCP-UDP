import { View, Text, Platform } from 'react-native'
import React, { useEffect } from 'react'
import Navigation from './src/navigation/Navigation'
import { request } from 'react-native-permissions'
import { requestPhotoPermission } from './src/utils/Constants'
import { checkFilePermissions } from './src/utils/libraryHelpers'
import { SafeAreaProvider } from 'react-native-safe-area-context'

const App = () => {

  useEffect(() => {
    requestPhotoPermission();
    checkFilePermissions(Platform.OS);
  },[])

  return (
    <SafeAreaProvider>
      <Navigation/>
    </SafeAreaProvider>
  );
}

export default App