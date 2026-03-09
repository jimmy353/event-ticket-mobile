import React, { useState } from "react";
import { View, Text, StyleSheet, Switch, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function PaymentSettingsScreen({ navigation }) {

const [momoEnabled, setMomoEnabled] = useState(true);

return (
<View style={styles.container}>

  <Pressable style={styles.back} onPress={() => navigation.goBack()}>
    <Ionicons name="arrow-back" size={26} color="#7CFF00"/>
  </Pressable>

  <Text style={styles.header}>Payment Settings</Text>

  {/* MOBILE MONEY CARD */}
  <View style={styles.card}>

    <View style={styles.left}>

      <View style={styles.icon}>
        <Ionicons name="phone-portrait" size={22} color="#000"/>
      </View>

      <View style={{flex:1}}>
        <Text style={styles.title}>MoMo / M-Gurush</Text>
        <Text style={styles.desc}>
          Use mobile money for ticket payments
        </Text>
      </View>

    </View>

    <Switch
      value={momoEnabled}
      onValueChange={setMomoEnabled}
      trackColor={{ false:"#333", true:"#7CFF00" }}
      thumbColor="#fff"
    />

  </View>


  {/* SAVED PAYMENTS */}
  <Pressable
    style={styles.card}
    onPress={() => navigation.navigate("SavedPayments")}
  >

    <View style={styles.left}>

      <View style={styles.icon}>
        <Ionicons name="card" size={22} color="#000"/>
      </View>

      <View style={{flex:1}}>
        <Text style={styles.title}>Saved Payment Methods</Text>
        <Text style={styles.desc}>
          Manage your MoMo numbers
        </Text>
      </View>

    </View>

    <Ionicons name="chevron-forward" size={22} color="#777"/>

  </Pressable>

</View>

);
}

const styles = StyleSheet.create({

container:{
flex:1,
backgroundColor:"#000",
padding:20,
paddingTop:70
},

back:{
position:"absolute",
top:40,
left:20
},

header:{
fontSize:30,
fontWeight:"bold",
color:"#7CFF00",
marginBottom:30
},

card:{
backgroundColor:"#0f0f0f",
borderRadius:20,
padding:20,
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center",
borderWidth:1,
borderColor:"#1c1c1c",
marginBottom:18
},

left:{
flexDirection:"row",
alignItems:"center",
flex:1
},

icon:{
width:46,
height:46,
borderRadius:12,
backgroundColor:"#7CFF00",
justifyContent:"center",
alignItems:"center",
marginRight:14
},

title:{
color:"#fff",
fontSize:17,
fontWeight:"600"
},

desc:{
color:"#888",
fontSize:13,
marginTop:2
}

});