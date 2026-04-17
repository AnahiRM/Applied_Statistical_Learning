/*--------------------------------------------------------------*/
/* Configuration                                                */
/*--------------------------------------------------------------*/

const ctx = {
    MAP_WIDTH:  620,
    MAP_HEIGHT: 540,
    GEOJSON_URL: "https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions.geojson",
    DATA_PATH: "../data/region_metrics.json",
    COLOR_LOW:  "#d4e8c2",   // low MAPE  → green
    COLOR_HIGH: "#7B2D2D",   // high MAPE → dark red
};

// Global state
let colorScale;
let ranked;    // regions sorted by MAPE descending
let metrics;   // raw JSON keyed by region name


/*--------------------------------------------------------------*/
/* Section 1 – Color scale + legend                            */
/*--------------------------------------------------------------*/

function initColorScale(metricsData) {
    const mapeValues = Object.values(metricsData).map(d => d.mean_mape);
    const mapeMin    = d3.min(mapeValues);
    const mapeMax    = d3.max(mapeValues);

    colorScale = d3.scaleSequential()
        .domain([mapeMin, mapeMax])
        .interpolator(d3.interpolate(ctx.COLOR_LOW, ctx.COLOR_HIGH));

    // Build ranked list for the info panel bar chart
    ranked = Object.entries(metricsData)
        .sort((a, b) => b[1].mean_mape - a[1].mean_mape)
        .map(([name, d]) => ({ name, mape: d.mean_mape }));

    // Draw legend canvas
    const canvas  = document.getElementById("legendCanvas");
    const ctx2d   = canvas.getContext("2d");
    const w       = canvas.offsetWidth  * (window.devicePixelRatio || 1) || 400;
    const h       = 8  * (window.devicePixelRatio || 1);
    canvas.width  = w;
    canvas.height = h;

    const grad = ctx2d.createLinearGradient(0, 0, w, 0);
    for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        grad.addColorStop(t, colorScale(mapeMin + t * (mapeMax - mapeMin)));
    }
    ctx2d.fillStyle = grad;
    ctx2d.fillRect(0, 0, w, h);

    document.getElementById("legendMin").textContent = (mapeMin * 100).toFixed(1) + "%";
    document.getElementById("legendMax").textContent = (mapeMax * 100).toFixed(1) + "%";
}


/*--------------------------------------------------------------*/
/* Section 2 – Draw choropleth map                             */
/*--------------------------------------------------------------*/

function drawMap(geojson) {
    const mapDiv = document.getElementById("mapPanel");

    const svg = d3.select("#mapPanel")
        .insert("svg", "#legendWrap")   // insert before the legend div
        .attr("viewBox", `0 0 ${ctx.MAP_WIDTH} ${ctx.MAP_HEIGHT}`)
        .attr("width", "100%");

    const projection = d3.geoConicConformal()
        .center([2.454071, 46.279229])
        .scale(ctx.MAP_WIDTH * 3.5)
        .translate([ctx.MAP_WIDTH / 2, ctx.MAP_HEIGHT / 2]);

    const path = d3.geoPath().projection(projection);

    svg.selectAll("path.region-path")
        .data(geojson.features)
        .enter()
        .append("path")
        .attr("class", "region-path")
        .attr("d", path)
        .attr("fill", d => {
            const m = metrics[d.properties.nom];
            return m ? colorScale(m.mean_mape) : "#ccc";
        })
        // Section 3: hover interactions
        .on("mouseenter", function (event, d) {
            const name = d.properties.nom;
            if (!metrics[name]) return;

            // Highlight hovered region, mute others
            svg.selectAll(".region-path")
                .classed("muted",  dd => dd.properties.nom !== name)
                .classed("active", dd => dd.properties.nom === name);

            updateInfoPanel(name);
        })
        .on("mouseleave", function () {
            svg.selectAll(".region-path")
                .classed("muted",  false)
                .classed("active", false);
        });
}


/*--------------------------------------------------------------*/
/* Section 3 – Info panel update on hover                      */
/*--------------------------------------------------------------*/

function updateInfoPanel(name) {
    const d = metrics[name];
    if (!d) return;

    // Show card, hide placeholder
    document.getElementById("infoDefault").style.display = "none";
    document.getElementById("infoCard").classList.add("visible");

    // Header
    document.getElementById("cardRegion").textContent = name;
    document.getElementById("cardMape").textContent   = (d.mean_mape * 100).toFixed(1) + "%";

    // Metrics
    document.getElementById("cardMae").textContent      = d.mean_mae.toFixed(2)       + " kWh/cap";
    document.getElementById("cardPred").textContent     = d.mean_predicted.toFixed(1)  + " kWh/cap";
    document.getElementById("cardTrue").textContent     = d.mean_true.toFixed(1)        + " kWh/cap";
    document.getElementById("cardDensity").textContent  = d.density.toFixed(0)          + " /km²";
    document.getElementById("cardN").textContent        = "n = " + d.n_obs;

    // Bias with direction colour
    const biasEl   = document.getElementById("cardBias");
    const biasSign = d.mean_bias >= 0 ? "+" : "";
    const direction = d.mean_bias > 0.05  ? "↑ underestimate" :
                  d.mean_bias < -0.05 ? "↓ overestimate"  :
                                         "≈ ";
    biasEl.textContent = biasSign + d.mean_bias.toFixed(3) + " kWh/cap  " + direction;
    biasEl.className   = "metric-value " +
        (d.mean_bias >  0.05 ? "bias-pos" :
         d.mean_bias < -0.05 ? "bias-neg" : "");

    // Ranking bar chart
    drawRankChart(name);
}


/*--------------------------------------------------------------*/
/* Section 4 – Ranking bar chart inside the info panel         */
/*--------------------------------------------------------------*/

function drawRankChart(activeName) {
    const wrap = document.getElementById("rankWrap");
    wrap.innerHTML = '<div class="rank-title">MAPE ranking — all regions</div>';

    const mapeValues = ranked.map(r => r.mape);
    const mapeMin    = d3.min(mapeValues);
    const mapeMax    = d3.max(mapeValues);

    ranked.forEach(r => {
        const isCurrent = r.name === activeName;
        const pct = ((r.mape - mapeMin) / (mapeMax - mapeMin) * 100).toFixed(0);

        const item = document.createElement("div");
        item.className = "rank-item" + (isCurrent ? " current" : "");

        item.innerHTML = `
            <span class="rank-dot"  style="background:${colorScale(r.mape)}"></span>
            <span class="rank-name">${r.name}</span>
            <div  class="rank-bar-bg">
                <div class="rank-bar-fill"
                     style="width:${pct}%;background:${colorScale(r.mape)}">
                </div>
            </div>
            <span class="rank-val">${(r.mape * 100).toFixed(1)}%</span>
        `;
        wrap.appendChild(item);
    });
}


/*--------------------------------------------------------------*/
/* Data loading                                                  */
/*--------------------------------------------------------------*/

function loadData() {
    Promise.all([
        d3.json(ctx.GEOJSON_URL),
        d3.json(ctx.DATA_PATH)
    ]).then(function ([geojson, metricsData]) {
        console.log("GeoJSON features:", geojson.features.length);
        console.log("Regions in metrics:", Object.keys(metricsData).length);

        metrics = metricsData;

        // Section 1 – color scale + legend
        initColorScale(metrics);

        // Section 2 – draw the map
        drawMap(geojson);

    }).catch(error => console.error("Data loading error:", error));
}


/*--------------------------------------------------------------*/
/* Entry point                                                   */
/*--------------------------------------------------------------*/

function createViz() {
    console.log("Using D3 v" + d3.version);
    loadData();
}