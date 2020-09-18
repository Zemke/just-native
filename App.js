import {StatusBar} from 'expo-status-bar';
import React, {useEffect, useRef} from 'react';
import {PermissionsAndroid, View} from 'react-native';
import WebView from "react-native-webview/lib/WebView";
import messaging from '@react-native-firebase/messaging';
import firebase from '@react-native-firebase/app';
import functions from '@react-native-firebase/functions';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export default function App() {

  const user = useRef(null);
  const webViewRef = useRef(null);

  const requestPermissions = async () => {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
    const messagingPermission = await messaging().requestPermission();
    console.info('messaging permission:', messagingPermission);
  };

  useEffect(() => {
    requestPermissions();
  });

  useEffect(() => {
    return messaging().onMessage(remoteMessage => console.log('FCM received', remoteMessage));
  });

  const jsCode = `
    (() => { // CSS amendments
      document.body.classList.add('native');
      const style = document.createElement('style');
      style.textContent = 'body.native .chat > .head { padding-top: 2.5rem; } ';
      style.textContent += 'body.native .dropdown.attachTopLeft,  body.native .dropdown.attachTopRight { top: 5.8rem; }';
      document.head.append(style);
    })();

    (() => { // Getting the auth user
      const currentUser = window.localStorage.getItem('currentUser');
      if (currentUser != null) {
        window.ReactNativeWebView.postMessage(JSON.stringify({currentUser: JSON.parse(currentUser)}));
      }
    })();
`;

  const authenticate = async userUid => {
    const res = await functions().httpsCallable('createCustomToken')({userUid})
    console.log('createCustomToken res', res);
    return res.data['customToken'];
  };

  const saveToken = async (token, userUid) => {
    console.log('save token', token);
    console.log('for user', userUid);
    return await firestore()
      .collection('users')
      .doc(userUid)
      .set({tokens: firebase.firestore.FieldValue.arrayUnion(token)}, {merge: true});
  };

  const onWebViewMessage = async e => {
    const currentUserUid = JSON.parse(e.nativeEvent.data).currentUser.uid;
    const authCustomToken = await authenticate(currentUserUid);
    user.current = await auth().signInWithCustomToken(authCustomToken);
    saveToken(await messaging().getToken(), currentUserUid)
    messaging().onTokenRefresh(messageToken => saveToken(messageToken, currentUserUid));
  };

  const onLoad = () => console.log('webview onload')

  return (
    <View style={{height: "100%", width: "100%"}}>
      <WebView source={{uri: 'https://just.zemke.io'}}
               mediaPlaybackRequiresUserAction={false}
               ref={(ref) => webViewRef.current = ref}
               originWhitelist={['*']}
               allowsInlineMediaPlayback
               javaScriptEnabledAndroid={true}
               onLoad={onLoad}
               injectedJavaScript={jsCode}
               onMessage={onWebViewMessage}
      />
      <StatusBar style={{color: 'black'}} translucent={true}/>
    </View>
  );
}
