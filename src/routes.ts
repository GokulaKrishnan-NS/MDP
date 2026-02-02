import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { History } from "./components/History";
import { DeviceStatus } from "./components/DeviceStatus";
import { Settings } from "./components/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "history", Component: History },
      { path: "device", Component: DeviceStatus },
      { path: "settings", Component: Settings },
    ],
  },
]);
