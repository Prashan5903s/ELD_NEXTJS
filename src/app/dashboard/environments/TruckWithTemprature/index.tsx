"use client";
import React, { useEffect, useState, useCallback } from "react";
import classes from "./TruckWithTemprature.module.css";
import Image from "next/image";
import TruckImage from "../../../../../public/media/misc/truck_images.png";

const TruckWithTemprature = ({
  address,
  temprature,
  name,
}: {
  temprature: string;
  address: string;
  name: string;
}) => {

  return (
    <div className={classes.truckContainer}>
      <div style={{ position: "relative", alignSelf: "center" }}>
        <Image src={TruckImage} alt="truck-image" width={300} height={300} />
        <div style={{ position: "absolute", top: "50%", right: "50%", transform: "translate(37%, -50%)", fontSize: "14px", marginLeft: "-6px" }}>{temprature}</div>
      </div>
      <div className={classes.truckName}>{name}</div>
      <div className={classes.address}>
        <div className={classes.mapIcon}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
            <path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z" />
          </svg>
        </div>
        <i className="fas fa-map-marker-alt"></i>
        <p style={{ margin: 0, fontSize: "14px", textAlign: "center" }}>
          {address}
        </p>
      </div>
    </div>
  );
};

export default TruckWithTemprature;
