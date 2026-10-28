'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { useSession } from 'next-auth/react'

interface ToggleSwitchProps {
  status: boolean | number
  vehicleId: string | number
  vehicleName?: string
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
  vehicleName = 'this vehicle',
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
    const checkbox = event.currentTarget
    const nextStatus = checkbox.checked

    // Prevent multiple requests while one is in progress.
    if (isUpdating) return

    if (!token || !url) {
      checkbox.checked = isActive

      await Swal.fire({
        title: 'Error',
        text: 'Authentication or backend configuration is missing.',
        icon: 'error'
      })
      return
    }

    const action = nextStatus ? 'activate' : 'deactivate'
    const actionPast = nextStatus ? 'activated' : 'deactivated'

    const result = await Swal.fire({
      title: 'Confirm action',
      text: `Are you sure you want to ${action} ${vehicleName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Yes, ${action}`,
      cancelButtonText: 'Cancel'
    })

    if (!result.isConfirmed) {
      // Restore the checkbox to its current React state.
      checkbox.checked = isActive
      return
    }

    setIsUpdating(true)

    try {
      // IMPORTANT: Do not await this loading dialog.
      // Awaiting it would block the API request until the dialog closes.
      void Swal.fire({
        title: 'Please wait',
        text: `${action}ing ${vehicleName}...`,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
      })

      // Keep your existing endpoint and HTTP method.
      // Verify that this DELETE endpoint supports both status changes.
      const response = await axios.delete(
        `${url}/transport/vehicle/${vehicleId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.status < 200 || response.status >= 300) {
        throw new Error('Failed to update vehicle status.')
      }

      setIsActive(nextStatus)

      // Close the loading dialog before showing the result.
      Swal.close()

      await Swal.fire({
        title: 'Success',
        text: `${vehicleName} has been ${actionPast}.`,
        icon: 'success'
      })

      updateVehiclesList?.()
    } catch (error) {
      console.error('Error updating vehicle status:', error)

      Swal.close()

      // Restore the original status if the request fails.
      setIsActive(Boolean(status))

      await Swal.fire({
        title: 'Error',
        text: `Could not ${action} ${vehicleName}. Please try again.`,
        icon: 'error'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <label className='form-check form-switch form-check-solid'>
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
