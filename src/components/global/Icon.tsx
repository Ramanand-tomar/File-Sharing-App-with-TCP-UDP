import Ionicons from "react-native-vector-icons/Ionicons"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import React, {FC} from "react"
import {RFValue} from "react-native-responsive-fontsize"



interface IconProps {
    color?:string;
    size:number;
    name:string;
    iconsFamily: "Ionicons" | "MaterialIcons" | "MaterialCommunityIcons"

}

import { View, Text } from 'react-native'


const Icon:FC<IconProps> = ({color, size, name, iconsFamily}) => {
  return (
    <>
      {iconsFamily === "Ionicons" && <Ionicons name={name} size={RFValue(size)} color={color} />}
      {iconsFamily === "MaterialIcons" && <MaterialIcons name={name} size={RFValue(size)} color={color} />}
      {iconsFamily === "MaterialCommunityIcons" && <MaterialCommunityIcons name={name} size={RFValue(size)} color={color} />}
    </>
  )
}

export default Icon


