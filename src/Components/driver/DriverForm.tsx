'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Select from 'react-select'
import {
  useForm,
  Controller,
  Control,
  FieldError,
  UseFormRegister
} from 'react-hook-form'
import { useSession } from 'next-auth/react'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import LoadingIcons from 'react-loading-icons'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Id = string | number

type IFormInput = {
  first_name: string
  last_name: string
  driver_id: string
  email: string
  phone: string
  password: string
  confirm_password: string
  landline_no: string
  language_id: Id
  country_id: Id
  state_id: Id
  city_id: Id
  pincode: string
  address: string
  timezone: string
  is_active: Id
  username: string
  driver_license_number: string
  note: string
  driver_license_state: Id
  carrer_us_dot_number: string
  career_name: string
  main_office_address: string
  home_terminal_address: Id
  home_terminal_name: string
  home_terminal_timezones: string
  cycle_rule: Id
  restart: Id
  cargo_type: Id
  adverse_condtion: Id
  rest_break: Id
}

type Option = { value: Id; label: string }

/* ------------------------------------------------------------------ */
/* Static validation rules (do not depend on component state)          */
/* ------------------------------------------------------------------ */

const baseValidations: Record<string, any> = {
  first_name: {
    required: 'First name is required',
    maxLength: {
      value: 100,
      message: 'First name cannot have more than 100 characters'
    },
    pattern: {
      value: /^[A-Za-z]+$/i,
      message: 'First name should be only alphabetic characters'
    }
  },
  last_name: {
    required: 'Last name is required',
    maxLength: {
      value: 100,
      message: 'Last name cannot have more than 100 characters'
    },
    pattern: {
      value: /^[A-Za-z]+$/i,
      message: 'Last name should be only alphabetic characters'
    }
  },
  driver_id: {
    required: 'Driver ID is required',
    maxLength: {
      value: 10,
      message: 'Driver ID must be at most 10 characters long'
    },
    pattern: { value: /^[0-9]+$/i, message: 'Driver ID should be numeric' }
  },
  phone: {
    required: 'Phone is required',
    minLength: {
      value: 10,
      message: 'Phone must be at least 10 characters long'
    },
    maxLength: {
      value: 15,
      message: 'Phone must be at most 15 characters long'
    },
    pattern: { value: /^[0-9]+$/i, message: 'Phone should be numeric' }
  },
  password: {
    required: 'Password is required',
    minLength: {
      value: 8,
      message: 'Password must have at least 8 characters'
    },
    maxLength: {
      value: 100,
      message: 'Password must be at most 100 characters long'
    }
  },
  confirm_password: {
    required: 'Confirm Password is required',
    minLength: {
      value: 8,
      message: 'Confirm Password must have at least 8 characters'
    },
    maxLength: {
      value: 100,
      message: 'Confirm Password must be at most 100 characters long'
    }
  },
  landline_no: {
    minLength: {
      value: 10,
      message: 'Landline no must be at least 10 characters long'
    },
    maxLength: {
      value: 15,
      message: 'Landline no must be at most 15 characters long'
    },
    pattern: { value: /^[0-9]+$/i, message: 'Landline no should be numeric' }
  },
  language_id: { required: 'Please select a language' },
  country_id: { required: 'Please select a country' },
  state_id: { required: 'Please select a state' },
  city_id: { required: 'Please select a city' },
  pincode: {
    required: 'Pincode is required',
    minLength: {
      value: 4,
      message: 'Pincode must be at least 4 characters long'
    },
    maxLength: {
      value: 10,
      message: 'Pincode must be at most 10 characters long'
    },
    pattern: { value: /^[0-9]+$/i, message: 'Pincode should be numeric' }
  },
  address: {
    required: 'Address is required',
    maxLength: {
      value: 200,
      message: 'Address cannot be more than 200 characters long'
    }
  },
  timezone: { required: 'Please select a timezone' },
  is_active: { required: 'Please select a status' },
  driver_license_number: {
    required: 'Driver license number is required',
    minLength: {
      value: 6,
      message: 'Driver license number must be at least 6 characters long'
    },
    maxLength: {
      value: 20,
      message: 'Driver license number must be at most 20 characters long'
    },
    pattern: {
      value: /^[0-9]+$/i,
      message: 'Driver license number should be only numeric'
    }
  },
  note: {
    required: 'Note is required',
    maxLength: {
      value: 30,
      message: 'Note can be at maximum 30 characters long'
    }
  },
  driver_license_state: { required: 'Driver License State is required' },
  carrer_us_dot_number: {
    required: 'Carrer us dot number is required',
    minLength: {
      value: 5,
      message: 'Carrer us dot number must be at least 5 characters long'
    },
    maxLength: {
      value: 10,
      message: 'Carrer us dot number must be at most 10 characters long'
    },
    pattern: {
      value: /^[0-9]+$/i,
      message: 'Carrer us dot number should be only numeric'
    }
  },
  career_name: {
    required: 'Career name is required',
    maxLength: {
      value: 30,
      message: 'Career name must be at most 30 characters long'
    },
    pattern: {
      value: /^[A-Za-z\s]+$/i,
      message: 'Career name should be only alphabetic characters and spaces'
    }
  },
  main_office_address: {
    required: 'Main office address is required',
    maxLength: {
      value: 100,
      message: 'Main office address must be at most 100 characters long'
    }
  },
  home_terminal_address: { required: 'Please select a home terminal address' },
  home_terminal_name: {
    required: 'Home terminal name is required',
    maxLength: {
      value: 50,
      message: 'Home terminal name must be at most 50 characters long'
    },
    pattern: {
      value: /^[A-Za-z\s]+$/i,
      message: 'Home terminal name should be only alphabetic characters'
    }
  },
  home_terminal_timezones: { required: 'Home terminal timezone is required' },
  cycle_rule: { required: 'Cycle rule is required' },
  cargo_type: { required: 'Cargo type is required' },
  restart: { required: 'Please select a restart rule' },
  rest_break: { required: 'Please select a rest break rule' },
  adverse_condtion: { required: 'Please select an adverse condition' }
}

