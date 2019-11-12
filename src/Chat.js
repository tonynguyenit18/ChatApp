import React, { useState, useEffect, useRef } from "react";
import { KeyboardAvoidingView, View, Text, TouchableOpacity, TextInput, SafeAreaView, Animated, Keyboard, Platform, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { fetchMessages, SOCKET_URL } from "./utils/api"
import io from "socket.io-client";
let socket = io(SOCKET_URL);


const Chat = ({ userName, onLogout, id, fromNoti, resetFromNotiVar }) => {
    const [message, setMessage] = useState("")
    const [socket, setSocket] = useState(null)
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
    }, [])

    const getMessages = () => {
        fetchMessages().then(result => {
            setLoadingMsgs(false)
            if (result && result.data && result.data.messages && result.data.messages.length > 0) {
                const msgs = result.data.messages.map(msg => {
                    return { content: msg.content, userName: msg.user.userName, color: msg.user.color };
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
        if (data && data.newMessage && data.user) {
            const newMessage = {
                content: data.newMessage.content,
                userName: data.user.userName,
                color: data.user.color
            }

            setMessageArr(messageArr => [newMessage, ...messageArr,]);
        }
    }

    const handleOnChangeText = text => {
        setMessage(text)
    }

    const sendMessage = () => {
        if (!socket) {
            const newSocket = io(SOCKET_URL);
            setSocket(newSocket);
        }
        socket.emit("newMessage", { userId: id, content: message })
        setMessage("")
    }

    const renderItem = ({ item }) => (
        <TouchableOpacity activeOpacity={1} style={{ flexDirection: "row", marginLeft: 20, marginTop: 10 }}>
            <Text style={userName === item.userName ? { fontSize: 18, marginRight: 10, color: "#ff0000" } : { fontSize: 18, marginRight: 10, color: item.color }}>{item.userName}:</Text>
            <Text style={{ fontSize: 18 }}>{item.content}</Text>
        </TouchableOpacity>
    )

    const renderBody = () => (<SafeAreaView style={{ width: "100%", position: "relative", marginVertical: 10 }}>
        <View style={{ width: "100%", height: 70, flexDirection: "row", alignItems: "center", borderBottomWidth: 0.5, borderBottomColor: "#333333", position: "relative" }}>
            <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 22 }}>{userName}</Text>
            </View>
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