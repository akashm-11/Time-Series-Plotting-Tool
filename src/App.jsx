import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import UploadPage from "./pages/UploadPage";
import PlotPage from "./pages/PlotPage";

export default function App() {
  const [uploadedFiles, setUploadedFiles] = useState({}); // { filename: [File, ...versions] }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<UploadPage setUploadedFiles={setUploadedFiles} />}
        />
        <Route
          path="/plot"
          element={
            <PlotPage
              uploadedFiles={uploadedFiles}
              setUploadedFiles={setUploadedFiles}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
