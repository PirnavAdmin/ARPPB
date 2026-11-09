import { useState, useMemo } from "react";
import { useFarmer } from "../context/FarmerContext";
import DataTable from "../components/DataTable";
import { formatCurrency } from "../utils/farmerHelpers";

function MarketPrices() {
  const { marketPrices, searchQuery } = useFarmer();

  const [selectedCropDetail, setSelectedCropDetail] = useState(null);
  const [showChart, setShowChart] = useState(false);
  const [selectedState, setSelectedState] = useState("All");

  const handleOpenChart = (row) => {
    setSelectedCropDetail(row);
    setShowChart(true);
  };

  // Filtered prices
  const filteredPrices = useMemo(() => {
    return marketPrices.filter((mp) => {
      const matchSearch =
        !searchQuery ||
        mp.crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mp.market.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mp.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchState = selectedState === "All" || mp.state === selectedState;

      return matchSearch && matchState;
    });
  }, [marketPrices, searchQuery, selectedState]);

  const columns = [
    {
      key: "crop",
      label: "Crop & Category",
      render: (val, row) => (
        <div>
          <strong style={{ color: "var(--farmer-dark)", fontSize: "0.94rem" }}>
            {val}
          </strong>
          <small style={{ display: "block", color: "var(--farmer-secondary)" }}>
            {row.category}
          </small>
        </div>
      ),
    },
    {
      key: "market",
      label: "Mandi / APMC Yard",
      render: (val, row) => (
        <div>
          <span style={{ fontWeight: 600 }}>{val}</span>
          <small style={{ display: "block", color: "var(--farmer-secondary)" }}>
            📍 {row.location} ({row.state})
          </small>
        </div>
      ),
    },
    {
      key: "todayPrice",
      label: "Today's Price",
      render: (val, row) => (
        <div>
          <strong
            style={{ fontSize: "1.05rem", color: "var(--farmer-primary)" }}
          >
            {formatCurrency(val)} / qtl
          </strong>
        </div>
      ),
    },
    {
      key: "prevPrice",
      label: "Prev Day",
      render: (val) => `${formatCurrency(val)}`,
    },
    {
      key: "change",
      label: "Daily Trend",
      render: (val, row) => {
        const isUp = row.trend === "up";
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 8px",
              borderRadius: 6,
              fontSize: "0.8rem",
              fontWeight: 700,
              backgroundColor: isUp ? "#E8F5EC" : "#FEE2E2",
              color: isUp ? "#155D35" : "#B91C1C",
            }}
          >
            {isUp ? "▲" : "▼"} {val}
          </span>
        );
      },
    },
    {
      key: "minPrice",
      label: "Min / Max Range",
      render: (_, row) => (
        <span style={{ fontSize: "0.86rem", color: "var(--farmer-secondary)" }}>
          {formatCurrency(row.minPrice)} – {formatCurrency(row.maxPrice)}
        </span>
      ),
    },
    {
      key: "avgPrice",
      label: "Average Price",
      render: (val) => formatCurrency(val),
    },
    {
      key: "lastUpdated",
      label: "Updated On",
      render: (val) => (
        <span
          style={{
            fontSize: "0.78rem",
            color: "var(--farmer-secondary)",
            whiteSpace: "nowrap",
          }}
        >
          {val}
        </span>
      ),
    },
    {
      key: "action",
      label: "Trend",
      render: (_, row) => (
        <button
          type="button"
          className="farmer-btn farmer-btn-outline farmer-btn-sm"
          onClick={() => handleOpenChart(row)}
        >
          View Chart
        </button>
      ),
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="farmer-page-header">
        <div className="farmer-header-titles">
          <h2>Daily Mandi Market Prices</h2>
          <p>
            Real-time commodity price tracking across regional APMC yards and
            wholesale mandis
          </p>
        </div>

        <div className="farmer-header-actions">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: "0.84rem",
                color: "var(--farmer-secondary)",
                fontWeight: 600,
              }}
            >
              State Filter:
            </span>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid var(--farmer-border)",
                background: "#FFFFFF",
                fontSize: "0.88rem",
              }}
            >
              <option value="All">All States (AP & TG)</option>
              <option value="Andhra Pradesh">Andhra Pradesh Mandis</option>
              <option value="Telangana">Telangana APMCs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Selected Crop Interactive Trend Modal */}
      {showChart && selectedCropDetail && (
        <div
          className="farmer-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowChart(false)}
        >
          <div
            className="farmer-modal-content lg"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "linear-gradient(135deg, #FFFFFF 0%, #F5FBF7 100%)",
              border: "2px solid #E8F5EC",
            }}
          >
            <div className="farmer-modal-header">
              <div>
                <h3>{selectedCropDetail.crop} Trend</h3>
                <span
                  style={{
                    fontSize: "0.84rem",
                    color: "var(--farmer-secondary)",
                  }}
                >
                  {selectedCropDetail.market} • {selectedCropDetail.location}
                </span>
              </div>
              <button
                type="button"
                className="farmer-modal-close"
                onClick={() => setShowChart(false)}
                aria-label="Close chart"
              >
                ✕
              </button>
            </div>

            <div className="farmer-modal-body" style={{ paddingTop: 8 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: 16,
                }}
              >
                <div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <h3 style={{ margin: 0, fontSize: "1.4rem" }}>
                      {selectedCropDetail.crop}
                    </h3>
                    <span
                      style={{
                        backgroundColor:
                          selectedCropDetail.trend === "up"
                            ? "#E8F5EC"
                            : "#FEE2E2",
                        color:
                          selectedCropDetail.trend === "up"
                            ? "#155D35"
                            : "#B91C1C",
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontSize: "0.8rem",
                        fontWeight: 700,
                      }}
                    >
                      {selectedCropDetail.change} today
                    </span>
                  </div>
                  <p
                    style={{
                      margin: "4px 0 0",
                      color: "var(--farmer-secondary)",
                      fontSize: "0.9rem",
                    }}
                  >
                    Primary Mandi: <strong>{selectedCropDetail.market}</strong>{" "}
                    ({selectedCropDetail.location}) • Last updated:{" "}
                    {selectedCropDetail.lastUpdated}
                  </p>
                </div>

                <div style={{ display: "flex", gap: 20 }}>
                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        fontSize: "0.74rem",
                        color: "var(--farmer-secondary)",
                        display: "block",
                      }}
                    >
                      TODAY'S RATE
                    </span>
                    <strong
                      style={{
                        fontSize: "1.6rem",
                        color: "var(--farmer-primary)",
                      }}
                    >
                      {formatCurrency(selectedCropDetail.todayPrice)}
                    </strong>
                    <small
                      style={{
                        color: "var(--farmer-secondary)",
                        display: "block",
                      }}
                    >
                      per quintal
                    </small>
                  </div>

                  <div
                    style={{
                      textAlign: "right",
                      borderLeft: "1px solid var(--farmer-border)",
                      paddingLeft: 20,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.74rem",
                        color: "var(--farmer-secondary)",
                        display: "block",
                      }}
                    >
                      AVERAGE RANGE
                    </span>
                    <strong
                      style={{
                        fontSize: "1.2rem",
                        color: "var(--farmer-text)",
                      }}
                    >
                      {formatCurrency(selectedCropDetail.avgPrice)}
                    </strong>
                    <small
                      style={{
                        color: "var(--farmer-secondary)",
                        display: "block",
                      }}
                    >
                      Min: {formatCurrency(selectedCropDetail.minPrice)} / Max:{" "}
                      {formatCurrency(selectedCropDetail.maxPrice)}
                    </small>
                  </div>
                </div>
              </div>

              {/* 6-day Trend Sparkline / Bar visualization */}
              <div style={{ marginTop: 20 }}>
                <div
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--farmer-secondary)",
                    marginBottom: 10,
                    fontWeight: 600,
                  }}
                >
                  Recent 6-Day Price Movement Trend (₹ / qtl):
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 16,
                    height: 120,
                    borderBottom: "1px solid var(--farmer-border)",
                    paddingBottom: 6,
                  }}
                >
                  {selectedCropDetail.history?.map((val, idx) => {
                    const minH = Math.min(...selectedCropDetail.history);
                    const maxH = Math.max(...selectedCropDetail.history);
                    const range = maxH - minH || 1;
                    const pct = Math.max(
                      25,
                      Math.round(((val - minH) / range) * 80),
                    );

                    return (
                      <div
                        key={idx}
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          height: "100%",
                          justifyContent: "flex-end",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            color: "var(--farmer-dark)",
                            marginBottom: 4,
                          }}
                        >
                          {formatCurrency(val)}
                        </span>
                        <div
                          style={{
                            width: "60%",
                            height: `${pct}%`,
                            backgroundColor:
                              idx === selectedCropDetail.history.length - 1
                                ? "var(--farmer-primary)"
                                : "#A3E6B4",
                            borderRadius: "4px 4px 0 0",
                            transition: "height 0.3s ease",
                          }}
                        />
                        <span
                          style={{
                            fontSize: "0.74rem",
                            color: "var(--farmer-secondary)",
                            marginTop: 6,
                          }}
                        >
                          Day {idx + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Prices Table */}
      <div className="farmer-card" style={{ padding: "20px" }}>
        <DataTable columns={columns} rows={filteredPrices} />
      </div>
    </div>
  );
}

export default MarketPrices;
