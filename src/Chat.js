import React, { useState, useEffect, useRef } from "react";
import { KeyboardAvoidingView, View, Text, Linking, Alert, TouchableOpacity, TextInput, SafeAreaView, Image, Keyboard, Platform, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { fetchMessages, SOCKET_URL, fetchMessage } from "./utils/api";
import { setupRNBackgroundGeolocation } from "./utils/RNBackgroundGeolocation"
import io from "socket.io-client";
import { iccShareLocation } from "./images"
import { trackingUserLocation } from "./utils/helpers"
import { getCurrentLocationAsyc } from "./utils/RNBackgroundGeolocation"


const Chat = ({ userName, onLogout, id, fromNoti, resetFromNotiVar }) => {
    const [message, setMessage] = useState("")
    const [socket, setSocket] = useState(io(SOCKET_URL))
    const [messageArr, setMessageArr] = useState([])
    const [loadingMsgs, setLoadingMsgs] = useState(true);

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
        // setupRNBackgroundGeolocation(startTracking("a"))

    }, [])

    const getMessages = () => {
        fetchMessages().then(result => {
            setLoadingMsgs(false)
            if (result && result.data && result.data.messages && result.data.messages.length > 0) {
                const msgs = result.data.messages.map(msg => {
                    const isShareLocationMsg = checkIsShareLocationMsg(msg.content)
                    return { isShareLocationMsg, content: msg.content, userName: msg.user.userName, color: msg.user.color, msgId: msg._id };
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

    const checkIsShareLocationMsg = (content) => {
        let isShareLocationMsg = false;
        try {
            const location = JSON.parse(content)
            if (location && location.latitude && location.longitude) {
                isShareLocationMsg = true
            }
        } catch (error) {
        }
        return isShareLocationMsg;
    }

    const handleReceiveNewMessage = data => {
        if (data && data.newMessage && data.user) {
            const isShareLocationMsg = checkIsShareLocationMsg(data.newMessage.content)
            const newMessage = {
                isShareLocationMsg,
                content: data.newMessage.content,
                msgId: data.newMessage._id,
                userName: data.user.userName,
                color: data.user.color
            }
            setMessageArr(messageArr => [newMessage, ...messageArr,]);
            if (isShareLocationMsg && data.user.userName === userName && data.newMessage._id) {
                setupRNBackgroundGeolocation(startTracking(data.newMessage._id))
            }
        }
    }

    const startTracking = (msgId) => () => {
        trackingUserLocation(msgId)
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
        socket.emit("newMessage", { userId: id, content: message })
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
            socket.emit("newMessage", { userId: id, content: msg })
        }
    }

    const renderItem = ({ item }) => (
        <TouchableOpacity activeOpacity={1} style={{ flexDirection: "row", marginLeft: 20, marginTop: 10 }}>
            <Text style={userName === item.userName ? { fontSize: 18, marginRight: 10, color: "#ff0000" } : { fontSize: 18, marginRight: 10, color: item.color }}>{item.userName}:</Text>
            {item.isShareLocationMsg ?
                <Text onPress={handleMsgContentClick(item.msgId)} style={{ color: "#19A3E5", textDecorationLine: "underline", fontSize: 18 }}>Locate me</Text> :
                <Text style={{ fontSize: 18 }}>{item.content}</Text>

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