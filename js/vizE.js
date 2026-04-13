/*--------------------------------------------------------------*/
/* Configuration                                                */
/*--------------------------------------------------------------*/

const ctxE = {
    CHART_WIDTH:  800,
    CHART_HEIGHT: 480,
    MARGIN: { top: 40, right: 60, bottom: 70, left: 70 },
    DATA_PATH: "../data/viz_e_data.json",
    COLOR_LOW:  "#d4e8c2",
    COLOR_HIGH: "#7B2D2D",
    OUTLIER:    "Île-de-France",
    HIGHLIGHT:  "Provence-Alpes-Côte d'Azur",
};

let svgE, xScaleE, yScaleE, colorScaleE;


/*--------------------------------------------------------------*/
/* Section 1 – Scales                                           */
/*--------------------------------------------------------------*/

function initScalesE(data) {
    const innerW = ctxE.CHART_WIDTH  - ctxE.MARGIN.left - ctxE.MARGIN.right;
    const innerH = ctxE.CHART_HEIGHT - ctxE.MARGIN.top  - ctxE.MARGIN.bottom;

    // X — density (log scale because Île-de-France is a massive outlier)
    xScaleE = d3.scaleLog()
        .domain([
            d3.min(data, d => d.density) * 0.85,
            d3.max(data, d => d.density) * 1.2
        ])
        .range([0, innerW]);

    // Y — mean MAPE
    const mapeMin = d3.min(data, d => d.mean_mape);
    const mapeMax = d3.max(data, d => d.mean_mape);
    const mapePad = (mapeMax - mapeMin) * 0.12;

    yScaleE = d3.scaleLinear()
        .domain([mapeMin - mapePad, mapeMax + mapePad])
        .range([innerH, 0]);

    // Color — same palette as map (low MAPE = green, high = red)
    colorScaleE = d3.scaleSequential()
        .domain([mapeMin, mapeMax])
        .interpolator(d3.interpolate(ctxE.COLOR_LOW, ctxE.COLOR_HIGH));

    return { innerW, innerH };
}


/*--------------------------------------------------------------*/
/* Section 2 – Axes, grid, reference lines                      */
/*--------------------------------------------------------------*/

function drawAxesE(innerG, innerW, innerH, data) {

    // Horizontal grid
    innerG.append("g")
        .attr("class", "gridE")
        .call(d3.axisLeft(yScaleE)
            .ticks(5)
            .tickSize(-innerW)
            .tickFormat("")
        )
        .selectAll("line")
        .style("stroke", "#eee")
        .style("stroke-width", 0.8);

    innerG.selectAll(".gridE .domain").remove();

    // Y axis
    innerG.append("g")
        .call(d3.axisLeft(yScaleE)
            .ticks(5)
            .tickFormat(d => (d * 100).toFixed(1) + "%")
        )
        .selectAll("text")
        .style("font-family", "Courier New, monospace")
        .style("font-size", "10px");

    // X axis — log scale, custom ticks
    innerG.append("g")
        .attr("transform", `translate(0,${innerH})`)
        .call(d3.axisBottom(xScaleE)
            .tickValues([60, 100, 200, 500, 1000])
            .tickFormat(d => d + " /km²")
        )
        .selectAll("text")
        .style("font-family", "Courier New, monospace")
        .style("font-size", "10px");

    innerG.select(".domain").style("display", "none");

    // Y axis label
    innerG.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerH / 2)
        .attr("y", -52)
        .attr("text-anchor", "middle")
        .style("font-family", "Georgia, serif")
        .style("font-size", "11px")
        .style("fill", "#555")
        .text("Mean MAPE (test set)");

    // X axis label
    innerG.append("text")
        .attr("x", innerW / 2)
        .attr("y", innerH + 50)
        .attr("text-anchor", "middle")
        .style("font-family", "Georgia, serif")
        .style("font-size", "11px")
        .style("fill", "#555")
        .text("Population density (log scale, people/km²)");

    // Mean MAPE reference line
    const meanMape = d3.mean(data, d => d.mean_mape);
    innerG.append("line")
        .attr("x1", 0).attr("x2", innerW)
        .attr("y1", yScaleE(meanMape)).attr("y2", yScaleE(meanMape))
        .style("stroke", "#aaa")
        .style("stroke-width", 1)
        .style("stroke-dasharray", "4,3");

    innerG.append("text")
        .attr("x", innerW - 4)
        .attr("y", yScaleE(meanMape) - 6)
        .attr("text-anchor", "end")
        .style("font-family", "Courier New, monospace")
        .style("font-size", "9px")
        .style("fill", "#aaa")
        .text("national avg MAPE");
}


/*--------------------------------------------------------------*/
/* Section 3 – Scatter points                                   */
/*--------------------------------------------------------------*/

function drawPointsE(innerG, data) {
    const g = innerG.append("g").attr("id", "pointsE");

    data.forEach(d => {
        const isOutlier   = d.region_name === ctxE.OUTLIER;
        const isHighlight = d.region_name === ctxE.HIGHLIGHT;

        const pointG = g.append("g")
            .attr("class", "point-g")
            .attr("transform", `translate(${xScaleE(d.density)},${yScaleE(d.mean_mape)})`);

        // Outer ring for outlier
        if (isOutlier) {
            pointG.append("circle")
                .attr("r", 16)
                .style("fill", "none")
                .style("stroke", colorScaleE(d.mean_mape))
                .style("stroke-width", 1)
                .style("stroke-dasharray", "3,2")
                .style("opacity", 0.6);
        }

        // Main dot
        pointG.append("circle")
            .attr("r", isOutlier || isHighlight ? 9 : 7)
            .style("fill", colorScaleE(d.mean_mape))
            .style("stroke", "#fff")
            .style("stroke-width", isOutlier ? 2 : 1)
            .style("opacity", 0.9);
    });
}


