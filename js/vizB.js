/*--------------------------------------------------------------*/
/* Configuration                                                */
/*--------------------------------------------------------------*/

const ctxB = {
    CHART_WIDTH:  700,
    CHART_HEIGHT: 620,
    MARGIN: { top: 40, right: 40, bottom: 70, left: 70 },
    DATA_PATH: "../data/rf_scatter.json",
    POINT_RADIUS: 2.5,
    POINT_OPACITY: 0.55,
    REGION_COLORS: {
        "Auvergne-Rhône-Alpes":       "#4e79a7",
        "Bourgogne-Franche-Comté":    "#f28e2b",
        "Bretagne":                   "#e15759",
        "Centre-Val de Loire":        "#76b7b2",
        "Grand Est":                  "#59a14f",
        "Hauts-de-France":            "#edc948",
        "Normandie":                  "#b07aa1",
        "Nouvelle-Aquitaine":         "#ff9da7",
        "Occitanie":                  "#9c755f",
        "Pays de la Loire":           "#bab0ac",
        "Provence-Alpes-Côte d'Azur": "#d37295",
        "Île-de-France":              "#a0cbe8"
    }
};

// Global state for Viz B
let xScaleB, yScaleB, svgB, allDataB;
let activeRegionB = null;  // for coordination with map


/*--------------------------------------------------------------*/
/* Section 1 – Scales and axes                                  */
/*--------------------------------------------------------------*/

function initScalesB(data) {
    const innerW = ctxB.CHART_WIDTH  - ctxB.MARGIN.left - ctxB.MARGIN.right;
    const innerH = ctxB.CHART_HEIGHT - ctxB.MARGIN.top  - ctxB.MARGIN.bottom;

    const minVal = Math.min(
        d3.min(data, d => d.y_true),
        d3.min(data, d => d.y_pred_rf)
    );
    const maxVal = Math.max(
        d3.max(data, d => d.y_true),
        d3.max(data, d => d.y_pred_rf)
    );

    const pad = (maxVal - minVal) * 0.04;

    xScaleB = d3.scaleLinear()
        .domain([minVal - pad, maxVal + pad])
        .range([0, innerW]);

    yScaleB = d3.scaleLinear()
        .domain([minVal - pad, maxVal + pad])
        .range([innerH, 0]);

    return { innerW, innerH, minVal, maxVal };
}


/*--------------------------------------------------------------*/
/* Section 2 – Draw axes, grid, diagonal                        */
/*--------------------------------------------------------------*/

