import React from 'react';
import { useTable } from 'react-table';

const truckDetails1 = [{ color: 'purple', text: '302' }];
const truckDetails2 = [{ color: 'purple', text: '302' }];
const truckDetails3 = [{ color: 'purple', text: '302' }];

// Complete data
const data = [
  { status: 4, time: '0:00', truckDetails: truckDetails1 },
  { status: 2, time: '4:00', truckDetails: truckDetails2 },
  { status: 3, time: '2:30', truckDetails: truckDetails2 },
  { status: 4, time: '1:15', truckDetails: truckDetails1 },
  { status: 1, time: '3:45', truckDetails: truckDetails3 },
  { status: 2, time: '2:20', truckDetails: truckDetails3 },
  { status: 3, time: '1:10', truckDetails: truckDetails2 },
  { status: 4, time: '1:30', truckDetails: truckDetails2 },
  { status: 1, time: '2:20', truckDetails: truckDetails2 },
  { status: 2, time: '2:10', truckDetails: truckDetails1 },
  { status: 4, time: '3:00', truckDetails: truckDetails1 },
];

const parseTime = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours + minutes / 60;
};

const groupDataByTruck = (data) => {
  const truckMap = new Map();

  data.forEach((entry) => {
    const truckNumber = entry.truckDetails[0].text;
    const truckColor = entry.truckDetails[0].color;
    const hours = parseTime(entry.time);

    if (!truckMap.has(truckNumber)) {
      truckMap.set(truckNumber, {
        truckNumber,
        truckColor,
        totalHours: 0,
        statusHours: {},
      });
    }

    const truckData = truckMap.get(truckNumber);
    truckData.totalHours += hours;
    truckData.statusHours[entry.status] = (truckData.statusHours[entry.status] || 0) + hours;
  });

  return Array.from(truckMap.values());
};

const transformedData = groupDataByTruck(data);

const columns = [
  { Header: 'Truck Number', accessor: 'truckNumber' },
  { Header: 'Truck Color', accessor: 'truckColor' },
  { Header: 'Total Hours', accessor: 'totalHours' },
  ...[1, 2, 3, 4].map((status) => ({
    Header: `Hours in Status ${status}`,
    accessor: (row) => row.statusHours[status] || 0,
    id: `status${status}`,
  })),
];

const Table = ({ columns, data }) => {
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({
    columns,
    data,
  });

  return (
    <table {...getTableProps()} style={{ border: 'solid 1px blue' }}>
      <thead>
        {headerGroups.map((headerGroup, index) => (
          <tr key={index}  {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column, thIndex) => (
              <th key={thIndex} {...column.getHeaderProps()} style={{ borderBottom: 'solid 3px red', background: 'aliceblue', color: 'black', fontWeight: 'bold' }}>
                {column.render('Header')}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row, tsIndex) => {
          prepareRow(row);
          return (
            <tr key={tsIndex} {...row.getRowProps()}>
              {row.cells.map((cell, TTIndex) => (
                <td key={TTIndex} {...cell.getCellProps()} style={{ padding: '10px', border: 'solid 1px gray', background: 'papayawhip' }}>
                  {cell.render('Cell')}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};


export default Table;
