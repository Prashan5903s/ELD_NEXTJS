"use client";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function Shadow({ val = 5, header = 5 }) {
  return (
    <>
      <div className="table-responsive">
        <table
          className=" table-row-dashed table-striped  dataTable fs-6 gy-5 no-footer"
          id="kt_tr_u_table"
        >
          <thead>
            <tr className="fs-7">
              {[...Array(header)].map((_, headerIndex) => (
                <th key={headerIndex} className="text-start">
                  <Skeleton />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-gray-600 fw-semibold">
            {[...Array(val)].map((_, rowIndex) => (
              <tr key={rowIndex}>
                {[...Array(header)].map((_, colIndex) => (
                  <td key={colIndex}>
                    <Skeleton />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
