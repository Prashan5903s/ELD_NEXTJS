import React from "react"
import AddUserRoleComponent from "@/Components/Settings/Organization/UserRoles/AddRole"

export default function EditUserRoles({params}){
    return(  <AddUserRoleComponent id={params.slug}/> )
}