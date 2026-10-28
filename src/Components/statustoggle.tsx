'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { useSession } from 'next-auth/react'

interface ToggleSwitchProps {
  status: boolean | number
  vehicleId: string | number
  updateVehiclesList?: () => void
}

interface SessionUser {
  token?: string
}

interface SessionData {
  user?: SessionUser
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  status,
  vehicleId,
  updateVehiclesList
}) => {
  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL
  const { data: session } = useSession()
  const token = (session as SessionData | null)?.user?.token

  const [isActive, setIsActive] = useState(Boolean(status))
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    setIsActive(Boolean(status))
  }, [status])

  const handleToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextStatus = event.target.checked
    const row = event.currentTarget.closest('tr')
    const vehicleName =
      row?.querySelector('td')?.textContent?.trim() || 'this vehicle'

    if (isUpdating) return

    if (!token || !url) {
      await Swal.fire({
        title: 'Error',
        text: 'Authentication or backend configuration is missing.',
        icon: 'error'
      })
      return
    }

    const action = nextStatus ? 'Activate' : 'Deactivate'
    const actionLower = nextStatus ? 'activated' : 'deactivated'

    const result = await Swal.fire({
      text: `Are you sure you want to ${action} ${vehicleName}?`,
      icon: 'warning',
      showCancelButton: true,
      buttonsStyling: false,
      confirmButtonText: `Yes, ${action}!`,
      cancelButtonText: 'No, cancel',
      customClass: {
        confirmButton: 'btn fw-bold btn-danger',
        cancelButton: 'btn fw-bold btn-active-light-primary'
      }
    })

    // Keep the existing state if the user cancels.
    if (!result.isConfirmed) return

    setIsUpdating(true)

    try {
      await Swal.fire({
        text: `${action}ing ${vehicleName}...`,
        icon: 'info',
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading()
      })

      // Preserves your existing API method and endpoint.
      // Verify that your backend supports this for BOTH actions.
      const response = await axios.delete(
        `${url}/transport/vehicle/${vehicleId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.status === 200) {
        setIsActive(nextStatus)

        await Swal.fire({
          text: `${vehicleName} has been ${actionLower}!`,
          icon: 'success',
          buttonsStyling: false,
          confirmButtonText: 'OK',
          customClass: {
            confirmButton: 'btn fw-bold btn-primary'
          }
        })

        updateVehiclesList?.()
      } else {
        throw new Error('Failed to change vehicle status.')
      }
    } catch (error) {
      console.error('Error updating vehicle status:', error)

      await Swal.fire({
        text: `${vehicleName} could not be ${actionLower}.`,
        icon: 'error',
        confirmButtonText: 'OK'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <label className='form-switch form-check-solid'>
      <input
        type='checkbox'
        className='form-check-input border'
        checked={isActive}
        onChange={handleToggle}
        disabled={isUpdating}
        aria-label={`Toggle status for vehicle ${vehicleId}`}
      />
    </label>
  )
}

export default ToggleSwitch
