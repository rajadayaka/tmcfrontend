import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
<<<<<<< HEAD
import dayjs from "dayjs";
import HeatmapForm from "./HeatmapForm";
import TrafficHeatmapD3 from "./TrafficHeatmapD3";
import CameraPreviewRow from "./CameraPreviewRow";
import { ROUTE_IMAGES, ROUTE_DIRECTIONS } from "./RouteConfig";

const DEFAULT_FORM_STATE = {
  state: "IN",
  start_date: "2025-09-22",
  end_date: "2025-09-25",
  route: "I-70",
=======
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
>>>>>>> heatmap/main
  start_mm: 0,
  end_mm: 20,
  accel: 0.25,
  decel: -0.25,
  width: 400,
  height: 300,
<<<<<<< HEAD
  size: 7,
};


=======
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
>>>>>>> heatmap/main

const HeatmapGenerator = () => {
  const params = useParams();
  const navigate = useNavigate();
  const isFormNavigation = useRef(false);
<<<<<<< HEAD
  const abortControllerRef = useRef(null);

  // Reference to Child Component for direct drawing
  const heatmapRef = useRef(null);

  // States
  const [draftFormState, setDraftFormState] = useState(DEFAULT_FORM_STATE);
  const [appliedFormState, setAppliedFormState] = useState(DEFAULT_FORM_STATE);

  // Data storage
  const [dataVersion, setDataVersion] = useState(0);

  const [cameraLocations, setCameraLocations] = useState([]);
  const [showCameraLines, setShowCameraLines] = useState(false);
  const [showTimeIndicators, setShowTimeIndicators] = useState(true);
  const [selectedMMs, setSelectedMMs] = useState([null, null, null]);
  const [currentGraphTime, setCurrentGraphTime] = useState(null);

  const [metaData, setMetaData] = useState({ cost: 0, bytes: 0 });

  const [visibleLayers, setVisibleLayers] = useState({
    car: true,
    truck: true,
    accel: false,
    decel: false,
  });

  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const formatBytesToTB = (bytes) => {
    if (!bytes) return "--";
    return (bytes / 1e12).toFixed(5) + " TB";
  };

  const getDaysArray = (start, end) => {
    let arr = [];
    let dt = dayjs(start);
    const endDt = dayjs(end);
    while (dt.isBefore(endDt) || dt.isSame(endDt, "day")) {
      arr.push(dt.format("YYYY-MM-DD"));
      dt = dt.add(1, "day");
    }
    return arr;
  };

  const processChunkToMap = (dataChunk, forcedDir, forcedType) => {
    const map = {};

    for (let i = 0; i < dataChunk.length; i++) {
      const row = dataChunk[i];
      // Backend now sends optimized objects: { bin, mph, mm }
      // direction and type are provided by the caller based on the API request context
      let dir = forcedDir || "E";
      const rawDir = row.direction;
      if (rawDir) {
        if (rawDir.includes("IL")) dir = "IL";
        else if (rawDir.includes("OL")) dir = "OL";
        else if (rawDir.includes("N")) dir = "N";
        else if (rawDir.includes("S")) dir = "S";
        else if (rawDir.includes("E")) dir = "E";
        else if (rawDir.includes("W")) dir = "W";
      }

      // Convert Unix timestamp (seconds) to Date object
      const dateObj = new Date(row.bin * 1000);

      // Get the Indiana wall-clock date string (YYYY-MM-DD)
      const y = dateObj.getUTCFullYear();
      const m = (dateObj.getUTCMonth() + 1).toString().padStart(2, "0");
      const d = dateObj.getUTCDate().toString().padStart(2, "0");
      const dayStr = `${y}-${m}-${d}`;

      // Calculate decimal hour using getUTC* (pseudo-Indiana time)
      const decimalHour =
        dateObj.getUTCHours() +
        dateObj.getUTCMinutes() / 60 +
        dateObj.getUTCSeconds() / 3600;

      if (!map[dayStr]) map[dayStr] = {};
      if (!map[dayStr][dir]) map[dayStr][dir] = [];

      map[dayStr][dir].push({
        mm: row.mm,
        mph: row.mph !== undefined ? row.mph : row.speed, // handle both mph and speed
        event_type: forcedType || row.event_type,
        mmStep: row.mmStep || 0.1, // Default to 0.1 if not provided
        binStep: row.binStep || 60, // Default to 60s if not provided
        dateObj: dateObj,
        decimalHour: decimalHour,
        local_bin: row.bin,
        normalizedDir: dir,
      });
    }
    return map;
  };

  const fetchData = async (url, formData, signal, onChunk) => {
    try {
      const options = {
        method: formData ? "POST" : "GET",
        body: formData || undefined,
        signal,
        // Add timeout via AbortSignal (10 minutes to match backend)
        keepalive: true,
      };

      const response = await fetch(url, options);
      if (!response.ok) {
        console.error(`HTTP Error ${response.status} for ${url}`);
        throw new Error(`HTTP Error ${response.status}`);
      }

      const contentType = response.headers.get("Content-Type") || "";

      if (contentType.includes("x-ndjson")) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let rowBatch = [];
        const BATCH_SIZE = 500;

        while (true) {
          const { value, done } = await reader.read();

          if (done) {
            // Process any remaining buffer data
            if (buffer.trim()) {
              try {
                rowBatch.push(JSON.parse(buffer));
              } catch (e) {
                console.warn("Final buffer parse error:", e, "Buffer:", buffer);
              }
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop(); // Keep the last incomplete line

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              rowBatch.push(JSON.parse(line));
              if (rowBatch.length >= BATCH_SIZE) {
                onChunk(rowBatch);
                rowBatch = [];
              }
            } catch (e) {
              console.error("NDJSON Parse error", e, "Line:", line);
            }
          }
        }
        // Final batch
        if (rowBatch.length > 0) {
          onChunk(rowBatch);
        }
        console.log(`Stream completed for ${url}`);
      } else {
        // Fallback for standard JSON (events or older fallback)
        const data = await response.json();
        if (Array.isArray(data)) {
          onChunk(data);
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Fetch aborted:", url);
      } else {
        console.error("Fetch error for", url, ":", err.message, err);
      }
    }
  };

  const generatePlot = useCallback(async (stateToUse) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

    setLoading(true);

    // RESET DATA
    // Trigger version update to clear canvas via useEffect in child
    setDataVersion((v) => v + 1);

    setMetaData({ cost: 0, bytes: 0 });
    setCameraLocations([]);
    setSelectedMMs([null, null, null]);
    setCurrentGraphTime(null);

    // Fetch Camera Locations
    // No more master data storage! We draw and discard.
    const route = stateToUse.route;
    const start_mm = stateToUse.start_mm;
    const end_mm = stateToUse.end_mm;
    const state = stateToUse.state;

    const cameraUrl = `http://localhost:5000/get_camera_locations?state=${state}&route=${route}&start_mile=${start_mm}&end_mile=${end_mm}`;
    fetch(cameraUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.locations) {
          const numericLocs = data.locations.map(Number);
          setCameraLocations(numericLocs);
          const initMMs = [
            numericLocs.length > 0 ? numericLocs[0] : 0,
            numericLocs.length > 1 ? numericLocs[1] : numericLocs[0] || 0,
            numericLocs.length > 2 ? numericLocs[2] : numericLocs[0] || 0,
          ];
          setSelectedMMs(initMMs);
          const start = dayjs(stateToUse.start_date);
          setCurrentGraphTime(
            new Date(
              Date.UTC(start.year(), start.month(), start.date(), 0, 0, 0)
            )
          );
        }
      })
      .catch((err) => console.error("Error fetching cameras:", err));

    // Calc Tasks
    const stateDirections = ROUTE_DIRECTIONS[state] || ROUTE_DIRECTIONS['IN'];
    const directions = stateDirections[route] || ["E", "W"];

    const types = ["car", "truck", "events"];

    // setProgress({ completed: 0, total: totalTasks });

    let totalCost = 0;
    let totalBytes = 0;

    try {
      const allTasks = [];
      const { start_date, end_date, route, start_mm, end_mm, accel, decel } =
        stateToUse;
      const allDates = getDaysArray(start_date, end_date);

      // Helper to chunk dates (e.g. 3 days per request) to balance request count vs payload size
      const chunkArray = (arr, size) => {
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
          chunks.push(arr.slice(i, i + size));
        }
        return chunks;
      };

      const dateChunks = chunkArray(allDates, 5); // 1 Day per request

      // 1. CREATE ALL TASKS
      dateChunks.forEach((chunk) => {
        const chunkStart = chunk[0];
        const chunkEnd = chunk[chunk.length - 1];

        types.forEach((type) => {
          directions.forEach((dir) => {
            // Define the task function
            const taskFn = async () => {
              if (signal.aborted) return;

              const processResponse = async (formData, urlOverride) => {
                await fetchData(
                  urlOverride ||
                  `http://localhost:5000/generate_heatmap_${type}`,
                  formData,
                  signal,
                  async (dataChunk) => {
                    if (signal.aborted) return;

                    // Filter out meta rows and update stats
                    const contentRows = [];
                    dataChunk.forEach((row) => {
                      if (row.meta) {
                        if (row.bytes) totalBytes += row.bytes;
                        if (row.cost) totalCost += row.cost;
                      } else {
                        contentRows.push(row);
                      }
                    });

                    if (contentRows.length === 0) return;

                    // Batching is handled inside fetchData for NDJSON
                    const chunkMap = processChunkToMap(
                      contentRows,
                      dir,
                      type === "events" ? null : type
                    );

                    // DIRECT DRAW TO CANVAS AND DISCARD
                    if (heatmapRef.current) {
                      heatmapRef.current.appendData(chunkMap);
                    }
                  }
                );
              };

              if (type === "car" || type === "truck") {
                const formattedRoute = route.startsWith('I-') ? route : route.replace('I', 'I-');
                const roadName = `${formattedRoute} ${dir}`;
                // API expects End Date to be the boundary.
                const endDatePayload = dayjs(chunkEnd)
                  .add(1, "day")
                  .format("YYYY-MM-DD");
                const endpoint = type === "car" ? "getMiles" : "getMiles_truck";
                const url = `http://localhost:5000/api/heatmap/${endpoint}/${state}/${roadName}/${chunkStart}/${endDatePayload}/${start_mm}/${end_mm}`;
                await processResponse(null, url);
              } else {
                // Events
                const formattedRoute = route.startsWith('I-') ? route : route.replace('I', 'I-');
                const formData = new FormData();
                formData.append("state", state);
                formData.append("start_date", chunkStart);
                formData.append("end_date", chunkEnd);
                formData.append(
                  "direction",
                  `${formattedRoute} ${dir}`
                );
                formData.append("route", route);
                formData.append("start_mm", start_mm);
                formData.append("end_mm", end_mm);
                if (accel !== undefined) formData.append("accel", accel);
                if (decel !== undefined) formData.append("decel", decel);
                await processResponse(formData);
              }
            };

            allTasks.push(taskFn);
          });
        });
      });

      // 2. PROCESS WITH CONCURRENCY LIMIT
      const CONCURRENCY = 6;
      await processQueue(allTasks, CONCURRENCY, signal);

      setMetaData({ cost: totalCost.toFixed(6), bytes: totalBytes });
    } catch (err) {
      if (err.name !== "AbortError") console.error("Batch error", err);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  // Helper to run tasks with concurrency
  const processQueue = async (tasks, concurrency, signal) => {
    const results = [];
    const executing = new Set();
    for (const task of tasks) {
      if (signal.aborted) break;
      const p = task().then((r) => {
        executing.delete(p);
        return r;
      });
      executing.add(p);
      results.push(p);
      if (executing.size >= concurrency) {
        await Promise.race(executing);
      }
    }
    return Promise.all(results);
  };

=======

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
>>>>>>> heatmap/main
  useEffect(() => {
    if (isFormNavigation.current) {
      isFormNavigation.current = false;
      return;
    }
<<<<<<< HEAD
    if (params.start_date || params.state) {
      const newState = { ...DEFAULT_FORM_STATE };
      // Handle state param if present, or default to IN if not (backward compat handled by router usually)
      if (params.state) {
        newState.state = params.state;
      }

      Object.keys(params).forEach((key) => {
        // If we have route params matching keys in state
=======

    if (params.start_date) {
      const newState = { ...DEFAULT_FORM_STATE };
      Object.keys(params).forEach((key) => {
>>>>>>> heatmap/main
        if (newState.hasOwnProperty(key)) {
          const value = params[key];
          const isNum = ["start_mm", "end_mm"].includes(key);
          newState[key] = isNum ? parseFloat(value) || 0 : value;
        }
      });

<<<<<<< HEAD
      setDraftFormState(newState);
      setAppliedFormState(newState);
      setIsSubmitted(true);
      generatePlot(newState);
    }
  }, [params, generatePlot]);

  // Keyboard Listeners
=======
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
>>>>>>> heatmap/main
  useEffect(() => {
    const handleKey = (e) => {
      if (!isSubmitted) return;
      const key = e.key.toUpperCase();
<<<<<<< HEAD
      if (key === "T") setVisibleLayers((p) => ({ ...p, truck: !p.truck }));
      if (key === "D") setVisibleLayers((p) => ({ ...p, car: !p.car }));
      if (key === "N") setVisibleLayers((p) => ({ ...p, accel: !p.accel }));
      if (key === "B") setVisibleLayers((p) => ({ ...p, decel: !p.decel }));
      if (key === "L") setShowCameraLines((prev) => !prev);
      if (key === "S") setShowTimeIndicators((prev) => !prev);
    };
=======

      if (key === "T") toggleLayer("truck");
      if (key === "D") toggleLayer("car");
      if (key === "N") toggleLayer("accel"); // ⭐ NEW
      if (key === "B") toggleLayer("decel"); // ⭐ NEW
    };

>>>>>>> heatmap/main
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isSubmitted]);

<<<<<<< HEAD
  const handleInputChange = (e) =>
    setDraftFormState((p) => ({
      ...p,
      [e.target.id]:
        e.target.type === "number"
          ? parseFloat(e.target.value) || 0
          : e.target.value,
    }));

  const handleSubmit = (e) => {
    e.preventDefault();
    isFormNavigation.current = true;
    setAppliedFormState(draftFormState);
    const { state, start_date, end_date, route, start_mm, end_mm } = draftFormState;
    // Updated route structure including state
    navigate(`/${state}/${start_date}/${end_date}/${route}/${start_mm}/${end_mm}`, {
      replace: true,
    });
    setIsSubmitted(true);
    generatePlot(draftFormState);
  };

  const handleMMChange = (index, val) => {
    const newMMs = [...selectedMMs];
    newMMs[index] = val;
    setSelectedMMs(newMMs);
  };

  const handleTimeAdjust = (minutes) => {
    if (!currentGraphTime) return;
    const newTime = dayjs(currentGraphTime).add(minutes, "minute").toDate();

    // Construct UTC boundaries to match currentGraphTime initialization which uses Date.UTC
    const s = dayjs(appliedFormState.start_date);
    const startDate = new Date(
      Date.UTC(s.year(), s.month(), s.date(), 0, 0, 0)
    );

    const e = dayjs(appliedFormState.end_date);
    const endDate = new Date(
      Date.UTC(e.year(), e.month(), e.date(), 23, 59, 59, 999)
    );

    if (newTime < startDate || newTime > endDate) return;
    setCurrentGraphTime(newTime);
  };

  return (
    <div className="heatmap-wrapper" style={{ position: "relative" }}>
      {/* {alertMessage && (
        <div style={{ position: "fixed", top: "20px", right: "20px", padding: "12px 18px", backgroundColor: "#ff5733", color: "white", fontWeight: "bold", borderRadius: "6px", zIndex: 9999 }}>
          {alertMessage}
        </div>
      )} */}

      <HeatmapForm
        draftFormState={draftFormState}
=======
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
>>>>>>> heatmap/main
        loading={loading}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
      />

<<<<<<< HEAD
      <div style={{ marginTop: "100px" }}>
        {isSubmitted && (
          <div>
            <div style={{ position: "relative" }}>
              <TrafficHeatmapD3
                ref={heatmapRef} // ATTACH REF HERE
                groupedData={{}} // Always pass empty object to avoid re-renders
                dataVersion={dataVersion}
                state={appliedFormState.state}
                startDate={appliedFormState.start_date}
                endDate={appliedFormState.end_date}
                route={appliedFormState.route}
                startMM={appliedFormState.start_mm}
                endMM={appliedFormState.end_mm}
                width={appliedFormState.width}
                height={appliedFormState.height}
                pointSize={appliedFormState.size}
                visibleLayers={visibleLayers}
                selectedMMs={selectedMMs}
                onTimeChange={setCurrentGraphTime}
                selectedTime={currentGraphTime}
                cameraLocations={cameraLocations}
                showCameraLines={showCameraLines}
                showTimeIndicators={showTimeIndicators}
              >
                {/* FOOTER */}
                <div
                  id="filter-status"
                  className="d-flex align-items-center flex-wrap gap-4 py-2 px-3 bg-white border-top"
                  style={{ borderRadius: "0 0 20px 20px" }}
                >
                  <div className="d-flex align-items-center gap-3 flex-nowrap">
                    <span className="fw-semibold">Toggle layers:</span>
                    {["truck", "car", "accel", "decel", "lines"].map((k) => (
                      <div
                        key={k}
                        className="d-flex align-items-center gap-2 flex-nowrap"
                      >
                        <kbd
                          className={`badge ${k === "lines"
                            ? showCameraLines
                              ? "bg-dark"
                              : "bg-secondary"
                            : visibleLayers[k]
                              ? k === "truck"
                                ? "bg-primary"
                                : k === "car"
                                  ? "bg-success"
                                  : k === "accel"
                                    ? "bg-warning"
                                    : "bg-danger"
                              : "bg-secondary"
                            } fs-6 px-3 py-2`}
                        >
                          {k === "truck"
                            ? "T"
                            : k === "car"
                              ? "D"
                              : k === "accel"
                                ? "N"
                                : k === "decel"
                                  ? "B"
                                  : "L"}
                        </kbd>
                        <span
                          className={
                            (k === "lines" ? showCameraLines : visibleLayers[k])
                              ? "text-dark fw-semibold"
                              : "text-muted"
                          }
                        >
                          {k === "lines"
                            ? "Cam Lines"
                            : k.charAt(0).toUpperCase() + k.slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="d-flex align-items-center gap-3 border-start border-end px-3">
                    <span className="small">
                      <strong>Cost:</strong> ${metaData.cost}
                    </span>
                    <span className="small">
                      <strong>Bytes:</strong> {formatBytesToTB(metaData.bytes)}
                    </span>
                  </div>

                  <img
                    src={ROUTE_IMAGES[appliedFormState.state]?.[appliedFormState.route] || ROUTE_IMAGES.IN["I-465"]}
                    alt=""
                    height={40}
                    width={40}
                    className="rounded shadow-sm"
                    style={{ objectFit: "contain", flexShrink: 0 }}
                  />

                  <div className="d-flex align-items-center gap-3 flex-nowrap">
                    <span className="fw-semibold small">Speed (mph):</span>
                    {[
                      ["rgb(234, 0, 234)", "0–14"],
                      ["rgb(211, 2, 2)", "15–24"],
                      ["rgb(239, 67, 9)", "25–34"],
                      ["rgb(249, 183, 49)", "35–44"],
                      ["rgb(239, 234, 91)", "45–54"],
                      ["rgb(127, 234, 51)", "55–64"],
                      ["rgb(204, 255, 153)", ">65"],
                      ["rgb(238, 238, 238)", "No Data"],
                    ].map(([color, label]) => (
                      <div
                        key={label}
                        className="d-flex align-items-center gap-2 flex-nowrap"
                      >
                        <div
                          style={{
                            width: "14px",
                            height: "14px",
                            backgroundColor: color,
                            border: "1px solid #ddd",
                            flexShrink: 0,
                          }}
                        />
                        <span className="small">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TrafficHeatmapD3>

              {/* {loading && <div style={{ position: "absolute", top: 10, right: 10 }}>Loading...</div>} */}
            </div>

            <div className="mt-4 px-3">
              <CameraPreviewRow
                data={selectedMMs.map((mm) => ({ mm }))}
                allMMs={cameraLocations}
                dateTime={currentGraphTime}
                route={appliedFormState.route}
                state={appliedFormState.state}
                onMMChange={handleMMChange}
                onTimeAdjust={handleTimeAdjust}
              />
            </div>
          </div>
        )}
      </div>
=======
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
>>>>>>> heatmap/main
    </div>
  );
};

export default HeatmapGenerator;