/* ------------------------------------------------------------------ */
/* Small presentational helpers (defined OUTSIDE the component so they */
/* are not re-created / re-mounted on every render)                    */
/* ------------------------------------------------------------------ */

function Card ({
  title,
  first = false,
  children
}: {
  title: React.ReactNode
  first?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`d-flex flex-column ${first ? '' : 'mt-8'}`}>
      <div className='card card-flush py-4'>
        <div className='text-center'>
          <p className='fw-bolder fs-7'>{title}</p>
        </div>
        <div className='separator my-0'></div>
        <div className='card-body mt-4'>{children}</div>
      </div>
    </div>
  )
}

function FormRow ({
  label,
  required = true,
  children
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className='mb-5 row'>
      <label
        className={`${
          required ? 'required ' : ''
        }col-lg-2 col-md-12 col-sm-12 col-form-label`}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

function TextInput ({
  name,
  placeholder,
  type = 'text',
  register,
  rules,
  error,
  autoComplete
}: {
  name: keyof IFormInput
  placeholder: string
  type?: string
  register: UseFormRegister<IFormInput>
  rules?: any
  error?: FieldError
  autoComplete?: string
}) {
  return (
    <>
      <input
        type={type}
        autoComplete={autoComplete}
        className={`form-control mb-2 ${error ? 'is-invalid' : ''}`}
        placeholder={placeholder}
        {...register(name, rules)}
      />
      {error && <p className='invalid-feedback'>{error.message}</p>}
    </>
  )
}

function PasswordInput ({
  name,
  placeholder,
  register,
  rules,
  error,
  autoComplete
}: {
  name: keyof IFormInput
  placeholder: string
  register: UseFormRegister<IFormInput>
  rules?: any
  error?: FieldError
  autoComplete?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <>
      <div className='position-relative'>
        <input
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          className={`form-control mb-2 ${error ? 'is-invalid' : ''}`}
          placeholder={placeholder}
          {...register(name, rules)}
        />
        <span
          role='button'
          className='position-absolute top-50 end-0 translate-middle'
          style={{
            paddingRight: '2.5rem',
            fontSize: 'large',
            cursor: 'pointer'
          }}
          onClick={() => setShow(prev => !prev)}
        >
          {show ? (
            <i className='ki-duotone ki-eye-slash'>
              <span className='path1'></span>
              <span className='path2'></span>
              <span className='path3'></span>
              <span className='path4'></span>
            </i>
          ) : (
            <i className='ki-duotone ki-eye'>
              <span className='path1'></span>
              <span className='path2'></span>
              <span className='path3'></span>
            </i>
          )}
        </span>
      </div>
      {error && <p className='invalid-feedback d-block'>{error.message}</p>}
    </>
  )
}

function SelectField ({
  control,
  name,
  options,
  rules,
  placeholder,
  error,
  onChangeExtra,
  large = false
}: {
  control: Control<IFormInput>
  name: keyof IFormInput
  options: Option[]
  rules?: any
  placeholder: string
  error?: FieldError
  onChangeExtra?: (option: Option | null) => void
  large?: boolean
}) {
  return (
    <>
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field: { onChange, onBlur, value, ref } }) => (
          <Select
            ref={ref}
            value={options.find(o => String(o.value) === String(value)) ?? null}
            onChange={(option: any) => {
              onChange(option ? option.value : '')
              onChangeExtra?.(option ?? null)
            }}
            onBlur={onBlur}
            options={options}
            placeholder={placeholder}
            className={`react-select-styled ${large ? 'react-select-lg' : ''} ${
              error ? 'is-invalid' : ''
            }`}
            classNamePrefix='react-select'
            isSearchable
          />
        )}
      />
      {error && <p className='invalid-feedback'>{error.message}</p>}
    </>
  )
}

