'use client'
import React from "react";
import Image from "next/image";
import { ToastContainer } from "react-toastify";

function ListItem(props: any) {
  return (
    <>
      <ToastContainer />
      <tr>
        <td className="user-item list-item">
          <div className="userImg ">
            {/* <img src={props.img} className="img" alt="user" /> */}
            <Image src={props.img} className="img" alt="user" />
          </div>
          <div className="user-name">
            <h5>{props.userName}</h5>
            <span>{props.userEmail}</span>
          </div>
        </td>
        <td>{props.userType}</td>
        <td>{props.mobileno}</td>

        <td className="user-status">
          <p>{props.status}</p>
        </td>
        <td>{props.joinDate}</td>
        <td>
          <button title="Shadow login" type="button" className="btn-primary">
            <i className="fa fa-sign-in"></i>
          </button>
        </td>
      </tr>
    </>
  );
}

export default ListItem;
