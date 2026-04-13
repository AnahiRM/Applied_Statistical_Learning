/*--------------------------------------------------------------*/
/* Configuration                                                */
/*--------------------------------------------------------------*/

const ctxD = {
    CHART_WIDTH:  900,
    CHART_HEIGHT: 480,
    MARGIN: { top: 30, right: 30, bottom: 100, left: 70 },
    DATA_PATH: "../data/violin_data.json",
    REGION_ORDER: [
        'Centre-Val de Loire',
        'Île-de-France',
        'Bourgogne-Franche-Comté',
        'Normandie',
        'Pays de la Loire',
        'Hauts-de-France',
        'Occitanie',
        'Bretagne',
        'Auvergne-Rhône-Alpes',
        'Grand Est',
        'Nouvelle-Aquitaine',
        "Provence-Alpes-Côte d'Azur"
    ],
    COLOR_LOW:  "#d4e8c2",
    COLOR_HIGH: "#7B2D2D",
    KDE_BANDWIDTH: 0.3,
    KDE_TICKS: 60,
};

// Global state
let svgD, innerGD, xScaleD, yScaleD, colorScaleD;
let allDataD;


/*--------------------------------------------------------------*/
/* Section 1 – Scales                                           */
/*--------------------------------------------------------------*/

function initScalesD(data) {
    const innerW = ctxD.CHART_WIDTH  - ctxD.MARGIN.left - ctxD.MARGIN.right;
    const innerH = ctxD.CHART_HEIGHT - ctxD.MARGIN.top  - ctxD.MARGIN.bottom;

    // X — one band per region
    xScaleD = d3.scaleBand()
        .domain(ctxD.REGION_ORDER)
        .range([0, innerW])
        .padding(0.15);

    // Y — error_rf range with padding
    const absMax = Math.max(
        Math.abs(d3.min(data, d => d.error_rf)),
        Math.abs(d3.max(data, d => d.error_rf))
    );
    const pad = absMax * 0.08;

    yScaleD = d3.scaleLinear()
        .domain([-absMax - pad, absMax + pad])
        .range([innerH, 0]);

    // Color — mean MAPE per region (same as map)
    const meanByRegion = d3.rollup(data, v => d3.mean(v, d => d.ape_rf), d => d.region_name);
    const mapeValues   = Array.from(meanByRegion.values());

    colorScaleD = d3.scaleSequential()
        .domain([d3.min(mapeValues), d3.max(mapeValues)])
        .interpolator(d3.interpolate(ctxD.COLOR_LOW, ctxD.COLOR_HIGH));

    return { innerW, innerH, meanByRegion };
}


/*--------------------------------------------------------------*/
/* Section 2 – Axes and zero line                               */
/*--------------------------------------------------------------*/

function drawAxesD(innerG, innerW, innerH) {

    // Horizontal grid lines
    innerG.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(yScaleD)
            .ticks(8)
            .tickSize(-innerW)
            .tickFormat("")
        )
        .selectAll("line")
        .style("stroke", "#eee")
        .style("stroke-width", 0.8);

    innerG.selectAll(".grid .domain").remove();

    // Zero line
    innerG.append("line")
        .attr("x1", 0).attr("x2", innerW)
        .attr("y1", yScaleD(0)).attr("y2", yScaleD(0))
        .style("stroke", "#1a1a1a")
        .style("stroke-width", 1)
        .style("stroke-dasharray", "4,3");

    // Y axis
    innerG.append("g")
        .call(d3.axisLeft(yScaleD).ticks(8))
        .selectAll("text")
        .style("font-family", "Courier New, monospace")
        .style("font-size", "10px");

    // Y axis label
    innerG.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerH / 2)
        .attr("y", -52)
        .attr("text-anchor", "middle")
        .style("font-family", "Georgia, serif")
        .style("font-size", "11px")
        .style("fill", "#555")
        .text("Prediction error (kWh/capita)  ←  overestimate · 0 · underestimate  →");

    // X axis region labels — rotated
    innerG.append("g")
        .attr("transform", `translate(0,${innerH})`)
        .call(d3.axisBottom(xScaleD).tickSize(0))
        .selectAll("text")
        .style("font-family", "Courier New, monospace")
        .style("font-size", "9px")
        .style("fill", "#555")
        .attr("transform", "rotate(-35)")
        .attr("text-anchor", "end")
        .attr("dx", "-0.4em")
        .attr("dy", "0.6em");

    innerG.select(".domain").style("display", "none");
}


