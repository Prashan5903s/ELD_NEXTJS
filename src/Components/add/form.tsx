'use client'
import { useState, useEffect } from "react";


type dTYpe = {
  d
}
export default function Form({ userData, subCl }) {
  const [userFormData, setUserFormData] = useState({
    countries: [],
    state: [],
    city: [],
    timezones: [],
    lang: [],
    first_name: "",
    last_name: "",
    comp_name: "",
    mobile_no: "",
    landline_no: "",
    email: "",
    country: "",
    states: "",
    cities: "",
    dtime: "",
    dlang: '',
    timezone: "",
    langu: "",
    status: "",
  });

  useEffect(() => {
    if (userData) {
      const obj = userData.timezones;
      const result = Object.keys(obj).map((key) => [key, obj[key]]);
      setUserFormData({
        ...userFormData,
        countries: userData.countries,
        state: userData.state,
        city: userData.city,
        timezones: result, // Setting timezones as array
        lang: userData.lang,
      });
    }
  }, [userData, userFormData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Check if subCl is a function before calling it
    if (typeof subCl === 'function') {
      subCl(userFormData);
    } else {
      console.error("subCl is not a function");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserFormData({ ...userFormData, [name]: value });
  };

  return (
    <form className="container" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="first-name">First Name</label>
        <input
          type="text"
          className="form-control"
          id="first-name"
          name="first_name"
          placeholder="Enter first name"
          onChange={handleInputChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="last-name">Last Name</label>
        <input
          type="text"
          className="form-control"
          id="last-name"
          name="last_name"
          placeholder="Enter last name"
          onChange={handleInputChange}
        />
      </div>
      <div className="form-group">
        <label htmlFor="name"> Company Name</label>
        <input
          type="text"
          className="form-control"
          id="name"
          name="comp_name"
          placeholder="Enter Company name"
          onChange={handleInputChange}
        />
      </div>
      <div className="form-group">
        <label htmlFor="company-name">Mobile No</label>
        <input
          type="text"
          className="form-control"
          id="mobile_no"
          name="mobile_no"
          placeholder="Enter mobile no"
          onChange={handleInputChange}
        />
      </div>
      <div className="form-group">
        <label htmlFor="landline-no">Landline No</label>
        <input
          type="text"
          className="form-control"
          id="landline-no"
          name="landline_no"
          placeholder="Enter landline no"
          onChange={handleInputChange}
        />
      </div>
      <div className="form-group">
        <label htmlFor="email">Email address</label>
        <input
          type="email"
          className="form-control"
          id="email"
          name="email"
          placeholder="Enter email"
          onChange={handleInputChange}
        />
      </div>
      <div className="form-group">
        <label htmlFor="email">Password</label>
        <input
          type="password"
          className="form-control"
          id="password"
          name="password"
          placeholder="Enter password"
          onChange={handleInputChange}
        />
      </div>
      {userFormData.countries.length > 0 && (
        <div className="form-group">
          <label htmlFor="country">Country</label>
          <select
            className="form-control"
            id="country"
            name="country_id"
            onChange={handleInputChange}
          >
            <option value="default" disabled>
              Select Country
            </option>
            {userFormData.countries.map((country) => (
              <option key={country.country_id} value={country.country_id}>
                {country.country_name}
              </option>
            ))}
          </select>
        </div>
      )}
      {userFormData.state.length > 0 && (
        <div className="form-group">
          <label htmlFor="states">State</label>
          <select
            className="form-control"
            id="states"
            name="state_id"
            onChange={handleInputChange}
          >
            <option value="default" disabled>
              Select State
            </option>
            {userFormData.state.map((states) => (
              <option key={states.state_id} value={states.state_id}>
                {states.state_name}
              </option>
            ))}
          </select>
        </div>
      )}
        {userFormData.city.length > 0 && (
        <div className="form-group">
          <label htmlFor="cities">City</label>
          <select
            className="form-control"
            id="city_id"
            name="city_id"
            onChange={handleInputChange}
          >
            <option value="default" disabled>
              Select City
            </option>
            {userFormData.city.map((cities) => (
              <option key={cities.city_id} value={cities.city_id}>
                {cities.city_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {userFormData.timezones.length > 0 && (
        <div className="form-group">
          <label htmlFor="timezone">Timezone</label>
          <select
            className="form-control"
            id="timezone"
            name="timezone"
            onChange={handleInputChange}
          >
            <option value="default" disabled>
              Select Timezone
            </option>
            {userFormData.timezones.map((timezone, index) => (
              <option
                selected={userFormData.dtime == timezone[1]}
                key={index}
                value={timezone[1]}
              >
                {timezone[1]}
              </option>
            ))}
          </select>
        </div>
      )}

      {userFormData.lang.length > 0 && (
        <div className="form-group">
          <label htmlFor="langu">Language</label>
          <select
            className="form-control"
            id="langu"
            name="language_id"
            onChange={handleInputChange}
          >
            <option value="default" disabled>
              Select Language
            </option>
            {userFormData.lang.map((language) => (
              <option
                key={language.id}
                value={language.id}
                selected={userFormData.dlang === language.id}
              >
                {language.language_name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="status">Status</label>
        <select
          className="form-control"
          id="status"
          name="status"
          onChange={handleInputChange}
        >
          <option value="" disabled>
            Select Status
          </option>
          <option value="1" >
            Active
          </option>
          <option value="0" >
            Inactive
          </option>
        </select>
      </div>
      <button type="submit" className="w-100 btn btn-primary">
        Submit
      </button>
    </form>
  );
}
