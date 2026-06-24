'use client'

import EditHOSChart from '../../../Components/EditGraphComponent/Linechart'

const apiData = {
  '2026-06-15': [
    [[7408, 1, 'Off duty', '00:00', '23:59', 'A02']],
    [
      {
        id: 9,
        name: 'A02',
        master_company_id: 94,
        master_id: 95,
        vin: '1XPBDP9XXLD633459'
      }
    ],
    {
      total_log_count: 1
    }
  ]
}

export default function EditHosChart () {
  const handleSegmentsChange = segments => {
    console.log(segments)
  }

  return (
    <EditHOSChart
      params={apiData['2026-06-15']}
      editable={true}
      onSegmentsChange={handleSegmentsChange}
    />
  )
}