/*--------------------------------------------------------------*/
/* Section 3 – Kernel density estimator                         */
/*--------------------------------------------------------------*/

function kernelDensityEstimatorD(kernel, X) {
    return function(V) {
        return X.map(x => [x, d3.mean(V, v => kernel(x - v))]);
    };
}

function kernelEpanechnikovD(k) {
    return function(v) {
        return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
}


/*--------------------------------------------------------------*/
/* Section 4 – Draw violins                                     */
/*--------------------------------------------------------------*/

function drawViolins(innerG, data, meanByRegion) {
    const bandwidth = xScaleD.bandwidth() / 2;
    const kde = kernelDensityEstimatorD(
        kernelEpanechnikovD(ctxD.KDE_BANDWIDTH),
        yScaleD.ticks(ctxD.KDE_TICKS)
    );

    ctxD.REGION_ORDER.forEach(region => {
        const regionData  = data.filter(d => d.region_name === region);
        const errors      = regionData.map(d => d.error_rf);
        const density     = kde(errors);
        const meanMape    = meanByRegion.get(region) || 0;
        const fillColor   = colorScaleD(meanMape);
        const cx          = xScaleD(region) + xScaleD.bandwidth() / 2;

        const maxDensity  = d3.max(density, d => d[1]);
        const widthScale  = d3.scaleLinear()
            .domain([0, maxDensity])
            .range([0, bandwidth * 0.85]);

        const g = innerG.append("g")
            .attr("class", "violin-g")
            .attr("data-region", region);

        // Right half
        g.append("path")
            .datum(density)
            .attr("fill", fillColor)
            .attr("fill-opacity", 0.75)
            .attr("stroke", fillColor)
            .attr("stroke-width", 0.8)
            .attr("d", d3.line()
                .curve(d3.curveBasis)
                .x(d => cx + widthScale(d[1]))
                .y(d => yScaleD(d[0]))
            );

        // Left half (mirror)
        g.append("path")
            .datum(density)
            .attr("fill", fillColor)
            .attr("fill-opacity", 0.75)
            .attr("stroke", fillColor)
            .attr("stroke-width", 0.8)
            .attr("d", d3.line()
                .curve(d3.curveBasis)
                .x(d => cx - widthScale(d[1]))
                .y(d => yScaleD(d[0]))
            );

        // Median line
        const median = d3.quantile(errors.sort(d3.ascending), 0.5);
        const q1     = d3.quantile(errors.sort(d3.ascending), 0.25);
        const q3     = d3.quantile(errors.sort(d3.ascending), 0.75);

        // IQR box
        g.append("rect")
            .attr("x", cx - 4)
            .attr("y", yScaleD(q3))
            .attr("width", 8)
            .attr("height", yScaleD(q1) - yScaleD(q3))
            .attr("fill", "#1a1a1a")
            .attr("fill-opacity", 0.15)
            .attr("stroke", "#1a1a1a")
            .attr("stroke-width", 0.8);

        // Median dot
        g.append("circle")
            .attr("cx", cx)
            .attr("cy", yScaleD(median))
            .attr("r", 3)
            .attr("fill", "#1a1a1a")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1);
    });
}


/*--------------------------------------------------------------*/
/* Section 5 – Tooltip                                          */
/*--------------------------------------------------------------*/

