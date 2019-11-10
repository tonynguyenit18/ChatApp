// @flow
import firebase from 'react-native-firebase';
// Optional flow type
import { RemoteMessage } from 'react-native-firebase';

export default async (message: RemoteMessage) => {
    const { title, body } = message.data;
    console.log("message1", body, title, message)
    const notificationToBeDisplayed = new firebase.notifications.Notification({
        data: "Test",
        sound: 'sound',
        title: title,
        body: body
    });

    if (Platform.OS === 'android') {
        notificationToBeDisplayed.android
            .setPriority(firebase.notifications.Android.Priority.High)
            .android.setChannelId('@string/default_notification_channel_id')
    }
    await firebase.notifications().displayNotification(notificationToBeDisplayed);
    return Promise.resolve();
}