import React, { useState, useEffect, useRef } from "react";
import { KeyboardAvoidingView, View, Text, Linking, Alert, TouchableOpacity, TextInput, SafeAreaView, Image, Keyboard, Platform, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { fetchMessages, SOCKET_URL, fetchMessage, updateImage, updateUserLocation } from "./utils/api";
import { setupRNBackgroundGeolocation } from "./utils/RNBackgroundGeolocation"
import io from "socket.io-client";
import { iccShareLocation, icCamera } from "./images"
import { trackingUserLocation } from "./utils/helpers"
import { getCurrentLocationAsyc } from "./utils/RNBackgroundGeolocation"
import ImagePicker from 'react-native-image-picker';
import BackgroundTimer from 'react-native-background-timer';
import Toast, { DURATION } from 'react-native-easy-toast'

const options = {
    title: 'Select Image',
    storageOptions: {
        skipBackup: true,
        path: 'images',
    },
};

//There are three types of message text, location and image
const Chat = ({ userName, onLogout, id, fromNoti, resetFromNotiVar }) => {
    const [message, setMessage] = useState("")
    const [socket, setSocket] = useState(io(SOCKET_URL))
    const [messageArr, setMessageArr] = useState([])
    const [loadingMsgs, setLoadingMsgs] = useState(true);
    const [openedImgUrl, setOpenedImgUrl] = useState("")
    const [loadingImg, setLoadingImg] = useState(false);
    const toastRef = useRef(null)

    useEffect(() => {
        if (!socket) {
            const newSocket = io(SOCKET_URL);
            setSocket(newSocket)
        } else {
            socket.on("connect", () => {
                if (socket.connected) {
                    socket.on("newMessage", handleReceiveNewMessage);
                } else {
                    const newSocket = io(SOCKET_URL);
                    setSocket(newSocket)
                }
            })

            socket.on("disconnect", reason => {
                console.log("disconnected", socket.disconnected, reason);
                const newSocket = io(SOCKET_URL);
                setSocket(newSocket)
            });
        }

        return () => {
            if (!socket) return;
            socket.disconnect();
        }
    }, [socket])

    useEffect(() => {
        getMessages();

    }, [])

    const getMessages = () => {
        fetchMessages().then(result => {
            setLoadingMsgs(false)
            if (result && result.data && result.data.messages && result.data.messages.length > 0) {
                console.log(result)
                const msgs = result.data.messages.map(msg => {
                    return { content: msg.content, userName: msg.user.userName, color: msg.user.color, msgId: msg._id, type: msg.type };
                })
                msgs.reverse();
                setMessageArr(msgs)
            }
        })
            .catch(err => {
                setLoadingMsgs(false)
                console.log("Fetch messages error: ", err);
            }
            )
    }

    const handleReceiveNewMessage = data => {
        console.log("bewMsgData", data)
        if (data && data.newMessage && data.user) {
            const newMessage = {
                type: data.newMessage.type,
                content: data.newMessage.content,
                msgId: data.newMessage._id,
                userName: data.user.userName,
                color: data.user.color
            }
            setMessageArr(messageArr => [newMessage, ...messageArr,]);
            if (data.newMessage.type === "location" && data.user.userName === userName && data.newMessage._id) {
                console.log("Start setting up tracking")
                setupRNBackgroundGeolocation(startTracking(data.newMessage._id))
            }
            if (data.newMessage.type === "image" && data.user.userName === userName && data.newMessage._id) {
                BackgroundTimer.stop();
            }
        }
    }

    const startTracking = (msgId) => () => {
        trackingUserLocation(msgId)
        toastRef.current.show("Start sharing location.")
    }

    const handleOnChangeText = text => {
        setMessage(text)
    }

    const handleMsgContentClick = (msgId) => async () => {
        const result = await fetchMessage(msgId);
        if (result && result.data && result.data.message && result.data.message) {
            if (result.data.message.content) {
                const location = JSON.parse(result.data.message.content)
                const createdAt = result.data.message.createdAt;
                const createdAtTimeStamp = Date.parse(createdAt);
                const currentTimeStamp = (new Date()).getTime();
                const timeGap = currentTimeStamp - createdAtTimeStamp;
                const timeout = 900000 //ms
                let alertMsg = "";
                if (timeGap > timeout) {
                    alertMsg = "Tracking location on this user is stopped. Open the user lastest location?"
                } else {
                    alertMsg = "Open user current location?"
                }
                Alert.alert(
                    "Open Google map",
                    alertMsg,
                    [
                        { text: "Cancel", style: "cancel" },
                        { text: "Ok", onPress: () => openGoogleMap(location) },
                    ]
                )

            } else {
                Alert.alert(
                    "Notice!",
                    "Location link is invalid.",
                    [
                        { text: "Ok", style: "cancel" }
                    ]
                )
            }
        } else {
            Alert.alert(
                "Notice!",
                "Location link is invalid.",
                [
                    { text: "Ok", style: "cancel" }
                ]
            )
        }
    }

    const openGoogleMap = (location) => {
        const schema = Platform.select({ ios: "comgooglemaps://?q=", android: "geo:0,0?q=" });
        const latLng = location ? `${location.latitude},${location.longitude}` : "";
        const label = userName + " location";
        const url = Platform.select({
            ios: `${schema}${label}@${latLng}`,
            android: `${schema}${latLng}(${label})`
        })

        Linking.openURL(url);
    }

    const sendMessage = () => {
        if (!socket) {
            const newSocket = io(SOCKET_URL);
            setSocket(newSocket);
        }
        socket.emit("newMessage", { userId: id, content: message, type: "text" })
        setMessage("")
    }

    const shareLocation = async () => {
        //Template for share location message {"latitude":-37.787608,"longitude":144.877108}
        const currentLocation = await getCurrentLocationAsyc();
        if (currentLocation && currentLocation.coords) {
            const { latitude, longitude } = currentLocation.coords
            const msg = JSON.stringify({ latitude, longitude })
            if (!socket) {
                const newSocket = io(SOCKET_URL);
                setSocket(newSocket);
            }
            socket.emit("newMessage", { userId: id, content: msg, type: "location" })
        }
    }

    /*------Image picker section ------*/
    const showImagePicker = () => {
        ImagePicker.showImagePicker(options, async (response) => {
            console.log('Response = ', response);

            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            } else if (response.customButton) {
                console.log('User tapped custom button: ', response.customButton);
            } else {
                const source = { uri: response.uri };
                BackgroundTimer.start();
                // const result = await updateImage({ base64: response.data, imgType: response.type, userId: id, type: "image" })
                // console.log("updateimage", result)
                if (!socket) {
                    const newSocket = io(SOCKET_URL);
                    setSocket(newSocket);
                }
                socket.emit("newMessage", { base64: response.data, imgType: response.type, userId: id, type: "image" })
                toastRef.current.show("Start sending image.")
                // You can also display the image using data:
                // const source = { uri: 'data:image/jpeg;base64,' + response.data };
            }
        });
    }

    const onLoadImgStart = (e) => {
        console.log("start")
        setLoadingImg(true)
    }

    const onLoadImgEnd = (e) => {
        console.log("end")
        setLoadingImg(false)
    }

    const renderItem = ({ item }) => (
        <TouchableOpacity activeOpacity={1} style={{ flexDirection: "row", marginLeft: 20, marginTop: 10 }}>
            <Text style={userName === item.userName ? { fontSize: 18, marginRight: 10, color: "#ff0000" } : { fontSize: 18, marginRight: 10, color: item.color }}>{item.userName}:</Text>
            {item.type == "location" ?
                <Text onPress={handleMsgContentClick(item.msgId)} style={{ color: "#19A3E5", textDecorationLine: "underline", fontSize: 18 }}>Locate me</Text> :
                item.type === "text" ? <Text style={{ fontSize: 18 }}>{item.content}</Text> :
                    <Text onPress={() => setOpenedImgUrl(item.content)} style={{ color: "#19A3E5", textDecorationLine: "underline", fontSize: 18 }}>{item.content}</Text>

            }
        </TouchableOpacity>
    )

    const renderBody = () => (<SafeAreaView style={{ width: "100%", position: "relative", marginVertical: 10 }}>
        <View style={{ width: "100%", height: 70, flexDirection: "row", alignItems: "center", borderBottomWidth: 0.5, borderBottomColor: "#333333", position: "relative" }}>
            <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 22 }}>{userName}</Text>
            </View>
            <TouchableOpacity onPress={shareLocation} activeOpacity={0.5} style={{ position: "absolute", left: 20, width: 50, height: 50 }}>
                <Image source={iccShareLocation} style={{ width: "100%", height: "100%" }} />
            </TouchableOpacity>
            <TouchableOpacity onPress={showImagePicker} activeOpacity={0.5} style={{ position: "absolute", left: 80, width: 50, height: 50 }}>
                <Image source={icCamera} style={{ width: "100%", height: "100%" }} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onLogout} activeOpacity={0.6} style={{ position: "absolute", right: 20, height: 50, justifyContent: "center", alignItems: "center", backgroundColor: "#DF7373", paddingHorizontal: 10, borderRadius: 10 }}>
                <Text style={{ fontSize: 18, color: "#ffffff" }}>Log out</Text>
            </TouchableOpacity>
        </View>
        <TouchableOpacity style={{ width: "100%", height: "90%", paddingBottom: 100 }} activeOpacity={1} onPress={() => Keyboard.dismiss()}>
            {loadingMsgs ? <View style={{ ...StyleSheet.absoluteFill, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="small" color="#DF7373" /></View> :
                messageArr && messageArr.length > 0 ?
                    <FlatList
                        data={messageArr}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => item.userName + index}
                        inverted /> :
                    <View style={{ ...StyleSheet.absoluteFill, justifyContent: "center", alignItems: "center" }}><Text>No messages</Text></View>}
        </TouchableOpacity>
        <View style={{ flexDirection: "row", justifyContent: "space-around", position: "absolute", bottom: 10, backgroundColor: "#ffffff" }}>
            <TextInput onChangeText={handleOnChangeText} value={message} multiline={true} placeholder="Type here" style={{ width: "75%", borderColor: "#545454", borderWidth: 0.5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 15, fontSize: 18, justifyContent: "center" }} />
            <TouchableOpacity onPress={sendMessage} disabled={message ? false : true} activeOpacity={0.6} style={{ height: 50, justifyContent: "center", alignItems: "center", backgroundColor: "#DF7373", paddingHorizontal: 20, borderRadius: 10 }}>
                <Text style={{ fontSize: 18, color: "#ffffff" }}>Send</Text>
            </TouchableOpacity>
        </View>
        {openedImgUrl ?
            <View style={{ ...StyleSheet.absoluteFill, backgroundColor: "#ffffff" }}>
                <Image onLoadStart={onLoadImgStart} onLoadEnd={onLoadImgEnd} source={{ uri: openedImgUrl }} style={{ width: "100%", height: "100%", resizeMode: "contain" }} />
                {loadingImg ?
                    <View style={{ ...StyleSheet.absoluteFill, justifyContent: "center", alignItems: "center", top: 40, left: 0, right: 0, bottom: 0 }}>
                        <ActivityIndicator size="small" />
                    </View> : null}
                <TouchableOpacity style={{ ...StyleSheet.absoluteFill, top: 20, left: 20, width: 80, height: 80 }} onPress={() => setOpenedImgUrl("")}>
                    <Text style={{ fontSize: 50, color: "#1091FC" }}>{"<"}</Text>
                </TouchableOpacity>
            </View> : null}
        <Toast ref={toastRef} />
    </SafeAreaView>)



    if (fromNoti) {
        getMessages();
        resetFromNotiVar();
    }

    return (
        <React.Fragment>
            {Platform.OS === "ios" ?
                <KeyboardAvoidingView style={{ width: "100%", height: "100%" }} behavior="padding" enabled keyboardVerticalOffset={20}>
                    {renderBody()}
                </KeyboardAvoidingView > :
                renderBody()}
        </React.Fragment>
    );
}

export default Chat;