function Toolbar ({ loading, id }: { loading: boolean; id?: Id }) {
  const crumbs = ['Home', 'Drivers', id ? 'Edit' : 'Add']
  return (
    <div id='kt_app_toolbar' className='app-toolbar pt-6 pb-2 mb-5'>
      <div
        id='kt_app_toolbar_container'
        className='app-container container-fluid d-flex align-items-stretch'
      >
        <div className='app-toolbar-wrapper d-flex flex-stack flex-wrap gap-4 w-100'>
          <div className='page-title d-flex flex-column justify-content-center gap-1 me-3'>
            <h1 className='page-heading d-flex flex-column justify-content-center text-gray-900 fw-bold fs-3 m-0'>
              {loading ? <Skeleton width={100} /> : 'Drivers'}
            </h1>
            <ul className='breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0'>
              {crumbs.map((crumb, i) => (
                <React.Fragment key={crumb}>
                  {i > 0 && (
                    <li className='breadcrumb-item'>
                      <span className='bullet bg-gray-500 w-5px h-2px'></span>
                    </li>
                  )}
                  <li className='breadcrumb-item text-muted'>
                    <Link href='#' className='text-muted text-hover-primary'>
                      {loading ? <Skeleton width={100} /> : crumb}
                    </Link>
                  </li>
                </React.Fragment>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

/* Skeleton layout description: [title, titleWidth, rows[]] */
type SkeletonRow = { label: string; cols?: 1 | 2; required?: boolean }
const skeletonCards: { width: number; rows: SkeletonRow[] }[] = [
  {
    width: 150,
    rows: [
      { label: 'Name', cols: 2 },
      { label: 'Driver Id' },
      { label: 'Landline no', required: false },
      { label: 'Mobile no' },
      { label: 'License', cols: 2 },
      { label: 'Default Language' },
      { label: 'Email' },
      { label: 'Username' }
    ]
  },
  { width: 150, rows: [{ label: 'Note' }] },
  {
    width: 150,
    rows: [
      { label: 'Country' },
      { label: 'State' },
      { label: 'City' },
      { label: 'Pincode' },
      { label: 'Address' },
      { label: 'Timezone' },
      { label: 'Status' }
    ]
  },
  {
    width: 150,
    rows: [
      { label: 'Carrer & Career', cols: 2 },
      { label: 'Main Office Address' },
      { label: 'Home Terminal', cols: 2 }
    ]
  },
  {
    width: 250,
    rows: [
      { label: 'Cycle Rule' },
      { label: 'Cargo Type' },
      { label: 'Restart' },
      { label: 'Rest Break' },
      { label: 'Adverse Conditions Exception' }
    ]
  }
]

function FormSkeleton ({ id }: { id?: Id }) {
  return (
    <div className='d-flex flex-column flex-row-fluid gap-7 gap-lg-10'>
      <div className='tab-content'>
        <div className='tab-pane fade show active' role='tabpanel'>
          {skeletonCards.map((card, ci) => (
            <Card
              key={ci}
              first={ci === 0}
              title={<Skeleton width={card.width} />}
            >
              {card.rows.map(row => (
                <FormRow
                  key={row.label}
                  label={row.label}
                  required={row.required ?? true}
                >
                  {row.cols === 2 ? (
                    <>
                      <div className='col-lg-5 col-md-12 col-sm-12'>
                        <Skeleton height={38} />
                      </div>
                      <div className='col-lg-5 col-md-12 col-sm-12'>
                        <Skeleton height={38} />
                      </div>
                    </>
                  ) : (
                    <div className='col-lg-10 col-md-12 col-sm-12'>
                      <Skeleton height={38} />
                    </div>
                  )}
                </FormRow>
              ))}
              {ci === 0 && !id && (
                <FormRow label='Password'>
                  <div className='col-lg-5 col-md-12 col-sm-12'>
                    <Skeleton height={38} />
                  </div>
                  <div className='col-lg-5 col-md-12 col-sm-12'>
                    <Skeleton height={38} />
                  </div>
                </FormRow>
              )}
            </Card>
          ))}
        </div>
      </div>
      <div className='d-flex justify-content-center gap-5'>
        <Skeleton width={100} height={38} />
        <Skeleton width={100} height={38} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

interface SessionData {
  user?: { token: string; [key: string]: any }
}

function DriverForm ({ id }: { id?: Id }) {
  const router = useRouter()
  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const { data: session } = (useSession() as { data?: SessionData }) || {}
  const token = session?.user?.token

  const [address, setAddress] = useState<any>(null)
  const [hoursOfService, setHoursOfService] = useState<any>(null)
  const [homeTerminal, setHomeTerminal] = useState<any>(null)
  const [driver, setDriver] = useState<any>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [states, setStates] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    control,
    formState: { errors }
  } = useForm<IFormInput>()

  const countryId = watch('country_id')
  const stateId = watch('state_id')

  /* ----------------------- uniqueness validators ----------------------- */

  const checkUnique = async (
    kind: 'email' | 'username',
    value: string,
    excludeId: Id | null
  ) => {
    if (!token) {
      console.error('No token available')
      return false
    }
    try {
      const response = await axios.get(
        `${url}/check/${kind}/${encodeURIComponent(value)}/${
          excludeId ?? null
        }`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      return response.data === 0 // 0 matching users => unique
    } catch (error) {
      console.error(`Error checking ${kind}:`, error)
      return false
    }
  }

  // In edit mode exclude the driver's own user record from the check.
  const currentUserId: Id | null = driver?.user?.id ?? null

  const formValidations: Record<string, any> = {
    ...baseValidations,
    email: {
      required: 'Email is required',
      pattern: {
        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        message: 'Invalid email address'
      },
      validate: async (email: string) =>
        (await checkUnique('email', email, currentUserId)) ||
        'Email already exists'
    },
    username: {
      required: 'Username is required',
      minLength: {
        value: 8,
        message: 'Username must be at least 8 characters long'
      },
      maxLength: {
        value: 20,
        message: 'Username cannot have more than 20 characters'
      },
      validate: async (username: string) =>
        (await checkUnique('username', username, currentUserId)) ||
        'Username already exists'
    }
  }

  /* ------------------------------ data load ------------------------------ */

  useEffect(() => {
    if (!token) return
    let cancelled = false
    const headers = { Authorization: `Bearer ${token}` }
    const get = (path: string) =>
      axios.get(`${url}${path}`, { headers }).then(r => r.data)

    ;(async () => {
      try {
        const [addr, hos, ht, edit, generatedUsername] = await Promise.all([
          get('/driver/create'),
          get('/step2'),
          get('/step3'),
          id ? get(`/driver/${id}/edit`) : Promise.resolve(null),
          id ? Promise.resolve(null) : get('/generate/username')
        ])
        if (cancelled) return

        setAddress(addr)
        setHoursOfService(hos)
        setHomeTerminal(ht)

        if (edit) {
          setDriver(edit)
          // Reset with a flat object that matches the form's field names,
          // so no unrelated API keys end up in the submitted payload.
          reset({
            first_name: edit.user?.first_name,
            last_name: edit.user?.last_name,
            driver_id: edit.userInfo?.driver_id,
            email: edit.user?.email,
            phone: edit.user?.mobile_no,
            landline_no: edit.user?.landline_no ?? '',
            language_id: edit.user?.language_id,
            country_id: edit.user?.country_id,
            state_id: edit.user?.state_id,
            city_id: edit.user?.city_id,
            pincode: edit.user?.pin_code,
            address: edit.user?.address,
            timezone: edit.user?.timezone,
            is_active: edit.user?.is_active,
            username: edit.userInfo?.username,
            driver_license_number: edit.userInfo?.licenseNumber,
            driver_license_state: edit.userInfo?.driver_license_state,
            note: edit.userInfo?.note,
            carrer_us_dot_number: edit.userInfo?.carrer_us_dot_number,
            career_name: edit.userInfo?.career_name,
            main_office_address: edit.userInfo?.main_office_address,
            home_terminal_address: edit.userInfo?.home_terminal_address,
            home_terminal_name: edit.userInfo?.home_terminal_name,
            home_terminal_timezones: edit.userInfo?.home_terminal_timezone,
            cycle_rule: edit.cycle?.[0]?.rule_id,
            restart: edit.restart?.[0]?.rule_id,
            rest_break: edit.break?.[0]?.rule_id,
            cargo_type: edit.cargo?.option_id,
            adverse_condtion: edit.adverse?.length ? 1 : 0
          })
        } else {
          setUserName(generatedUsername ?? '')
          if (generatedUsername) setValue('username', generatedUsername)
        }
      } catch (error) {
        if (cancelled) return
        console.error('Error loading driver form data:', error)
        toast.error('Unable to load driver data.')
        router.push('/dashboard/drivers')
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token, url])

  /* ------------------- dependent country / state / city ------------------- */

  useEffect(() => {
    if (!token || !countryId) {
      setStates([])
      return
    }
    let cancelled = false
    axios
      .get(`${url}/states/${countryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(r => !cancelled && setStates(r.data))
      .catch(error => console.error('Error fetching states:', error))
    return () => {
      cancelled = true
    }
  }, [countryId, token, url])

  useEffect(() => {
    if (!token || !stateId) {
      setCities([])
      return
    }
    let cancelled = false
    axios
      .get(`${url}/cities/${stateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(r => !cancelled && setCities(r.data))
      .catch(error => console.error('Error fetching cities:', error))
    return () => {
      cancelled = true
    }
  }, [stateId, token, url])

  const handleCountryChange = () => {
    setValue('state_id', '')
    setValue('city_id', '')
    setStates([])
    setCities([])
  }

  const handleStateChange = () => {
    setValue('city_id', '')
    setCities([])
  }

  /* -------------------------------- submit -------------------------------- */

  const onSubmit = async (data: IFormInput) => {
    if (isLoading) return
    setIsLoading(true)
    const config = { headers: { Authorization: `Bearer ${token}` } }
    try {
      if (id) {
        await axios.put(`${url}/driver/${id}`, data, config)
      } else {
        await axios.post(`${url}/driver`, data, config)
      }
      toast.success(`Driver ${id ? 'updated' : 'added'} successfully!`, {
        position: 'top-right',
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      })
      router.push('/dashboard/drivers')
    } catch (error: any) {
      console.error(`Error ${id ? 'updating' : 'adding'} driver:`, error)
      toast.error(
        error?.response?.data?.message ||
          `Failed to ${id ? 'update' : 'add'} driver.`
      )
    } finally {
      setIsLoading(false)
    }
  }

  /* ------------------------------ render state ------------------------------ */

  const isReady =
    !!address &&
    !!hoursOfService &&
    !!homeTerminal &&
    (id ? !!driver : userName !== null)

  const timezoneOptions: Option[] = (address?.timezones ?? []).map(
    (t: any) => ({
      value: t.timezone_key,
      label: t.timezone_value
    })
  )

  if (!isReady) {
    return (
      <div className='d-flex flex-column flex-column-fluid'>
        <Toolbar loading id={id} />
        <div id='kt_app_content' className='app-content flex-column-fluid'>
          <div
            id='kt_app_content_container'
            className='app-container container-fluid'
          >
            <FormSkeleton id={id} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='d-flex flex-column flex-column-fluid'>
      <Toolbar loading={false} id={id} />

      <div id='kt_app_content' className='app-content flex-column-fluid'>
        <div
          id='kt_app_content_container'
          className='app-container container-fluid'
        >
          <form
            className='form d-flex flex-column'
            onSubmit={handleSubmit(onSubmit)}
            id='form'
            noValidate
          >
            <div className='d-flex flex-column flex-row-fluid gap-7 gap-lg-10'>
              <div className='tab-content'>
                <div className='tab-pane fade show active' role='tabpanel'>
                  {/* ---------------- ACCOUNT & SECURITY ---------------- */}
                  <Card title='ACCOUNT & SECURITY' first>
                    <FormRow label='Name'>
                      <div className='col-lg-5 col-md-12 col-sm-12'>
                        <TextInput
                          name='first_name'
                          placeholder='First name'
                          register={register}
                          rules={formValidations.first_name}
                          error={errors.first_name}
                        />
                      </div>
                      <div className='col-lg-5 col-md-12 col-sm-12'>
                        <TextInput
                          name='last_name'
                          placeholder='Last name'
                          register={register}
                          rules={formValidations.last_name}
                          error={errors.last_name}
                        />
                      </div>
                    </FormRow>

                    <FormRow label='Driver Id'>
                      <div className='col-lg-10 col-md-12 col-sm-12'>
                        <TextInput
                          name='driver_id'
                          placeholder='Driver Id'
                          register={register}
                          rules={formValidations.driver_id}
                          error={errors.driver_id}
                        />
                      </div>
                    </FormRow>

                    <FormRow label='Landline no' required={false}>
                      <div className='col-lg-10 col-md-12 col-sm-12'>
                        <TextInput
                          name='landline_no'
                          placeholder='Landline no'
                          register={register}
                          rules={formValidations.landline_no}
                          error={errors.landline_no}
                        />
                      </div>
                    </FormRow>

                    <FormRow label='Mobile no'>
                      <div className='col-lg-10 col-md-12 col-sm-12'>
                        <TextInput
                          name='phone'
                          placeholder='Mobile no'
                          register={register}
                          rules={formValidations.phone}
                          error={errors.phone}
                        />
                      </div>
                    </FormRow>

                    {hoursOfService?.state?.length > 0 && (
                      <FormRow label='License'>
                        <div className='col-lg-5 col-md-12 mb-md-2 mb-sm-2 col-sm-12'>
                          <SelectField
                            control={control}
                            name='driver_license_state'
                            rules={formValidations.driver_license_state}
                            placeholder='Select Driver License State'
                            error={errors.driver_license_state as FieldError}
                            large
                            options={hoursOfService.state.map((s: any) => ({
                              value: s.state_id,
                              label: s.state_name
                            }))}
                          />
                        </div>
                        <div className='col-lg-5 col-md-12 col-sm-12'>
                          <TextInput
                            name='driver_license_number'
                            placeholder='Driver License Number'
                            register={register}
                            rules={formValidations.driver_license_number}
                            error={errors.driver_license_number}
                          />
                        </div>
                      </FormRow>
                    )}

                    <FormRow label='Default Language'>
                      <div className='col-lg-10 col-md-12 col-sm-12'>
                        <SelectField
                          control={control}
                          name='language_id'
                          rules={formValidations.language_id}
                          placeholder='Select Your Language'
                          error={errors.language_id as FieldError}
                          large
                          options={(address.language ?? []).map((l: any) => ({
                            value: l.id,
                            label: l.language_name
                          }))}
                        />
                      </div>
                    </FormRow>

                    <FormRow label='Email'>
                      <div className='col-lg-10 col-md-12 col-sm-12'>
                        <TextInput
                          name='email'
                          type='email'
                          placeholder='Email'
                          register={register}
                          rules={formValidations.email}
                          error={errors.email}
                        />
                      </div>
                    </FormRow>

                    <FormRow label='Username'>
                      <div className='col-lg-10 col-md-12 col-sm-12'>
                        <TextInput
                          name='username'
                          placeholder='Username'
                          register={register}
                          rules={formValidations.username}
                          error={errors.username}
                        />
                      </div>
                    </FormRow>

                    {!id && (
                      <FormRow label='Password'>
                        <div className='col-lg-5 col-md-12 col-sm-12'>
                          <PasswordInput
                            name='password'
                            placeholder='Password'
                            autoComplete='new-password'
                            register={register}
                            rules={formValidations.password}
                            error={errors.password}
                          />
                        </div>
                        <div className='col-lg-5 col-md-12 col-sm-12'>
                          <PasswordInput
                            name='confirm_password'
                            placeholder='Confirm Password'
                            autoComplete='new-password'
                            register={register}
                            rules={{
                              ...formValidations.confirm_password,
                              validate: (value: string) =>
                                value === getValues('password') ||
                                'Passwords should match!'
                            }}
                            error={errors.confirm_password}
                          />
                        </div>
                      </FormRow>
                    )}
                  </Card>

                  {/* ---------------- NOTE ---------------- */}
                  <Card title='Note'>
                    <FormRow label='Note'>
                      <div className='col-lg-10 col-md-12 col-sm-12'>
                        <TextInput
                          name='note'
                          placeholder='Note'
                          register={register}
                          rules={formValidations.note}
                          error={errors.note}
                        />
                      </div>
                    </FormRow>
                  </Card>

                  {/* ---------------- COUNTRY & ADDRESS ---------------- */}
                  <Card title='COUNTRY & ADDRESS'>
                    <FormRow label='Country'>
                      <div className='col-lg-10 col-md-12 col-sm-12'>
                        <SelectField
                          control={control}
                          name='country_id'
                          rules={formValidations.country_id}
                          placeholder='Select Country'
                          error={errors.country_id as FieldError}
                          onChangeExtra={handleCountryChange}
                          options={(address.Country ?? []).map((c: any) => ({
                            value: c.country_id,
                            label: c.country_name
                          }))}
                        />
                      </div>
                    </FormRow>

                    {states.length > 0 && (
                      <FormRow label='State'>
                        <div className='col-lg-10 col-md-12 col-sm-12'>
                          <SelectField
                            control={control}
                            name='state_id'
                            rules={formValidations.state_id}
                            placeholder='Select State'
                            error={errors.state_id as FieldError}
                            onChangeExtra={handleStateChange}
                            options={states.map(s => ({
                              value: s.state_id,
                              label: s.state_name
                            }))}
                          />
                        </div>
                      </FormRow>
                    )}

                    {cities.length > 0 && (
                      <FormRow label='City'>
                        <div className='col-lg-10 col-md-12 col-sm-12'>
                          <SelectField
                            control={control}
                            name='city_id'
                            rules={formValidations.city_id}
                            placeholder='Select City'
                            error={errors.city_id as FieldError}
                            options={cities.map(c => ({
                              value: c.city_id,
                              label: c.city_name
                            }))}
                          />
                        </div>
                      </FormRow>
                    )}

                    <FormRow label='Pincode'>
                      <div className='col-lg-4 col-md-12 col-sm-12'>
                        <TextInput
                          name='pincode'
                          placeholder='Pincode'
                          register={register}
                          rules={formValidations.pincode}
                          error={errors.pincode}
                        />
                      </div>
                    </FormRow>

                    <FormRow label='Address'>
                      <div className='col-lg-10 col-md-12 col-sm-12'>
                        <TextInput
                          name='address'
                          placeholder='Address'
                          register={register}
                          rules={formValidations.address}
                          error={errors.address}
                        />
                      </div>
                    </FormRow>

                    <FormRow label='Timezone'>
                      <div className='col-lg-10 col-md-12 col-sm-12'>
                        <SelectField
                          control={control}
                          name='timezone'
                          rules={formValidations.timezone}
                          placeholder='Select Timezones'
                          error={errors.timezone as FieldError}
                          options={timezoneOptions}
                        />
                      </div>
                    </FormRow>

                    <FormRow label='Status'>
                      <div className='col-lg-10 col-md-12 col-sm-12'>
                        <select
                          className={`form-control mb-2 ${
                            errors.is_active ? 'is-invalid' : ''
                          }`}
                          defaultValue=''
                          {...register('is_active', formValidations.is_active)}
                          aria-invalid={!!errors.is_active}
                        >
                          <option value='' disabled>
                            Select Status
                          </option>
                          <option value='1'>Active</option>
                          <option value='0'>Inactive</option>
                        </select>
                        {errors.is_active && (
                          <p className='invalid-feedback'>
                            {errors.is_active.message}
                          </p>
                        )}
                      </div>
                    </FormRow>
                  </Card>

                  {/* ---------------- MAIN OFFICE ADDRESS ---------------- */}
                  <Card title='MAIN OFFICE ADDRESS'>
                    <FormRow label='Carrer & Career'>
                      <div className='col-lg-5 col-md-12 col-sm-12'>
                        <TextInput
                          name='carrer_us_dot_number'
                          placeholder='Carrer US Dot Number'
                          register={register}
                          rules={formValidations.carrer_us_dot_number}
                          error={errors.carrer_us_dot_number}
                        />
                      </div>
                      <div className='col-lg-5 col-md-12 col-sm-12'>
                        <TextInput
                          name='career_name'
                          placeholder='Career Name'
                          register={register}
                          rules={formValidations.career_name}
                          error={errors.career_name}
                        />
                      </div>
                    </FormRow>

                    <FormRow label='Main Office Address'>
                      <div className='col-lg-10 col-md-12 col-sm-12'>
                        <TextInput
                          name='main_office_address'
                          placeholder='Main Office Address'
                          register={register}
                          rules={formValidations.main_office_address}
                          error={errors.main_office_address}
                        />
                      </div>
                    </FormRow>

                    <FormRow label='Home Terminal'>
                      <div className='col-lg-5 col-md-12 col-sm-12'>
                        <select
                          className={`form-control mb-2 ${
                            errors.home_terminal_address ? 'is-invalid' : ''
                          }`}
                          defaultValue=''
                          {...register(
                            'home_terminal_address',
                            formValidations.home_terminal_address
                          )}
                          aria-invalid={!!errors.home_terminal_address}
                        >
                          <option value='' disabled>
                            Select Home Terminal Address
                          </option>
                          {(homeTerminal.location ?? []).map((loc: any) => (
                            <option key={loc.id} value={loc.id}>
                              {loc.address}
                            </option>
                          ))}
                        </select>
                        {errors.home_terminal_address && (
                          <p className='invalid-feedback'>
                            {errors.home_terminal_address.message}
                          </p>
                        )}
                      </div>
                      <div className='col-lg-5 col-md-12 col-sm-12'>
                        <TextInput
                          name='home_terminal_name'
                          placeholder='Home Terminal Name'
                          register={register}
                          rules={formValidations.home_terminal_name}
                          error={errors.home_terminal_name}
                        />
                      </div>
                    </FormRow>

                    <FormRow label='' required={false}>
                      <div className='col-lg-5 col-md-12 col-sm-12'>
                        <SelectField
                          control={control}
                          name='home_terminal_timezones'
                          rules={formValidations.home_terminal_timezones}
                          placeholder='Select Home Terminal Timezones'
                          error={errors.home_terminal_timezones as FieldError}
                          options={timezoneOptions}
                        />
                      </div>
                    </FormRow>
                  </Card>

                  {/* ---------------- CYCLES ---------------- */}
                  <Card title='CYCLES'>
                    <FormRow label='Cycle Rule'>
                      <div className='col-lg-10 col-md-12 col-sm-12'>
                        <SelectField
                          control={control}
                          name='cycle_rule'
                          rules={formValidations.cycle_rule}
                          placeholder='Select Cycle Rule'
                          error={errors.cycle_rule as FieldError}
                          options={(address.cycle ?? []).map((c: any) => ({
                            value: c.id,
                            label: c.title
                          }))}
                        />
                      </div>
                    </FormRow>

                    <FormRow label='Cargo Type'>
                      <div className='col-lg-10 col-md-12 col-sm-12'>
                        <SelectField
                          control={control}
                          name='cargo_type'
                          rules={formValidations.cargo_type}
                          placeholder='Select Cargo Type'
                          error={errors.cargo_type as FieldError}
                          options={(address.cargo ?? []).map((c: any) => ({
                            value: c.option_id,
                            label: c.title
                          }))}
                        />
                      </div>
                    </FormRow>

                    {/* NOTE: the old code called handleCountryChange() from the
                        Restart / Rest Break selects, which wiped the state/city
                        values. That has been removed. */}
                    <FormRow label='Restart'>
                      <div className='col-lg-10 col-md-12 col-sm-12'>
                        <SelectField
                          control={control}
                          name='restart'
                          rules={formValidations.restart}
                          placeholder='Select Restart'
                          error={errors.restart as FieldError}
                          options={(address.restart ?? []).map((r: any) => ({
                            value: r.id,
                            label: r.title
                          }))}
                        />
                      </div>
                    </FormRow>

                    <FormRow label='Rest Break'>
                      <div className='col-lg-10 col-md-12 col-sm-12'>
                        <SelectField
                          control={control}
                          name='rest_break'
                          rules={formValidations.rest_break}
                          placeholder='Select Break'
                          error={errors.rest_break as FieldError}
                          options={(address.break ?? []).map((b: any) => ({
                            value: b.id,
                            label: b.title
                          }))}
                        />
                      </div>
                    </FormRow>

                    <FormRow label='Adverse Conditions Exception'>
                      <div className='col-lg-10 col-md-12 col-sm-12'>
                        <select
                          className={`form-control mb-2 ${
                            errors.adverse_condtion ? 'is-invalid' : ''
                          }`}
                          defaultValue=''
                          {...register('adverse_condtion', {
                            ...formValidations.adverse_condtion,
                            setValueAs: (v: string) =>
                              v === '' || v === undefined ? '' : Number(v)
                          })}
                          aria-invalid={!!errors.adverse_condtion}
                        >
                          <option value='' disabled>
                            Select Adverse Conditions Exception
                          </option>
                          <option value='1'>Available</option>
                          <option value='0'>Not Available</option>
                        </select>
                        {errors.adverse_condtion && (
                          <p className='invalid-feedback'>
                            {errors.adverse_condtion.message}
                          </p>
                        )}
                      </div>
                    </FormRow>
                  </Card>
                </div>
              </div>

              <div className='d-flex justify-content-center'>
                <Link href='/dashboard/drivers' className='btn-light me-5'>
                  Cancel
                </Link>
                <button
                  id='kt_sign_in_submit'
                  type='submit'
                  className='justify-content-center btn-primary'
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
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default DriverForm
