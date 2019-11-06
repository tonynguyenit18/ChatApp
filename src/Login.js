import React from "react";
import { View, TouchableOpacity, Text, TextInput } from "react-native";

const Login = ({ onLogin, onChangeText, error }) => {
    return (
        <View style={{ width: "100%", height: "100%", justifyContent: "center", alignItems: "center", backgroundColor: "#59CD90" }}>
            <TextInput onChangeText={onChangeText} placeholder="Enter your name" style={{ fontSize: 18, width: "60%", backgroundColor: "#ffffff", borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10 }} />
            {error ? <Text style={{ fontSize: 20, color: "#CC3A35", marginTop: 10 }}>{error}</Text> : null}
            <TouchableOpacity onPress={onLogin} activeOpacity={0.6} style={{ backgroundColor: "#DF7373", paddingHorizontal: 20, paddingVertical: 10, marginTop: 20, borderRadius: 10 }}>
                <Text style={{ fontSize: 18, color: "#ffffff" }}>Log In</Text>
            </TouchableOpacity>
        </View>
    )
}


export default Login