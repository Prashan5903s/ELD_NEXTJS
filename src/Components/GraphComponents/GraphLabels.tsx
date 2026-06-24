import React from 'react';

const GraphLabels = () => {
  const labels = [
    { color: 'gray', text: 'OFF' },
    { color: 'blue', text: 'SB' },
    { color: 'green', text: 'D' },
    { color: 'orange', text: 'ON' },
  ];

  return (
    <div style={{ flexGrow: '1', display: 'flex', justifyContent: 'left', alignItems: 'flex-end', paddingBottom: '10px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', height: '78%' }}>
        {labels.map((label, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'left', alignItems: 'flex-end', paddingBottom: '10px' }}>
            <div style={{ width: '10px', height: '10px', backgroundColor: label.color, margin: '0px 5px 5px 0px' }}></div>
            <p style={{ margin: '0', textAlign: 'left' }}>{label.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GraphLabels;
