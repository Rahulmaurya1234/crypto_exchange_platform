import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import App from "./App";
import "./index.css";
import store from "./app/store";
import AuthInit from "./components/AuthInit";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AuthInit>
          <App />
        </AuthInit>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
