import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import HeatmapForm from "./HeatmapForm";
import HeatmapDisplay from "./HeatmapDisplay";
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

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

// --- Constants ---
const DEFAULT_FORM_STATE = {
  start_date: "2025-09-22",
  end_date: "2025-09-25",
  route: "I70",
  start_mm: 0,
  end_mm: 20,
  accel: 0.25,
  decel: -0.25,
  width: 400,
  height: 300,
  size: 11,
};

const ROUTE_IMAGES = {
  I64,
  I65,
  I69,
  I70,
  I74,
  I80,
  I90,
  I94,
  I265,
  I275,
  I465,
  I469,
  I865,
};

const CACHE_KEY = "trafficHeatmapCache";
export const HEATMAP_KEYS = ["car", "truck", "accel", "decel"];

const HeatmapGenerator = () => {
  const params = useParams();
  const navigate = useNavigate();
  const isFormNavigation = useRef(false);

  // --- States ---
  const [liveFormState, setLiveFormState] = useState(DEFAULT_FORM_STATE);
  const [submittedFormState, setSubmittedFormState] =
    useState(DEFAULT_FORM_STATE);
  const [base64Data, setBase64Data] = useState({});
  // ⭐ Updated visibility with accel, decel default OFF
  const [visibleLayers, setVisibleLayers] = useState({
    empty: true,
    car: true,
    truck: true,
    accel: false,  // B
    decel: false,  // N
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [urlTrigger, setUrlTrigger] = useState(false);

  // ⭐ NEW styled alert state
  const [alertMessage, setAlertMessage] = useState("");

  const showAlert = (msg) => {
    setAlertMessage(msg);
    setTimeout(() => setAlertMessage(""), 3000);
  };
  console.log(base64Data, "base64data");

  // Load URL params
  useEffect(() => {
    if (isFormNavigation.current) {
      isFormNavigation.current = false;
      return;
    }

    if (params.start_date) {
      const newState = { ...DEFAULT_FORM_STATE };
      Object.keys(params).forEach((key) => {
        if (newState.hasOwnProperty(key)) {
          const value = params[key];
          const isNum = ["start_mm", "end_mm"].includes(key);
          newState[key] = isNum ? parseFloat(value) || 0 : value;
        }
      });

      newState.width = DEFAULT_FORM_STATE.width;
      newState.height = DEFAULT_FORM_STATE.height;
      newState.accel = DEFAULT_FORM_STATE.accel;
      newState.decel = DEFAULT_FORM_STATE.decel;

      setLiveFormState(newState);
      setSubmittedFormState(newState);
      setIsSubmitted(true);
      setUrlTrigger(true);
      generatePlot(newState);
    }
  }, [params]);

  useEffect(() => {
    if (urlTrigger) setUrlTrigger(false);
  }, [urlTrigger]);

  // --- Keyboard Toggles -----
  useEffect(() => {
    const handleKey = (e) => {
      if (!isSubmitted) return;
      const key = e.key.toUpperCase();

      if (key === "T") toggleLayer("truck");
      if (key === "D") toggleLayer("car");
      if (key === "N") toggleLayer("accel"); // ⭐ NEW
      if (key === "B") toggleLayer("decel"); // ⭐ NEW
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isSubmitted]);

  // --- Toggle Heatmap Layers ---
  const toggleLayer = useCallback((layerKey) => {
    setVisibleLayers((prev) => ({
      ...prev,
      [layerKey]: !prev[layerKey],
    }));
  }, []);

  // Input update
  const handleInputChange = (e) => {
    const { id, value, type } = e.target;
    setLiveFormState((prev) => ({
      ...prev,
      [id]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  // Submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    isFormNavigation.current = true;

    const { start_date, end_date, route, start_mm, end_mm, width, height } =
      liveFormState;

    const newPath = `/${start_date}/${end_date}/${route}/${start_mm}/${end_mm}`;
    navigate(newPath, { replace: true });

    const payload = {
      ...liveFormState,
      width: width || DEFAULT_FORM_STATE.width,
      height: height || DEFAULT_FORM_STATE.height,
    };

    if (width > 149 && height > 149) {
      generatePlot(payload);
      setSubmittedFormState(payload);
      setLiveFormState(payload);
      setIsSubmitted(true);
    } else {
      showAlert("Height and Width should be 150 or above");
    }
  };

  // --- API CALL ---
  const generatePlot = useCallback(async (stateToUse) => {
    setLoading(true);
    setError(null);
    setBase64Data({});

    try {
      const formData = new FormData();
      Object.entries(stateToUse).forEach(([k, v]) => formData.append(k, v));
      formData.append("include_data", "car,truck,empty,accel,decel");

      const response = await fetch("http://127.0.0.1:8080/generate_heatmap", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error(await response.text());

      const data = await response.json();
      const newBase64Data = {
        empty: data.empty_heatmap_base64,
        car: data.car_heatmap_base64,
        truck: data.truck_heatmap_base64,
        accel: data.accel_heatmap_base64,
        decel: data.decel_heatmap_base64,
        cost: data.estimated_cost_usd,
        byte_processed: data.bigquery_bytes_processed,
      };

      setBase64Data(newBase64Data);
      localStorage.setItem(CACHE_KEY, JSON.stringify(newBase64Data));
    } catch (err) {
      setError(`Error fetching heatmaps: ${err.message}`);
      showAlert("Error generating heatmap");
    } finally {
      setLoading(false);
    }
  }, []);
  // Convert bytes to TB (Terabytes)
  const formatBytesToTB = (bytes) => {
    if (!bytes) return "--";
    const tb = bytes / 1e12;
    return tb.toFixed(4) + " TB";
  };

  // --- Render ---
  return (
    <div className="heatmap-wrapper" style={{ position: "relative" }}>

      {/* Alert Box */}
      {alertMessage && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            padding: "12px 18px",
            backgroundColor: "#ff5733",
            color: "white",
            fontWeight: "bold",
            borderRadius: "6px",
            boxShadow: "0 3px 6px rgba(0,0,0,0.3)",
            zIndex: 9999,
          }}
        >
          {alertMessage}
        </div>
      )}

      {/* Form */}
      <HeatmapForm
        liveFormState={liveFormState}
        loading={loading}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
      />

      {/* Heatmap Display */}
      <div style={{ marginTop: "80px" }}>
        <HeatmapDisplay
          isSubmitted={isSubmitted}
          base64Data={base64Data}
          visibleLayers={visibleLayers}
        />
      </div>

      {/* Toggle Legend */}
      {/* {isSubmitted && (
        <div
          id="filter-status"
          className="d-flex flex-wrap align-items-center justify-content-between gap-3 py-2 px-3"
        >
          <div className="d-flex align-items-center gap-3">
            <span className="fw-semibold">Toggle layers:</span>

            <div className="d-flex align-items-center gap-2">
              <kbd className={`badge ${visibleLayers.truck ? "bg-primary" : "bg-secondary"} fs-6 px-3 py-2`}>
                T
              </kbd>
              <span className={visibleLayers.truck ? "text-dark fw-semibold" : "text-muted"}>
                Truck
              </span>
            </div>

            <span className="text-muted">|</span>

            <div className="d-flex align-items-center gap-2">
              <kbd className={`badge ${visibleLayers.car ? "bg-success" : "bg-secondary"} fs-6 px-3 py-2`}>
                D
              </kbd>
              <span className={visibleLayers.car ? "text-dark fw-semibold" : "text-muted"}>
                Car
              </span>
            </div>

            <span className="text-muted">|</span>

            <div className="d-flex align-items-center gap-2">
              <kbd className={`badge ${visibleLayers.accel ? "bg-warning" : "bg-secondary"} fs-6 px-3 py-2`}>
                B
              </kbd>
              <span className={visibleLayers.accel ? "text-dark fw-semibold" : "text-muted"}>
                Accel
              </span>
            </div>

            <span className="text-muted">|</span>

            <div className="d-flex align-items-center gap-2">
              <kbd className={`badge ${visibleLayers.decel ? "bg-danger" : "bg-secondary"} fs-6 px-3 py-2`}>
                N
              </kbd>
              <span className={visibleLayers.decel ? "text-dark fw-semibold" : "text-muted"}>
                Decel
              </span>
            </div>
          </div>
          <div
            className="d-flex flex-column ms-4 ps-3 border-start"
            style={{ minWidth: "20px" }}
          >

            <span className="small mt-1">
              <strong>Cost:</strong>{" "}
              {base64Data.cost !== undefined ? `$${base64Data.cost}` : "--"}
            </span>
          </div>
          <div
            className="d-flex flex-column ms-4 ps-3 border-start"
            style={{ minWidth: "220px" }}
          >
            <span className="small mt-1">
              <strong>Bytes:</strong>{" "}
              {formatBytesToTB(base64Data.byte_processed)}
            </span>

          </div>


          <div>
            <img
              src={ROUTE_IMAGES[params.route] || I465}
              alt={params.route || "route"}
              height={40}
              width={40}
              className="img-fluid rounded shadow-sm"
              style={{ maxHeight: "60px", objectFit: "contain" }}
            />
          </div>

          <div className="d-flex align-items-center flex-wrap gap-3">
            <span className="fw-semibold small">Speed (mph):</span>
            {[["#ff0000", "0–14"], ["#ff6600", "15–24"], ["#ffcc00", "25–34"], ["#cccc00", "35–44"], ["#66cc00", "45–54"], ["#00cc00", "55–64"], ["#cccccc", "No Data"]].map(([color, label]) => (
              <div key={label} className="d-flex align-items-center gap-2">
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    backgroundColor: color,
                    border: "1px solid #ddd",
                  }}
                ></div>
                <span className="small">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )} */}
      {isSubmitted && (
  <div
    id="filter-status"
    className="d-flex align-items-center justify-content-between gap-3 py-2 px-3 bg-white border-bottom"
    style={{ whiteSpace: "nowrap", overflowX: "auto" }} // Ensures single line with scroll if needed
  >
    {/* --- SECTION 1: TOGGLE LAYERS --- */}
    <div className="d-flex align-items-center gap-3">
      <span className="fw-semibold">Toggle layers:</span>

      {/* Truck */}
      <div className="d-flex align-items-center gap-2">
        <kbd className={`badge ${visibleLayers.truck ? "bg-primary" : "bg-secondary"} fs-6 px-3 py-2`}>T</kbd>
        <span className={visibleLayers.truck ? "text-dark fw-semibold" : "text-muted"}>Truck</span>
      </div>
      <span className="text-muted">|</span>

      {/* Car */}
      <div className="d-flex align-items-center gap-2">
        <kbd className={`badge ${visibleLayers.car ? "bg-success" : "bg-secondary"} fs-6 px-3 py-2`}>D</kbd>
        <span className={visibleLayers.car ? "text-dark fw-semibold" : "text-muted"}>Car</span>
      </div>
      <span className="text-muted">|</span>

      {/* Accel */}
      <div className="d-flex align-items-center gap-2">
        <kbd className={`badge ${visibleLayers.accel ? "bg-warning" : "bg-secondary"} fs-6 px-3 py-2`}>N</kbd>
        <span className={visibleLayers.accel ? "text-dark fw-semibold" : "text-muted"}>Accel</span>
      </div>
      <span className="text-muted">|</span>

      {/* Decel */}
      <div className="d-flex align-items-center gap-2">
        <kbd className={`badge ${visibleLayers.decel ? "bg-danger" : "bg-secondary"} fs-6 px-3 py-2`}>B</kbd>
        <span className={visibleLayers.decel ? "text-dark fw-semibold" : "text-muted"}>Decel</span>
      </div>
    </div>

    {/* --- SECTION 2: METRICS (VERTICAL STACK) --- */}
    {/* This container forces Cost and Bytes to stack vertically, but sits horizontally with the rest */}
    <div className="d-flex flex-column justify-content-center border-start border-end px-3 mx-2">
      <span className="small mb-0" style={{ lineHeight: "1.2" }}>
        <strong>Cost:</strong> {base64Data.cost !== undefined ? `$${base64Data.cost}` : "--"}
      </span>
      <span className="small mt-0" style={{ lineHeight: "1.2" }}>
        <strong>Bytes:</strong> {formatBytesToTB(base64Data.byte_processed)}
      </span>
    </div>

    {/* --- SECTION 3: ROUTE IMAGE --- */}
    <div>
      <img
        src={ROUTE_IMAGES[params.route] || I465}
        alt={params.route || "route"}
        height={40}
        width={40}
        className="img-fluid rounded shadow-sm"
        style={{ maxHeight: "40px", objectFit: "contain" }}
      />
    </div>

    {/* --- SECTION 4: LEGEND --- */}
    <div className="d-flex align-items-center gap-3 ms-auto">
      <span className="fw-semibold small">Speed (mph):</span>
      <div className="d-flex align-items-center gap-3">
        {[
          ["#ff0000", "0–14"],
          ["#ff6600", "15–24"],
          ["#ffcc00", "25–34"],
          ["#cccc00", "35–44"],
          ["#66cc00", "45–54"],
          ["#00cc00", "55–64"],
          ["#cccccc", "No Data"],
        ].map(([color, label]) => (
          <div key={label} className="d-flex align-items-center gap-2">
            <div
              style={{
                width: "16px",
                height: "16px",
                backgroundColor: color,
                border: "1px solid #ddd",
                flexShrink: 0,
              }}
            ></div>
            <span className="small text-nowrap">{label}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default HeatmapGenerator;
