'use client'
import React, { useMemo, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { debounce } from 'lodash'
import { DemoContainer, DemoItem } from '@mui/x-date-pickers/internals/demo'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import Link from 'next/link'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import Select from 'react-select'
import { toast } from 'react-toastify'
import RecipientModal from '../../../../Components/recipientModal'
import dayjs from 'dayjs'
import 'react-toastify/dist/ReactToastify.css'
import { useSession } from 'next-auth/react'
import LoadingIcons from 'react-loading-icons'
import Skeleton from 'react-loading-skeleton' // Import Skeleton
import 'react-loading-skeleton/dist/skeleton.css' // Import Skeleton CSS
const AddalertModal = ({ id, close, open, updateVehiclesList }) => {
  const [vehicleField, setVehicleField] = useState({
    name: '',
    Range: '',
    Type: '',
    driver: '',
    vehicle: '',
    recipient: '',
    priority: '',
    method: '',
    dataType: ''
  })

  const { data: session } = useSession() || {}

  const token = session && session.user && session?.user?.token

  const router = useRouter()
  const [checkError, setCheckError] = useState()
  const [errors, setErrors] = useState({})
  const [placeHold, setPlaceHold] = useState()
  const [recipient, setRecipient] = useState([])
  const [editData, setEditData] = useState(null)
  const [condCheck, setCondCheck] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formValue, setFormValue] = useState({})
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [recipientModal, setRecipientModal] = useState(false)
  const [selectedTime, setSelectedTime] = useState(0)
  const [isImportant, setIsImportant] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState(0)
  const [selectedCustomTime, setSelectedCustomTime] = useState([])
  const [selectedOptions, setSelectedOptions] = useState([])
  const [selectedVehOpt, setSelectedVeh] = useState([])
  const [selectOpt, setSelectOpt] = useState(null)
  const [startTimes, setStartTimes] = useState(null)
  const [endTimes, setEndTimes] = useState(null)
  const [error, setError] = useState('') // Error message state
  const [vehChngs, setVehChngs] = useState(false)
  const [driveChngs, setDriveChngs] = useState(false)

  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL

  // const notify = () => toast("Wow so easy!");

  const notify = () =>
    toast.success(`Alert ${id ? 'update' : 'added'} successfully!`, {
      position: 'top-right',
      autoClose: 1000, // Auto-dismiss after 3 seconds
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    })

  const changeVehicleFieldHandler = useCallback(
    e => {
      if (e.target?.dataset?.field === 'trigger_range') {
        e.target.value = e.target.dataset.id
      }

      const fieldName = e.target?.dataset?.field ?? e.target?.name
      const fieldValue = e.target?.dataset?.field
        ? e.target.dataset.id
        : ['driver', 'vehicle', 'recipient'].includes(e.target?.name) &&
          e.target?.value.length === 0
        ? ''
        : e.target?.value

      setVehicleField(prevFields => ({
        ...prevFields,
        [fieldName]: fieldValue
      }))
    },
    [setVehicleField]
  )

  const useDebouncedSubmit = (callback, delay) => {
    return useCallback(debounce(callback, delay), [callback, delay])
  }

  let userId = id ? id : null

  useEffect(() => {
    if (recipient.length == 0) {
      setPlaceHold(false)
    }

    if (recipient && recipient.length > 0 && formValue) {
      const driverLen = formValue['driver'].length
      const fleetUserLen = formValue['fleetUser'].length

      // Convert recipient array into a Set for faster lookup
      const recipientIds = new Set(recipient.map(r => r))

      // Count matches in formValue['driver']
      const driverMatches =
        formValue['driver']?.filter(driver =>
          recipientIds.has(driver.id.toString())
        ).length || 0

      // Count matches in formValue['fleetUser']
      const fleetUserMatches =
        formValue['fleetUser']?.filter(user =>
          recipientIds.has(user.id.toString())
        ).length || 0

      const paraGraph = (() => {
        if (driverLen > 0 && fleetUserLen > 0) {
          if (
            fleetUserMatches === fleetUserLen &&
            driverMatches === driverLen
          ) {
            return 'All fleet user and all driver'
          }
          if (fleetUserMatches > 0 && driverMatches > 0) {
            return `${fleetUserMatches} fleet user and ${driverMatches} driver`
          }
          return fleetUserMatches > 0
            ? `${fleetUserMatches} fleet user`
            : `${driverMatches} driver`
        }

        if (fleetUserLen > 0) {
          return fleetUserMatches === fleetUserLen
            ? 'All fleet user'
            : `${fleetUserMatches} fleet user`
        }

        if (driverLen > 0) {
          return driverMatches === driverLen
            ? 'All driver'
            : `${driverMatches} driver`
        }

        return ''
      })()

      setPlaceHold(paraGraph)
    }
  }, [recipient, formValue])

  const formValidations = {
    name: {
      required: 'Name is required',
      minLength: {
        value: 6,
        message: 'Name must be atleast 6 characters long'
      },
      maxLength: {
        value: 60,
        message: 'Name must be at most 60 characters long'
      },
      pattern: {
        value: /^[A-Za-z0-9\s]+$/i,
        message: 'Name should be only alphanumeric characters and spaces'
      }
    },
    Type: {
      required: 'Type is required'
    },
    driver: {
      required: 'Driver is required'
    },
    vehicle: {
      required: 'Vehicle is required'
    },
    trigger_range: {
      required: 'Trigger Range is required'
    },
    Range: {
      required: 'Range is required'
    },
    dates: {
      required: 'Dates is required'
    },
    recipient: {
      required: 'Recipient is required'
    },
    priority: {},
    method: {
      required: 'Method is required'
    }
  }

  const validateForm = async () => {
    let isValid = true
    let errors = {}

    for (const [key, value] of Object.entries(formValidations)) {
      const validation = value // Type assertion for safety

      if (validation.required && !vehicleField[key]) {
        if (selectOpt === 0 && key == 'vehicle') {
          errors[key] = `${key.replace(/_/g, ' ')} is required`
          isValid = false
        } else if (selectOpt === 1 && key == 'driver') {
          errors[key] = `${key.replace(/_/g, ' ')} is required`
          isValid = false
        } else if (selectedTime == 4 && key == 'Range' && key != 'dates') {
          if (
            !startTimes ||
            !endTimes ||
            startTimes == null ||
            endTimes == null ||
            startTimes == undefined ||
            endTimes == undefined
          ) {
            setError(`${key.replace(/_/g, ' ')} is required`)
            isValid = false
          } else {
            if (
              dayjs(endTimes).isBefore(dayjs(startTimes)) ||
              dayjs(startTimes).isAfter(dayjs(endTimes))
            ) {
              isValid = false
              setCondCheck(true)
            }
          }
        } else if (selectedTime == 4 && key != 'Range' && key == 'dates') {
          errors[key] = `${key.replace(/_/g, ' ')} is required`
          isValid = false
        } else if (
          key != 'Range' &&
          key != 'dates' &&
          key != 'driver' &&
          key != 'vehicle'
        ) {
          errors[key] = `${key.replace(/_/g, ' ')} is required`
          isValid = false
        }
      } else if (
        validation.minLength &&
        vehicleField[key]?.length < validation.minLength.value
      ) {
        errors[key] = validation.minLength.message
        isValid = false
      } else if (
        validation.maxLength &&
        vehicleField[key]?.length > validation.maxLength.value
      ) {
        errors[key] = validation.maxLength.message
        isValid = false
      } else if (
        validation.pattern &&
        !validation.pattern.value.test(vehicleField[key])
      ) {
        errors[key] = validation.pattern.message
        isValid = false
      } else if (key === 'vin' && validation.validate) {
        const vinError = await validation.validate(vehicleField[key])
        if (vinError !== true) {
          errors[key] = vinError
          isValid = false
        }
      }
    }

    setErrors(errors)
    return isValid
  }

  const handleFormSubmit = async event => {
    const isValid = await validateForm() // Wait for validation to complete

    if (!isValid) {
      return // Stop form submission if validation fails
    }

    setIsLoading(true)
    try {
      const apiUrl = id
        ? `${url}/alert/user/info/${id}`
        : `${url}/alert/user/info`
      const method = id ? axios.put : axios.post
      const response = await method(apiUrl, vehicleField, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.status === 200) {
        close(false)
        updateVehiclesList()
        notify() // Show success toast notification
        router.push('/dashboard/alert')
      }
    } catch (error) {
      setCheckError(error.response?.data)
      console.error('API error:', error.response?.data || error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Create debounced function
  const debouncedSubmit = useDebouncedSubmit(handleFormSubmit, 1000) // Adjust delay as needed

  const onSubmitChange = async e => {
    e.preventDefault()
    debouncedSubmit() // Call the debounced function
  }

  const fetchData = useCallback(
    debounce(async () => {
      if (!token) return

      try {
        const response = await axios.get(`${url}/alert/user/info/create`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        setFormValue(response.data || {})
      } catch (error) {
        console.error('Error fetching data:', error.message)
      }
    }, 1000),
    [url, token]
  )

  useEffect(() => {
    if (token) {
      fetchData()
    }
  }, [fetchData, token])

  const fetchEditData = useCallback(
    debounce(async id => {
      if (!token) return

      try {
        const response = await axios.get(`${url}/alert/user/info/${id}/edit`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        setEditData(response.data)
        setVehicleField(response.data || {})
      } catch (error) {
        console.error('Error fetching data:', error.message)
      }
    }, 1000),
    [url, token]
  )

  useEffect(() => {
    if (id && token) {
      fetchEditData(id)
    }
  }, [id, fetchEditData, token])

  useEffect(() => {
    if (id) {
      if (editData && vehicleField && formValue) {
        setIsDataLoading(true)
      }
    }
  }, [id, editData, vehicleField, formValue])

  useEffect(() => {
    if (!id) {
      if (Object.keys(formValue).length > 0) {
        setIsDataLoading(true)
      }
    }
  }, [formValue])

  // Memoize driver and vehicle options to avoid unnecessary re-renders
  const driverOptions = useMemo(
    () =>
      formValue?.driver?.map(data => ({
        value: data.id,
        label: `${data.first_name} ${data.last_name}`
      })) || [],
    [formValue?.driver]
  )

  const vehOption = useMemo(
    () =>
      formValue?.vehicle?.map(data => ({
        value: data.id,
        label: data.name
      })) || [],
    [formValue?.vehicle]
  )

  const allOption = { value: 'all', label: 'Select All' }
  const clearOption = { value: 'clear', label: 'Clear Selection' }

  let isAllSelected =
    Array.isArray(editData?.driver) &&
    Array.isArray(selectedOptions) &&
    Array.isArray(driverOptions)
      ? selectedOptions.length === editData.driver.length &&
        editData.driver.length > 0
      : Array.isArray(selectedOptions) &&
        Array.isArray(driverOptions) &&
        selectedOptions.length === driverOptions.length &&
        driverOptions.length > 0

  let isAllVehSelect =
    Array.isArray(editData?.vehicle) &&
    Array.isArray(selectedVehOpt) &&
    Array.isArray(vehOption)
      ? selectedVehOpt.length === editData.vehicle.length &&
        editData.vehicle.length > 0
      : Array.isArray(selectedVehOpt) &&
        Array.isArray(vehOption) &&
        selectedVehOpt.length === vehOption.length &&
        vehOption.length > 0

  const optionsWithAll = isAllSelected
    ? [clearOption, ...driverOptions]
    : [allOption, ...driverOptions]
  const optionVehicle = isAllVehSelect
    ? [clearOption, ...vehOption]
    : [allOption, ...vehOption]

  useEffect(() => {
    changeVehicleFieldHandler({
      target: { name: 'dataType', value: selectOpt }
    })
  }, [selectOpt])

  // Handle Driver Selection
  const handleChange = selected => {
    setDriveChngs(true)
    if (!selected || selected.some(option => option.value == 'clear')) {
      setSelectedOptions([])
      changeVehicleFieldHandler({ target: { name: 'driver', value: [] } })
    } else if (selected.some(option => option.value == 'all')) {
      setSelectedOptions(driverOptions)
      changeVehicleFieldHandler({
        target: { name: 'driver', value: driverOptions.map(d => d.value) }
      })
    } else {
      setSelectedOptions(selected)
      changeVehicleFieldHandler({
        target: { name: 'driver', value: selected.map(d => d.value) }
      })
    }
  }

  // Handle Vehicle Selection
  const handleVehChange = selected => {
    setVehChngs(true)
    if (!selected || selected.some(option => option.value == 'clear')) {
      setSelectedVeh([])
      changeVehicleFieldHandler({ target: { name: 'vehicle', value: [] } })
    } else if (selected.some(option => option.value == 'all')) {
      setSelectedVeh(vehOption)
      changeVehicleFieldHandler({
        target: { name: 'vehicle', value: vehOption.map(d => d.value) }
      })
    } else {
      setSelectedVeh(selected)
      changeVehicleFieldHandler({
        target: { name: 'vehicle', value: selected.map(d => d.value) }
      })
    }
  }

  // Set initial selected values when `vehicleField` changes
  useEffect(() => {
    if (vehicleField['driver']) {
      const preSelected = driverOptions.filter(option =>
        vehicleField['driver'].includes(option.value)
      )
      if (JSON.stringify(preSelected) !== JSON.stringify(selectedOptions)) {
        setSelectedOptions(preSelected)
      }
    }
    if (vehicleField['vehicle']) {
      const preSelected = vehOption.filter(option =>
        vehicleField['vehicle'].includes(option.value)
      )
      if (JSON.stringify(preSelected) !== JSON.stringify(selectedVehOpt)) {
        setSelectedVeh(preSelected)
      }
    }
  }, [vehicleField, driverOptions, vehOption])

  const handleSelection = option => {
    setSelectedCustomTime(
      (prev = []) =>
        Array.isArray(prev)
          ? prev.includes(option)
            ? prev.filter(day => day !== option)
            : [...prev, option]
          : [option] // Ensure it's always an array
    )

    // Use a callback to get the latest state after update
    setSelectedCustomTime(prevSelected => {
      changeVehicleFieldHandler({
        target: { name: 'dates', value: prevSelected }
      })
      return prevSelected // Return the updated value
    })
  }

  const handleStartTimeChange = newValue => {
    const formattedStartTime = dayjs(newValue).format('YYYY-MM-DD HH:mm:ss')

    if (endTimes && dayjs(formattedStartTime).isAfter(dayjs(endTimes))) {
      setError('Start time cannot be greater than end time.')
    } else {
      setError('')
      setStartTimes(formattedStartTime)
    }
  }

  const handleEndTimeChange = newValue => {
    const formattedEndTime = dayjs(newValue).format('YYYY-MM-DD HH:mm:ss')

    if (startTimes && dayjs(formattedEndTime).isBefore(dayjs(startTimes))) {
      setError('End time cannot be smaller than start time.')
    } else {
      setError('') // Fix: setError instead of setErrors
      setEndTimes(formattedEndTime)
    }
  }

  const closeModal = () => {
    changeVehicleFieldHandler({
      target: { name: 'recipient', value: recipient }
    })
    setRecipientModal(false)
  }

  useEffect(() => {
    if (startTimes && endTimes) {
      changeVehicleFieldHandler({
        target: { name: 'Range', value: [startTimes, endTimes] }
      })
    }
  }, [startTimes, endTimes])

  const [typeChnge, setTypeChnge] = useState(false)

  useEffect(() => {
    if (editData) {
      if (!typeChnge) {
        setSelectOpt(editData['dataType'])
        setSelectedTime(editData['trigger_range'])
        setSelectedCustomTime(editData['dates'])
        if (editData['trigger_range'] == 4) {
          setStartTimes(editData['range'][0])
          setEndTimes(editData['range'][1])
        }
        setSelectedMethod(editData['method'])
        setIsImportant(editData['priority'])
        setPlaceHold(editData['paragraph'])
        if (editData?.driver) {
          setSelectedOptions(editData['driver'])
          isAllSelected =
            editData && editData['driver']
              ? selectedOptions.length === editData['driver'].length &&
                editData['driver'].length > 0
              : selectedOptions.length === driverOptions.length &&
                driverOptions.length > 0
        }
        if (editData?.vehicle) {
          setSelectedVeh(editData['vehicle'])
          isAllVehSelect =
            editData && editData['vehicle']
              ? selectedVehOpt.length === editData['vehicle'].length &&
                editData['vehicle'].length > 0
              : selectedVehOpt.length === vehOption.length &&
                vehOption.length > 0
        }
        setTypeChnge(true)
      }
    }
  }, [editData, selectedVehOpt, selectedOptions, typeChnge])

  if (!isDataLoading) {
    return (
      <div
        className={`modal ${open ? 'showpopup' : ''}`}
        style={{ display: 'block' }}
        aria-modal='true'
        role='dialog'
      >
        <div className='modal-dialog modal-dialog-centered w-100 mw-650px'>
          <div className='modal-content'>
            <div className='modal-header'>
              <h2 className='fw-bold'>
                <Skeleton width={180} />
              </h2>
              <div
                className='btn btn-icon btn-sm btn-active-icon-primary'
                data-bs-dismiss='modal'
              >
                <i
                  onClick={() => close(false)}
                  className='ki ki-outline ki-cross fs-1'
                ></i>
              </div>
            </div>
            <div className='modal-body mx-5 mx-xl-15 my-7'>
              <form
                id='kt_modal_add_vehicle_form'
                className='form fv-plugins-bootstrap5 fv-plugins-framework'
                onSubmit={onSubmitChange}
              >
                {Object.keys(formValidations).map((field, index) => (
                  <div className='fv-row mb-7' key={index}>
                    <label className='fs-6 fw-semibold form-label mb-2'>
                      <span
                        className={
                          formValidations[field].required ? 'required' : ''
                        }
                      >
                        {field.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </label>

                    {field === 'make' ? (
                      <Skeleton width={500} />
                    ) : field === 'fuel_type' ? (
                      <Skeleton width={500} />
                    ) : field === 'year' ? (
                      <Skeleton width={500} />
                    ) : field === 'license_state' ? (
                      <Skeleton width={500} />
                    ) : field === 'fuel_type_primary' ||
                      field === 'fuel_type_secondary' ? (
                      <Skeleton width={500} />
                    ) : field === 'throttle_wifi' ? (
                      <Skeleton width={500} />
                    ) : (
                      <Skeleton width={500} />
                    )}
                  </div>
                ))}
                <div className='d-flex justify-content-center'>
                  <Skeleton width={100} />
                  <Skeleton width={100} />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {recipientModal ? (
        <div>
          <RecipientModal
            activeModal={recipientModal}
            closeModal={closeModal}
            formValue={formValue}
            setRecipient={setRecipient}
            recipient={recipient}
            editData={editData}
          />
        </div>
      ) : (
        <div
          className={`modal ${open ? 'showpopup' : ''}`}
          style={{ display: 'block' }}
          aria-modal='true'
          role='dialog'
        >
          <div className='modal-dialog modal-dialog-centered w-100 mw-650px'>
            <div className='modal-content'>
              <div className='modal-header'>
                <h2 className='fw-bold'>
                  {id ? 'Edit an Alert' : 'Add an Alert'}
                </h2>
                <div
                  className='btn btn-icon btn-sm btn-active-icon-primary'
                  onClick={() => close(false)}
                >
                  <i className='ki ki-outline ki-cross fs-1'></i>
                </div>
              </div>
              <div className='modal-body mx-5 mx-xl-15 my-7'>
                <form
                  id='kt_modal_add_vehicle_form'
                  className='form'
                  onSubmit={onSubmitChange}
                >
                  {Object.keys(formValidations).map((field, index) => (
                    <div className='fv-row mb-7' key={index}>
                      {field == 'name' ? (
                        <div>
                          <div>
                            <label className='fs-6 fw-semibold form-label mb-2'>
                              <span
                                className={
                                  formValidations[field]?.required
                                    ? 'required'
                                    : ''
                                }
                              >
                                {field.replace(/_/g, ' ').toUpperCase()}
                              </span>
                            </label>
                          </div>
                          <div>
                            <input
                              className='form-control form-control-solid'
                              placeholder={`Enter ${field.replace(/_/g, ' ')}`}
                              name={field}
                              onChange={changeVehicleFieldHandler}
                              value={vehicleField[field]}
                            />
                          </div>
                          {errors[field] && (
                            <div style={{ color: 'red', marginTop: '5px' }}>
                              {errors[field]}
                            </div>
                          )}
                        </div>
                      ) : field === 'trigger_range' ? (
                        <div>
                          <div>
                            <label className='fs-6 fw-semibold form-label mb-2'>
                              <span
                                className={
                                  formValidations[field]?.required
                                    ? 'required'
                                    : ''
                                }
                              >
                                {field.replace(/_/g, ' ').toUpperCase()}
                              </span>
                            </label>
                          </div>

                          <div
                            className='btn-group d-flex gap-2'
                            role='group'
                            aria-label='Time Selection'
                          >
                            {['All times', 'Weekdays', 'Weekend', 'Custom'].map(
                              (option, index) => (
                                <button
                                  key={index + 1}
                                  data-id={index + 1}
                                  data-field={'trigger_range'}
                                  type='button'
                                  className='btn fw-semibold'
                                  onClick={e => {
                                    setSelectedTime(index + 1)
                                    changeVehicleFieldHandler(e) // Pass `e` and index if needed
                                  }}
                                  aria-pressed={selectedTime === index + 1}
                                  value={vehicleField[field]}
                                  style={{
                                    minWidth: '100px',
                                    borderRadius: '8px',
                                    transition: 'all 0.2s ease-in-out',
                                    backgroundColor:
                                      selectedTime === index + 1
                                        ? '#c6e8ff'
                                        : 'white',
                                    color:
                                      selectedTime === index + 1
                                        ? 'black'
                                        : '#333',
                                    border: '1px solid #c6e8ff'
                                  }}
                                >
                                  {option}
                                </button>
                              )
                            )}
                          </div>

                          {errors[field] && (
                            <div style={{ color: 'red', marginTop: '5px' }}>
                              {errors[field]}
                            </div>
                          )}
                        </div>
                      ) : field == 'Range' ? (
                        selectedTime == 4 && (
                          <div>
                            <div>
                              <label className='fs-6 fw-semibold form-label mb-2'>
                                <span
                                  className={
                                    formValidations[field]?.required
                                      ? 'required'
                                      : ''
                                  }
                                >
                                  {field.replace(/_/g, ' ').toUpperCase()}
                                </span>
                              </label>
                            </div>

                            <div className='col-lg-10 col-md-12 col-sm-12'>
                              <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DemoContainer components={['TimePicker']}>
                                  <DemoItem>
                                    <TimePicker
                                      className='form-control mb-2'
                                      views={['hours', 'minutes', 'seconds']}
                                      value={
                                        startTimes ? dayjs(startTimes) : null
                                      }
                                      onChange={handleStartTimeChange}
                                      // value={vehicleField[field]}
                                    />
                                  </DemoItem>
                                </DemoContainer>
                              </LocalizationProvider>
                            </div>

                            <div className='col-lg-10 col-md-12 col-sm-12'>
                              <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DemoContainer components={['TimePicker']}>
                                  <DemoItem>
                                    <TimePicker
                                      className='form-control mb-2'
                                      views={['hours', 'minutes', 'seconds']}
                                      value={endTimes ? dayjs(endTimes) : null}
                                      onChange={handleEndTimeChange}
                                    />
                                  </DemoItem>
                                </DemoContainer>
                              </LocalizationProvider>
                            </div>
                            {error && (
                              <p style={{ color: 'red' }} className='mt-2'>
                                {error}
                              </p>
                            )}
                          </div>
                        )
                      ) : field == 'dates' ? (
                        selectedTime == 4 && (
                          <div>
                            <div>
                              <label className='fs-6 fw-semibold form-label mb-2'>
                                <span
                                  className={
                                    formValidations[field]?.required
                                      ? 'required'
                                      : ''
                                  }
                                >
                                  {field.replace(/_/g, ' ').toUpperCase()}
                                </span>
                              </label>
                            </div>
                            <div
                              className='btn-group d-flex flex-wrap gap-2'
                              role='group'
                              aria-label='Time Selection'
                            >
                              {[
                                'Sunday',
                                'Monday',
                                'Tuesday',
                                'Wednesday',
                                'Thursday',
                                'Friday',
                                'Saturday'
                              ].map((option, index) => (
                                <button
                                  key={index}
                                  data-id={option}
                                  type='button'
                                  className='btn fw-semibold'
                                  onClick={() => handleSelection(option)}
                                  onChange={changeVehicleFieldHandler}
                                  value={vehicleField[field]}
                                  aria-pressed={
                                    Array.isArray(selectedCustomTime) &&
                                    selectedCustomTime.includes(option)
                                  }
                                  style={{
                                    minWidth: '100px',
                                    borderRadius: '8px',
                                    transition: 'all 0.2s ease-in-out',
                                    backgroundColor: Array.isArray(
                                      selectedCustomTime
                                    )
                                      ? selectedCustomTime.includes(option)
                                        ? '#c6e8ff'
                                        : 'white'
                                      : 'white',
                                    color: Array.isArray(selectedCustomTime)
                                      ? selectedCustomTime.includes(option)
                                        ? 'black'
                                        : '#333'
                                      : '#333',
                                    border: '1px solid #c6e8ff'
                                  }}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                            {errors[field] && (
                              <div style={{ color: 'red', marginTop: '5px' }}>
                                {errors[field]}
                              </div>
                            )}
                          </div>
                        )
                      ) : field === 'Type' ? (
                        <div>
                          <label className='fs-6 fw-semibold form-label mb-2'>
                            <span
                              className={
                                formValidations[field]?.required
                                  ? 'required'
                                  : ''
                              }
                            >
                              {field.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </label>
                          <Select
                            className='form-select-solid'
                            name={field}
                            options={formValue?.alertType?.map(data => ({
                              value: data.option_id,
                              label: data.title,
                              type: data.type
                            }))}
                            onChange={selectedOption => {
                              changeVehicleFieldHandler({
                                target: {
                                  name: field,
                                  value: selectedOption?.value || ''
                                }
                              })
                              setTypeChnge(true)
                              setSelectOpt(selectedOption?.type)
                            }}
                            value={
                              formValue?.alertType?.find(
                                option =>
                                  option.option_id == vehicleField[field]
                              )
                                ? {
                                    value: vehicleField[field],
                                    label: formValue?.alertType?.find(
                                      option =>
                                        option.option_id == vehicleField[field]
                                    )?.title
                                  }
                                : null
                            }
                            placeholder='Select an option'
                            isSearchable
                          />
                          {checkError && (
                            <p style={{ color: 'red' }} className='mt-2'>
                              {checkError}
                            </p>
                          )}
                          {errors[field] && (
                            <div style={{ color: 'red', marginTop: '5px' }}>
                              {errors[field]}
                            </div>
                          )}
                        </div>
                      ) : field === 'driver' ? (
                        selectOpt == 1 && (
                          <div>
                            <label className='fs-6 fw-semibold form-label mb-2'>
                              <span
                                className={
                                  formValidations[field]?.required
                                    ? 'required'
                                    : ''
                                }
                              >
                                {field.replace(/_/g, ' ').toUpperCase()}
                              </span>
                            </label>
                            <Select
                              className='form-select-solid'
                              name={field}
                              options={optionsWithAll}
                              isMulti
                              onChange={handleChange}
                              value={
                                !driveChngs
                                  ? editData?.driver
                                    ? optionsWithAll.filter(opt =>
                                        editData.driver.includes(
                                          opt.value.toString()
                                        )
                                      )
                                    : selectedOptions
                                  : selectedOptions
                              }
                              placeholder='Select Driver'
                              isSearchable
                              styles={{
                                control: provided => ({
                                  ...provided,
                                  minHeight: '40px', // Adjust height properly
                                  borderColor: '#ccc',
                                  boxShadow: 'none'
                                }),
                                menu: provided => ({
                                  ...provided,
                                  zIndex: 9999 // Ensure dropdown is above other elements
                                })
                              }}
                            />
                            {errors[field] && (
                              <div style={{ color: 'red', marginTop: '5px' }}>
                                {errors[field]}
                              </div>
                            )}
                          </div>
                        )
                      ) : field === 'vehicle' ? (
                        selectOpt == 0 && (
                          <div>
                            <label className='fs-6 fw-semibold form-label mb-2'>
                              <span
                                className={
                                  formValidations[field]?.required
                                    ? 'required'
                                    : ''
                                }
                              >
                                {field.replace(/_/g, ' ').toUpperCase()}
                              </span>
                            </label>
                            <Select
                              classNamePrefix='react-select'
                              className='form-select-solid'
                              name={field}
                              options={optionVehicle}
                              isMulti
                              onChange={handleVehChange}
                              value={
                                !vehChngs
                                  ? editData?.vehicle
                                    ? optionVehicle.filter(opt =>
                                        editData.vehicle.includes(
                                          opt.value.toString()
                                        )
                                      )
                                    : selectedVehOpt
                                  : selectedVehOpt
                              }
                              placeholder='Select Vehicle'
                              isSearchable
                              styles={{
                                control: provided => ({
                                  ...provided,
                                  minHeight: '40px', // Adjust height properly
                                  borderColor: '#ccc',
                                  boxShadow: 'none'
                                }),
                                menu: provided => ({
                                  ...provided,
                                  zIndex: 9999 // Ensure dropdown is above other elements
                                })
                              }}
                            />
                            {errors[field] && (
                              <div style={{ color: 'red', marginTop: '5px' }}>
                                {errors[field]}
                              </div>
                            )}
                          </div>
                        )
                      ) : field == 'recipient' ? (
                        <div>
                          <div>
                            <label className='fs-6 fw-semibold form-label mb-2'>
                              <span
                                className={
                                  formValidations[field]?.required
                                    ? 'required'
                                    : ''
                                }
                              >
                                {field.replace(/_/g, ' ').toUpperCase()}
                              </span>
                            </label>
                          </div>
                          <div className='d-flex gap-2'>
                            <input
                              className='form-control form-control-solid flex-grow-1'
                              type='text'
                              placeholder={`${placeHold ? placeHold : 'none'}`}
                              readOnly
                            />
                            <button
                              key={index + 1}
                              data-id={index + 1}
                              type='button'
                              data-field='recipient'
                              onClick={e => {
                                setRecipientModal(true)
                              }}
                              value={recipient}
                              className='btn fw-semibold flex-grow-1'
                              style={{
                                borderRadius: '8px',
                                transition: 'all 0.2s ease-in-out',
                                color:
                                  selectedMethod === index + 1
                                    ? 'black'
                                    : '#333',
                                border: '1px solid #c6e8ff'
                              }}
                            >
                              Select
                            </button>
                          </div>
                          {errors[field] && (
                            <div style={{ color: 'red', marginTop: '5px' }}>
                              {errors[field]}
                            </div>
                          )}
                        </div>
                      ) : field == 'priority' ? (
                        <div>
                          <div>
                            <label className='fs-6 fw-semibold form-label mb-2'>
                              <span
                                className={
                                  formValidations[field]?.required
                                    ? 'required'
                                    : ''
                                }
                              >
                                {field.replace(/_/g, ' ').toUpperCase()}
                              </span>
                            </label>
                          </div>

                          <div className='border rounded p-3 d-flex align-items-center'>
                            <input
                              type='checkbox'
                              className='form-check-input me-2'
                              id='importantCheckbox'
                              name='important'
                              value={vehicleField[field]}
                              checked={isImportant}
                              onChange={e => {
                                setIsImportant(e.target.checked)
                                changeVehicleFieldHandler({
                                  target: {
                                    name: 'priority',
                                    value: isImportant
                                  }
                                })
                              }}
                            />
                            <div>
                              <label
                                className='fw-bold mb-0'
                                htmlFor='importantCheckbox'
                              >
                                {'Important'}
                              </label>
                              <small className='text-muted d-block'>
                                {`Flags the alert as Important in the notification and email`}
                              </small>
                            </div>
                          </div>
                          {errors[field] && (
                            <div style={{ color: 'red', marginTop: '5px' }}>
                              {errors[field]}
                            </div>
                          )}
                        </div>
                      ) : (
                        field === 'method' && (
                          <div>
                            <div>
                              <label className='fs-6 fw-semibold form-label mb-2'>
                                <span
                                  className={
                                    formValidations[field]?.required
                                      ? 'required'
                                      : ''
                                  }
                                >
                                  {field.replace(/_/g, ' ').toUpperCase()}
                                </span>
                              </label>
                            </div>

                            <div
                              className='btn-group d-flex gap-2'
                              role='group'
                              aria-label='Time Selection'
                            >
                              {[
                                'Email & Notification',
                                'Notification only',
                                'Email only',
                                'WhatsApp only'
                              ].map((option, index) => (
                                <button
                                  key={index + 1}
                                  data-id={index + 1}
                                  data-field={'method'}
                                  type='button'
                                  onChange={changeVehicleFieldHandler}
                                  value={vehicleField[field]}
                                  className='btn fw-semibold'
                                  onClick={e => {
                                    setSelectedMethod(index + 1)
                                    changeVehicleFieldHandler(e)
                                  }}
                                  aria-pressed={selectedMethod == index + 1}
                                  style={{
                                    minWidth: '100px',
                                    borderRadius: '8px',
                                    transition: 'all 0.2s ease-in-out',
                                    backgroundColor:
                                      selectedMethod === index + 1
                                        ? '#c6e8ff'
                                        : 'white',
                                    color:
                                      selectedMethod === index + 1
                                        ? 'black'
                                        : '#333',
                                    border: '1px solid #c6e8ff'
                                  }}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                            {errors[field] && (
                              <div style={{ color: 'red', marginTop: '5px' }}>
                                {errors[field]}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  ))}

                  <div className='d-flex justify-content-center'>
                    <Link
                      href='/dashboard/alert'
                      className='btn btn-light me-5'
                      onClick={() => close(false)}
                    >
                      Cancel
                    </Link>
                    <button
                      type='submit'
                      className='btn btn-primary'
                      disabled={isLoading}
                    >
                      <span className='indicator-progress d-flex justify-content-center'>
                        {isLoading ? (
                          <LoadingIcons.TailSpin height={18} />
                        ) : id ? (
                          'Update'
                        ) : (
                          'Save'
                        )}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AddalertModal
