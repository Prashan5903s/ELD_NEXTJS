import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";
import type { NextRequestWithAuth } from "next-auth/middleware";
import { toJSON } from "./_metronic/assets/ts/_utils";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

if (!BACKEND_API_URL) {
  throw new Error(
    "NEXT_PUBLIC_BACKEND_API_URL is not defined in environment variables"
  );
}

export default withAuth(
  async function middleware(request: NextRequestWithAuth) {
    const nextAuthToken = request.nextauth.token;

    const token = nextAuthToken?.token;

    const logSession = nextAuthToken?.logSession;

    const user_type = nextAuthToken?.user_type;

    const master_user = nextAuthToken?.master_user_type;

    // const token = request.cookies.get("token")?.value;
    const pathname = request.nextUrl.pathname;
    const splittedPathname = pathname.split("/");

    if (pathname === "/logo/favicon.ico") {
      return new Response(null, { status: 204 }); // No Content
    }

    // Check if there are enough segments to extract id
    const id = splittedPathname.length >= 5 ? splittedPathname[4] : undefined;
    const ids = splittedPathname.length >= 4 ? splittedPathname[3] : undefined;
    const tokens =
      splittedPathname.length >= 3 && splittedPathname[1] == "shares"
        ? splittedPathname[2]
        : "undefined";

    if (typeof window === undefined) {
      return null;
    }

    if (typeof document === undefined) {
      return null;
    }

    const dlist = ["/dashboard/drivers"];
    const llist = ["/dashboard/locations"];
    const hlist = [`/dashboard/drivers/detail/${id}/hoursOfService`];
    const ddriver = [`/dashboard/drivers/detail/${id}`];
    const dadd = ["/dashboard/drivers/driver-add"];
    const uadd = ["/settings/organization/user-roles/add-role"];
    const dedit = [`/dashboard/drivers/edit/${id}`];
    const ulist = [`/settings/organization/user-roles/${id}`];
    const vList = ["/dashboard/vehicles"];
    const userList = ["/settings/organization/user-roles"];
    const vAssignList = ["/settings/organization/vehicle-assign"];
    const dActivityList = ["/settings/organization/driver-activity"];
    const vAList = ["/settings/organization/vehicle-assign"];
    const vAAList = ["/settings/organization/vehicle-assign/add-assign"];
    const vAEList = [`/settings/organization/vehicle-assign/${id}`];
    const dAList = ["/settings/device"];
    const aDList = ["/settings/device/device-add"];
    const dEList = [`/settings/device/${ids}`];
    const tPage = [`/shares/${tokens}`];
    const changePassword = [`/Auth/changePassword/${ids}`];
    const editDriverActivity = [`/settings/organization/driver-activity/${id}`];
    const addDriverActivity = ['/settings/organization/driver-activity/add-activity'];

    const TrPage = [
      "/dashboard",
      "/dashboard/drivers",
      "/dashboard/drivers/driver-add",
      `/dashboard/drivers/edit/${id}`,
      `/dashboard/drivers/detail/${id}`,
      `/dashboard/drivers/detail/${id}/hoursOfService`,
      "/settings/organization/user-roles",
      `/settings/organization/user-roles/${id}`,
      "/settings/organization/user-roles/add-role",
      "/settings/organization/driver-activity",
      "/settings/organization/driver-activity/add-activity",
      `/settings/organization/driver-activity/${id}`,
      "/settings/device",
      "/dashboard/environments",
      "/dashboard/compliance",
      `/settings/device/${ids}`,
      "/settings/device/device-add",
      "/settings/organization/vehicle-assign",
      `/settings/organization/vehicle-assign/${id}`,
      "/settings/organization/vehicle-assign/add-assign",
      "/dashboard/vehicles",
      "/dashboard/locations",
      "/settings/organization/driver-activity",
      `/safety/speeding-details/${ids}`,
      `/safety/event-details/${ids}`,
      "/dashboard/documents",
      "/safety/overview",
      "/safety/events",
      "/dashboard/chatbox",
      "/reports/data",
      "/mileage/data",
      "/idling/data",
      "/fuel/performance",
      "/inspection/report",
      "/safety/score/report",
      "/hours/worked",
    ];

    const DrPage = [
      "/drivers",
      "/drivers/driver-activity",
      "/drivers/driver-activity/add-activity",
      `/drivers/driver-activity/${ids}`,
      "/drivers/hoursOfService",
      "/drivers/chatbox",
      "/drivers/inspection",
      "/safety-driver/events",
      "/drivers/documents",
      "/drivers/dot-inspection",
      "/drivers/settings/account",
      '/drivers/settings/change-password',
      '/drivers/settings/general',
      '/drivers/settings/carrer',
      "/drivers/settings/cycle-rule"
    ];

    const EcPage = ["/company/page", "/company/add", `/company/edit/${ids}`];

    const GuestPage = [
      "/",
      "/Auth/ResetPassword",
    ];

    const isTPage = tPage.includes(pathname);
    const isDrRequest = DrPage.includes(pathname);
    const isRequestedRouteIsGuestRoute = GuestPage.includes(pathname);
    const isTRRequestPage = TrPage.some((route) => pathname.startsWith(route));
    const isECRequestPage = EcPage.some((route) => pathname.startsWith(route));
    const isDList = dlist.includes(pathname);
    const isDAdd = dadd.includes(pathname);
    const isDEdit = dedit.includes(pathname);
    const isDDetail = ddriver.includes(pathname);
    const isHList = hlist.includes(pathname);
    const isUList = ulist.includes(pathname);
    const isUAdd = uadd.includes(pathname);
    const isVList = vList.includes(pathname);
    const isUserList = userList.includes(pathname);
    const isvAssignList = vAssignList.includes(pathname);
    const isDActivity = dActivityList.includes(pathname);
    const isDAList = dAList.includes(pathname);
    const isLList = llist.includes(pathname);
    const isVAList = vAList.includes(pathname);
    const isVAAList = vAAList.includes(pathname);
    const isVAEList = vAEList.includes(pathname);
    const isDEList = dEList.includes(pathname);
    const isADList = aDList.includes(pathname);
    const isChangePassword = changePassword.includes(pathname);
    const isDriverActivity = editDriverActivity.includes(pathname);
    const isAddDriverActivty = addDriverActivity.includes(pathname);

    if (
      token == "undefined" &&
      (isECRequestPage || isTRRequestPage || isDrRequest)
    ) {

      if (!isRequestedRouteIsGuestRoute) {
        return NextResponse.redirect(new URL("/", request.url));
      }

    }

    if (
      token &&
      user_type == "U" &&
      master_user == "TR" &&
      (isRequestedRouteIsGuestRoute || isTRRequestPage || isECRequestPage)
    ) {
      return NextResponse.redirect(new URL("/drivers", request.url));
    }

    if (!token && (isECRequestPage || isTRRequestPage || isDrRequest)) {

      if (!isRequestedRouteIsGuestRoute) {
        return NextResponse.redirect(new URL("/", request.url));
      }

    }

    if (token && isRequestedRouteIsGuestRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (token && user_type == "EC" && isTRRequestPage) {
      return NextResponse.redirect(new URL("/company/page", request.url));
    }

    if (token && user_type == "EC" && isDrRequest) {
      return NextResponse.redirect(new URL("/company/page", request.url));
    }

    if (token && user_type == "TR" && isECRequestPage) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (token && user_type == "TR" && isDrRequest) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    let cachedUserData = null;
    let lastFetchTime = 0;
    const CACHE_DURATION = 300000; // Cache user data for 5 minutes
    const RETRY_LIMIT = 3;
    const RETRY_DELAY = 1000; // Start with a 1 second delay

    async function fetchTokenData(ids, request) {
      try {
        // Make the fetch request to check the token
        const response = await fetch(
          `${BACKEND_API_URL}/check/forgot/password/token/${ids}`
        );

        // Check if the response is OK (status code 200-299)
        if (!response.ok) {

          if (!isRequestedRouteIsGuestRoute) {
            return NextResponse.redirect(new URL("/", request.url));
          }

        }

        // Parse the response data
        const data = await response.json();

        // Check if data is false or invalid
        if (!data) {

          if (!isRequestedRouteIsGuestRoute) {
            return NextResponse.redirect(new URL("/", request.url));
          }

        }

        // Return NextResponse.next() if the token is valid
        return NextResponse.next();
      } catch (error) {

        if (!isRequestedRouteIsGuestRoute) {
          return NextResponse.redirect(new URL("/", request.url));
        }

      }

    }


    if (!isAddDriverActivty) {

      if (isDriverActivity) {
        try {
          // Make the fetch request to check the token
          const response = await fetch(`${BACKEND_API_URL}/check/edit/driver/activity/${id}`, {
            method: "GET", // Explicitly set method
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json", // Add this to ensure proper request
            },
          });

          // Check if the response is OK (status code 200-299)
          if (!response.ok) {
            console.warn("Token validation failed. Redirecting to driver activity page...");
            return NextResponse.redirect(new URL("/settings/organization/driver-activity", request.url));
          }

          // Parse the response data
          const data = await response.json();

          // Check if data is false or invalid
          if (!data) {
            return NextResponse.redirect(new URL("/settings/organization/driver-activity", request.url));
          }

          // Return NextResponse.next() if the token is valid
          return NextResponse.next();
        } catch (error) {
          console.error("Error fetching token data:", error);
          // Redirect on error if fetching the token fails
          return NextResponse.redirect(new URL("/settings/organization/driver-activity", request.url));
        }
      }
    }

    if (isChangePassword) {
      const tokenValidationResponse = await fetchTokenData(ids, request);

      // If the token validation results in a redirection, return it immediately
      if (tokenValidationResponse instanceof NextResponse) {
        return tokenValidationResponse; // This will handle the redirect
      }
    }

    async function fetchUserData(token, retryCount = 0) {
      // Use cache if the cache duration has not expired
      if (cachedUserData && Date.now() - lastFetchTime < CACHE_DURATION) {
        return cachedUserData;
      }

      try {
        const response = await fetch(`${BACKEND_API_URL}/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          cachedUserData = data; // Cache the data
          lastFetchTime = Date.now();
          return data;
        } else {

          if (retryCount < RETRY_LIMIT) {
            const delay = RETRY_DELAY * Math.pow(2, retryCount);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return fetchUserData(token, retryCount + 1);
          } else {

            console.error("Maximum retry limit reached.");
          }
        }
      } catch (error) {

        if (retryCount < RETRY_LIMIT) {
          const delay = RETRY_DELAY * Math.pow(2, retryCount);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return fetchUserData(token, retryCount + 1);
        } else {

          console.error("Maximum retry limit reached.");

        }

      }

      return null; // Return null if the request fails after retries
    }

    async function handleUserRedirect(token, request) {
      if (token && typeof token === "string") {
        const data = await fetchUserData(token);

        if (data) {
          if (isRequestedRouteIsGuestRoute) {
            if (user_type === "EC") {
              return NextResponse.redirect(
                new URL("/company/page", request.url)
              );
            } else if (user_type === "TR") {
              return NextResponse.redirect(new URL("/dashboard", request.url));
            }
          }

          if (user_type === "EC" && !isECRequestPage) {
            return NextResponse.redirect(new URL("/company/page", request.url));
          }

          if (user_type === "TR" && !isTRRequestPage) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
          }
        }
      }
    }

    let permissionCache = null;
    let cacheTimestamp = 0;

    // Cache timeout of 10 minutes (600,000 milliseconds)
    const CACHE_TIMEOUT = 600000;
    const BACKEND_API_URLS = BACKEND_API_URL; // Replace with your backend URL

    // Function to fetch with retry mechanism for handling 429 Too Many Requests error
    const fetchWithRetry = async (url, options, retries = 5, delay = 1000) => {
      try {
        const response = await fetch(url, options);

        if (response.status === 429 && retries > 0) {
          // Too Many Requests: Wait for a delay, then retry
          let retryAfter = response.headers.get("Retry-After") || delay;

          // Ensure retryAfter is a number (if it's a string, convert to number)
          retryAfter = Number(retryAfter) * 1000 || delay; // Retry-After is often in seconds, so multiply by 1000

          await new Promise((resolve) => setTimeout(resolve, retryAfter));
          return fetchWithRetry(url, options, retries - 1, delay * 2); // Exponential backoff
        }

        return response;
      } catch (err) {
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          return fetchWithRetry(url, options, retries - 1, delay * 2); // Retry with exponential backoff
        }
        throw err;
      }
    };

    const checkPermissions = async (token, request, id) => {
      try {
        if (
          !isDrRequest &&
          (isDList ||
            isDAdd ||
            isDEdit ||
            isDDetail ||
            isHList ||
            isUserList ||
            isVList ||
            isvAssignList ||
            isDActivity ||
            isDAList ||
            isLList ||
            isVAList ||
            isVAAList ||
            isVAEList ||
            isDEList)
        ) {
          const currentTime = Date.now();
          let result;

          if (permissionCache && currentTime - cacheTimestamp < CACHE_TIMEOUT) {
            result = permissionCache;
          } else {
            const response = await fetchWithRetry(
              `${BACKEND_API_URLS}/transport/permission`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!response.ok) {
              return NextResponse.redirect('http://localhost:3000/dashboard', 302); // Absolute URL for redirect
            }

            result = await response.json();
            permissionCache = result;
            cacheTimestamp = currentTime;
          }

          // **Explicitly returning redirects**
          const permissionChecks = [
            { flag: isDList, code: 12 },
            { flag: isDAdd, code: 10 },
            { flag: isDEdit, code: 11 },
            { flag: isDDetail, code: 36 },
            { flag: isHList, code: 37 },
            { flag: isUserList, code: 26 },
            { flag: isVList, code: 3 },
            { flag: isvAssignList, code: 29 },
            { flag: isDAList, code: 35 },
            { flag: isLList, code: 6 },
            { flag: isVAList, code: 29 },
            { flag: isVAAList, code: 27 },
            { flag: isVAEList, code: 28 },
            { flag: isDActivity, code: 32 },
            { flag: isADList, code: 33 },
            { flag: isDEList, code: 34 },
          ];

          for (const check of permissionChecks) {
            if (check.flag && !result.includes(check.code)) {
              return NextResponse.redirect('http://localhost:3000/dashboard', 302); // Absolute URL for redirect
            }
          }

          // **Check Edit Detail Permissions**
          if (isDEdit || isDDetail || isHList) {
            const editDetailResponse = await fetchWithRetry(
              `${BACKEND_API_URLS}/driver/edit/check/${id}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!editDetailResponse.ok) {
              return NextResponse.redirect('http://localhost:3000/dashboard', 302); // Absolute URL for redirect
            }

            const editDetailResult = await editDetailResponse.json();

            if (!editDetailResult) {
              return NextResponse.redirect('http://localhost:3000/dashboard', 302); // Absolute URL for redirect
            }
          }
        }
      } catch (err) {
        console.error("Error fetching permissions:", err);
        return NextResponse.redirect('http://localhost:3000/dashboard', 302); // Absolute URL for redirect
      }
    };

    if (isTPage) {
      try {
        const response = await fetch(
          `${BACKEND_API_URLS}/check/token/email/${tokens}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        // Check if the response is successful
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        // Parse the response as JSON
        const data = await response.json();

        if (data.token_exist != 1) {

          if (!isRequestedRouteIsGuestRoute) {
            return NextResponse.redirect(new URL("/", request.url));
          }
        }

        // Handle the data (e.g., update state or UI)
      } catch (error) {
        console.error("Error fetching token:", error.message);
      }
    }

    if (!isUAdd) {
      if (isUList) {
        const editRoleResponse = await fetch(
          `${BACKEND_API_URLS}/check/roles/${id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!editRoleResponse.ok) {
          return NextResponse.redirect(
            new URL("/settings/organization/user-roles", request.url)
          );
        }

        const editRoleResult = await editRoleResponse.json();

        if (!editRoleResult) {
          return NextResponse.redirect(
            new URL("/settings/organization/user-roles", request.url)
          );
        }
      }
    }

    if (token && !isDrRequest) {
      await checkPermissions(token, request, id);
    }

    if (token) {
      handleUserRedirect(token, request);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => {
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|.+?/hook-examples|.+?/menu-examples|images|media|next.svg|vercel.svg).*)",
  ],
};
