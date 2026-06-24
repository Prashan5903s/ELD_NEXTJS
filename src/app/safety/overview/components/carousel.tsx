"use client";

import React from "react";
import { Carousel } from "react-bootstrap";
import "../style.css";
import styles from "./CarouselComponent.module.css";
import { useScreenWidth } from "@/Components/hooks/useScreenWidth";

// Data set

type Props = {
  id: number;
  image: string;
  title: string;
  description: string;
}[];

// Helper function to chunk data into groups of 3 items per slide
const chunkData = (data, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }
  return chunks;
};

const CarouselComponent = ({ data }: { data: Props }) => {
  const { screenWidth } = useScreenWidth();
  const itemsPerSlide = screenWidth < 420 ? 1 : screenWidth > 1200 ? 4 : 2;
  const chunkedData = chunkData(data, itemsPerSlide);

  return (
    screenWidth !== null && (
      <div className="multi-item-carousel">
        <Carousel indicators={false}>
          {chunkedData.map((chunk, slideIndex) => (
            <Carousel.Item key={slideIndex}>
              <div className="d-flex justify-content-around">
                {chunk.map((item) => (
                  <div className="carousel-item-container" key={item.id}>
                    <img
                      className="d-block w-100"
                      src={item.image}
                      alt={item.title}
                    />
                    <div style={{ padding: "0 10px" }}>
                      <div className="d-flex p-2 pt-4">
                        <div>
                          <span>Unsafe lane change</span>
                        </div>
                        <div>
                          <span
                            style={{ background: "#dac3c1", color: "Red" }}
                            className="p-1"
                          >
                            High
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 d-flex p-2 pb-4">
                        <div
                          style={{
                            color: "#1890ff",
                            fontSize: "12px",
                            fontFamily: "300",
                          }}
                        >
                          Amarjit Singh
                        </div>
                        <span>9:15pm</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Carousel.Item>
          ))}
        </Carousel>
      </div>
    )
  );
};

export default CarouselComponent;
