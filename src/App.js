import React, { useState, useEffect } from 'react';
import { YellowBox } from "react-native"
import Login from "./Login";
import Chat from "./Chat";
import AsyncStorage from "@react-native-community/async-storage";
import { login } from "./utils/api"

YellowBox.ignoreWarnings(["Unrecognized WebSocket"])
const App = () => {
  const [userNameInput, setUserNameInput] = useState("")
  const [id, setId] = useState("")
  const [userName, setUserName] = useState("")
  const [error, seterror] = useState("")

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
        const response = await login({ userName: userNameInput, fcmToken: "abc" });
        const result = await response.json();
        console.log(result)
        if (result && result.ok && result.user) {
          const { _id, fcmToken } = result.user;
          const userInfor = { userName: result.user.userName, _id, fcmToken }
          await AsyncStorage.setItem("user-infor", JSON.stringify(userInfor));
          setUserName(result.user.userName);
          setId(_id);
        } else {
          seterror("Log in failed!");
        }
      } catch (err) {
        seterror("Log in failed!");
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

  return (
    <React.Fragment>
      {!userName ?
        <Login onLogin={handleLogin} onChangeText={handleUsernameChange} error={error} /> :
        <Chat onLogout={handleLogout} userName={userName} id={id} />}
    </React.Fragment>
  )
};

export default App;
