import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SavedPaymentsScreen({ navigation }) {
  return (
    <View style={styles.container}>

      <Pressable style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={26} color="#7CFF00" />
      </Pressable>

      <Text style={styles.title}>Saved Payment Methods</Text>

      <View style={styles.card}>
        <Ionicons name="phone-portrait-outline" size={22} color="#7CFF00" />
        <Text style={styles.text}>No saved MoMo numbers yet</Text>
      </View>

      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Add MoMo Number</Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({

container:{
  flex:1,
  backgroundColor:"#000",
  padding:24,
  paddingTop:70
},

back:{
  position:"absolute",
  top:40,
  left:20
},

title:{
  fontSize:26,
  fontWeight:"bold",
  color:"#7CFF00",
  marginBottom:30
},

card:{
  backgroundColor:"#111",
  borderRadius:18,
  padding:20,
  flexDirection:"row",
  alignItems:"center",
  gap:10
},

text:{
  color:"#ccc",
  fontSize:15
},

button:{
  backgroundColor:"#7CFF00",
  marginTop:30,
  padding:16,
  borderRadius:30,
  alignItems:"center"
},

buttonText:{
  color:"#000",
  fontWeight:"bold",
  fontSize:16
}

});