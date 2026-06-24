"use client";
import React, { use, useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { debounce } from "lodash";
import Select from "react-select";
import { useForm, Controller } from "react-hook-form";
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoadingIcons from "react-loading-icons";
import Skeleton from "react-loading-skeleton"; // Import Skeleton
import "react-loading-skeleton/dist/skeleton.css"; // Import Skeleton CSS

type IFormInput = {
  first_name: number;
  last_name: number;
  driver_id: number;
  email: String;
  phone: number;
  password: String;
  confirm_password: String;
  landline_no: number;
  language_id: number;
  country_id: number;
  state_id: number;
  city_id: number;
  pincode: number;
  address: string;
  timezone: string;
  is_active: number;
  username: String;
  driver_license_number: Number;
  note: String;
  driver_license_state: number;
  carrer_us_dot_number: number;
  career_name: String;
  main_office_address: string;
  home_terminal_address: number;
  home_terminal_name: String;
  home_terminal_timezones: string;
  cycle_rule: number;
  restart: number;
  cargo_type: number;
  adverse_condtion: number;
  rest_break: number;
};

function DriverForm({ id }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const [address, setAddress] = useState(null);
  const [hoursOfService, setHoursOfService] = useState(null);
  const [homeTerminal, setHomeTerminal] = useState(null);
  const [driver, setDriver] = useState(null);
  const [adv, setAdv] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [userName, setUserName] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [countryId, setCountryId] = useState();
  const [stateId, setStateId] = useState();
  const [cityId, setCityId] = useState();
  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  interface User {
    token: string;
    // Add other properties you expect in the user object
  }

  interface SessionData {
    user?: User;
    // Add other properties you expect in the session data
  }

  const notify = () => toast.success(`Driver ${id ? 'update' : 'added'} successfully!`, {
    position: "top-right",
    autoClose: 1000,  // Auto-dismiss after 1 second
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true
  });

  const { data: session } = useSession() as { data?: SessionData } || {};

  const token = session && session.user && session?.user?.token;

  async function checkEmailUniqueness(email, id = null) {
    let emailVal = id ? id?.user?.id : null;

    try {
      if (!token) {
        console.error("No token available");
        return false; // Consider email not unique if no token
      }

      const response = await axios.get(
        `${url}/check/email/${email}/${emailVal}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data === 0; // If no users found, email is unique
    } catch (error) {
      console.error("Error fetching users:", error);
      return false; // Consider email not unique on error
    }
  }

  async function checkUsernameUniqueness(username, id = null) {
    let usernameVal = id ? id?.user?.id : null;

    try {
      if (!token) {
        console.error("No token available");
        return false; // Consider email not unique if no token
      }

      const response = await axios.get(
        `${url}/check/username/${username}/${usernameVal}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data === 0; // If no users found, email is unique
    } catch (error) {
      console.error("Error fetching users:", error);
      return false; // Consider email not unique on error
    }
  }

  const formValidations = {
    first_name: {
      required: "First name is required",
      maxLength: {
        value: 100,
        message: "First name cannot have more than 100 characters",
      },
      pattern: {
        value: /^[A-Za-z]+$/i,
        message: "First name should be only alphabetic characters",
      },
    },

    last_name: {
      required: "Last name is required",
      maxLength: {
        value: 100,
        message: "Last name cannot have more than 100 characters",
      },
      pattern: {
        value: /^[A-Za-z]+$/i,
        message: "Last name should be only alphabetic characters",
      },
    },

    driver_id: {
      required: "Driver ID is required",
      maxLength: {
        value: 10,
        message: "Driver ID must be at most 10 characters long",
      },
      pattern: {
        value: /^[0-9]+$/i,
        message: "Driver ID should be numeric",
      },
    },

    email: {
      required: "Email is required",
      pattern: {
        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        message: "Invalid email address",
      },
      validate: async (email, id) => {
        const isUnique = await checkEmailUniqueness(email, id ? id : null);
        return isUnique || "Email already exists";
      },
    },

    phone: {
      required: "Phone is required",
      minLength: {
        value: 10,
        message: "Phone must be at least 10 characters long",
      },
      maxLength: {
        value: 15,
        message: "Phone must be at most 15 characters long",
      },
      pattern: {
        value: /^[0-9]+$/i,
        message: "Phone should be numeric",
      },
    },

    password: {
      required: "Password is required",
      minLength: {
        value: 8,
        message: "Password must have at least 8 characters",
      },
      maxLength: {
        value: 100,
        message: "Password must be at most 100 characters long",
      },
    },

    confirm_password: {
      required: "Confirm Password is required",
      minLength: {
        value: 8,
        message: "Confirm Password must have at least 8 characters",
      },
      maxLength: {
        value: 100,
        message: "Confirm Password must be at most 100 characters long",
      },
      validate: {
        matchesPreviousPassword: (value, { password }) =>
          password === value || "Passwords and confirm password should match!",
      },
    },

    landline_no: {
      minLength: {
        value: 10,
        message: "Landline no must be at least 10 characters long",
      },
      maxLength: {
        value: 15,
        message: "Landline no must be at most 15 characters long",
      },
      pattern: {
        value: /^[0-9]+$/i,
        message: "Landline no should be numeric",
      },
    },

    language_id: { required: "Please select a language" },

    country_id: { required: "Please select a country" },

    state_id: { required: "Please select a state" },

    city_id: { required: "Please select a city" },

    pincode: {
      required: "Pincode is required",
      minLength: {
        value: 4,
        message: "Pincode must be at least 4 characters long",
      },
      maxLength: {
        value: 10,
        message: "Pincode must be at most 10 characters long",
      },
      pattern: {
        value: /^[0-9]+$/i,
        message: "Pincode should not be alphabatic",
      },
    },

    address: {
      required: "Address is required",
      maxLength: {
        value: 200,
        message: "Address cannot be more than 200 long",
      },
    },

    timezone: { required: "Please select a timezone" },

    is_active: { required: "Please select a status" },

    username: {
      required: "Username is required",
      minLength: {
        value: 8,
        message: "Username must be at least 8 characters long",
      },
      maxLength: {
        value: 20,
        message: "Username cannot have more than 100 characters",
      },
      validate: async (username, id) => {
        const isUniques = await checkUsernameUniqueness(
          username,
          id ? id : null
        );
        return isUniques || "Username already exists";
      },
    },

    driver_license_number: {
      required: "Driver license number is required",
      minLength: {
        value: 6,
        message: "Driver license number must be at least 6 characters long",
      },
      maxLength: {
        value: 20,
        message: "Driver license number must be at most 20 characters long",
      },
      pattern: {
        value: /^[0-9]+$/i,
        message: "Driver license number should be only numeric",
      },
    },

    note: {
      required: "Note is required",
      maxLength: {
        value: 30,
        message: "Note can be at maximum 30 characters long",
      },
    },

    driver_license_state: {
      required: "Driver License State is required",
    },

    carrer_us_dot_number: {
      required: "Carrer us dot number is required",
      minLength: {
        value: 5,
        message: "Carrer us dot number must be at least 5 characters long",
      },
      maxLength: {
        value: 10,
        message: "Carrer us dot number must be at most 10 characters long",
      },
      pattern: {
        value: /^[0-9]+$/i,
        message: "Carrer us dot number should be only numeric",
      },
    },

    career_name: {
      required: "Career name is required",
      maxLength: {
        value: 30,
        message: "Career name must be at most 30 characters long",
      },
      pattern: {
        value: /^[A-Za-z\s]+$/i,
        message: "Career name should be only alphabetic characters and spaces",
      },
    },

    main_office_address: {
      required: "Main office address is required",
      maxLength: {
        value: 100,
        message: "Main office address must be at most 100 characters long",
      },
    },

    home_terminal_address: {
      required: "Home terminal address is required",
    },

    home_terminal_name: {
      required: "Home terminal name is required",
      maxLength: {
        value: 50,
        message: "Home terminal name must be at most 50 characters long",
      },
      pattern: {
        value: /^[A-Za-z\s]+$/i,
        message: "Home terminal name should be only alphabatic",
      },
    },

    home_terminal_timezones: {
      required: "Home terminal timezone is required",
    },

    cycle_rule: {
      required: "Cycle rule is required",
    },

    cargo_type: {
      required: "Cargo type is required",
    },

    restart: {
      required: "Restart is required",
    },

    rest_break: {
      required: "Rest break is required",
    },

    adverse_condtion: {
      required: "Adverse condition is required",
    },
  };

  // Setup useForm with defaultValues
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    control,
    reset,
    getValues,
  } = useForm<IFormInput>();

  useEffect(() => {
    if (countryId) {
      fetchStates(countryId);
    }
    if (driver?.user?.country_id) {
      fetchStates(driver.user.country_id);
    }
    if (driver?.user?.state_id) {
      fetchCities(driver.user.state_id);
    }
  }, [countryId, driver?.user?.country_id, driver?.user?.state_id]);

  useEffect(() => {
    if (stateId) {
      fetchCities(stateId);
    }
  }, [stateId]);

  useEffect(() => {
    async function fetchUserName() {
      try {
        const response = await fetch(`${url}/generate/username`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        // Check if the response is ok
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error generating username:", errorData);
          return;
        }

        const responseData = await response.json();

        setUserName(responseData);

        // Redirect or show success message
        // router.push('/dashboard/drivers');
      } catch (error) {
        console.error("Error generating username:", error);
      }
    }
    if (token) {
      fetchUserName();
    }
  }, [url, token]);

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const handleCityChange = (event) => {
    const cityId = event.value;
    setCityId(cityId);
  };

  const fetchStates = async (countryId) => {
    try {
      const response = await axios.get(
        `${url}/states/${countryId}`,
        axiosConfig
      );

      setStates(response.data);
    } catch (error) {
      console.error("Error fetching states:", error);
    }
  };

  const fetchCities = async (stateId) => {
    try {
      const response = await axios.get(`${url}/cities/${stateId}`, axiosConfig);
      setCities(response.data);
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  const handleCountryChange = (option) => {
    const countryId = option.value;
    setCountryId(countryId);
    setStateId(null);
    setCityId(null);
    setStates([]);
    setCities([]);
    fetchStates(countryId);
  };

  const handleStateChange = (option) => {
    const stateId = option.value;
    setStateId(stateId);
    setCityId(null);
    setCities([]);
    fetchCities(stateId);
  };

  const Edit = async () => {
    try {
      const response = await axios.get(`${url}/driver/${id}/edit`, axiosConfig);
      const driver = response.data;
      reset(driver); // Reset the form with the fetched driver data
      setDriver({ ...driver });
    } catch (error) {
      router.push('/dashboard/drivers');
      console.error("Error fetching driver data:", error);
    }
  };

  const fetchAddress = async () => {
    try {
      const response = await axios.get(`${url}/driver/create`, axiosConfig);
      setAddress(response.data);
    } catch (error) {
      router.push('/dashboard/drivers');
      console.error("Error fetching address data:", error);
    }
  };

  const fetchHoursOfService = async () => {
    try {
      const response = await axios.get(`${url}/step2`, axiosConfig);
      setHoursOfService(response.data);
    } catch (error) {
      console.error("Error fetching hours of service data:", error);
    }
  };

  const fetchHomeTerminal = async () => {
    try {
      const response = await axios.get(`${url}/step3`, axiosConfig);
      setHomeTerminal(response.data);
    } catch (error) {
      console.error("Error fetching home terminal data:", error);
    }
  };

  // Debounced functions with memoization
  const debouncedFetchEdit = useCallback(debounce(Edit, 1000), [id, token]); // Memoized and dependent on id and token
  const debouncedFetchAddress = useCallback(debounce(fetchAddress, 1000), [token]); // Memoized and dependent on token
  const debouncedFetchHoursOfService = useCallback(
    debounce(fetchHoursOfService, 1000),
    [token]
  );
  const debouncedFetchHomeTerminal = useCallback(
    debounce(fetchHomeTerminal, 1000),
    [token]
  );

  useEffect(() => {
    if (token) {
      if (id) {
        debouncedFetchEdit(); // Call edit only when `id` is available
      }
      // Fetch shared data regardless of the presence of `id`
      debouncedFetchAddress();
      debouncedFetchHoursOfService();
      debouncedFetchHomeTerminal();
    }

    // Cleanup debounced functions on unmount
    return () => {
      debouncedFetchEdit.cancel();
      debouncedFetchAddress.cancel();
      debouncedFetchHoursOfService.cancel();
      debouncedFetchHomeTerminal.cancel();
    };
  }, [
    id, // Track `id` changes for Edit
    token, // Track `token` changes for all calls
    debouncedFetchEdit,
    debouncedFetchAddress,
    debouncedFetchHoursOfService,
    debouncedFetchHomeTerminal
  ])

  useEffect(() => {
    if (driver?.adverse) {
      const advrs = driver.adverse.length;
      setAdv(advrs ? 1 : 0); // Assuming '1' for Available and '0' for Not Available
      setValue("adverse_condtion", advrs ? 1 : 0); // Update the form value
    }
    if (driver?.restart?.length) {
      const restartRuleId = driver.restart[0].rule_id;
      setValue("restart", restartRuleId);
    }
    if (driver?.break?.length) {
      const breakRuleId = driver.break[0].rule_id;
      setValue("rest_break", breakRuleId);
    }
    if (driver?.cycle?.length) {
      const cycleRuleId = driver.cycle[0].rule_id;
      setValue("cycle_rule", cycleRuleId);
    }
    if (driver?.cargo) {
      const cargoOptionId = driver.cargo.option_id;
      setValue("cargo_type", cargoOptionId);
    }
    if (driver?.userInfo?.driver_license_state) {
      setValue("driver_license_state", driver.userInfo.driver_license_state);
    }
    if (driver?.userInfo?.licenseNumber) {
      setValue("driver_license_number", driver.userInfo.licenseNumber);
    }
    if (driver?.user?.language_id) {
      setValue("language_id", driver.user.language_id);
    }
    if (driver?.user?.timezone) {
      setValue("timezone", driver.user.timezone);
    }
    if (driver?.userInfo?.home_terminal_timezone) {
      setValue(
        "home_terminal_timezones",
        driver.userInfo.home_terminal_timezone
      );
    }
    if (driver?.user?.country_id) {
      setValue("country_id", driver.user.country_id);
    }
    if (driver?.user?.state_id) {
      setValue("state_id", driver.user.state_id);
    }
    if (driver?.user?.city_id) {
      setValue("city_id", driver.user.city_id);
    }
    if (!id) {
      if (userName) {
        setValue("username", userName);
      }
    }
  }, [driver, setValue, userName]);

  const addDriver = async (data) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${url}/driver`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error adding driver:", errorData);
      } else {
        notify();
        router.push("/dashboard/drivers");
      }
    } catch (error) {
      console.error("Error adding driver:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const editDriver = async (id, data, token) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${url}/driver/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error updating driver:", errorData);
      } else {
        notify();
        router.push("/dashboard/drivers");
      }
    } catch (error) {
      console.error("Error updating driver:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitHandler = async (data) => {
    if (id) {
      await editDriver(id, data, token);
    } else {
      await addDriver(data);
    }
  };

  // Use useCallback to memoize the debounced function
  const debouncedOnSubmit = useCallback(debounce(onSubmitHandler, 1000), [
    id,
    token,
  ]);

  const onSubmit = async (data) => {
    debouncedOnSubmit(data);
  };

  useEffect(() => {
    if (id) {
      if (driver && userName && homeTerminal && hoursOfService && address) {
        setIsDataLoading(true);
      }
    } else {
      if (userName && homeTerminal && hoursOfService && address) {
        setIsDataLoading(true);
      }
    }
  }, [id, driver, userName, homeTerminal, hoursOfService, address]);

  if (!isDataLoading) {
    return (
      <>
        <div className="d-flex flex-column flex-column-fluid">
          <div id="kt_app_toolbar" className="app-toolbar pt-6 pb-2 mb-5">
            <div
              id="kt_app_toolbar_container"
              className="app-container container-fluid d-flex align-items-stretch"
            >
              <div className="app-toolbar-wrapper d-flex flex-stack flex-wrap gap-4 w-100">
                <div className="page-title d-flex flex-column justify-content-center gap-1 me-3">
                  <h1 className="page-heading d-flex flex-column justify-content-center text-gray-900 fw-bold fs-3 m-0">
                    <Skeleton width={100} />
                  </h1>

                  <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0">
                    <li className="breadcrumb-item text-muted">
                      <Link href="#" className="text-muted text-hover-primary">
                        <Skeleton width={100} />
                      </Link>
                    </li>
                    <li className="breadcrumb-item">
                      <span className="bullet bg-gray-500 w-5px h-2px"></span>
                    </li>
                    <li className="breadcrumb-item text-muted">
                      <Link href="#" className="text-muted text-hover-primary">
                        <Skeleton width={100} />
                      </Link>
                    </li>
                    <li className="breadcrumb-item">
                      <span className="bullet bg-gray-500 w-5px h-2px"></span>
                    </li>
                    <li className="breadcrumb-item text-muted">
                      <Link href="#" className="text-muted text-hover-primary">
                        <Skeleton width={100} />
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div id="kt_app_content" className="app-content flex-column-fluid">
            <div
              id="kt_app_content_container"
              className="app-container container-fluid"
            >
              <form
                className="form d-flex flex-column"
                onSubmit={handleSubmit(onSubmit)}
                id="form"
              >
                <input type="hidden" />

                <div className="d-flex flex-column flex-row-fluid gap-7 gap-lg-10">
                  <div className="tab-content">
                    <div
                      className="tab-pane fade show active"
                      id="kt_ecommerce_add_product_general"
                      role="tabpanel"
                    >
                      <div className="d-flex flex-column">
                        <div className="card card-flush py-4">
                          <div className="text-center">
                            <p className="fw-bolder fs-7">
                              <Skeleton width={150} />
                            </p>
                          </div>
                          <div className="separator my-0"></div>
                          <div className="card-body mt-4">
                            <div className="mb-5 row">
                              <label className="required form-label  col-lg-2 col-md-12 col-sm-12 col-form-label">
                                Name
                              </label>
                              <div className="col-lg-5 col-md-12 col-sm-12">
                                <Skeleton width={280} />
                              </div>
                              <div className="col-lg-5 col-md-12 col-sm-12">
                                <Skeleton width={280} />
                              </div>
                            </div>
                            <div className="mb-5 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                Driver Id
                              </label>
                              <div className="col-lg-10 col-md-12 col-sm-12">
                                <Skeleton width={660} />
                              </div>
                            </div>

                            <div className="mb-5 row">
                              <label className="col-lg-2 col-md-12 col-sm-12 col-form-label">
                                Landline no
                              </label>
                              <div className="col-lg-10 col-md-12 col-sm-12">
                                <Skeleton width={660} />
                              </div>
                            </div>
                            <div className="mb-5 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                Mobile no
                              </label>
                              <div className="col-lg-10 col-md-12 col-sm-12">
                                <Skeleton width={660} />
                              </div>
                            </div>
                            <div className="mb-5 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                License
                              </label>
                              <div className="col-lg-5 col-md-12 mb-md-2 mb-sm-2 col-sm-12">
                                <Skeleton width={660} />
                              </div>
                              <div className="col-lg-5 col-md-12 col-sm-12">
                                <Skeleton width={660} />
                              </div>
                            </div>
                            <div className="mb-5 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                Default Language
                              </label>
                              <div className="col-lg-10 col-md-12 col-sm-12">
                                <Skeleton width={660} />
                              </div>
                            </div>
                            <div className="mb-5 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                Email
                              </label>
                              <div className="col-lg-10 col-md-12 col-sm-12">
                                <Skeleton width={660} />
                              </div>
                            </div>
                            <div className="mb-5 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                Username
                              </label>
                              <div className="col-lg-10 col-md-12 col-sm-12">
                                <Skeleton width={660} />
                              </div>
                            </div>
                            {!id && (
                              <div className="mb-5 row">
                                <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                  Password
                                </label>

                                <div className="col-lg-5 col-md-12 col-sm-5">
                                  <div className="position-relative">
                                    <Skeleton width={660} />
                                  </div>
                                </div>

                                <div className="col-lg-5 col-md-12 col-sm-5">
                                  <div className="position-relative">
                                    <Skeleton width={660} />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="d-flex flex-column mt-8">
                        <div className="card card-flush py-4">
                          <div className="text-center">
                            <p className="fw-bolder fs-7">
                              <Skeleton width={150} />
                            </p>
                          </div>
                          <div className="separator my-0"></div>
                          <div className="card-body mt-4">
                            <div className="mb-5 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                Note
                              </label>
                              <div className="col-lg-10 col-md-12 col-sm-12">
                                <Skeleton width={660} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="d-flex flex-column mt-8">
                        <div className="card card-flush py-4">
                          <div className="text-center">
                            <p className="fw-bolder fs-7">
                              <Skeleton width={150} />
                            </p>
                          </div>
                          <div className="separator my-0"></div>
                          <div className="card-body mt-3">
                            <div className="mb-6 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                Country
                              </label>
                              <div className="col-lg-10 col-md-12 col-sm-12">
                                <Skeleton width={660} />
                              </div>
                            </div>

                            <div className="mb-6 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                State
                              </label>
                              <div className="col-lg-10 col-md-12 col-sm-12">
                                <Skeleton width={660} />
                              </div>
                            </div>

                            <div className="mb-6 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                City
                              </label>
                              <div className="col-lg-10 col-md-12 col-sm-12">
                                <Skeleton width={660} />
                              </div>
                            </div>

                            <div className="mb-5 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                Pincode
                              </label>
                              <div className="col-lg-4 col-md-12 col-sm-12">
                                <Skeleton width={660} />
                              </div>
                            </div>
                            <div className="mb-5 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                Address
                              </label>
                              <div className="col-lg-10 col-md-12 col-sm-12">
                                <Skeleton width={660} />
                              </div>
                            </div>

                            <div className="mb-6 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                Timezone
                              </label>
                              <div className="col-lg-10 col-md-12 col-sm-12">
                                <Skeleton width={660} />
                              </div>
                            </div>

                            <div className="mb-5 row">
                              <label className="required  col-lg-2 col-md-12 col-sm-12 col-form-label">
                                Status
                              </label>
                              <div className="col-lg-10 col-md-12 col-sm-12">
                                <Skeleton width={660} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="d-flex flex-column mt-8">
                        <div className="card card-flush py-4">
                          <div className="text-center">
                            <p className="fw-bolder fs-7">
                              <Skeleton width={150} />
                            </p>
                          </div>
                          <div className="separator my-0"></div>
                          <div className="card-body mt-3">
                            <div className="mb-5 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                Carrer & Career
                              </label>
                              <div className="col-lg-5 col-md-12 col-sm-5">
                                <Skeleton width={660} />
                              </div>
                              <div className="col-lg-5 col-md-12 col-sm-5">
                                <Skeleton width={660} />
                              </div>
                            </div>

                            <div className="mb-5 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                Main Office Address
                              </label>
                              <div className="col-lg-10 col-md-12 col-sm-12">
                                <Skeleton width={660} />
                              </div>
                            </div>

                            <div className="mb-5 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12  col-form-label">
                                Home Terminal
                              </label>
                              <div className="col-lg-5 col-md-12 col-sm-5">
                                <Skeleton width={660} />
                              </div>
                              <div className="col-lg-5 col-md-12 col-sm-5">
                                <Skeleton width={660} />
                              </div>
                            </div>

                            <div className="mb-5 row">
                              <label className="col-lg-2 col-md-12 col-sm-12 col-form-label"></label>
                              <div className="col-lg-5 col-md-12 col-sm-5">
                                <Skeleton width={660} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="d-flex flex-column mt-8">
                        <div className="card card-flush py-4">
                          <div className="text-center">
                            <p className="fw-bolder fs-7">
                              <Skeleton width={250} />
                            </p>
                          </div>
                          <div className="separator my-0"></div>
                          <div className="card-body mt-3">
                            <>
                              <div className="mb-5 row">
                                <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                  Cycle Rule
                                </label>
                                <div className="col-lg-10 col-md-12 col-sm-12">
                                  <Skeleton width={660} />
                                </div>
                              </div>

                              <div className="mb-5 row">
                                <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                  Cargo Type
                                </label>
                                <div className="col-lg-10 col-md-12 col-sm-12">
                                  <Skeleton width={660} />
                                </div>
                              </div>
                            </>

                            <div className="mb-5 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                Restart
                              </label>
                              <div className="col-lg-10 col-md-12 col-sm-12">
                                <Skeleton width={660} />
                              </div>
                            </div>

                            <div className="mb-5 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                Rest Break
                              </label>
                              <div className="col-lg-10 col-md-12 col-sm-12">
                                <Skeleton width={660} />
                              </div>
                            </div>

                            <div className="mb-5 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                Adverse Conditions Exception
                              </label>
                              <div className="col-lg-10 col-md-12 col-sm-12">
                                <Skeleton width={660} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex justify-content-center">
                    <Skeleton width={100} />
                    <Skeleton width={100} />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="d-flex flex-column flex-column-fluid">
        <div id="kt_app_toolbar" className="app-toolbar pt-6 pb-2 mb-5">
          <div
            id="kt_app_toolbar_container"
            className="app-container container-fluid d-flex align-items-stretch"
          >
            <div className="app-toolbar-wrapper d-flex flex-stack flex-wrap gap-4 w-100">
              <div className="page-title d-flex flex-column justify-content-center gap-1 me-3">
                <h1 className="page-heading d-flex flex-column justify-content-center text-gray-900 fw-bold fs-3 m-0">
                  Drivers
                </h1>

                <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0">
                  <li className="breadcrumb-item text-muted">
                    <Link href="#" className="text-muted text-hover-primary">
                      Home
                    </Link>
                  </li>
                  <li className="breadcrumb-item">
                    <span className="bullet bg-gray-500 w-5px h-2px"></span>
                  </li>
                  <li className="breadcrumb-item text-muted">
                    <Link href="#" className="text-muted text-hover-primary">
                      Drivers
                    </Link>
                  </li>
                  <li className="breadcrumb-item">
                    <span className="bullet bg-gray-500 w-5px h-2px"></span>
                  </li>
                  <li className="breadcrumb-item text-muted">
                    <Link href="#" className="text-muted text-hover-primary">
                      {id ? "Edit" : "Add"}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div id="kt_app_content" className="app-content flex-column-fluid">
          <div
            id="kt_app_content_container"
            className="app-container container-fluid"
          >
            <form
              className="form d-flex flex-column"
              onSubmit={handleSubmit(onSubmit)}
              id="form"
            >
              <input type="hidden" />

              <div className="d-flex flex-column flex-row-fluid gap-7 gap-lg-10">
                <div className="tab-content">
                  <div
                    className="tab-pane fade show active"
                    id="kt_ecommerce_add_product_general"
                    role="tabpanel"
                  >
                    <div className="d-flex flex-column">
                      <div className="card card-flush py-4">
                        <div className="text-center">
                          <p className="fw-bolder fs-7">ACCOUNT & SECURITY</p>
                        </div>
                        <div className="separator my-0"></div>
                        <div className="card-body mt-4">
                          <div className="mb-5 row">
                            <label className="required form-label  col-lg-2 col-md-12 col-sm-12 col-form-label">
                              Name
                            </label>
                            <div className="col-lg-5 col-md-12 col-sm-12">
                              <input
                                type="text"
                                name="first_name"
                                className={`form-control mb-2 ${errors.first_name ? "is-invalid" : ""
                                  }`}
                                placeholder="First name"
                                defaultValue={driver?.user?.first_name}
                                {...register(
                                  "first_name",
                                  formValidations.first_name
                                )}
                              />
                              {errors.first_name && (
                                <p className="invalid-feedback">
                                  {errors.first_name.message}
                                </p>
                              )}
                            </div>
                            <div className="col-lg-5 col-md-12 col-sm-12">
                              <input
                                type="text"
                                name="last_name"
                                className={`form-control mb-2 ${errors.last_name ? "is-invalid" : ""
                                  }`}
                                placeholder="Last name"
                                defaultValue={driver?.user?.last_name}
                                {...register(
                                  "last_name",
                                  formValidations.last_name
                                )}
                              />
                              {errors.last_name && (
                                <p className="invalid-feedback">
                                  {errors.last_name.message}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="mb-5 row">
                            <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                              Driver Id
                            </label>
                            <div className="col-lg-10 col-md-12 col-sm-12">
                              <input
                                type="text"
                                name="driver_id"
                                className={`form-control mb-2 ${errors.driver_id ? "is-invalid" : ""
                                  }`}
                                placeholder="Driver Id"
                                defaultValue={driver?.userInfo?.driver_id}
                                {...register(
                                  "driver_id",
                                  formValidations.driver_id
                                )}
                              />
                              {errors.driver_id && (
                                <p className="invalid-feedback">
                                  {errors.driver_id.message}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mb-5 row">
                            <label className="col-lg-2 col-md-12 col-sm-12 col-form-label">
                              Landline no
                            </label>
                            <div className="col-lg-10 col-md-12 col-sm-12">
                              <input
                                type="text"
                                name="landline_no"
                                className={`form-control mb-2 ${errors.landline_no ? "is-invalid" : ""
                                  }`}
                                placeholder="Landline no"
                                {...register(
                                  "landline_no",
                                  formValidations.landline_no
                                )}
                              />
                              {errors.landline_no && (
                                <p className="invalid-feedback">
                                  {errors.landline_no.message}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="mb-5 row">
                            <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                              Mobile no
                            </label>
                            <div className="col-lg-10 col-md-12 col-sm-12">
                              <input
                                type="text"
                                name="phone"
                                defaultValue={driver?.user?.mobile_no}
                                className={`form-control mb-2 ${errors.phone ? "is-invalid" : ""
                                  }`}
                                placeholder="Mobile no"
                                {...register("phone", formValidations.phone)}
                              />
                              {errors.phone && (
                                <p className="invalid-feedback">
                                  {errors.phone.message}
                                </p>
                              )}
                            </div>
                          </div>
                          {/* <div className="mb-6 row">
                          <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                            Mobile
                          </label>
                          <div className="col-lg-10 col-md-12 col-sm-12">
                            <Controller
                              name="phone"
                              control={control}
                              rules={{
                                required: "Please enter a valid mobile number",
                              }}
                              render={({ field }) => (
                                <IntlTelInput
                                  defaultValue={field.value}
                                  containerClassName="intl-tel-input"
                                  inputClassName="form-control"
                                  value={driver?.user?.mobile_no}
                                  onPhoneNumberChange={(value) =>
                                    field.onChange(value)
                                  }
                                />
                              )}
                            />
                            {errors.phone && (
                              <p style={{ color: "red" }} className="mt-3">
                                {errors.phone.message}
                              </p>
                            )}
                          </div>
                        </div> */}
                          {hoursOfService?.state &&
                            hoursOfService?.state.length > 0 && (
                              <div className="mb-5 row">
                                <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                  License
                                </label>
                                <div className="col-lg-5 col-md-12 mb-md-2 mb-sm-2 col-sm-12">
                                  <Controller
                                    name="driver_license_state"
                                    control={control}
                                    defaultValue={
                                      driver?.userInfo?.driver_license_state || ""
                                    }
                                    rules={formValidations.driver_license_state}
                                    render={({
                                      field: { onChange, onBlur, value, ref },
                                    }) => {
                                      const selectedState =
                                        hoursOfService.state.find(
                                          (state) => state.state_id === value
                                        );

                                      const formattedValue = selectedState
                                        ? {
                                          value: selectedState.state_id,
                                          label: selectedState.state_name,
                                        }
                                        : null;

                                      return (
                                        <Select
                                          ref={ref}
                                          value={formattedValue}
                                          onChange={(option) => {
                                            const newValue = option
                                              ? option.value
                                              : null;
                                            onChange(newValue);
                                          }}
                                          className={`react-select-styled react-select-lg ${errors.driver_license_state
                                            ? "is-invalid"
                                            : ""
                                            }`}
                                          classNamePrefix="react-select"
                                          options={hoursOfService.state.map(
                                            (state) => ({
                                              value: state.state_id,
                                              label: state.state_name,
                                            })
                                          )}
                                          placeholder="Select Driver License State"
                                          isSearchable
                                        />
                                      );
                                    }}
                                  />
                                  {errors.driver_license_state && (
                                    <p className="invalid-feedback">
                                      {errors.driver_license_state.message}
                                    </p>
                                  )}
                                </div>
                                <div className="col-lg-5 col-md-12 col-sm-12">
                                  <input
                                    type="number"
                                    name="driver_license_number"
                                    className={`form-control mb-2 ${errors.driver_license_number
                                      ? "is-invalid"
                                      : ""
                                      }`}
                                    placeholder="Driver License Number"
                                    defaultValue={driver?.userInfo?.licenseNumber}
                                    {...register(
                                      "driver_license_number",
                                      formValidations.driver_license_number
                                    )}
                                  />
                                  {errors.driver_license_number && (
                                    <p className="invalid-feedback">
                                      {errors.driver_license_number.message}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          {address && (
                            <div className="mb-5 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                Default Language
                              </label>
                              <div className="col-lg-10 col-md-12 col-sm-12">
                                <Controller
                                  name="language_id"
                                  control={control}
                                  defaultValue={driver?.user?.language_id || ""} // Initialize default value
                                  rules={formValidations.language_id}
                                  render={({
                                    field: { onChange, onBlur, value, ref },
                                  }) => {
                                    const selectedLanguage =
                                      address.language.find(
                                        (language) => language.id === value
                                      );

                                    const formattedValue = selectedLanguage
                                      ? {
                                        value: selectedLanguage.id,
                                        label: selectedLanguage.language_name,
                                      }
                                      : null;

                                    return (
                                      <Select
                                        ref={ref}
                                        value={formattedValue} // Set the formatted value for the Select component
                                        onChange={(selectedOption) => {
                                          const newValue = selectedOption
                                            ? selectedOption.value
                                            : "";
                                          onChange(newValue); // Update form state with value
                                        }}
                                        onBlur={onBlur}
                                        options={address.language.map(
                                          (language) => ({
                                            value: language.id,
                                            label: language.language_name,
                                          })
                                        )}
                                        placeholder="Select Your Language"
                                        className={`react-select-styled react-select-lg ${errors.language_id ? "is-invalid" : ""
                                          }`}
                                        classNamePrefix="react-select"
                                        isSearchable
                                      />
                                    );
                                  }}
                                />
                                {errors.language_id && (
                                  <p className="invalid-feedback">
                                    {errors.language_id.message}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="mb-5 row">
                            <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                              Email
                            </label>
                            <div className="col-lg-10 col-md-12 col-sm-12">
                              <input
                                type="email"
                                name="email"
                                {...register("email", formValidations.email)}
                                className={`form-control mb-2 ${errors.email ? "is-invalid" : ""
                                  }`}
                                placeholder="Email"
                                defaultValue={driver?.user?.email}
                              />
                              {errors.email && (
                                <p className="invalid-feedback">
                                  {errors.email.message}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="mb-5 row">
                            <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                              Username
                            </label>
                            <div className="col-lg-10 col-md-12 col-sm-12">
                              <input
                                type="text"
                                name="username"
                                className={`form-control mb-2 ${errors.username ? "is-invalid" : ""
                                  }`}
                                placeholder="Username"
                                defaultValue={
                                  id ? driver?.userInfo?.username : userName
                                }
                                {...register(
                                  "username",
                                  formValidations.username
                                )}
                              />
                              {errors.username && (
                                <p className="invalid-feedback">
                                  {errors.username.message}
                                </p>
                              )}
                            </div>
                          </div>
                          {!id && (
                            <div className="mb-5 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                Password
                              </label>

                              <div className="col-lg-5 col-md-12 col-sm-5">
                                <div className="position-relative">
                                  <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    className={`form-control mb-2 ${errors.password ? "is-invalid" : ""
                                      }`}
                                    placeholder="Password"
                                    autoComplete="new-password"
                                    {...register(
                                      "password",
                                      formValidations.password
                                    )}
                                  />
                                  <span
                                    role="button"
                                    className="position-absolute top-50 end-0 translate-middle"
                                    style={{
                                      paddingRight: "2.5rem",
                                      fontSize: "large",
                                      cursor: "pointer",
                                    }}
                                    onClick={() =>
                                      setShowPassword((prev) => !prev)
                                    }
                                  >
                                    {showPassword ? (
                                      <i className="ki-duotone ki-eye-slash">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                        <span className="path4"></span>
                                      </i>
                                    ) : (
                                      <i className="ki-duotone ki-eye">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                      </i>
                                    )}
                                  </span>
                                </div>
                                {errors.password && (
                                  <p style={{ color: "red" }}>
                                    {errors.password.message}
                                  </p>
                                )}
                              </div>

                              <div className="col-lg-5 col-md-12 col-sm-5">
                                <div className="position-relative">
                                  <input
                                    type={
                                      showConfirmPassword ? "text" : "password"
                                    }
                                    name="confirm_password"
                                    className={`form-control mb-2 ${errors.confirm_password ? "is-invalid" : ""
                                      }`}
                                    placeholder="Confirm Password"
                                    {...register("confirm_password", {
                                      ...formValidations.confirm_password,
                                      validate: (value) =>
                                        value === getValues("password") ||
                                        "Passwords should match!",
                                    })}
                                  />
                                  <span
                                    role="button"
                                    className="position-absolute top-50 end-0 translate-middle"
                                    style={{
                                      paddingRight: "2.5rem",
                                      fontSize: "large",
                                      cursor: "pointer",
                                    }}
                                    onClick={() =>
                                      setShowConfirmPassword((prev) => !prev)
                                    }
                                  >
                                    {showConfirmPassword ? (
                                      <i className="ki-duotone ki-eye-slash">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                        <span className="path4"></span>
                                      </i>
                                    ) : (
                                      <i className="ki-duotone ki-eye">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                      </i>
                                    )}
                                  </span>
                                </div>
                                {errors.confirm_password && (
                                  <p style={{ color: "red" }}>
                                    {errors.confirm_password.message}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex flex-column mt-8">
                      <div className="card card-flush py-4">
                        <div className="text-center">
                          <p className="fw-bolder fs-7">Note</p>
                        </div>
                        <div className="separator my-0"></div>
                        <div className="card-body mt-4">
                          <div className="mb-5 row">
                            <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                              Note
                            </label>
                            <div className="col-lg-10 col-md-12 col-sm-12">
                              <input
                                type="text"
                                name="note"
                                className={`form-control mb-2 ${errors.note ? "is-invalid" : ""
                                  }`}
                                placeholder="Note"
                                defaultValue={driver?.userInfo?.note}
                                {...register("note", formValidations.note)}
                              />
                              {errors.note && (
                                <p className="invalid-feedback">
                                  {errors.note.message}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex flex-column mt-8">
                      <div className="card card-flush py-4">
                        <div className="text-center">
                          <p className="fw-bolder fs-7">COUNTRY & ADDRESS</p>
                        </div>
                        <div className="separator my-0"></div>
                        <div className="card-body mt-3">
                          {address && (
                            <div className="mb-6 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                Country
                              </label>
                              <div className="col-lg-10 col-md-12 col-sm-12">
                                <Controller
                                  name="country_id"
                                  control={control}
                                  defaultValue={driver?.user?.country_id || ""} // Initialize default value
                                  rules={{ required: "Please select a Country" }}
                                  render={({ field }) => {
                                    const selectedCountry = address.Country.find(
                                      (country) =>
                                        country.country_id ===
                                        (getValues("country_id") ||
                                          driver?.user?.country_id)
                                    );

                                    return (
                                      <Select
                                        {...field}
                                        value={
                                          selectedCountry
                                            ? {
                                              value: selectedCountry.country_id,
                                              label:
                                                selectedCountry.country_name,
                                            }
                                            : null
                                        }
                                        onChange={(option) => {
                                          field.onChange(
                                            option ? option.value : null
                                          );
                                          handleCountryChange(option);
                                        }}
                                        className={`react-select-styled ${errors.country_id ? "is-invalid" : ""
                                          }`}
                                        classNamePrefix="react-select"
                                        options={address.Country.map(
                                          (country) => ({
                                            value: country.country_id,
                                            label: country.country_name,
                                          })
                                        )}
                                        placeholder="Select Country"
                                        isSearchable
                                      />
                                    );
                                  }}
                                />
                                {errors.country_id && (
                                  <p className="invalid-feedback">
                                    {errors.country_id.message}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {states.length > 0 && (
                            <div className="mb-6 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                State
                              </label>
                              <div className="col-lg-10 col-md-12 col-sm-12">
                                <Controller
                                  name="state_id"
                                  control={control}
                                  defaultValue={driver?.user?.state_id || ""} // Initialize default value
                                  rules={{ required: "Please select a State" }}
                                  render={({ field }) => {
                                    const selectedState = states.find(
                                      (state) =>
                                        state.state_id ===
                                        (getValues("state_id") ||
                                          driver?.user?.state_id)
                                    );

                                    const formattedValue = selectedState
                                      ? {
                                        value: selectedState.state_id,
                                        label: selectedState.state_name,
                                      }
                                      : null;

                                    return (
                                      <Select
                                        {...field}
                                        value={formattedValue} // Set the formatted value for the Select component
                                        onChange={(option) => {
                                          field.onChange(
                                            option ? option.value : null
                                          );
                                          handleStateChange(option); // Additional logic
                                        }}
                                        className={`react-select-styled ${errors.state_id ? "is-invalid" : ""
                                          }`}
                                        classNamePrefix="react-select"
                                        options={states.map((state) => ({
                                          value: state.state_id,
                                          label: state.state_name,
                                        }))}
                                        placeholder="Select State"
                                        isSearchable
                                      />
                                    );
                                  }}
                                />
                                {errors.state_id && (
                                  <p style={{ color: "red" }} className="mt-3">
                                    {errors.state_id.message}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {cities.length > 0 && (
                            <div className="mb-6 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                City
                              </label>
                              <div className="col-lg-10 col-md-12 col-sm-12">
                                <Controller
                                  name="city_id"
                                  control={control}
                                  defaultValue={driver?.user?.city_id || ""} // Initialize default value
                                  rules={{ required: "Please select a City" }}
                                  render={({ field }) => {
                                    const selectedCity = cities.find(
                                      (city) =>
                                        city.city_id ===
                                        (getValues("city_id") ||
                                          driver?.user?.city_id)
                                    );

                                    const formattedValue = selectedCity
                                      ? {
                                        value: selectedCity.city_id,
                                        label: selectedCity.city_name,
                                      }
                                      : null;

                                    return (
                                      <Select
                                        {...field}
                                        value={formattedValue} // Set the formatted value for the Select component
                                        onChange={(option) => {
                                          field.onChange(
                                            option ? option.value : null
                                          );
                                          handleCityChange(option); // Additional logic
                                        }}
                                        className={`react-select-styled ${errors.city_id ? "is-invalid" : ""
                                          }`}
                                        classNamePrefix="react-select"
                                        options={cities.map((city) => ({
                                          value: city.city_id,
                                          label: city.city_name,
                                        }))}
                                        placeholder="Select City"
                                        isSearchable
                                      />
                                    );
                                  }}
                                />
                                {errors.city_id && (
                                  <p style={{ color: "red" }} className="mt-3">
                                    {errors.city_id.message}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="mb-5 row">
                            <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                              Pincode
                            </label>
                            <div className="col-lg-4 col-md-12 col-sm-12">
                              <input
                                type="text"
                                name="pincode"
                                className={`form-control mb-2 ${errors.pincode ? "is-invalid" : ""
                                  }`}
                                placeholder="Pincode"
                                defaultValue={driver?.user?.pin_code}
                                {...register("pincode", formValidations.pincode)}
                              />
                              {errors.pincode && (
                                <p className="invalid-feedback">
                                  {errors.pincode.message}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="mb-5 row">
                            <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                              Address
                            </label>
                            <div className="col-lg-10 col-md-12 col-sm-12">
                              <input
                                type="text"
                                className={`form-control mb-2 ${errors.address ? "is-invalid" : ""
                                  }`}
                                placeholder="Address"
                                name="address"
                                defaultValue={driver?.user?.address}
                                {...register("address", formValidations.address)}
                              />

                              {errors.address && (
                                <p className="invalid-feedback">
                                  {errors.address.message}
                                </p>
                              )}
                            </div>
                          </div>

                          {address && (
                            <div className="mb-6 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                Timezone
                              </label>
                              <div className="col-lg-10 col-md-12 col-sm-12">
                                <Controller
                                  name="timezone"
                                  control={control}
                                  defaultValue={driver?.user?.timezone || ""} // Initialize default value
                                  rules={formValidations.timezone}
                                  render={({
                                    field: { onChange, onBlur, value, ref },
                                  }) => {
                                    const selectedTimezone =
                                      address?.timezones?.find(
                                        (timezone) =>
                                          timezone.timezone_key === value // Use the value from form state
                                      );

                                    const formattedValue = selectedTimezone
                                      ? {
                                        value: selectedTimezone.timezone_key,
                                        label: selectedTimezone.timezone_value,
                                      }
                                      : null;

                                    return (
                                      <Select
                                        ref={ref}
                                        value={formattedValue} // Set the formatted value for the Select component
                                        onChange={(selectedOption) => {
                                          const newValue = selectedOption
                                            ? selectedOption.value
                                            : "";
                                          onChange(newValue); // Update form state with value
                                        }}
                                        onBlur={onBlur}
                                        options={address?.timezones?.map(
                                          (timezone) => ({
                                            value: timezone.timezone_key,
                                            label: timezone.timezone_value,
                                          })
                                        )}
                                        placeholder="Select Timezones"
                                        className={`react-select-styled ${errors.timezone ? "is-invalid" : ""
                                          }`}
                                        classNamePrefix="react-select"
                                        isSearchable
                                      />
                                    );
                                  }}
                                />
                                {errors.timezone && (
                                  <p className="invalid-feedback">
                                    {errors.timezone.message}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="mb-5 row">
                            <label className="required  col-lg-2 col-md-12 col-sm-12 col-form-label">
                              Status
                            </label>
                            <div className="col-lg-10 col-md-12 col-sm-12">
                              <select
                                name="is_active"
                                className="form-control mb-2"
                                defaultValue={driver?.user?.is_active}
                                {...register("is_active", {
                                  required: "Please select a Status",
                                })}
                                aria-invalid={!errors.is_active}
                              >
                                <option value="" disabled>
                                  Select Status
                                </option>
                                <option value="1">Active</option>
                                <option value="0">Inactive</option>
                              </select>
                              {errors.is_active && (
                                <p style={{ color: "red" }} className="mt-1">
                                  {errors.is_active.message}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex flex-column mt-8">
                      <div className="card card-flush py-4">
                        <div className="text-center">
                          <p className="fw-bolder fs-7">MAIN OFFICE ADDRESS</p>
                        </div>
                        <div className="separator my-0"></div>
                        <div className="card-body mt-3">
                          <div className="mb-5 row">
                            <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                              Carrer & Career
                            </label>
                            <div className="col-lg-5 col-md-12 col-sm-5">
                              <input
                                type="text"
                                name="carrer_us_dot_number"
                                className={`form-control mb-2 ${errors.carrer_us_dot_number ? "is-invalid" : ""
                                  }`}
                                placeholder="Carrer US Dot Number"
                                defaultValue={
                                  driver?.userInfo?.carrer_us_dot_number
                                }
                                {...register(
                                  "carrer_us_dot_number",
                                  formValidations.carrer_us_dot_number
                                )}
                              />
                              {errors.carrer_us_dot_number && (
                                <p className="invalid-feedback">
                                  {errors.carrer_us_dot_number.message}
                                </p>
                              )}
                            </div>
                            <div className="col-lg-5 col-md-12 col-sm-5">
                              <input
                                type="text"
                                name="career_name"
                                className={`form-control mb-2 ${errors.career_name ? "is-invalid" : ""
                                  }`}
                                placeholder="Career Name"
                                defaultValue={driver?.userInfo?.career_name}
                                {...register(
                                  "career_name",
                                  formValidations.career_name
                                )}
                              />
                              {errors.career_name && (
                                <p className="invalid-feedback">
                                  {errors.career_name.message}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mb-5 row">
                            <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                              Main Office Address
                            </label>
                            <div className="col-lg-10 col-md-12 col-sm-12">
                              <input
                                type="text"
                                name="main_office_address"
                                className={`form-control mb-2 ${errors.main_office_address ? "is-invalid" : ""
                                  }`}
                                placeholder="Main Office Address"
                                defaultValue={
                                  driver?.userInfo?.main_office_address
                                }
                                {...register(
                                  "main_office_address",
                                  formValidations.main_office_address
                                )}
                              />
                              {errors.main_office_address && (
                                <p className="invalid-feedback">
                                  {errors.main_office_address.message}
                                </p>
                              )}
                            </div>
                          </div>
                          {homeTerminal && (
                            <div className="mb-5 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12  col-form-label">
                                Home Terminal
                              </label>
                              <div className="col-lg-5 col-md-12 col-sm-5">
                                <select
                                  name="home_terminal_address"
                                  className={`form-control mb-2 ${errors.home_terminal_address
                                    ? "is-invalid"
                                    : ""
                                    }`}
                                  defaultValue={
                                    driver?.userInfo?.home_terminal_address
                                  }
                                  {...register("home_terminal_address", {
                                    required:
                                      "Please select a home terminal address",
                                  })}
                                  aria-invalid={!errors.home_terminal_address}
                                >
                                  <option value="" disabled selected={!id}>
                                    Select Home Terminal Address
                                  </option>
                                  {homeTerminal.location.map((driver) => (
                                    <option key={driver.id} value={driver.id}>
                                      {driver.address}
                                    </option>
                                  ))}
                                </select>
                                {errors.home_terminal_address && (
                                  <p style={{ color: "red" }} className="mt-1">
                                    {errors.home_terminal_address.message}
                                  </p>
                                )}
                              </div>
                              <div className="col-lg-5 col-md-12 col-sm-5">
                                <input
                                  type="text"
                                  name="home_terminal_name"
                                  className={`form-control mb-2 ${errors.home_terminal_name ? "is-invalid" : ""
                                    }`}
                                  placeholder="Home Terminal Name"
                                  defaultValue={
                                    driver?.userInfo?.home_terminal_name
                                  }
                                  {...register(
                                    "home_terminal_name",
                                    formValidations.home_terminal_name
                                  )}
                                />
                                {errors.home_terminal_name && (
                                  <p className="invalid-feedback">
                                    {errors.home_terminal_name.message}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {homeTerminal && (
                            <div className="mb-5 row">
                              <label className="col-lg-2 col-md-12 col-sm-12 col-form-label"></label>
                              <div className="col-lg-5 col-md-12 col-sm-5">
                                <Controller
                                  name="home_terminal_timezones"
                                  control={control}
                                  defaultValue={
                                    driver?.userInfo?.home_terminal_timezone || ""
                                  } // Initialize default value
                                  rules={formValidations.home_terminal_timezones}
                                  render={({
                                    field: { onChange, onBlur, value, ref },
                                  }) => {
                                    const selectedHomeTimezone =
                                      address?.timezones?.find(
                                        (timezone) =>
                                          timezone.timezone_key === value // Use the value from form state
                                      );

                                    const formattedValue = selectedHomeTimezone
                                      ? {
                                        value:
                                          selectedHomeTimezone.timezone_key,
                                        label:
                                          selectedHomeTimezone.timezone_value,
                                      }
                                      : null;

                                    return (
                                      <Select
                                        ref={ref}
                                        value={formattedValue} // Set the formatted value for the Select component
                                        onChange={(selectedOption) => {
                                          const newValue = selectedOption
                                            ? selectedOption.value
                                            : "";
                                          onChange(newValue); // Update form state with value
                                        }}
                                        onBlur={onBlur}
                                        options={
                                          address?.timezones?.map((obj) => ({
                                            value: obj.timezone_key,
                                            label: obj.timezone_value,
                                          })) || []
                                        }
                                        placeholder="Select Home Terminal Timezones"
                                        className={`react-select-styled ${errors.home_terminal_timezones
                                          ? "is-invalid"
                                          : ""
                                          }`}
                                        classNamePrefix="react-select"
                                      />
                                    );
                                  }}
                                />
                                {errors.home_terminal_timezones && (
                                  <p style={{ color: "red" }} className="mt-3">
                                    {errors.home_terminal_timezones.message}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex flex-column mt-8">
                      <div className="card card-flush py-4">
                        <div className="text-center">
                          <p className="fw-bolder fs-7">CYCLES</p>
                        </div>
                        <div className="separator my-0"></div>
                        <div className="card-body mt-3">
                          {address && (
                            <>
                              <div className="mb-5 row">
                                <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                  Cycle Rule
                                </label>
                                <div className="col-lg-10 col-md-12 col-sm-12">
                                  <Controller
                                    name="cycle_rule"
                                    control={control}
                                    defaultValue={
                                      driver?.cycle?.[0]?.rule_id || ""
                                    }
                                    rules={formValidations.cycle_rule}
                                    render={({
                                      field: { onChange, onBlur, value, ref },
                                    }) => {
                                      const selectedCycle = address?.cycle?.find(
                                        (cycle) => cycle.id === value
                                      );

                                      const formattedValue = selectedCycle
                                        ? {
                                          value: selectedCycle.id,
                                          label: selectedCycle.title,
                                        }
                                        : null;

                                      return (
                                        <Select
                                          ref={ref}
                                          value={formattedValue}
                                          onChange={(selectedOption) => {
                                            const newValue = selectedOption
                                              ? selectedOption.value
                                              : "";
                                            onChange(newValue);
                                          }}
                                          onBlur={onBlur}
                                          options={
                                            address?.cycle?.map((cycle) => ({
                                              value: cycle.id,
                                              label: cycle.title,
                                            })) || []
                                          }
                                          placeholder="Select Cycle Rule"
                                          className={`react-select-styled ${errors.cycle_rule ? "is-invalid" : ""
                                            }`}
                                          classNamePrefix="react-select"
                                        />
                                      );
                                    }}
                                  />
                                  {errors.cycle_rule && (
                                    <p className="invalid-feedback">
                                      {errors.cycle_rule.message}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="mb-5 row">
                                <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                  Cargo Type
                                </label>
                                <div className="col-lg-10 col-md-12 col-sm-12">
                                  <Controller
                                    name="cargo_type"
                                    control={control}
                                    defaultValue={driver?.cargo?.option_id || ""}
                                    rules={formValidations.cargo_type}
                                    render={({
                                      field: { onChange, onBlur, value, ref },
                                    }) => {
                                      const selectedCargo = address.cargo.find(
                                        (cargoObj) => cargoObj.option_id === value
                                      );

                                      const formattedValue = selectedCargo
                                        ? {
                                          value: selectedCargo.option_id,
                                          label: selectedCargo.title,
                                        }
                                        : null;

                                      return (
                                        <Select
                                          ref={ref}
                                          value={formattedValue}
                                          onChange={(selectedOption) => {
                                            const newValue = selectedOption
                                              ? selectedOption.value
                                              : "";
                                            onChange(newValue);
                                          }}
                                          onBlur={onBlur}
                                          options={address.cargo.map((cargo) => ({
                                            value: cargo.option_id,
                                            label: cargo.title,
                                          }))}
                                          placeholder="Select Cargo Type"
                                          className={`react-select-styled ${errors.cargo_type ? "is-invalid" : ""
                                            }`}
                                          classNamePrefix="react-select"
                                        />
                                      );
                                    }}
                                  />
                                  {errors.cargo_type && (
                                    <p className="invalid-feedback">
                                      {errors.cargo_type.message}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </>
                          )}

                          {address && (
                            <div className="mb-5 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                Restart
                              </label>
                              <div className="col-lg-10 col-md-12 col-sm-12">
                                <Controller
                                  name="restart"
                                  control={control}
                                  defaultValue={
                                    driver?.restart?.[0]?.rule_id || ""
                                  }
                                  rules={{
                                    required: "Please select a restart rule",
                                  }}
                                  render={({
                                    field: { onChange, onBlur, value, ref },
                                  }) => {
                                    const selectedRestartBreak =
                                      address?.restart?.find(
                                        (restart) => restart.id === value
                                      );

                                    const formattedValue = selectedRestartBreak
                                      ? {
                                        value: selectedRestartBreak.id,
                                        label: selectedRestartBreak.title,
                                      }
                                      : null;

                                    return (
                                      <Select
                                        ref={ref}
                                        value={formattedValue}
                                        onChange={(selectedOption) => {
                                          const newValue = selectedOption
                                            ? selectedOption.value
                                            : "";
                                          onChange(newValue);
                                          handleCountryChange(selectedOption);
                                        }}
                                        onBlur={onBlur}
                                        options={
                                          address?.restart?.map((restart) => ({
                                            value: restart.id,
                                            label: restart.title,
                                          })) || []
                                        }
                                        placeholder="Select Restart"
                                        className={`react-select-styled ${errors.restart ? "is-invalid" : ""
                                          }`}
                                        classNamePrefix="react-select"
                                      />
                                    );
                                  }}
                                />
                                {errors.restart && (
                                  <p className="invalid-feedback">
                                    {errors.restart.message}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {address && (
                            <div className="mb-5 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                Rest Break
                              </label>
                              <div className="col-lg-10 col-md-12 col-sm-12">
                                <Controller
                                  name="rest_break"
                                  control={control}
                                  defaultValue={driver?.break?.[0]?.rule_id || ""}
                                  rules={{
                                    required: "Please select a rest break rule",
                                  }}
                                  render={({
                                    field: { onChange, onBlur, value, ref },
                                  }) => {
                                    const selectedRestBreak =
                                      address?.break?.find(
                                        (restbObj) => restbObj.id === value
                                      );

                                    const formattedValue = selectedRestBreak
                                      ? {
                                        value: selectedRestBreak.id,
                                        label: selectedRestBreak.title,
                                      }
                                      : null;

                                    return (
                                      <Select
                                        ref={ref}
                                        value={formattedValue}
                                        onChange={(selectedOption) => {
                                          const newValue = selectedOption
                                            ? selectedOption.value
                                            : "";
                                          onChange(newValue);
                                          handleCountryChange(selectedOption);
                                        }}
                                        onBlur={onBlur}
                                        options={
                                          address?.break?.map((breakOption) => ({
                                            value: breakOption.id,
                                            label: breakOption.title,
                                          })) || []
                                        }
                                        placeholder="Select Break"
                                        className={`react-select-styled ${errors.rest_break ? "is-invalid" : ""
                                          }`}
                                        classNamePrefix="react-select"
                                      />
                                    );
                                  }}
                                />
                                {errors.rest_break && (
                                  <p className="invalid-feedback">
                                    {errors.rest_break.message}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="mb-5 row">
                            <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                              Adverse Conditions Exception
                            </label>
                            <div className="col-lg-10 col-md-12 col-sm-12">
                              <select
                                name="adverse_condtion"
                                className="form-control mb-2"
                                value={adv}
                                {...register("adverse_condtion", {
                                  required:
                                    "Please select a driver ruleset cycle",
                                })}
                                onChange={(e) => {
                                  setAdv(Number(e.target.value));
                                  setValue(
                                    "adverse_condtion",
                                    Number(e.target.value)
                                  );
                                }}
                                aria-invalid={!errors.adverse_condtion}
                              >
                                <option value="" disabled>
                                  Select Adverse Conditions Exception
                                </option>
                                <option value="1">Available</option>
                                <option value="0">Not Available</option>
                              </select>
                              {errors.adverse_condtion && (
                                <p style={{ color: "red" }} className="mt-1">
                                  {errors.adverse_condtion.message}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="d-flex justify-content-center">
                  <Link href="/dashboard/drivers" className="btn-light me-5">
                    Cancel
                  </Link>
                  <button
                    id="kt_sign_in_submit"
                    className="justify-content-center btn-primary"
                    disabled={isLoading}
                  >
                    <span className="indicator-progress d-flex justify-content-center">
                      {isLoading ? (
                        <LoadingIcons.TailSpin height={18} />
                      ) : id ? (
                        "Update"
                      ) : (
                        "Save"
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default DriverForm;
