"use client";

import React from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

import styles from "../app/dashboard/safety/components/carousel.module.css";

const TooltipWrapper = ({ children, tooltipText }) => {
  return (
    <OverlayTrigger
      placement="top"
      overlay={<Tooltip id="tooltip-top">{tooltipText}</Tooltip>}
    >
      <span>{children}</span>
    </OverlayTrigger>
  );
};

export default TooltipWrapper;
