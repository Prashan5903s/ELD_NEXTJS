import React from 'react';


const TimeFields = ({ timeMap }) => {
  return (
    <div style={{ flex: '1', display: 'flex', justifyContent: 'left', alignItems: 'flex-end', paddingBottom: '28px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', height: '75%', borderBottomWidth: '2px', borderBottomColor: '#D3D3D3', borderBottomStyle: 'solid' }}>
        <div style={{ display: 'flex', justifyContent: 'left', alignItems: 'flex-end', paddingBottom: '10px' }}>
          <p style={{ margin: '0', textAlign: 'left' }}>{ timeMap[4] }</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'left', alignItems: 'flex-end', paddingBottom: '10px' }}>
          <p style={{ margin: '0', textAlign: 'left' }}>{ timeMap[3] }</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'left', alignItems: 'flex-end', paddingBottom: '10px' }}>
          <p style={{ margin: '0', textAlign: 'left' }}>{ timeMap[2] }</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'left', alignItems: 'flex-end', paddingBottom: '10px' }}>
          <p style={{ margin: '0', textAlign: 'left' }}>{ timeMap[1] }</p>
        </div>
      </div>
    </div>
  );
};

export default TimeFields;
