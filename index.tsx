import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { UIProvider } from "./contexts/UIContext";
import { DataProvider } from "./contexts/DataContext";
import { GlobalFilterProvider } from "./components/GlobalFilterContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./contexts/AuthContext";


const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const GOOGLE_CLIENT_ID =
  "1019548241968-chonpm3nid1osgbc1drr5ks3qnkgjt40.apps.googleusercontent.com";

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <UIProvider>
          <DataProvider>
            <GlobalFilterProvider>
              <App />
            </GlobalFilterProvider>
          </DataProvider>
        </UIProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
