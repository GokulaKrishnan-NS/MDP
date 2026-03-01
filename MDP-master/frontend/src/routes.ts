import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { History } from "./components/History";
import { DeviceStatus } from "./components/DeviceStatus";
import { Settings } from "./components/Settings";
import { Login } from "./components/auth/Login";
import { OTP } from "./components/auth/OTP";
import { UserDetails } from "./components/auth/UserDetails";
import { Permissions } from "./components/auth/Permissions";
import { Hospitals } from "./components/Hospitals";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "history", Component: History },
      { path: "device", Component: DeviceStatus },
      { path: "settings", Component: Settings },
      { path: "hospitals", Component: Hospitals },
    ],
  },
  {
    path: "/auth",
    children: [
      { path: "login", Component: Login },
      { path: "otp", Component: OTP },
      { path: "details", Component: UserDetails },
      { path: "permissions", Component: Permissions },
    ],
  },
]);