/*--------------------------------------------------------------*/
/* Section 4 – Annotations                                      */
/*--------------------------------------------------------------*/

function drawAnnotationsE(innerG, data, innerW, innerH) {

    data.forEach(d => {
        const isOutlier   = d.region_name === ctxE.OUTLIER;
        const isHighlight = d.region_name === ctxE.HIGHLIGHT;
        const cx          = xScaleE(d.density);
        const cy          = yScaleE(d.mean_mape);

        if (isOutlier) {
            // Leader line
            innerG.append("line")
                .attr("x1", cx - 12).attr("x2", cx - 80)
                .attr("y1", cy - 8) .attr("y2", cy - 45)
                .style("stroke", "#1a1a1a")
                .style("stroke-width", 0.8);

            // Annotation box
            const box = innerG.append("g")
                .attr("transform", `translate(${cx - 82},${cy - 78})`);

            box.append("rect")
                .attr("x", -120).attr("y", -2)
                .attr("width", 120).attr("height", 38)
                .attr("rx", 3)
                .style("fill", "#1a1a1a");

            box.append("text")
                .attr("x", -60).attr("y", 13)
                .attr("text-anchor", "middle")
                .style("font-family", "Courier New, monospace")
                .style("font-size", "9px")
                .style("fill", "#fff")
                .text("Île-de-France");

            box.append("text")
                .attr("x", -60).attr("y", 27)
                .attr("text-anchor", "middle")
                .style("font-family", "Courier New, monospace")
                .style("font-size", "9px")
                .style("fill", "#aaa")
                .text("densest, yet hardest");

        } else if (isHighlight) {
            // Leader line
            innerG.append("line")
                .attr("x1", cx + 10).attr("x2", cx + 60)
                .attr("y1", cy)     .attr("y2", cy + 30)
                .style("stroke", "#555")
                .style("stroke-width", 0.8);

            innerG.append("text")
                .attr("x", cx + 64)
                .attr("y", cy + 34)
                .style("font-family", "Courier New, monospace")
                .style("font-size", "9px")
                .style("fill", "#555")
                .text("Provence — easiest");

        } else {
            // Small label for all other regions
            const labelX = cx + (d.density > 150 ? -12 : 10);
            const anchor = d.density > 150 ? "end" : "start";

            innerG.append("text")
                .attr("x", labelX)
                .attr("y", cy + 4)
                .attr("text-anchor", anchor)
                .style("font-family", "Courier New, monospace")
                .style("font-size", "8.5px")
                .style("fill", "#888")
                .text(d.region_name.length > 18
                    ? d.region_name.split('-')[0].split(' ')[0]
                    : d.region_name);
        }
    });

    // "No clear trend" annotation
    innerG.append("text")
        .attr("x", innerW / 2)
        .attr("y", 16)
        .attr("text-anchor", "middle")
        .style("font-family", "Courier New, monospace")
        .style("font-size", "10px")
        .style("fill", "#aaa")
        .style("font-style", "italic")
        .text("No clear linear relationship between density and prediction error");
}


/*--------------------------------------------------------------*/
/* Section 5 – Tooltip                                          */
/*--------------------------------------------------------------*/

function addTooltipE(innerG, data) {
    const tooltip = d3.select("body")
        .append("div")
        .attr("id", "tooltipE")
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

    innerG.selectAll(".point-g")
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            // d is not bound here — find region from transform
            // instead we use the data bound to the parent g
        });

    // Rebind with data directly
    data.forEach(d => {
        const cx = xScaleE(d.density);
        const cy = yScaleE(d.mean_mape);

        innerG.append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", 14)
            .style("fill", "transparent")
            .style("cursor", "pointer")
            .on("mouseover", function(event) {
                tooltip.style("opacity", 1)
                    .html(`
                        <strong>${d.region_name}</strong><br>
                        Mean MAPE: ${(d.mean_mape * 100).toFixed(1)}%<br>
                        Density:   ${d.density.toFixed(0)} /km²
                    `);
            })
            .on("mousemove", function(event) {
                tooltip
                    .style("left", (event.pageX + 14) + "px")
                    .style("top",  (event.pageY - 28) + "px");
            })
            .on("mouseleave", function() {
                tooltip.style("opacity", 0);
            });
    });
}


/*--------------------------------------------------------------*/
/* Data loading                                                  */
/*--------------------------------------------------------------*/

function loadDataE() {
    d3.json(ctxE.DATA_PATH).then(function(data) {
        console.log(`Viz E data loaded: ${data.length} regions`);

        const container = d3.select("#vizE");

        svgE = container.append("svg")
            .attr("viewBox", `0 0 ${ctxE.CHART_WIDTH} ${ctxE.CHART_HEIGHT}`)
            .attr("width", "100%");

        const { innerW, innerH } = initScalesE(data);

        const innerG = svgE.append("g")
            .attr("id", "innerGE")
            .attr("transform", `translate(${ctxE.MARGIN.left},${ctxE.MARGIN.top})`);

        // Section 2 — axes
        drawAxesE(innerG, innerW, innerH, data);

        // Section 3 — points
        drawPointsE(innerG, data);

        // Section 4 — annotations
        drawAnnotationsE(innerG, data, innerW, innerH);

        // Section 5 — tooltip
        addTooltipE(innerG, data);

    }).catch(error => console.error("Viz E error:", error));
}


/*--------------------------------------------------------------*/
/* Entry point                                                   */
/*--------------------------------------------------------------*/

function createVizE() {
    console.log("Viz E — MAPE vs density annotated scatter");
    loadDataE();
}