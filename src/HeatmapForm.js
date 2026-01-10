<<<<<<< HEAD
import React from "react";
import { DatePicker as MUIDatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { ROUTE_OPTIONS, ROUTE_IMAGES, ROUTE_MM_LIMITS } from "./RouteConfig";


const STATE_OPTIONS = ["IN", "IL", "MD", "PA"];

const HeatmapForm = ({
  draftFormState,
=======
import React, { useState } from "react";
import { DatePicker as MUIDatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import I64 from "./images/64.png";
import I65 from "./images/65.png";
import I69 from "./images/69.png";
import I70 from "./images/70.png";
import I74 from "./images/74.png";
import I80 from "./images/80.png";
import I90 from "./images/90.png";
import I94 from "./images/94.png";
import I265 from "./images/265.png";
import I275 from "./images/275.png";
import I465 from "./images/465.png";
import I469 from "./images/469.png";
import I865 from "./images/865.png";

// ⭐ MAX MILE LIMITS FOR EACH ROUTE
const ROUTE_MM_LIMITS = {
  I64: 124,
  I65: 262,
  I69: 358,
  I70: 157,
  I74: 171,
  I80: 21,
  I90: 21,
  I94: 46,
  I265: 7,
  I275: 7,  // Add real value if different
  I465: 53,
  I469: 31,
  I865: 5,
};

const routeOptions = [
  { label: "I-64", value: "I64", img: I64 },
  { label: "I-65", value: "I65", img: I65 },
  { label: "I-69", value: "I69", img: I69 },
  { label: "I-70", value: "I70", img: I70 },
  { label: "I-74", value: "I74", img: I74 },
  { label: "I-80", value: "I80", img: I80 },
  { label: "I-90", value: "I90", img: I90 },
  { label: "I-94", value: "I94", img: I94 },
  { label: "I-265", value: "I265", img: I265 },
  { label: "I-275", value: "I275", img: I275 },
  { label: "I-465", value: "I465", img: I465 },
  { label: "I-469", value: "I469", img: I469 },
  { label: "I-865", value: "I865", img: I865 },
];

const HeatmapForm = ({
  liveFormState,
>>>>>>> heatmap/main
  loading,
  handleInputChange,
  handleSubmit,
}) => {

  // ⭐ Universal MM Limiter for Start & End Inputs
  const handleInputChangeEnhanced = (e) => {
    const { id, value, type } = e.target;
    let val = type === "number" ? parseFloat(value) || 0 : value;

<<<<<<< HEAD
    // Find max MM based on current state and route
    const state = draftFormState.state || "IN";
    const route = draftFormState.route;
    const maxMM = ROUTE_MM_LIMITS[state]?.[route] || 500;
=======
    // Find max MM based on current route
    const route = liveFormState.route;
    const maxMM = ROUTE_MM_LIMITS[route] || 500;
>>>>>>> heatmap/main

    // ⭐ Clamp Start MM
    if (id === "start_mm") {
      if (val < 0) val = 0;
      if (val > maxMM) val = maxMM;
    }

    // ⭐ Clamp End MM
    if (id === "end_mm") {
      if (val < 0) val = 0;
      if (val > maxMM) val = maxMM;
    }

    handleInputChange({
      target: { id, value: val, type },
    });
  };

  // ⭐ When Route changes → auto-adjust start & end MM
  const handleRouteSelect = (routeValue) => {
<<<<<<< HEAD
    const state = draftFormState.state || "IN";
    const maxMM = ROUTE_MM_LIMITS[state]?.[routeValue] || 500;

    const correctedStart = Math.min(draftFormState.start_mm, maxMM);
    const correctedEnd = Math.min(draftFormState.end_mm, maxMM);
=======
    const maxMM = ROUTE_MM_LIMITS[routeValue] || 500;

    const correctedStart = Math.min(liveFormState.start_mm, maxMM);
    const correctedEnd = Math.min(liveFormState.end_mm, maxMM);
>>>>>>> heatmap/main

    handleInputChange({
      target: { id: "route", value: routeValue, type: "text" },
    });
    handleInputChange({
      target: { id: "start_mm", value: correctedStart, type: "number" },
    });
    handleInputChange({
      target: { id: "end_mm", value: correctedEnd, type: "number" },
    });
  };

<<<<<<< HEAD
  const handleStateSelect = (stateValue) => {
    // Reset route to first available in new state
    const availableRoutes = ROUTE_OPTIONS[stateValue] || [];
    const firstRoute = availableRoutes.length > 0 ? availableRoutes[0].value : "";

    handleInputChange({
      target: { id: "state", value: stateValue, type: "text" }
    });
    // Also trigger route select to reset MMs and route
    if (firstRoute) handleRouteSelect(firstRoute);
  };

  const currentState = draftFormState.state || "IN";
  const currentRouteOptions = ROUTE_OPTIONS[currentState] || [];

  const selectedRoute = currentRouteOptions.find(
    (r) => r.value === draftFormState.route
  ) || currentRouteOptions[0] || { value: draftFormState.route, label: draftFormState.route };
=======
  const selectedRoute = routeOptions.find(
    (r) => r.value === liveFormState.route
  );
>>>>>>> heatmap/main

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="bg-light p-1 border-bottom position-fixed top-0 start-0 w-100 shadow-sm"
        style={{ zIndex: 1050 }}
      >
        <div className="container-fluid">
          <div className="row g-3 align-items-end">

<<<<<<< HEAD
            {/* State Dropdown */}
            <div className="col" style={{ maxWidth: "100px" }}>
              <label className="form-label fw-semibold">State</label>
              <div className="dropdown">
                <button
                  className="btn btn-outline-secondary dropdown-toggle w-100"
                  type="button"
                  data-bs-toggle="dropdown"
                >
                  {currentState}
                </button>
                <ul className="dropdown-menu shadow-sm">
                  {STATE_OPTIONS.map((st) => (
                    <li key={st}>
                      <button
                        className="dropdown-item"
                        type="button"
                        onClick={() => handleStateSelect(st)}
                      >
                        {st}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

=======
>>>>>>> heatmap/main
            {/* Start Date */}
            <div className="col" style={{ width: "200px" }}>
              <label className="form-label fw-semibold">Begin Date</label>
              <MUIDatePicker
<<<<<<< HEAD
                value={dayjs(draftFormState.start_date)}
=======
                value={dayjs(liveFormState.start_date)}
>>>>>>> heatmap/main
                views={['year', 'month', 'day']}
                format="YYYY/MM/DD"
                onChange={(newValue) =>
                  handleInputChange({
                    target: {
                      id: "start_date",
                      value: newValue.format("YYYY-MM-DD"),
                      type: "text",
                    },
                  })
                }
                slotProps={{
                  textField: { size: "small", fullWidth: true },
                }}
              />
            </div>

            {/* End Date */}
            <div className="col" style={{ width: "200px" }}>
              <label className="form-label fw-semibold">End Date</label>
              <MUIDatePicker
<<<<<<< HEAD
                value={dayjs(draftFormState.end_date)}
=======
                value={dayjs(liveFormState.end_date)}
>>>>>>> heatmap/main
                views={['year', 'month', 'day']}
                format="YYYY/MM/DD"
                onChange={(newValue) =>
                  handleInputChange({
                    target: {
                      id: "end_date",
                      value: newValue.format("YYYY-MM-DD"),
                      type: "text",
                    },
                  })
                }
                slotProps={{
                  textField: { size: "small", fullWidth: true },
                }}
              />
            </div>

            {/* Route Dropdown */}
            <div className="col">
              <label className="form-label fw-semibold">Road</label>
              <div className="dropdown" style={{ width: "80px" }}>
                <button
                  className="btn btn-outline bg-white border dropdown-toggle w-100"
                  type="button"
                  data-bs-toggle="dropdown"
                >
                  <img
<<<<<<< HEAD
                    src={ROUTE_IMAGES[currentState]?.[selectedRoute?.value] || ROUTE_IMAGES[currentState]?.[draftFormState.route] || ROUTE_IMAGES.IN["I-64"]}
=======
                    src={selectedRoute?.img}
>>>>>>> heatmap/main
                    width="24"
                    height="24"
                    className="rounded"
                    alt=""
                  />
                </button>

                <ul className="dropdown-menu shadow-sm" style={{ maxHeight: "200px", overflowY: "auto" }}>
<<<<<<< HEAD
                  {currentRouteOptions.map((route) => (
=======
                  {routeOptions.map((route) => (
>>>>>>> heatmap/main
                    <li key={route.value}>
                      <button
                        className="dropdown-item"
                        type="button"
                        onClick={() => handleRouteSelect(route.value)}
                      >
                        <img
<<<<<<< HEAD
                          src={ROUTE_IMAGES[currentState]?.[route.value]}
=======
                          src={route.img}
>>>>>>> heatmap/main
                          width="38"
                          height="38"
                          className="rounded border"
                          alt={route.label}
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Start MM */}
            <div className="col">
              <label className="form-label fw-semibold">Start MM</label>
              <input
                type="number"
                id="start_mm"
                className="form-control"
<<<<<<< HEAD
                value={draftFormState.start_mm}
=======
                value={liveFormState.start_mm}
>>>>>>> heatmap/main
                onChange={handleInputChangeEnhanced}
              />
            </div>

            {/* End MM */}
            <div className="col">
              <label className="form-label fw-semibold">End MM</label>
              <input
                type="number"
                id="end_mm"
                className="form-control"
<<<<<<< HEAD
                value={draftFormState.end_mm}
=======
                value={liveFormState.end_mm}
>>>>>>> heatmap/main
                onChange={handleInputChangeEnhanced}
              />
            </div>

            {/* Accel */}
            <div className="col">
              <label className="form-label fw-semibold">Accel</label>
              <input
                type="number"
                id="accel"
                step="0.01"
                min="0"
                max="0.8"
                className="form-control"
<<<<<<< HEAD
                value={draftFormState.accel}
=======
                value={liveFormState.accel}
>>>>>>> heatmap/main
                onChange={handleInputChange}
              />
            </div>

            {/* Decel */}
            <div className="col">
              <label className="form-label fw-semibold">Decel</label>
              <input
                type="number"
                id="decel"
                step="0.01"
                max="-0.01"
                min="-0.8"
                className="form-control"
<<<<<<< HEAD
                value={draftFormState.decel}
=======
                value={liveFormState.decel}
>>>>>>> heatmap/main
                onChange={handleInputChange}
              />
            </div>

            {/* Width */}
            <div className="col">
              <label className="form-label fw-semibold">Width</label>
              <input
                type="number"
                id="width"
<<<<<<< HEAD
                min="200"
                className="form-control"
                value={draftFormState.width}
=======
                className="form-control"
                value={liveFormState.width}
>>>>>>> heatmap/main
                onChange={handleInputChange}
              />
            </div>

            {/* Height */}
            <div className="col">
              <label className="form-label fw-semibold">Height</label>
              <input
                type="number"
                id="height"
                className="form-control"
<<<<<<< HEAD
                value={draftFormState.height}
                onChange={handleInputChange}
              />
            </div>

=======
                value={liveFormState.height}
                onChange={handleInputChange}
              />
            </div>
            
>>>>>>> heatmap/main
            {/* accel and decel size */}
            <div className="col">
              <label className="form-label fw-semibold">size</label>
              <input
                type="number"
                id="size"
                className="form-control"
<<<<<<< HEAD
                value={draftFormState.size}
=======
                value={liveFormState.size}
>>>>>>> heatmap/main
                onChange={handleInputChange}
              />
            </div>

            {/* Submit button */}
            <div className="col d-flex align-items-end">
              <button
                type="submit"
                className="btn btn-primary w-100 fw-semibold"
                disabled={loading}
              >
                {loading ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      </form>
<<<<<<< HEAD
      {/* {loading && ( <div className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center" style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", zIndex: 2000 }} > <div className="spinner-border text-light mb-3" role="status" style={{ width: "2rem", height: "2rem" }} > <span className="visually-hidden">Loading...</span> </div> <h5 className="text-white fw-semibold">Generating Heatmaps...</h5> </div> )} */}
=======
      {loading && ( <div className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center" style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", zIndex: 2000 }} > <div className="spinner-border text-light mb-3" role="status" style={{ width: "2rem", height: "2rem" }} > <span className="visually-hidden">Loading...</span> </div> <h5 className="text-white fw-semibold">Generating Heatmaps...</h5> </div> )}
>>>>>>> heatmap/main
    </>
  );
};

<<<<<<< HEAD
export default HeatmapForm;
=======
export default HeatmapForm;
>>>>>>> heatmap/main
