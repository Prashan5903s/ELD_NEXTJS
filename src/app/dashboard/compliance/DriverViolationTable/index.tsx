import React from "react";
import "./style.css";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import {
  Column,
  ColumnDef,
  ColumnFiltersState,
  RowData,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Driver } from "./data";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

const ViaolationTable = ({ tableData, loading }: { tableData: Driver[], loading: Boolean }) => {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  const columns = React.useMemo<ColumnDef<Driver, any>[]>(
    () => [
      {
        accessorFn: (row) => `${row.driver}`,
        id: "fullName",
        header: "Driver",
        cell: (info) => info.getValue(),
        enableColumnFilter: true,
      },
      {
        accessorFn: (row) => `${row.hoursInViolation}`,
        id: "hoursInViolation",
        header: "Hours In Violation",
        cell: (info) => info.getValue(),
        enableColumnFilter: false,
      },
    ],
    []
  );

  const table = useReactTable({
    data: tableData,
    columns,
    filterFns: {},
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    debugTable: true,
    debugHeaders: true,
    debugColumns: false,
  });
  const driverColumn = table.getColumn("fullName");

  if (!loading) {
    return (
      <>
        {/* <hr /> */}
        <div className="mt-4 d-flex justify-content-between align-items-center">
          <div>
            <h2><Skeleton width={180} height={20} /></h2>
          </div>
          <div className="d-flex">
            <div className="d-flex align-items-stretch position-relative">
              <i className="ki-outline ki-magnifier search-icon fs-2 text-gray-500 position-absolute top-50 translate-middle-y ms-2"></i>
              <Skeleton width={180} height={20} />
            </div>
            <div className="d-flex align-items-center gap-2">
              <Skeleton width={90} height={20} />
            </div>
          </div>
        </div>
        {/* <hr /> */}
        <div className="p-2">
          <table>
            <thead>
              <tr>
                <th colSpan={1} style={{ width: '50%' }}>
                  <div className="cursor-pointer select-none d-flex"><Skeleton width={100} height={20} /></div>
                </th>
                <th colSpan={1} style={{ width: '50%' }}>
                  <div className="cursor-pointer select-none d-flex"><Skeleton width={100} height={20} /></div>
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: <Skeleton width={100} height={20} />, violation: <Skeleton width={100} height={20} /> },
                { name: <Skeleton width={100} height={20} />, violation: <Skeleton width={100} height={20} /> },
                { name: <Skeleton width={100} height={20} />, violation: <Skeleton width={100} height={20} /> },
                { name: <Skeleton width={100} height={20} />, violation: <Skeleton width={100} height={20} /> },
                { name: <Skeleton width={100} height={20} />, violation: <Skeleton width={100} height={20} /> },
                { name: <Skeleton width={100} height={20} />, violation: <Skeleton width={100} height={20} /> },
                { name: <Skeleton width={100} height={20} />, violation: <Skeleton width={100} height={20} /> },
                { name: <Skeleton width={100} height={20} />, violation: <Skeleton width={100} height={20} /> },
                { name: <Skeleton width={100} height={20} />, violation: <Skeleton width={100} height={20} /> },
                { name: <Skeleton width={100} height={20} />, violation: <Skeleton width={100} height={20} /> },
                { name: <Skeleton width={100} height={20} />, violation: <Skeleton width={100} height={20} /> },
              ].map((driver, index) => (
                <tr key={index}>
                  <td>
                    <div className="d-flex">{driver.name}</div>
                  </td>
                  <td>
                    <div className="d-flex">{driver.violation}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="h-2"></div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* <hr /> */}
      <div className=" mt-4 d-flex flex-wrap justify-content-between align-items-center">
        <div>
          <h2>Drivers</h2>
        </div>

        <div className="d-flex">
          <Filter column={driverColumn} />
          <div className="d-flex align-items-center gap-2">
            <button
              className="border rounded p-1"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              {"<"}
            </button>
            <span className="flex items-center gap-1">
              <strong>
                {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </strong>
            </span>
            <button
              className="border rounded p-1"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              {">"}
            </button>
          </div>
        </div>
      </div>
      {/* <hr /> */}

      <div className="p-2">
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{ width: "50%" }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: header.column.getCanSort()
                            ? "cursor-pointer select-none d-flex"
                            : "d-flex",
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: " 🔼",
                          desc: " 🔽",
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      <div className="d-flex">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={table.getAllColumns().length}
                  className="text-center"
                  style={{ padding: '20px', textAlign: 'center' }}
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="h-2" />
      </div>
    </>
  );
};

function Filter({ column }: { column: Column<any, unknown> }) {
  const columnFilterValue = column.getFilterValue();
  const { filterVariant } = column.columnDef.meta ?? {};

  return filterVariant === "range" ? (
    <div>
      <div className="flex space-x-2">
        {/* See faceted column filters example for min max values functionality */}
        <DebouncedInput
          type="number"
          value={(columnFilterValue as [number, number])?.[0] ?? ""}
          onChange={(value) =>
            column.setFilterValue((old: [number, number]) => [value, old?.[1]])
          }
          placeholder={`Min`}
          className="w-24 border shadow rounded"
        />
        <DebouncedInput
          type="number"
          value={(columnFilterValue as [number, number])?.[1] ?? ""}
          onChange={(value) =>
            column.setFilterValue((old: [number, number]) => [old?.[0], value])
          }
          placeholder={`Max`}
          className="w-24 border shadow rounded"
        />
      </div>
      <div className="h-1" />
    </div>
  ) : filterVariant === "select" ? (
    <select
      onChange={(e) => column.setFilterValue(e.target.value)}
      value={columnFilterValue?.toString()}
    >
      {/* See faceted column filters example for dynamic select options */}
      <option value="">All</option>
      <option value="complicated">complicated</option>
      <option value="relationship">relationship</option>
      <option value="single">single</option>
    </select>
  ) : (
    <DebouncedInput
      className="w-36 border shadow rounded"
      onChange={(value) => column.setFilterValue(value)}
      placeholder={`Search...`}
      type="text"
      value={(columnFilterValue ?? "") as string}
    />
  );
}

function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <div className=" d-flex align-items-stretch  position-relative">
      <i className="ki-outline ki-magnifier search-icon fs-2 text-gray-500 position-absolute top-50 translate-middle-y ms-2"></i>
      <input
        {...props}
        placeholder="Search drivers"
        value={value}
        style={{
          border: "none",
          outline: "none",
          padding: "10px",
          background: "#f6f7f9",
          boxShadow: "none",
          paddingLeft: "30px",
          marginRight: "20px",
        }}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}

export default ViaolationTable;
