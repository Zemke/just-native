import {registerRootComponent} from 'expo';
import messaging from '@react-native-firebase/messaging';
import App from './App';

console.log('registering messaging background handler');

// Register background handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('BG MSG', remoteMessage);
});


// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in the Expo client or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
