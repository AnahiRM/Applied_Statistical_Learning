/*--------------------------------------------------------------*/
/* Configuration                                                */
/*--------------------------------------------------------------*/

const ctxD = {
    CHART_WIDTH: 900,
    CHART_HEIGHT: 520,
    MARGIN: { top: 40, right: 30, bottom: 100, left: 70 },
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
    COLOR_LOW: "#d4e8c2",
    COLOR_HIGH: "#7B2D2D",
    DOT_RADIUS: 3,
    NUM_QUANTILES: 20, // Each dot represents a 5% probability
};

let svgD, innerGD, xScaleD, yScaleD, colorScaleD;

/*--------------------------------------------------------------*/
/* Section 1 – Scales                                           */
/*--------------------------------------------------------------*/

function initScalesD(data) {
    const innerW = ctxD.CHART_WIDTH - ctxD.MARGIN.left - ctxD.MARGIN.right;
    const innerH = ctxD.CHART_HEIGHT - ctxD.MARGIN.top - ctxD.MARGIN.bottom;

    xScaleD = d3.scaleBand()
        .domain(ctxD.REGION_ORDER)
        .range([0, innerW])
        .padding(0.2);

    const absMax = Math.max(
        Math.abs(d3.min(data, d => d.error_rf)),
        Math.abs(d3.max(data, d => d.error_rf))
    );

    yScaleD = d3.scaleLinear()
        .domain([-absMax * 1.1, absMax * 1.1])
        .range([innerH, 0]);

    const meanByRegion = d3.rollup(data, v => d3.mean(v, d => d.ape_rf), d => d.region_name);
    
    colorScaleD = d3.scaleSequential()
        .domain([d3.min(meanByRegion.values()), d3.max(meanByRegion.values())])
        .interpolator(d3.interpolate(ctxD.COLOR_LOW, ctxD.COLOR_HIGH));

    return { innerW, innerH, meanByRegion };
}

/*--------------------------------------------------------------*/
/* Section 2 – Axes                                             */
/*--------------------------------------------------------------*/

function drawAxesD(innerG, innerW, innerH) {
    // Zero line
    innerG.append("line")
        .attr("x1", 0).attr("x2", innerW)
        .attr("y1", yScaleD(0)).attr("y2", yScaleD(0))
        .style("stroke", "#1a1a1a")
        .style("stroke-width", 1)
        .style("stroke-dasharray", "4,3");

    // Y Axis
    innerG.append("g")
        .call(d3.axisLeft(yScaleD).ticks(8))
        .selectAll("text")
        .style("font-family", "Courier New, monospace")
        .style("font-size", "10px");

    // X Axis Labels
    innerG.append("g")
        .attr("transform", `translate(0,${innerH})`)
        .call(d3.axisBottom(xScaleD).tickSize(0))
        .selectAll("text")
        .style("font-family", "Courier New, monospace")
        .style("font-size", "9px")
        .attr("transform", "rotate(-35)")
        .attr("text-anchor", "end")
        .attr("dx", "-0.4em")
        .attr("dy", "0.6em");
}

/*--------------------------------------------------------------*/
/* Section 3 – Quantile Dotplot & Boxplot                       */
/*--------------------------------------------------------------*/

