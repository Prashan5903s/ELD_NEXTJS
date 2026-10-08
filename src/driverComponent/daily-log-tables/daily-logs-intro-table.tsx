"use client";

import "./styles.css";
import React, { useEffect, useState, lazy, memo, Suspense } from "react";
import axios from "axios";
import Image from "next/image";
import Skeleton from "react-loading-skeleton"; // Import Skeleton
import logo from "../../../public/media/logos/demo.svg";
import pdfBranding from "../../../public/assets/pdf-branding.png";
const LineChart = lazy(() => import("@/Components/GraphComponents/LineChart"));

const MapKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY;

const frontEndURL = process.env.NEXT_PUBLIC_ASSERT_URL;

const DriversDailyLog = ({ logData, DOTData }: { logData: any, DOTData: any }) => {

  const MemoizedLineChart = memo(LineChart);

  const currentTime = DOTData && DOTData['currentTime'];

  const formattedDate = currentTime ? new Date(currentTime).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  return (
    <div className="mt-4">
      <div>
        <LogComponent formatTime={formattedDate} DOTData={DOTData} />
      </div>

      {DOTData && DOTData['dot_data'] && DOTData['dot_data'].map((data, index) => {
        const keys = data ? Object.keys(data) : []; // Ensure you're mapping through each `data` object

        const todayDate = keys[0] ? new Date(keys[0]).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : '';

        var datas = data[keys[0]];

        return (
          <div key={index}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <Image
                  className="logo"
                  src={logo}
                  alt="logo"
                  width={158}
                  height={150}
                />
              </div>
              <div>
                <strong>{`DRIVER'S DAILY LOG`}</strong>
                <p className="m-0">{DOTData['data'] && DOTData['data']['rule_assign'] && DOTData['data']['rule_assign']['rule'] && DOTData['data']['rule_assign']['rule']['title']}</p>
              </div>
              <div>
                <p className="m-0">
                  <strong>Log Date:</strong> {todayDate}
                </p>
                <p className="m-0">
                  <strong>Print Date:</strong> {formattedDate}
                </p>
              </div>
            </div>
            <DriverDetails data={logData} userData={DOTData['data']} compName={DOTData['eld_comp_name']} datas={datas} dates={keys[0]} />
            <div style={{ marginTop: "25px" }}>
              {datas['dot_graph'] ? (
                <Suspense fallback={<Skeleton height={200} />}>
                  <MemoizedLineChart
                    params={datas['dot_graph']}
                  />{" "}
                  {/* Correctly use graphDatas */}
                </Suspense>
              ) : (
                <Skeleton height={200} width={180} />
              )}
            </div>
            <LogTable datas={datas} dates={keys[0]} />
            <div style={{ marginBottom: "480px" }}>
              <DriverLogs datas={datas} dates={keys[0]} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DriversDailyLog;

interface DriverDetailsProps {
  data: {
    driver: string;
    coDrivers?: string;
    fleetID?: string;
    exemptDriver: number;
    driverLicense: string;
    vehicleLicense: string;
    distance: string;
    engineHours: string;
    odometers: string;
    shippingDocs: string;
    currentLocation?: string;
    periodStarting: string;
    dataDiagIndicators: string;
    eldMalfunctionIndicators: string;
    eldID: string;
    eldProvider: string;
    vehiclesAndVINs: string;
    trailers?: string;
    carrierDOT: string;
    mainOffice: string;
    homeTerminal: string;
  };
  userData: any;
  compName: any;
  datas: any;
  dates: any;
}

const DriverDetails: React.FC<DriverDetailsProps> = ({ data, userData, compName, datas, dates }: { data: any, userData: any, compName: any, datas: any, dates: any }) => {

  const hosData = datas?.hos_data[0][dates]

  const userInfo = hosData[1][0];

  const coDriver = hosData[5];

  const malFunctionCheck = datas['malfun_check'];

  const userDetail = hosData[1][3];

  const licenseNumber = userDetail['licenseNumber']

  const mainOfficeAddress = userDetail['main_office_address'];

  const homeTerminalAddress = userDetail['home_terminal']['address'];

  const carrerName = userDetail['career_name'];

  const USDOTNumber = userDetail['carrer_us_dot_number'];

  const [addresses, setAddresses] = useState();

  const fetchAddress = async (latitude, longitude) => {
    try {
      // Check if latitude and longitude are valid numbers
      if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
        throw new Error('Invalid coordinates');
      }

      const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
        params: {
          latlng: `${latitude},${longitude}`,
          key: `${MapKey}`,
        },
      });

      const address = response.data.results[0]?.formatted_address || "Address not found";
      setAddresses(address);

    } catch (error) {
      console.error("Error fetching address:", error);
      return "Error fetching address";
    }
  };

  useEffect(() => {
    if (datas['end_loc'][0] && datas['end_loc'][1]) {
      fetchAddress(datas['end_loc'][0], datas['end_loc'][1]);
    }
  }, [datas['end_loc'][0], datas['end_loc'][1]])

  const timeString = hosData && hosData[2] && hosData[2][0] && hosData[2][0][4];
  var timeSlot = null;

  if (timeString === "12:00 AM") {
    timeSlot = 'midnight';
  } else if (timeString === "12:00 PM") {
    timeSlot = 'midday';
  }

  return (
    <div className="driver-details-container">
      <table className="driver-details-table">
        <tbody>
          <tr>
            <th>Driver</th>
            <td>{`${userInfo && userInfo['last_name']} ${userInfo && userInfo['first_name']}`}</td>
            <th>Co-Drivers</th>
            <td>
              {coDriver?.map(cd => `${cd.last_name} ${cd.first_name}`).join(', ')}
            </td>
          </tr>
          {/* <tr>
            <th>Fleet ID</th>
            <td>{data.fleetID || ""}</td>
            <th>Exempt Driver</th>
            <td>{data.exemptDriver}</td>
          </tr> */}
          <tr>
            <th>Driver License</th>
            <td>{licenseNumber}</td>
            <th>Vehicle License</th>
            <td>
              {datas['dot_graph'][1].map((data, index) => (
                data['license_plate'] + ", "
              ))}
            </td>
          </tr>
          <tr>
            <th>Distance</th>
            <td>{datas && datas['vehicle_data'] && datas['vehicle_data']['total_distance'] + " mi"}</td>
            <th>Engine Hours</th>
            <td>{data.engineHours}</td>
          </tr>
          <tr>
            <th>Odometers</th>
            <td>{datas && datas['vehicle_data'] && (datas['vehicle_data']['start_odometer'] + " - " + datas['vehicle_data']['end_odometer'] + " mi")}</td>
            {/* <th>Shipping Docs</th>
            <td>{data.shippingDocs}</td> */}
          </tr>
          <tr>
            <th>Current Location</th>
            <td>{addresses ? addresses : ""}</td>
            <th>24-Period Starting</th>
            <td>{timeSlot}</td>
          </tr>
          <tr>
            {/* <th>Data Diag. Indicators</th>
            <td>{data.dataDiagIndicators}</td> */}
            <th>ELD Malfn. Indicators</th>
            <td>{(malFunctionCheck ? "Yes" : "No")}</td>
          </tr>
          <tr>
            <th>ELD ID</th>
            <td>{compName}</td>
            <th>ELD Provider</th>
            <td>{compName}</td>
          </tr>
          <tr>
            <th>Vehicles and VINs</th>
            <td>
              {datas && datas['dot_graph'] && datas['dot_graph'][1].map((data) => (
                data['name'] + " (" + data['vin'] + "), "
              ))}
            </td>
          </tr>
          {/* <tr>
            <th>Trailers</th>
            <td>{data.trailers || ""}</td>
          </tr> */}
          <tr>
            <th>Carrier and DOT#</th>
            <td>{carrerName && USDOTNumber && (carrerName + " " + "(" + USDOTNumber + ")")}</td>
          </tr>
          <tr>
            <th>Main Office</th>
            <td>{mainOfficeAddress ? mainOfficeAddress : ''}</td>
          </tr>
          <tr>
            <th>Home Terminal</th>
            <td>{homeTerminalAddress}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const LogComponent = ({ formatTime, DOTData }) => {

  const eldMail = DOTData && DOTData['eld_mail'];

  const eldURL = DOTData && DOTData['eld_mail'];

  const eldMobileNo = DOTData && DOTData['eld_mobileNo'];

  // Ensure that formatTime is a valid string or formatted value
  const formattedTime = formatTime ? new Date(formatTime).toLocaleString() : '';

  return (
    <div className="log-container">
      <div className="logo">
        <Image
          className="logo"
          src={logo}
          alt="Motive Logo"
          width={158}
          height={150}
        />
      </div>

      <div>
        <p>
          <strong className="highlight">
            {DOTData?.data?.user?.first_name} {DOTData?.data?.user?.last_name}
          </strong>{" "}
          sent <strong className="highlight">8 logs</strong>
          <br />
          from the Motive Electronic Logbook App
        </p>

        <table className="details-table">
          <tbody>
            <tr>
              <td>
                <strong>To:</strong>
              </td>
              <td className="blue-text">
                {DOTData?.data?.user?.first_name} {DOTData?.data?.user?.last_name}
              </td>
              <td>
                <strong>Date:</strong>
              </td>
              <td className="blue-text">{formattedTime}</td>
            </tr>
            <tr>
              <td>
                <strong>Contents:</strong>
              </td>
              <td className="blue-text" colSpan={3}>
                8 Logs, No Inspections
              </td>
            </tr>
          </tbody>
        </table>

        <div className="footer">
          <p className="platform-text mt-12">
            One platform for all types of fleets
          </p>
          <p className="description-text">
            Whether your fleet is local or over the road, Motive is the complete
            solution for your fleet.
          </p>
        </div>

        {/* <div className="branding-container"> */}
        <Image
          className="pdf-branding"
          src={pdfBranding}
          width={650}
          height={650}
          alt="PDF Branding"
        />
        {/* </div> */}

        <p className="fs-5 text-dark">
          Email us at{" "}
          <a href={`mailto:${eldMail}`} className="text-primary text-decoration-none">
            {eldMail}
          </a>{" "}
          or call{" "}
          <strong className="text-primary">{eldMobileNo}</strong> to order your ELDs today!
        </p>

        <div className="d-flex justify-content-between mt-4">
          <div>
            <p className="mb-0">{eldURL}</p>
          </div>
          <div className="d-flex" style={{ gap: "30px" }}>
            <div className="text-muted">{eldMobileNo}</div>
            <div>
              <a href="mailto:sales@gomotive.com" className="text-primary text-decoration-none">
                {eldMail}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const LogTable = ({ datas, dates }: { datas: any, dates: any }) => {

  const hosData = datas['hos_data'][0][dates][2];

  return (
    <div className="log-table-container">
      <table className="log-table">
        <thead>
          <tr>
            <th>No.</th>
            <th>Status</th>
            <th>Start (MST)</th>
            <th>Duration</th>
            <th>Location</th>
            {/* <th>Engine (elapsed)</th> */}
            <th>Odo (accum.)</th>
            <th>CMV</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {hosData && hosData.length > 0 && hosData.map((data, index) => (
            <tr key={index}>
              <td>
                <div>{index + 1}</div>
              </td>
              <td>{data[1]}</td>
              <td>
                <div className="driver-logs-details">{data[4]}</div>
              </td>
              <td>
                <div className="driver-logs-details">{data[0]}</div>
              </td>
              <td>
                <div className="driver-logs-details">{data[8]}</div>
              </td>
              {/* <td>
                <div className="driver-logs-details">{data.engine}</div>
              </td> */}
              <td>
                <div className="driver-logs-details">{data[7]}</div>
              </td>
              <td>
                <div className="driver-logs-details">{data[3]}</div>
              </td>
              <td>
                <div className="driver-logs-details">{data[2] ? data[2] : '...'}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const DriverLogs = ({ datas, dates }: { datas: any, dates: any }) => {

  const logData = datas['hos_data'][0][dates][2];

  const unsignedLog = datas['unsigned_log'];

  return (
    <div className="driver-logs-container">
      <div
        style={{
          border: "2px solid black",
          borderBottom: 0,
          textAlign: "center",
        }}
      >
        <strong>Odometers</strong>
      </div>
      <table>
        <thead>
          <tr className="tr-row">
            <th>Vehicle</th>
            <th>Start</th>
            <th>End</th>
            <th>Distance</th>
          </tr>
        </thead>
        <tbody>
          {logData && logData.length > 0 && logData.map((row, index) => (
            <tr className="tr-row" key={index}>
              <td>{row[3]}</td>
              <td>{row[7]}</td>
              <td>{logData && logData[index + 1] && logData[index + 1][7] ? logData[index + 1][7] : '...'} </td>
              <td>{(logData && logData[index + 1] && logData[index + 1][7]) ? (logData[index + 1][7] - row[7]) : '...'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="driver-certification">
        <p className="text-center mt-4">
          <strong>
            I hereby certify that my data entries and my record of duty status
            for this day are true and correct
          </strong>
        </p>
        <div className="driver-signature">
          {(!unsignedLog || unsignedLog == null || unsignedLog == 'null') ? (
            <div className="hr"></div>
          ) : (
            <div className="d-flex align-items-center justify-content-center flex-column">
              <img
                src={`${frontEndURL}/signature/${unsignedLog['signature']}`}
                alt="driver_signature"
                className="img-fluid"
                style={{ width: "120px", height: "50px" }}
              />
              <div className="hr"></div>
            </div>
          )}
          <p className="mt-4 text-center">
            <strong>Driver Signature</strong>
          </p>
        </div>
      </div>
    </div >
  );
};

