import React, { useState, useEffect } from 'react';
import Login from "./Login";
import Chat from "./Chat";
import AsyncStorage from "@react-native-community/async-storage"

const App = () => {
  const [screen, setScreen] = useState("login")
  const [userNameInput, setUserNameInput] = useState("")
  const [userName, setUserName] = useState("")
  const [error, seterror] = useState("")

  useEffect(() => {
    AsyncStorage.getItem("user-name").then(result => {
      setUserName(result)
    })
  }, [])

  const handleLogin = async () => {
    if (!userNameInput) {
      seterror("Username is required!");
    } else {
      await AsyncStorage.setItem("user-name", userNameInput);
      setUserName(userNameInput)
    }
  }

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("user-name")
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
        <Chat onLogout={handleLogout} userName={userName} />}
    </React.Fragment>
  )
};

export default App;
