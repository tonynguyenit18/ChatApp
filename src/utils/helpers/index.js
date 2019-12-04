import AsyncStorage from "@react-native-community/async-storage"
import { getCurrentLocationAsyc, removeRNBGListener } from "../RNBackgroundGeolocation"
import { updateUserLocation } from "../api"

const getUerInfoFromStorageAsync = async () => {
    return AsyncStorage.getItem("user-infor")
}

const trackingUserLocation = (msgId, interval = 10000, timeout = 900000) => {
    const intervalListener = setInterval(startUpdatingLocationInterval(msgId), interval);
    setTimeout(() => {
        clearInterval(intervalListener);
        removeRNBGListener();
    }, timeout);
}

const startUpdatingLocationInterval = msgId => async () => {
    getCurrentLocationAsyc().then(async (result) => {
        if (!result || !result.coords) return
        const location = {
            latitude: result.coords.latitude,
            longitude: result.coords.longitude,
        }
        const response = await updateUserLocation({ location: JSON.stringify(location), msgId })
        console.log("response", response)
    });
}

export {
    getUerInfoFromStorageAsync,
    trackingUserLocation
}