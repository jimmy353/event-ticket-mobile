import React, { useState } from "react";
import {
View,
Text,
TextInput,
StyleSheet,
Pressable,
Alert
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AddPaymentMethodScreen({ navigation }) {

const [phone, setPhone] = useState("");
const [loading, setLoading] = useState(false);

const saveNumber = async () => {

if (!phone) {
  Alert.alert("Error", "Please enter a phone number");
  return;
}

try {

  setLoading(true);

  const token = await AsyncStorage.getItem("access");

  const res = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/api/payments/saved/add/`,
    {
      method: "POST",
      headers:{
        "Content-Type":"application/json",
        Authorization:`Bearer ${token}`
      },
      body: JSON.stringify({
        provider:"MOMO",
        phone_number:phone
      })
    }
  );

  const data = await res.json();

  if (!res.ok) {
    Alert.alert("Error", data.error || "Failed to save number");
    setLoading(false);
    return;
  }

  Alert.alert("Success", "MoMo number saved");

  setLoading(false);

  navigation.goBack();

} catch (err) {

  console.log(err);
  Alert.alert("Error", "Something went wrong");

  setLoading(false);

}

};

return (

<View style={styles.container}>

  <Text style={styles.title}>Add MoMo Number</Text>

  <TextInput
    placeholder="Enter phone number"
    placeholderTextColor="#777"
    style={styles.input}
    keyboardType="phone-pad"
    value={phone}
    onChangeText={setPhone}
  />

  <Pressable style={styles.button} onPress={saveNumber}>

    <Text style={styles.buttonText}>
      {loading ? "Saving..." : "Save Number"}
    </Text>

  </Pressable>

</View>

);
}

const styles = StyleSheet.create({

container:{
flex:1,
backgroundColor:"#000",
padding:24,
paddingTop:80
},

title:{
color:"#7CFF00",
fontSize:28,
fontWeight:"bold",
marginBottom:30
},

input:{
backgroundColor:"#111",
borderRadius:12,
padding:16,
color:"#fff",
marginBottom:25,
fontSize:16
},

button:{
backgroundColor:"#7CFF00",
paddingVertical:18,
borderRadius:30,
alignItems:"center"
},

buttonText:{
color:"#000",
fontWeight:"bold",
fontSize:16
}

});