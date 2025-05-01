// script.js

console.log("🟢 script.js loaded");

// Selectors & SVG setup
const svg = d3.select("#pie-chart");
const width = +svg.attr("width");
const height = +svg.attr("height");
const radius = Math.min(width, height) / 2;
const g = svg.append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);
const color = d3.scaleOrdinal(d3.schemeCategory10);

// Load data
//d3.csv("cleaned_trade_data.csv")
d3.csv("subset_trade_data.csv")
  .then(data => {
    console.log("✅ CSV loaded, sample:", data.slice(0,3));

    // Convert date columns to numbers
    const dateCols = data.columns.filter(c => /\d{4}-/.test(c));
    data.forEach(d => {
      dateCols.forEach(col => d[col] = +d[col]);
    });

    // Populate dropdowns
    populateDropdown("country-select", [...new Set(data.map(d => d.COUNTRY))]);
    populateDropdown("indicator-select", [...new Set(data.map(d => d.INDICATOR))]);
    populateDropdown("trade-flow-select", [...new Set(data.map(d => d.TRADE_FLOW))]);

    // Wire up change handlers
    d3.selectAll("select").on("change", () => updateChart(data));

    // Initial draw
    updateChart(data);
  })
  .catch(err => {
    console.error("❌ failed to load CSV:", err);
  });

// Helper to populate a <select> and include a default
function populateDropdown(id, values) {
  const select = d3.select(`#${id}`);
  // default placeholder
  select.append("option")
        .attr("value", "")
        .text("Select…");
  values.sort().forEach(val => {
    select.append("option")
          .attr("value", val)
          .text(val);
  });
}

function updateChart(data) {
    // 0. Read dropdowns
    const country   = d3.select("#country-select").property("value");
    const indicator = d3.select("#indicator-select").property("value");
    const flow      = d3.select("#trade-flow-select").property("value");
    if (!country || !indicator || !flow) return;
  
    // 1. Filter
    const filtered = data.filter(d =>
      d.COUNTRY    === country &&
      d.INDICATOR  === indicator &&
      d.TRADE_FLOW === flow
    );
    if (!filtered.length) {
      g.selectAll("*").remove();
      return;
    }
  
    // 2. Find the latest non-zero period
    const dateCols = data.columns.filter(c => /\d{4}-/.test(c)).sort();
    const latestCol = dateCols
      .slice().reverse()
      .find(col => d3.sum(filtered, d => d[col]) > 0);
    if (!latestCol) {
      g.selectAll("*").remove();
      return;
    }
  
    // 3. Roll-up
    const rolls = d3.rollups(
      filtered,
      vs => d3.sum(vs, d => d[latestCol]),
      d => d.COUNTERPART_COUNTRY
    ).map(([ctry, val]) => ({ country: ctry, value: val }))
     .sort((a,b) => b.value - a.value);
  
    // 4. Top-5 + Other
    const top5 = rolls.slice(0,5);
    const other = d3.sum(rolls.slice(5), d => d.value);
    if (other > 0) top5.push({ country: "Other", value: other });
  
    // 5. Build pie & arcs
    const pieData = d3.pie().value(d => d.value)(top5);
    const arcGen  = d3.arc().innerRadius(0).outerRadius(radius);
    const labelArc= d3.arc().innerRadius(radius*0.5).outerRadius(radius*0.8);
  
    // 6. Clear old and draw
    g.selectAll("*").remove();
  
    // ensure tooltip div exists
    const tooltip = d3.select(".tooltip");
  
    // slices
    g.selectAll("path")
      .data(pieData)
      .join("path")
        .attr("d", arcGen)
        .attr("fill", d => color(d.data.country))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .on("mouseover", (event,d) => {
          tooltip
            .style("opacity", 1)
            .html(`${d.data.value.toLocaleString()}`)
            .style("left",  (event.pageX + 10) + "px")
            .style("top",   (event.pageY - 25) + "px");
        })
        .on("mousemove", (event) => {
          tooltip
            .style("left",  (event.pageX + 10) + "px")
            .style("top",   (event.pageY - 25) + "px");
        })
        .on("mouseout", () => {
          tooltip.style("opacity", 0);
        });
  
    // labels INSIDE slices
    g.selectAll("text")
      .data(pieData)
      .join("text")
        .attr("transform", d => `translate(${labelArc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", "#fff")
        .text(d => d.data.country);
  }
  

  
// // stub for updateChart so no errors until you add it
// function updateChart(data) {
//     console.log("🔄 updateChart() called");
  
//     // 1. Read dropdowns
//     const country   = d3.select("#country-select").property("value");
//     const indicator = d3.select("#indicator-select").property("value");
//     const flow      = d3.select("#trade-flow-select").property("value");
  
//     // 2. Don’t draw until all are selected
//     if (!country || !indicator || !flow) return;
  
//     // 3. Filter
//     const filtered = data.filter(d =>
//       d.COUNTRY   === country   &&
//       d.INDICATOR === indicator &&
//       d.TRADE_FLOW=== flow
//     );
  
//     // 4. Find your date columns & pick the latest one
//     const dateCols = data.columns
//       .filter(c => /\d{4}-/.test(c))
//       .sort();                       // lexicographic sort: “2023-Q4” < “2024-Q1” < …
//     const latestCol = dateCols[dateCols.length - 1];
  
//     // 5. Aggregate sums by counterpart country
//     const rolls = d3.rollups(
//       filtered,
//       v => d3.sum(v, d => d[latestCol]),
//       d => d.COUNTERPART_COUNTRY
//     ).map(([key, sum]) => ({ country: key, value: sum }));
  
//     // 6. Top-5 + “Other”
//     rolls.sort((a,b) => b.value - a.value);
//     const top5 = rolls.slice(0,5);
//     const others = d3.sum(rolls.slice(5), d => d.value);
//     if (others > 0) top5.push({ country: "Other", value: others });
  
//     // 7. Prepare the pie layout
//     const pie  = d3.pie().value(d => d.value);
//     const arcs = pie(top5);
  
//     // 8. Clear old chart
//     g.selectAll("*").remove();
  
//     // 9. Draw slices
//     const arcGen   = d3.arc().innerRadius(0).outerRadius(radius);
//     const slices = g.selectAll("path")
//       .data(arcs)
//       .enter()
//       .append("path")
//         .attr("d", arcGen)
//         .attr("fill", d => color(d.data.country))
//         .attr("stroke", "white")
//         .attr("stroke-width", 2)
//       .on("mouseover", (event,d) => {
//         d3.select(".tooltip")
//           .style("opacity", 1)
//           .html(`${d.data.country}: ${d.data.value.toLocaleString()}`)
//           .style("left",  (event.pageX + 10) + "px")
//           .style("top",   (event.pageY - 25) + "px");
//       })
//       .on("mouseout", () => {
//         d3.select(".tooltip").style("opacity", 0);
//       });
  
//     // 10. Draw labels
//     const labelArc = d3.arc().innerRadius(radius*0.6).outerRadius(radius);
//     g.selectAll("text")
//       .data(arcs)
//       .enter()
//       .append("text")
//         .attr("transform", d => `translate(${labelArc.centroid(d)})`)
//         .attr("text-anchor", "middle")
//         .style("font-size", "12px")
//         .text(d => d.data.country);
//   }
  