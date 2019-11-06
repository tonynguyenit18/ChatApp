import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, SafeAreaView, Animated, Keyboard, Platform } from "react-native"

const Chat = ({ userName, onLogout }) => {
    useState
    let keyboardHeight = new Animated.Value(0);

    useEffect(() => {
        const keyboardWillShowListener = Keyboard.addListener("keyboardWillShow", handleKeyboardWillShow);
        const keyboardWillHideListener = Keyboard.addListener("keyboardWillHide", handleKeyboardWillHide);
        return () => {
            keyboardWillHideListener.remove();
            keyboardWillShowListener.remove()
        }
    }, [])

    const handleKeyboardWillShow = event => {
        Animated.parallel([
            Animated.timing(keyboardHeight, {
                duration: event.duration,
                toValue: event.endCoordinates.height
            })
        ]).start();
    }

    const handleKeyboardWillHide = event => {
        Animated.parallel([
            Animated.timing(keyboardHeight, {
                duration: event.duration,
                toValue: 0
            })
        ]).start()
    }
    return (
        <SafeAreaView style={{ width: "100%", height: "100%" }} >
            <Animated.View style={Platform.OS === "ios" ? [{ width: "100%", position: "relative" }, { marginBottom: keyboardHeight }] : { width: "100%" }}>
                <View style={{ width: "100%", height: 70, flexDirection: "row", alignItems: "center", borderBottomWidth: 0.5, borderBottomColor: "#333333", position: "relative" }}>
                    <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 22 }}>{userName}</Text>
                    </View>
                    <TouchableOpacity onPress={onLogout} activeOpacity={0.6} style={{ position: "absolute", right: 20, height: 50, justifyContent: "center", alignItems: "center", backgroundColor: "#DF7373", paddingHorizontal: 10, borderRadius: 10 }}>
                        <Text style={{ fontSize: 18, color: "#ffffff" }}>Log out</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={{ width: "100%", height: "90%" }} activeOpacity={1} onPress={() => Keyboard.dismiss()}>

                </TouchableOpacity>
                <View style={{ flexDirection: "row", justifyContent: "space-around", position: "absolute", bottom: 0 }}>
                    <TextInput multiline={true} placeholder="Type here" style={{ width: "75%", borderColor: "#545454", borderWidth: 0.5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 15, fontSize: 18, justifyContent: "center" }} />
                    <TouchableOpacity activeOpacity={0.6} style={{ height: 50, justifyContent: "center", alignItems: "center", backgroundColor: "#DF7373", paddingHorizontal: 20, borderRadius: 10 }}>
                        <Text style={{ fontSize: 18, color: "#ffffff" }}>Send</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </SafeAreaView >
    );
}

export default Chat;