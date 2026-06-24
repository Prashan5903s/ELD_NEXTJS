import React from 'react';

interface TimeFieldsProps {
  timeMap: Record<number, string>;
}

const TimeFields: React.FC<TimeFieldsProps> = ({ timeMap }) => {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'left',
        alignItems: 'flex-end',
        paddingBottom: '28px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          height: '75%',
          borderBottom: '2px solid #D3D3D3',
        }}
      >
        {[4, 3, 2, 1].map((key) => (
          <div
            key={key}
            style={{
              display: 'flex',
              justifyContent: 'left',
              alignItems: 'flex-end',
              paddingBottom: '10px',
            }}
          >
            <p style={{ margin: 0, textAlign: 'left' }}>
              {timeMap?.[key] ?? '0:00:00'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimeFields;