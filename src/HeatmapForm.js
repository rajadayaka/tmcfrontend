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
  loading,
  handleInputChange,
  handleSubmit,
}) => {

  // ⭐ Universal MM Limiter for Start & End Inputs
  const handleInputChangeEnhanced = (e) => {
    const { id, value, type } = e.target;
    let val = type === "number" ? parseFloat(value) || 0 : value;

    // Find max MM based on current route
    const route = liveFormState.route;
    const maxMM = ROUTE_MM_LIMITS[route] || 500;

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
    const maxMM = ROUTE_MM_LIMITS[routeValue] || 500;

    const correctedStart = Math.min(liveFormState.start_mm, maxMM);
    const correctedEnd = Math.min(liveFormState.end_mm, maxMM);

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

  const selectedRoute = routeOptions.find(
    (r) => r.value === liveFormState.route
  );

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="bg-light p-1 border-bottom position-fixed top-0 start-0 w-100 shadow-sm"
        style={{ zIndex: 1050 }}
      >
        <div className="container-fluid">
          <div className="row g-3 align-items-end">

            {/* Start Date */}
            <div className="col" style={{ width: "200px" }}>
              <label className="form-label fw-semibold">Begin Date</label>
              <MUIDatePicker
                value={dayjs(liveFormState.start_date)}
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
                value={dayjs(liveFormState.end_date)}
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
                    src={selectedRoute?.img}
                    width="24"
                    height="24"
                    className="rounded"
                    alt=""
                  />
                </button>

                <ul className="dropdown-menu shadow-sm" style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {routeOptions.map((route) => (
                    <li key={route.value}>
                      <button
                        className="dropdown-item"
                        type="button"
                        onClick={() => handleRouteSelect(route.value)}
                      >
                        <img
                          src={route.img}
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
                value={liveFormState.start_mm}
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
                value={liveFormState.end_mm}
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
                value={liveFormState.accel}
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
                value={liveFormState.decel}
                onChange={handleInputChange}
              />
            </div>

            {/* Width */}
            <div className="col">
              <label className="form-label fw-semibold">Width</label>
              <input
                type="number"
                id="width"
                className="form-control"
                value={liveFormState.width}
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
                value={liveFormState.height}
                onChange={handleInputChange}
              />
            </div>
            
            {/* accel and decel size */}
            <div className="col">
              <label className="form-label fw-semibold">size</label>
              <input
                type="number"
                id="size"
                className="form-control"
                value={liveFormState.size}
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
      {loading && ( <div className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center" style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", zIndex: 2000 }} > <div className="spinner-border text-light mb-3" role="status" style={{ width: "2rem", height: "2rem" }} > <span className="visually-hidden">Loading...</span> </div> <h5 className="text-white fw-semibold">Generating Heatmaps...</h5> </div> )}
    </>
  );
};

export default HeatmapForm;