function drawAxesB(innerG, innerW, innerH, minVal, maxVal) {

    // Grid lines X
    innerG.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${innerH})`)
        .call(d3.axisBottom(xScaleB)
            .ticks(7)
            .tickSize(-innerH)
            .tickFormat("")
        )
        .selectAll("line")
        .style("stroke", "#eee")
        .style("stroke-width", 0.8);

    // Grid lines Y
    innerG.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(yScaleB)
            .ticks(7)
            .tickSize(-innerW)
            .tickFormat("")
        )
        .selectAll("line")
        .style("stroke", "#eee")
        .style("stroke-width", 0.8);

    // Remove grid domain lines
    innerG.selectAll(".grid .domain").remove();

    // X axis
    innerG.append("g")
        .attr("transform", `translate(0,${innerH})`)
        .call(d3.axisBottom(xScaleB).ticks(7))
        .selectAll("text")
        .style("font-family", "Courier New, monospace")
        .style("font-size", "11px");

    // Y axis
    innerG.append("g")
        .call(d3.axisLeft(yScaleB).ticks(7))
        .selectAll("text")
        .style("font-family", "Courier New, monospace")
        .style("font-size", "11px");

    // X axis label
    innerG.append("text")
        .attr("x", innerW / 2)
        .attr("y", innerH + 50)
        .attr("text-anchor", "middle")
        .style("font-family", "Georgia, serif")
        .style("font-size", "12px")
        .style("fill", "#555")
        .text("Observed consumption (kWh/capita)");

    // Y axis label
    innerG.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerH / 2)
        .attr("y", -52)
        .attr("text-anchor", "middle")
        .style("font-family", "Georgia, serif")
        .style("font-size", "12px")
        .style("fill", "#555")
        .text("Predicted consumption (kWh/capita)");

    // Perfect prediction diagonal
    innerG.append("line")
        .attr("x1", xScaleB(minVal))
        .attr("y1", yScaleB(minVal))
        .attr("x2", xScaleB(maxVal))
        .attr("y2", yScaleB(maxVal))
        .style("stroke", "#1a1a1a")
        .style("stroke-width", 1.5)
        .style("stroke-dasharray", "6,4");

    // Diagonal label
    innerG.append("text")
        .attr("x", xScaleB(maxVal) - 10)
        .attr("y", yScaleB(maxVal) - 8)
        .attr("text-anchor", "end")
        .style("font-family", "Courier New, monospace")
        .style("font-size", "10px")
        .style("fill", "#888")
        .text("perfect prediction");
}


/*--------------------------------------------------------------*/
/* Section 3 – Draw scatter points                              */
/*--------------------------------------------------------------*/

function drawPointsB(innerG, data) {
    innerG.selectAll("circle.pt")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "pt")
        .attr("cx", d => xScaleB(d.y_true))
        .attr("cy", d => yScaleB(d.y_pred_rf))
        .attr("r", ctxB.POINT_RADIUS)
        .style("fill", d => ctxB.REGION_COLORS[d.region_name] || "#888")
        .style("opacity", ctxB.POINT_OPACITY)
        .style("stroke", "none");
}


/*--------------------------------------------------------------*/
/* Section 4 – Tooltip                                          */
/*--------------------------------------------------------------*/

function addTooltipB(innerG) {
    const tooltip = d3.select("body")
        .append("div")
        .attr("id", "tooltipB")
        .style("position", "absolute")
        .style("background", "#1a1a1a")
        .style("color", "#fff")
        .style("padding", "10px 14px")
        .style("border-radius", "4px")
        .style("font-family", "Courier New, monospace")
        .style("font-size", "11px")
        .style("line-height", "1.7")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("z-index", 100);

    innerG.selectAll("circle.pt")
        .on("mouseover", function(event, d) {
            d3.select(this)
                .raise()
                .attr("r", 5)
                .style("opacity", 1)
                .style("stroke", "#1a1a1a")
                .style("stroke-width", 1);

            tooltip.style("opacity", 1)
                .html(`
                    <strong>${d.region_name}</strong><br>
                    Observed:    ${d.y_true.toFixed(2)} kWh/cap<br>
                    Predicted: ${d.y_pred_rf.toFixed(2)} kWh/cap<br>
                    Error:     ${d.abs_error_rf.toFixed(2)} kWh/cap<br>
                    MAPE:      ${(d.ape_rf * 100).toFixed(1)}%
                `);
        })
        .on("mousemove", function(event) {
            tooltip
                .style("left", (event.pageX + 14) + "px")
                .style("top",  (event.pageY - 28) + "px");
        })
        .on("mouseleave", function() {
            d3.select(this)
                .attr("r", ctxB.POINT_RADIUS)
                .style("opacity", ctxB.POINT_OPACITY)
                .style("stroke", "none");
            tooltip.style("opacity", 0);
        });
}


/*--------------------------------------------------------------*/
/* Section 5 – Legend                                           */
/*--------------------------------------------------------------*/

function drawLegendB(container) {
    const legendDiv = container.append("div")
        .attr("id", "legendB")
        .style("display", "flex")
        .style("flex-wrap", "wrap")
        .style("gap", "6px 14px")
        .style("margin-top", "10px")
        .style("font-family", "Courier New, monospace")
        .style("font-size", "10px")
        .style("color", "#555");

    Object.entries(ctxB.REGION_COLORS).forEach(([region, color]) => {
        const item = legendDiv.append("div")
            .style("display", "flex")
            .style("align-items", "center")
            .style("gap", "5px")
            .style("cursor", "pointer")
            .on("click", () => filterByRegionB(region));

        item.append("div")
            .style("width", "10px")
            .style("height", "10px")
            .style("border-radius", "50%")
            .style("background", color)
            .style("flex-shrink", "0");

        item.append("span").text(region);
    });

    // Reset button
    legendDiv.append("div")
        .style("display", "flex")
        .style("align-items", "center")
        .style("gap", "5px")
        .style("cursor", "pointer")
        .style("color", "#aaa")
        .style("margin-left", "8px")
        .on("click", () => filterByRegionB(null))
        .append("span")
        .text("show all ×");
}


/*--------------------------------------------------------------*/
/* Section 6 – Region filter (coordination hook)               */
/*--------------------------------------------------------------*/

function filterByRegionB(regionName) {
    activeRegionB = regionName;

    svgB.selectAll("circle.pt")
        .transition()
        .duration(250)
        .style("opacity", d => {
            if (!regionName) return ctxB.POINT_OPACITY;
            return d.region_name === regionName ? 0.85 : 0.05;
        })
        .attr("r", d => {
            if (!regionName) return ctxB.POINT_RADIUS;
            return d.region_name === regionName ? 3.5 : ctxB.POINT_RADIUS;
        });
}


/*--------------------------------------------------------------*/
/* Data loading                                                  */
/*--------------------------------------------------------------*/

function loadDataB() {
    d3.json(ctxB.DATA_PATH).then(function(data) {
        console.log(`Scatter data loaded: ${data.length} points`);
        allDataB = data;

        const { innerW, innerH, minVal, maxVal } = initScalesB(data);

        const container = d3.select("#vizB");

        svgB = container.append("svg")
            .attr("viewBox", `0 0 ${ctxB.CHART_WIDTH} ${ctxB.CHART_HEIGHT}`)
            .attr("width", "100%");

        const innerG = svgB.append("g")
            .attr("id", "innerGB")
            .attr("transform", `translate(${ctxB.MARGIN.left},${ctxB.MARGIN.top})`);

        // Section 2 — axes + diagonal
        drawAxesB(innerG, innerW, innerH, minVal, maxVal);

        // Section 3 — points
        drawPointsB(innerG, data);

        // Section 4 — tooltip
        addTooltipB(innerG);

        // Section 5 — legend
        drawLegendB(container);

    }).catch(error => console.error("Scatter data error:", error));
}


/*--------------------------------------------------------------*/
/* Entry point                                                   */
/*--------------------------------------------------------------*/

function createVizB() {
    console.log("Viz B — Predicted vs Observed scatter");
    loadDataB();
}