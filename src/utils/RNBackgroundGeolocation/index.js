import BackgroundGeolocation from "react-native-background-geolocation";
import { Platform } from "react-native"
import { BASE_URL } from "../api"


const setupRNBackgroundGeolocation = (callback, msgId) => {
    ////
    // 1.  Wire up event-listeners
    //
    // This handler fires whenever bgGeo receives a location update.
    BackgroundGeolocation.onLocation(onLocation, onError);

    // This handler fires when movement states changes (stationary->moving; moving->stationary)
    BackgroundGeolocation.onMotionChange(onMotionChange);

    // This event fires when a change in motion activity is detected
    BackgroundGeolocation.onActivityChange(onActivityChange);

    // This event fires when the user toggles location-services authorization
    BackgroundGeolocation.onProviderChange(onProviderChange);

    ////
    // 2.  Execute #ready method (required)
    //

    if (Platform.OS == "android") {
        BackgroundGeolocation.onHttp(response => {
            console.log("loc res 1", response, response.responseText)
            if (response && response.responseText) {
                try {
                    console.log("loc res", response.responseText)
                    const updatedMsg = JSON.parse(response.responseText).updatedMsg;
                    const { createdAt, updatedAt } = updatedMsg
                    const startTime = new Date(createdAt).getTime();
                    const updatedTime = new Date(updatedAt).getTime();
                    console.log("time", startTime, updatedTime, updatedTime - startTime)
                    if (updatedTime - startTime >= 900000) {
                        BackgroundGeolocation.removeListeners();
                    }
                } catch (error) {

                }
            }
        });
        BackgroundGeolocation.ready({
            // Geolocation Config
            desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
            distanceFilter: 0,
            locationUpdateInterval: 10000,
            locationTemplate: '{"latitude":<%= latitude %>,"longitude":<%= longitude %>}',
            // Activity Recognition
            stopTimeout: 1,
            // Application config
            debug: false, // <-- enable this hear sounds for background-geolocation life-cycle.
            logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
            stopOnTerminate: false,   // <-- Allow the background-service to continue tracking when user closes the app.
            startOnBoot: false,        // <-- Auto start tracking when device is powered-up.
            stopOnStationary: false,
            // HTTP / SQLite config
            url: `${BASE_URL}/api/location/`,
            batchSync: false,       // <-- [Default: false] Set true to sync locations to server in a single HTTP request.
            autoSync: true,         // <-- [Default: true] Set true to sync each location to server as it arrives.
            headers: {              // <-- Optional HTTP headers
                "Content-Type": "application/json"
            },
            params: {               // <-- Optional HTTP params
                "msgId": msgId
            }
        }, (state) => {
            console.log("- BackgroundGeolocation is configured and ready in android: ", state.enabled);
            if (!state.enabled) {
                ////
                // 3. Start tracking!
                //
                BackgroundGeolocation.start(function () {
                    console.log("- Start success");
                });
            }
        });
    } else {
        BackgroundGeolocation.ready({
            // Geolocation Config
            desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
            distanceFilter: 10,
            // Activity Recognition
            stopTimeout: 1,
            locationAuthorizationRequest: "Always",
            // Application config
            debug: false, // <-- enable this hear sounds for background-geolocation life-cycle.
            logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
            stopOnTerminate: false,   // <-- Allow the background-service to continue tracking when user closes the app.
            startOnBoot: false,        // <-- Auto start tracking when device is powered-up.
            stopOnStationary: false,
            // HTTP / SQLite config
            url: `${BASE_URL}/api/location/Tony`,
            batchSync: false,       // <-- [Default: false] Set true to sync locations to server in a single HTTP request.
            autoSync: true,         // <-- [Default: true] Set true to sync each location to server as it arrives.
            headers: {              // <-- Optional HTTP headers
                "Content-Type": "application/json"
            },
            params: {               // <-- Optional HTTP params
                "auth_token": "maybe_your_server_authenticates_via_token_YES?"
            }
        }, (state) => {
            console.log("- BackgroundGeolocation is configured and ready in ios: ", state.enabled);
            callback()
            if (!state.enabled) {
                ////
                // 3. Start tracking!
                //
                BackgroundGeolocation.start(function () {
                    console.log("- Start success");
                });
            }
        });
    }
}

// You must remove listeners when your component unmounts
const removeRNBGListener = () => {
    BackgroundGeolocation.removeListeners();
}
const onLocation = (location) => {
    // console.log('[location] -', location);
}
const onError = (error) => {
    // console.warn('[location] ERROR -', error);
}
const onActivityChange = (event) => {
    // console.log('[activitychange] -', event);  // eg: 'on_foot', 'still', 'in_vehicle'
}
const onProviderChange = (provider) => {
    // console.log('[providerchange] -', provider.enabled, provider.status);
}
const onMotionChange = (event) => {
    if (!event.isMoving) {
        BackgroundGeolocation.changePace(true);
    }
    // console.log('[motionchange] -', event.isMoving, event.location);
}

const getCurrentLocationAsyc = () => {
    return BackgroundGeolocation.getCurrentPosition({
        timeout: 10,          // 30 second timeout to fetch location
        maximumAge: 5000,     // Accept the last-known-location if not older than 5000 ms.
        desiredAccuracy: 10,  // Try to fetch a location with an accuracy of `10` meters.
    });
}

export {
    setupRNBackgroundGeolocation,
    removeRNBGListener,
    getCurrentLocationAsyc
}