function addTooltipD(innerG, data) {
    const tooltip = d3.select("body")
        .append("div")
        .attr("id", "tooltipD")
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

    // Invisible overlay rects for hover detection
    ctxD.REGION_ORDER.forEach(region => {
        const regionData = data.filter(d => d.region_name === region);
        const errors     = regionData.map(d => d.error_rf).sort(d3.ascending);
        const median     = d3.quantile(errors, 0.5);
        const q1         = d3.quantile(errors, 0.25);
        const q3         = d3.quantile(errors, 0.75);
        const meanMape   = d3.mean(regionData, d => d.ape_rf);
        const innerH     = ctxD.CHART_HEIGHT - ctxD.MARGIN.top - ctxD.MARGIN.bottom;

        innerG.append("rect")
            .attr("x", xScaleD(region))
            .attr("y", 0)
            .attr("width", xScaleD.bandwidth())
            .attr("height", innerH)
            .attr("fill", "transparent")
            .on("mouseover", function(event) {
            // Correctly mute other violins by comparing the 'data-region' attribute
            innerG.selectAll(".violin-g")
            .attr("opacity", function() {
                return d3.select(this).attr("data-region") === region ? 1 : 0.1;
            });

        tooltip.style("opacity", 1)
        .html(`
            <div style="border-bottom: 1px solid #444; margin-bottom: 5px; padding-bottom: 3px;">
                <strong>${region}</strong>
            </div>
            Mean MAPE: ${(meanMape * 100).toFixed(1)}%<br>
            Median error: ${median.toFixed(2)} kWh/cap<br>
            IQR: ${q1.toFixed(2)} → ${q3.toFixed(2)}<br>
            <span style="color: #888">n = ${regionData.length}</span>
        `);
})
            .on("mousemove", function(event) {
                tooltip
                    .style("left", (event.pageX + 14) + "px")
                    .style("top",  (event.pageY - 28) + "px");
            })
            .on("mouseleave", function() {
                innerG.selectAll(".violin-g").attr("opacity", 1);
                tooltip.style("opacity", 0);
            });
    });
}


/*--------------------------------------------------------------*/
/* Section 6 – Annotation: overestimate / underestimate labels  */
/*--------------------------------------------------------------*/

function drawAnnotationsD(innerG, innerW, innerH) {
    // "Overestimates" label (negative error = model predicted too high)
    innerG.append("text")
        .attr("x", innerW - 4)
        .attr("y", yScaleD(-1.5))
        .attr("text-anchor", "end")
        .style("font-family", "Courier New, monospace")
        .style("font-size", "9px")
        .style("fill", "#c0392b")
        .text("model overestimates ▼");

    // "Underestimates" label
    innerG.append("text")
        .attr("x", innerW - 4)
        .attr("y", yScaleD(1.5))
        .attr("text-anchor", "end")
        .style("font-family", "Courier New, monospace")
        .style("font-size", "9px")
        .style("fill", "#27ae60")
        .text("model underestimates ▲");
}


/*--------------------------------------------------------------*/
/* Data loading                                                  */
/*--------------------------------------------------------------*/

function loadDataD() {
    d3.json(ctxD.DATA_PATH).then(function(data) {
        console.log(`Violin data loaded: ${data.length} points`);
        allDataD = data;

        const container = d3.select("#vizD");
        container.style("min-height", null).style("display", null)
                 .style("align-items", null).style("justify-content", null)
                 .style("border", null).style("color", null);

        svgD = container.append("svg")
            .attr("viewBox", `0 0 ${ctxD.CHART_WIDTH} ${ctxD.CHART_HEIGHT}`)
            .attr("width", "100%");

        const { innerW, innerH, meanByRegion } = initScalesD(data);

        innerGD = svgD.append("g")
            .attr("id", "innerGD")
            .attr("transform", `translate(${ctxD.MARGIN.left},${ctxD.MARGIN.top})`);

        // Section 2 — axes
        drawAxesD(innerGD, innerW, innerH);

        // Section 4 — violins
        drawViolins(innerGD, data, meanByRegion);

        // Section 6 — annotations
        drawAnnotationsD(innerGD, innerW, innerH);

        // Section 5 — tooltip LAST (so overlay rects are on top)
        addTooltipD(innerGD, data);

    }).catch(error => console.error("Violin data error:", error));
}


/*--------------------------------------------------------------*/
/* Entry point                                                   */
/*--------------------------------------------------------------*/

function createVizD() {
    console.log("Viz D — Error distribution violin plot");
    loadDataD();
}