import {StatusBar} from 'expo-status-bar';
import React, {useEffect, useRef} from 'react';
import {Alert, PermissionsAndroid, View} from 'react-native';
import WebView from "react-native-webview/lib/WebView";
import messaging from '@react-native-firebase/messaging';
import firebase from '@react-native-firebase/app';

let originApp;
(() => {
  const origin = firebase.app('origin');
  if (origin != null) {
    return Promise.resolve(origin);
  }
  return firebase.initializeApp({
    apiKey: "AIzaSyCpeA-4i6sZalkiqjB3ks6u1__hO4E2o8U",
    authDomain: "just-pwa.firebaseapp.com",
    databaseURL: "https://just-pwa.firebaseio.com",
    projectId: "just-pwa",
    storageBucket: "just-pwa.appspot.com",
    messagingSenderId: "389806956797",
    appId: "1:389806956797:web:18d5c9ae865eda5b51de94",
    measurementId: "G-8FFPRPW39V"
  }, 'origin');
})().then(app => originApp = app);


export default function App() {

  const currentUserUid = useRef(null);

  const requestCameraPermission = async () =>
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA);

  useEffect(() => {
    requestCameraPermission();
  });

  useEffect(() => {
    return messaging().onMessage(async remoteMessage => {
      Alert.alert(`FCM:  ${JSON.stringify(remoteMessage)}`);
    });
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

  const saveToken = async (token, userUid) => {
    console.log('user doc:', await firebase.app('origin').firestore().collection('users').doc(userUid).get())
    return await firebase.app('origin')
      .firestore()
      .collection('users')
      .doc(userUid)
      // .update({tokens: firebase.app('origin').firestore.FieldValue.arrayUnion(token)})
      .set({tokens: firebase.app('origin').firestore.FieldValue.arrayUnion(token)}, {merge: true})
      .then(res => console.log(`token ${token} of user ${userUid} saved:`, res))
      .catch(console.error);
  };

  const onWebViewMessage = e => {
    currentUserUid.current = JSON.parse(e.nativeEvent.data).currentUser.uid;
    console.log('currentUserUid from webview local storage', currentUserUid.current);
    messaging().getToken()
      .then(token => {
        console.log('got token', token);
        saveToken(token, currentUserUid.current);
      });
    messaging().onTokenRefresh(token => {
      console.log('token refresh received', token);
      saveToken(token, currentUserUid.current)
    });
  };

  const onLoad = () => console.log('webview onload')

  return (
    <View style={{height: "100%", width: "100%"}}>
      <WebView source={{uri: 'https://just.zemke.io'}}
               mediaPlaybackRequiresUserAction={false}
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

// todo function for just-pwa has to sent android messages to the other firebase app?
// todo firestore of secondary app just-pwa needs to be used
// todo and for saving into the just-pwa firestore we need auth
//  and for that one could use custom token authentication
//  https://firebase.google.com/docs/auth/admin/create-custom-tokens#web
