import React from "react";
import Driverdetails from "../../../../../Components/driverdetails/Driverdetails";

export default function Driverdetail({ params }) {
  return (
    <>
      <Driverdetails id={params.slug} />
    </>
  );
}