function drawDotplots(innerG, data, meanByRegion) {
    const jitterWidth = 40; // How far to scatter points horizontally

    ctxD.REGION_ORDER.forEach(region => {
        const regionData = data.filter(d => d.region_name === region);
        const errors = regionData.map(d => d.error_rf).sort(d3.ascending);
        const cx = xScaleD(region) + xScaleD.bandwidth() / 2;
        
        const fillColor = colorScaleD(d3.mean(regionData, d => d.ape_rf));

        const g = innerG.append("g")
            .attr("class", "region-group")
            .attr("data-region", region);

        // 1. DRAW ALL RAW POINTS (The "Jitter")
        g.selectAll("circle.raw-point")
            .data(regionData)
            .enter()
            .append("circle")
            .attr("class", "raw-point")
            .attr("r", 1.5) 
            .attr("cx", () => cx + (Math.random() - 0.5) * jitterWidth)
            .attr("cy", d => yScaleD(d.error_rf))
            .attr("fill", fillColor)
            .attr("opacity", 0.3); 

        // 2. DRAW BOXPLOT (Summary Statistics)
        const q1 = d3.quantile(errors, 0.25);
        const median = d3.quantile(errors, 0.5);
        const q3 = d3.quantile(errors, 0.75);
        const min = d3.min(errors);
        const max = d3.max(errors);

        // Vertical line (Whiskers)
        g.append("line")
            .attr("x1", cx).attr("x2", cx)
            .attr("y1", yScaleD(min)).attr("y2", yScaleD(max))
            .attr("stroke", "#000")
            .attr("stroke-width", 1);

        // IQR Box - Width set to jitterWidth to match data area
        g.append("rect")
            .attr("x", cx - jitterWidth / 2)
            .attr("y", yScaleD(q3))
            .attr("width", jitterWidth)
            .attr("height", yScaleD(q1) - yScaleD(q3))
            .attr("fill", "white") 
            .attr("fill-opacity", 0.6) // Lower opacity slightly so jitter density is visible behind it
            .attr("stroke", "#000");

        // Median Line - Length matches the box width
        g.append("line")
            .attr("x1", cx - jitterWidth / 2)
            .attr("x2", cx + jitterWidth / 2)
            .attr("y1", yScaleD(median)).attr("y2", yScaleD(median))
            .attr("stroke", "red")
            .attr("stroke-width", 2);
    });
}

/*--------------------------------------------------------------*/
/* Section 4 – Tooltip                                          */
/*--------------------------------------------------------------*/

function addTooltipD(innerG, data) {
    const tooltip = d3.select("body").append("div")
        .attr("id", "tooltipD")
        .style("position", "absolute")
        .style("background", "#1a1a1a")
        .style("color", "#fff")
        .style("padding", "10px")
        .style("border-radius", "4px")
        .style("font-family", "Courier New, monospace")
        .style("font-size", "11px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("z-index", 100);

    ctxD.REGION_ORDER.forEach(region => {
        const regionData = data.filter(d => d.region_name === region);
        const errors = regionData.map(d => d.error_rf).sort(d3.ascending);
        const meanMape = d3.mean(regionData, d => d.ape_rf);

        innerG.append("rect")
            .attr("x", xScaleD(region))
            .attr("y", 0)
            .attr("width", xScaleD.bandwidth())
            .attr("height", ctxD.CHART_HEIGHT)
            .attr("fill", "transparent")
            .on("mouseover", function(event) {
                innerG.selectAll(".region-group")
                    .attr("opacity", function() {
                        return d3.select(this).attr("data-region") === region ? 1 : 0.15;
                    });

                tooltip.style("opacity", 1)
                    .html(`
                        <strong>${region}</strong><br>
                        Mean MAPE: ${(meanMape * 100).toFixed(1)}%<br>
                        Median Error: ${d3.quantile(errors, 0.5).toFixed(2)} kWh/cap<br>
                        n = ${regionData.length} dots
                    `);
            })
            .on("mousemove", (event) => {
                tooltip.style("left", (event.pageX + 15) + "px")
                       .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseleave", () => {
                innerG.selectAll(".region-group").attr("opacity", 1);
                tooltip.style("opacity", 0);
            });
    });
}

/*--------------------------------------------------------------*/
/* Execution                                                    */
/*--------------------------------------------------------------*/

function loadDataD() {
    d3.json(ctxD.DATA_PATH).then(data => {
        const container = d3.select("#vizD");
        svgD = container.append("svg")
            .attr("viewBox", `0 0 ${ctxD.CHART_WIDTH} ${ctxD.CHART_HEIGHT}`)
            .attr("width", "100%");

        const { innerW, innerH, meanByRegion } = initScalesD(data);

        innerGD = svgD.append("g")
            .attr("transform", `translate(${ctxD.MARGIN.left},${ctxD.MARGIN.top})`);

        drawAxesD(innerGD, innerW, innerH);
        drawDotplots(innerGD, data, meanByRegion);
        addTooltipD(innerGD, data);
    });
}

function createVizD() {
    loadDataD();
}