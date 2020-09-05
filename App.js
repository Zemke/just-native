import {StatusBar} from 'expo-status-bar';
import React, {useEffect} from 'react';
import {PermissionsAndroid, View} from 'react-native';
import WebView from "react-native-webview/lib/WebView";

export default function App() {

  const requestCameraPermission = async () =>
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA);

  useEffect(() => {
    requestCameraPermission();
  });

  const jsCode = `
    document.body.classList.add('native');
    const style = document.createElement('style');
    style.textContent = 'body.native .chat > .head { padding-top: 2.5rem; }';
    document.head.append(style);
`;

  const onLoad = () => console.log('onload')

  return (
    <View style={{height: "100%", width: "100%"}}>
      <WebView source={{uri: 'https://just.zemke.io'}}
               mediaPlaybackRequiresUserAction={false}
               originWhitelist={['*']}
               allowsInlineMediaPlayback
               javaScriptEnabledAndroid={true}
               onLoad={onLoad}
               injectedJavaScript={jsCode}
      />
      <StatusBar style={{color: 'black'}} translucent={true}/>
    </View>
  );
}
