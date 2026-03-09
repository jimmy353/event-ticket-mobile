import React, { useState } from "react";
import { View, Text, StyleSheet, Switch, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function PaymentConfirmationSettings({ navigation }) {

  const [enabled, setEnabled] = useState(true);

  return (
    <View style={styles.container}>

      {/* BACK BUTTON */}
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={26} color="#7CFF00" />
      </Pressable>

      <Text style={styles.header}>
        Payment Notifications
      </Text>

      <Text style={styles.sub}>
        Control how you receive payment confirmations.
      </Text>

      <View style={styles.card}>

        <View style={styles.left}>

          <View style={styles.icon}>
            <Ionicons name="card-outline" size={22} color="#000" />
          </View>

          <View style={styles.textBlock}>
            <Text style={styles.title}>
              Payment Confirmation
            </Text>

            <Text style={styles.desc}>
              Get notified instantly when your ticket payment succeeds.
            </Text>
          </View>

        </View>

        <Switch
          value={enabled}
          onValueChange={setEnabled}
          trackColor={{ false: "#333", true: "#7CFF00" }}
          thumbColor={enabled ? "#7CFF00" : "#777"}
        />

      </View>

      <Text style={styles.note}>
        You will receive a push notification after every successful payment.
      </Text>

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

  backButton:{
    position:"absolute",
    top:40,
    left:20,
    zIndex:10
  },

  header:{
    color:"#7CFF00",
    fontSize:26,
    fontWeight:"bold",
    marginBottom:6
  },

  sub:{
    color:"#777",
    marginBottom:30
  },

  card:{
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"space-between",
    backgroundColor:"#111",
    padding:20,
    borderRadius:20,
    borderWidth:1,
    borderColor:"#1a1a1a",
    shadowColor:"#000",
    shadowOpacity:0.3,
    shadowRadius:10,
    elevation:4
  },

  left:{
    flexDirection:"row",
    alignItems:"center",
    flex:1
  },

  icon:{
    width:42,
    height:42,
    borderRadius:10,
    backgroundColor:"#7CFF00",
    justifyContent:"center",
    alignItems:"center",
    marginRight:14
  },

  textBlock:{
    flex:1
  },

  title:{
    color:"#fff",
    fontSize:16,
    fontWeight:"600"
  },

  desc:{
    color:"#777",
    fontSize:13,
    marginTop:4
  },

  note:{
    color:"#555",
    marginTop:20,
    fontSize:12
  }

});