import React, { useState, useEffect } from 'react';
import { YellowBox } from "react-native"
import Login from "./Login";
import Chat from "./Chat";
import AsyncStorage from "@react-native-community/async-storage";
import { login } from "./utils/api";
import firebase from 'react-native-firebase';

YellowBox.ignoreWarnings(["Unrecognized WebSocket"])
let notificationListener = null;
let notificationOpenedListener = null;
let messageListener = null;
const App = () => {
  const [userNameInput, setUserNameInput] = useState("")
  const [id, setId] = useState("")
  const [userName, setUserName] = useState("")
  const [error, seterror] = useState("")

  useEffect(() => {
    checkPermission();
    createNotificationListeners();
    // messageListener = firebase.messaging().onMessage((message: RemoteMessage) => {
    //   console.log("message", message)
    // });
    return () => {
      notificationListener;
      notificationOpenedListener;
      // messageListener();
    }
  }, [])


  useEffect(() => {
    AsyncStorage.getItem("user-infor").then(result => {
      const userInfor = JSON.parse(result)
      if (!userInfor) return;
      setUserName(userInfor.userName);
      setId(userInfor._id)
    })
  }, [])

  const handleLogin = async () => {
    if (!userNameInput) {
      seterror("Username is required!");
    } else {
      seterror("");
      try {
        let fcmToken = await AsyncStorage.getItem("fcmToken");
        if (!fcmToken) {
          fcmToken = getToken();
        }
        const response = await login({ userName: userNameInput, fcmToken });
        const result = response.data;
        if (result && result.ok && result.user) {
          const { _id } = result.user;
          const userInfor = { userName: result.user.userName, _id }
          setUserName(result.user.userName);
          setId(_id);
          await AsyncStorage.setItem("user-infor", JSON.stringify(userInfor));
        } else {
          const errMsg = `Log in failed! ${result}, ${result.ok}, ${result.user}`
          seterror(errMsg);
        }
      } catch (err) {
        const errMsg = `Log in failed! ${err}, ${err.message}`
        seterror(errMsg);
      }
    }
  }

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("user-infor")
    } catch (error) {
      console.log(error)
    }
    setUserName("")
  }

  const handleUsernameChange = text => {
    setUserNameInput(text)
  }

  /*----Firebase notificatios section----*/
  //1
  const checkPermission = async () => {
    const enabled = await firebase.messaging().hasPermission();
    if (enabled) {
      getToken();
    } else {
      requestPermission();
    }
  }

  //3
  const getToken = async () => {
    const fcmToken = await firebase.messaging().getToken();
    if (fcmToken) {
      await AsyncStorage.setItem('fcmToken', fcmToken);
    }
    fcmToken;
  }

  //2
  requestPermission = async () => {
    try {
      await firebase.messaging().requestPermission();
      getToken();
    } catch (error) {
      console.log('permission rejected');
    }
  }

  const createNotificationListeners = async () => {
    /*
    * Triggered when a particular notification has been received in foreground
    * */
    const channel = new firebase.notifications.Android.Channel("@string/default_notification_channel_id", 'ChatApp', firebase.notifications.Android.Importance.High)
      .setDescription('Demo app description')
      .setSound('sound.mp3');
    firebase.notifications().android.createChannel(channel);

    notificationListener = firebase.notifications().onNotification((notification) => {
      const { title, body, data } = notification;
      console.log('onNotification:', notification);

      const localNotification = new firebase.notifications.Notification({
        sound: 'sound',
        show_in_foreground: true,
        show_in_background: true,
      })
        .setSound(channel.sound)
        .setNotificationId(notification.notificationId)
        .setTitle(title)
        .setBody(body)
        .setData(data)
        .android.setChannelId("@string/default_notification_channel_id") // e.g. the id you chose above
        .android.setSmallIcon('@mipmap/ic_launcher') // create this icon in Android Studio
        .android.setColor('#000000') // you can set a color here
        .android.setPriority(firebase.notifications.Android.Priority.High);

      firebase.notifications()
        .displayNotification(localNotification)
        .catch(err => console.error(err));
    });

    /*
    * If your app is in background, you can listen for when a notification is clicked / tapped / opened as follows:
    * */
    notificationOpenedListener = firebase.notifications().onNotificationOpened((notificationOpen) => {
      const { title, body } = notificationOpen.notification;
      console.log('onNotificationOpened:');
    });

    /*
    * If your app is closed, you can check if it was opened by a notification being clicked / tapped / opened as follows:
    * */
    const notificationOpen = await firebase.notifications().getInitialNotification();
    if (notificationOpen) {
      const { title, body } = notificationOpen.notification;
      console.log('getInitialNotification:');
    }
    /*
    * Triggered for data only payload in foreground
    * */
    messageListener = firebase.messaging().onMessage((message) => {
      //process data message
      console.log("JSON.stringify:", JSON.stringify(message));
      const { title, body, data } = message.data;
      const localNotification = new firebase.notifications.Notification({
        sound: 'sound',
        show_in_foreground: true,
        show_in_background: true,
      })
        .setSound(channel.sound)
        .setNotificationId(message.messageId)
        .setTitle(title)
        .setBody(body)
        .setData(data)
        .android.setChannelId("@string/default_notification_channel_id") // e.g. the id you chose above
        .android.setSmallIcon('@mipmap/ic_launcher') // create this icon in Android Studio
        .android.setColor('#000000') // you can set a color here
        .android.setPriority(firebase.notifications.Android.Priority.High);

      firebase.notifications()
        .displayNotification(localNotification)
        .catch(err => console.error(err));
    });
  }

  /*----End Firebase notificatios section----*/

  return (
    <React.Fragment>
      {!userName ?
        <Login onLogin={handleLogin} onChangeText={handleUsernameChange} error={error} /> :
        <Chat onLogout={handleLogout} userName={userName} id={id} />}
    </React.Fragment>
  )
};

export default App;
