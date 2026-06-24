import React from "react"
import VehicleAssignForm from "@/Components/Settings/Organization/vehicle_assign/vehicleAssignForm"

export default function EditUserRoles({params}){
    return(  <VehicleAssignForm id={params.slug}/> )
}