"use client";
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import { debounce } from "lodash";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Skeleton from "react-loading-skeleton"; // Import Skeleton
import { useSession } from "next-auth/react";
import LoadingIcons from "react-loading-icons";

export default function AddUserRoleComponent({ id }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
  } = useForm();
  const [module, setModule] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [roles, setRoles] = useState<Roles>();
  const [alls, setAlls] = useState<All[]>();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  interface User {
    token: string;
    // Add other properties you expect in the user object
  }

  interface SessionData {
    user?: User;
    // Add other properties you expect in the session data
  }

  const { data: session } = (useSession() as { data?: SessionData }) || {};

  const token = session && session.user && session?.user?.token;

  type Permission = {
    id: string;
    // Add other fields if necessary
  };

  type Roles = {
    permissions?: Permission[];
    name?: string;
  };

  interface Module {
    id: string;
    name: string;
    category: string;
    checked: boolean;
    permissions: {
      id: string;
      name: string;
      slug: string;
      checked: boolean;
    }[];
  }

  interface All {
    id: string;
    name: string;
    category: string;
    checked: boolean;
    permissions: {
      id: string;
      name: string;
      slug: string;
      checked: boolean;
    }[];
  }

  const notify = () =>
    toast.success(`User & roles ${id ? "update" : "added"} successfully!`, {
      position: "top-right",
      autoClose: 4000, // Auto-dismiss after 1 second
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });

  const getValidationRules = (name) => {
    switch (name) {
      case "name":
        return {
          required: "Role Name is required",
          pattern: {
            value: /^[A-Za-z\s]+$/,
            message: "Alphabetical characters only",
          },
          maxLength: {
            value: 100,
            message: "Role name must be at most 100 characters long",
          },
        };
      default:
        return {};
    }
  };

  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const fetchModules = useCallback(
    debounce(async () => {
      try {
        if (!token) {
          console.error("No token available");
          return;
        }

        const response = await axios.get(
          `${url}/setting/organization/user-roles/create`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setModule(response.data.modules);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    }, 1000), // Adjust debounce delay as needed (in milliseconds)
    [token, url] // Dependencies
  );

  useEffect(() => {
    if (token) {
      fetchModules(); // Trigger the debounced function
    }
  }, [fetchModules, token]);

  const fetchEditModules = useCallback(
    debounce(async (id) => {
      try {
        if (!id) {
          console.error("No ID provided");
          return;
        }

        if (!token) {
          console.error("No token available");
          return;
        }

        const response = await axios.get(
          `${url}/setting/organization/user-roles/${id}/edit`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setAlls(response.data.modules);
        setRoles(response.data.role);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    }, 1000), // Adjust debounce delay as needed (in milliseconds)
    [url, token] // Dependencies
  );

  useEffect(() => {
    if (token) {
      fetchEditModules(id); // Trigger the debounced function with the `id`
    }
  }, [id, fetchEditModules, token]); // Include `fetchEditModules` in dependencies

  useEffect(() => {
    if (id && roles && token) {
      setValue("name", roles.name || ""); // Update form value when roles data is fetched
    }
  }, [roles, id, setValue, token]); // Ensure setValue is included in dependencies

  useEffect(() => {
    if (!id && Array.isArray(module)) {
      const permissionsData = module.map((data) => ({
        id: data.id,
        category: data.name,
        checked: data.checked || false,
        permissions: data.permissions
          ? data.permissions.map((val) => ({
              id: val.id,
              label: val.name,
              value: val.slug,
              checked: val.checked !== undefined ? val.checked : false,
            }))
          : [],
      }));

      setItems(permissionsData);
    }
  }, [module, id]);

  useEffect(() => {
    if (
      id &&
      roles &&
      Array.isArray(roles["permissions"]) &&
      Array.isArray(alls)
    ) {
      const permissionsData = alls.map((data) => {
        const permissions = data.permissions
          ? data.permissions.map((val) => {
              const matchedPermission =
                roles &&
                roles["permissions"].find(
                  (rolePermission) => rolePermission.id === val.id
                );

              return {
                id: val.id,
                label: val.name,
                value: val.slug,
                checked: matchedPermission ? true : false,
              };
            })
          : [];

        const anyChecked = permissions.some((permission) => permission.checked);
        const allChecked =
          permissions.length > 0 &&
          permissions.every((permission) => permission.checked);

        return {
          id: data.id,
          category: data.name,
          checked: anyChecked || allChecked,
          permissions: permissions,
        };
      });

      setItems(permissionsData);
    }
  }, [alls, roles, id]);

  const handleSelectAll = (event) => {
    const checked = event.target.checked;
    setItems(
      items.map((item) => ({
        ...item,
        checked,
        permissions: item.permissions.map((permission) => ({
          ...permission,
          checked,
        })),
      }))
    );
  };

  const handleCategoryChange = (id) => {
    setItems(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              checked: !item.checked,
              permissions: item.permissions.map((permission) => ({
                ...permission,
                checked: !item.checked,
              })),
            }
          : item
      )
    );
  };

  const handlePermissionChange = (categoryId, permissionValue) => {
    setItems(
      items.map((item) => {
        if (item.id === categoryId) {
          const updatedPermissions = item.permissions.map((permission) =>
            permission.value === permissionValue
              ? {
                  ...permission,
                  checked: !permission.checked,
                }
              : permission
          );

          const isAnyPermissionChecked = updatedPermissions.some(
            (permission) => permission.checked
          );
          return {
            ...item,
            permissions: updatedPermissions,
            checked: isAnyPermissionChecked,
          };
        }
        return item;
      })
    );
  };

  const debouncedSaveData = useCallback(
    debounce(async (data) => {
      setIsLoading(true);
      try {
        if (!token) {
          console.error("No token available");
          return;
        }

        const response = await axios.post(
          `${url}/setting/organization/user-roles`,
          data,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.status >= 200 && response.status < 300) {
          notify();
          router.push("/settings/organization/user-roles");
        } else {
          console.error("Unexpected response status:", response.status);
        }
      } catch (error) {
        console.error("Error saving data:", error);
      } finally {
        setIsLoading(false); // Ensure loading state is updated
      }
    }, 1000),
    [url, router, token]
  );

  const debouncedEditData = useCallback(
    debounce(async (data) => {
      setIsLoading(true);
      try {
        if (!token) {
          console.error("No token available");
          return;
        }

        const response = await axios.put(
          `${url}/setting/organization/user-roles/${id}`,
          data,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.status >= 200 && response.status < 300) {
          notify();
          router.push("/settings/organization/user-roles");
        } else {
          console.error("Unexpected response status:", response.status);
        }
      } catch (error) {
        console.error("Error updating data:", error);
      } finally {
        setIsLoading(false); // Ensure loading state is updated
      }
    }, 1000),
    [url, id, router, token]
  );

  const submit = async (data) => {
    const filteredItems = items
      .map((item) => ({
        ...item,
        permissions: item.permissions.filter(
          (permission) => permission.checked
        ),
        checked: item.checked,
      }))
      .filter((item) => item.checked);

    const formData = {
      ...data,
      modules: filteredItems,
    };

    try {
      if (token) {
        if (!id) {
          debouncedSaveData(formData);
        } else {
          debouncedEditData(formData);
        }
      }
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

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
                  {id ? "Edit Role" : "Add Role"}
                </h1>
                <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0">
                  <li className="breadcrumb-item text-muted">
                    <Link
                      href="/dashboard"
                      className="text-muted text-hover-primary"
                    >
                      Home
                    </Link>
                  </li>
                  <li className="breadcrumb-item">
                    <span className="bullet bg-gray-500 w-5px h-2px"></span>
                  </li>
                  <li
                    className="breadcrumb-item text-muted text-muted text-hover-primary"
                    role="button"
                  >
                    User &amp; Roles
                  </li>
                  <li className="breadcrumb-item">
                    <span className="bullet bg-gray-500 w-5px h-2px"></span>
                  </li>
                  <li
                    className="breadcrumb-item text-muted text-muted text-hover-primary"
                    role="button"
                  >
                    {id ? "Edit" : "Add"}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div id="kt_app_content" className="app-content flex-column-fluid mt-3">
          <div
            id="kt_app_content_container"
            className="app-container container-fluid"
          >
            <div>
              <form className="form" onSubmit={handleSubmit(submit)}>
                <div className="d-flex flex-column me-n7 pe-7">
                  <div className="fv-row mb-10">
                    <label className="fs-5 fw-bold form-label mb-2">
                      <span className="required">Role Name</span>
                    </label>
                    {loading ? (
                      <Skeleton height={40} />
                    ) : (
                      <>
                        <input
                          name="name"
                          defaultValue={
                            roles && roles["name"] ? roles["name"] : ""
                          } // Default value from roles or empty string
                          className={`form-control form-control-solid mb-2 ${
                            errors.name ? "is-invalid" : ""
                          }`} // Fixed className syntax
                          placeholder="Enter role name"
                          {...register("name", getValidationRules("name"))} // Register the input with validation rules
                          onChange={(e) => setValue("name", e.target.value)} // Use setValue to update form state
                        />
                        {errors.name && (
                          <p style={{ color: "red" }}>
                            {errors.name.message as string}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="fv-row">
                    <div className="d-flex">
                      <label
                        style={{ maxWidth: "300px" }}
                        className="fs-5 fw-bold form-label col-lg-6 col-md-6 col-xl-2 col-sm-12"
                      >
                        Role Permissions
                      </label>
                      <label className="form-check form-check-custom form-check-solid fw-semibold fs-6 me-9 cursor-pointer">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          value=""
                          id="kt_roles_select_all"
                          onChange={handleSelectAll}
                        />
                        <span className="form-check-label">Select all</span>
                      </label>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <div className="text-gray-600 fw-semibold fs-6">
                      {loading ? (
                        <div>
                          {Array(5)
                            .fill(null)
                            .map((_, index) => (
                              <div className="permissionSection" key={index}>
                                <Skeleton height={30} width={200} />
                                <div className="d-flex flex-wrap border-bottom-dashed border-bottom mb-2 pb-2">
                                  {Array(3)
                                    .fill(null)
                                    .map((_, permIndex) => (
                                      <div
                                        className="col-xl-3 col-lg-6 col-md-6 col-sm-12 py-2"
                                        key={permIndex}
                                      >
                                        <Skeleton height={20} width={150} />
                                      </div>
                                    ))}
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        items.map((item) => (
                          <div className="permissionSection" key={item.id}>
                            <div className="d-flex text-gray-800">
                              <label className="col-xl-2 col-lg-6 col-md-6 col-sm-12 py-3 me-9 fw-bold form-check form-check-solid cursor-pointer">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  value={item.id}
                                  id={item.category.toLowerCase()}
                                  checked={item.checked}
                                  name="modules"
                                  onChange={() => handleCategoryChange(item.id)}
                                />
                                {item.category}
                              </label>
                            </div>
                            <div className="d-flex flex-wrap border-bottom-dashed border-bottom mb-2 pb-2">
                              {item.permissions.map((perm) => (
                                <div
                                  className="col-xl-3 col-lg-6 col-md-6 col-sm-12 py-2"
                                  key={perm.id}
                                >
                                  <label className="form-check form-check-custom form-check-solid me-9 cursor-pointer">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      value={perm.id}
                                      name="permissions"
                                      checked={perm.checked}
                                      onChange={() =>
                                        handlePermissionChange(
                                          item.id,
                                          perm.value
                                        )
                                      }
                                    />
                                    <span className="form-check-label">
                                      {perm.label}
                                    </span>
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                <div className="d-flex justify-content-center align-items-end mt-5">
                  <Link
                    href="/settings/organization/user-roles"
                    className="btn-light me-5 px-7 py-4"
                  >
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
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
