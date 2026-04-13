/*--------------------------------------------------------------*/
/* Configuration                                                */
/*--------------------------------------------------------------*/

const ctxANOVA = {
    DATA_PATH:  "../data/anova_results.json",
    COLOR_LOW:  "#d4e8c2",
    COLOR_HIGH: "#7B2D2D",
};


/*--------------------------------------------------------------*/
/* Section 1 – Summary stat cards                               */
/*--------------------------------------------------------------*/

function drawAnovaSummary(container, data) {
    const stats = [
        { value: `F = ${data.f_stat.toFixed(3)}`, label: "F-statistic (one-way ANOVA)" },
        { value: "p = 2.36 × 10⁻¹⁸",             label: "p-value — highly significant" },
        { value: "52%",                            label: "Gap best vs worst region" },
        { value: "6,348",                          label: "Total test observations" },
    ];

    const row = container.append("div")
        .attr("id", "anovaSummaryRow")
        .style("display", "flex")
        .style("gap", "1rem")
        .style("flex-wrap", "wrap")
        .style("margin-bottom", "1.25rem");

    stats.forEach((s, i) => {
        const card = row.append("div")
            .style("background", "#eeeae0")
            .style("border-radius", "4px")
            .style("padding", "0.75rem 1.25rem");

        card.append("div")
            .style("font-family", "Courier New, monospace")
            .style("font-size", "1.15rem")
            .style("color", i === 1 ? "#27ae60" : "#1a1a1a")
            .html(s.value);

        card.append("div")
            .style("font-family", "Courier New, monospace")
            .style("font-size", "10px")
            .style("text-transform", "uppercase")
            .style("letter-spacing", "0.08em")
            .style("color", "#888")
            .style("margin-top", "2px")
            .text(s.label);
    });
}


/*--------------------------------------------------------------*/
/* Section 2 – Color scale                                      */
/*--------------------------------------------------------------*/

function makeAnovaColorScale(regions) {
    const means = regions.map(d => d.mean);
    return d3.scaleSequential()
        .domain([d3.min(means), d3.max(means)])
        .interpolator(d3.interpolate(ctxANOVA.COLOR_LOW, ctxANOVA.COLOR_HIGH));
}


/*--------------------------------------------------------------*/
/* Section 3 – Table rows                                       */
/*--------------------------------------------------------------*/

function drawAnovaTable(container, regions, colorScale) {
    const minMean = d3.min(regions, d => d.mean);
    const maxMean = d3.max(regions, d => d.mean);

    const tableWrap = container.append("div")
        .style("overflow-x", "auto");

    const table = tableWrap.append("table")
        .style("width", "100%")
        .style("border-collapse", "collapse")
        .style("font-size", "12px")
        .style("table-layout", "fixed");

    // Header
    const headers = ["#", "Region", "Mean MAPE ↓", "Std dev", "n", "Range"];
    const widths  = ["32px", "34%", "28%", "10%", "8%", "14%"];

    const thead = table.append("thead").append("tr");
    headers.forEach((h, i) => {
        thead.append("th")
            .style("font-family", "Courier New, monospace")
            .style("font-size", "10px")
            .style("text-transform", "uppercase")
            .style("letter-spacing", "0.06em")
            .style("color", "#888")
            .style("padding", "8px 10px")
            .style("text-align", i >= 2 ? "right" : "left")
            .style("border-bottom", "0.5px solid #ccc")
            .style("font-weight", "500")
            .style("width", widths[i])
            .text(h);
    });

    // Body
    const tbody = table.append("tbody");

    regions.forEach((d, i) => {
        const isWorst = i === 0;
        const isBest  = i === regions.length - 1;
        const pct     = ((d.mean - minMean) / (maxMean - minMean) * 100).toFixed(0);
        const color   = colorScale(d.mean);

        const tr = tbody.append("tr");

        // Rank
        tr.append("td")
            .style("padding", "8px 10px")
            .style("border-bottom", "0.5px solid #eee")
            .style("font-family", "Courier New, monospace")
            .style("font-size", "10px")
            .style("color", "#bbb")
            .text(i + 1);

        // Region name
        tr.append("td")
            .style("padding", "8px 10px")
            .style("border-bottom", "0.5px solid #eee")
            .style("font-size", "12px")
            .style("font-weight", (isWorst || isBest) ? "bold" : "normal")
            .style("color", "#1a1a1a")
            .text(d.name + (isWorst ? " ▲" : isBest ? " ▼" : ""));

        // MAPE bar
        const barTd = tr.append("td")
            .style("padding", "8px 10px")
            .style("border-bottom", "0.5px solid #eee");

        const barWrap = barTd.append("div")
            .style("display", "flex")
            .style("align-items", "center")
            .style("gap", "6px");

        const barBg = barWrap.append("div")
            .style("flex", "1")
            .style("height", "5px")
            .style("background", "#eee")
            .style("border-radius", "3px")
            .style("overflow", "hidden");

        barBg.append("div")
            .style("width", pct + "%")
            .style("height", "100%")
            .style("background", color)
            .style("border-radius", "3px");

        barWrap.append("span")
            .style("font-family", "Courier New, monospace")
            .style("font-size", "11px")
            .style("color", "#555")
            .style("width", "38px")
            .style("text-align", "right")
            .text((d.mean * 100).toFixed(1) + "%");

        // Std dev
        tr.append("td")
            .style("padding", "8px 10px")
            .style("border-bottom", "0.5px solid #eee")
            .style("font-family", "Courier New, monospace")
            .style("font-size", "11px")
            .style("color", "#888")
            .style("text-align", "right")
            .text((d.std * 100).toFixed(1) + "%");

        // n
        tr.append("td")
            .style("padding", "8px 10px")
            .style("border-bottom", "0.5px solid #eee")
            .style("font-family", "Courier New, monospace")
            .style("font-size", "11px")
            .style("color", "#888")
            .style("text-align", "right")
            .text(d.n);

        // Range
        tr.append("td")
            .style("padding", "8px 10px")
            .style("border-bottom", "0.5px solid #eee")
            .style("font-family", "Courier New, monospace")
            .style("font-size", "11px")
            .style("color", "#888")
            .style("text-align", "right")
            .text((d.min * 100).toFixed(1) + "–" + (d.max * 100).toFixed(1) + "%");
    });

    // Footer note
    container.append("div")
        .style("margin-top", "10px")
        .style("font-family", "Courier New, monospace")
        .style("font-size", "10px")
        .style("color", "#bbb")
        .text("ANOVA H₀: mean MAPE is equal across all regions. p < 0.001 → reject H₀. Evaluated on held-out test set.");
}


/*--------------------------------------------------------------*/
/* Data loading                                                  */
/*--------------------------------------------------------------*/

function loadDataANOVA() {
    d3.json(ctxANOVA.DATA_PATH).then(function(data) {
        console.log("ANOVA data loaded:", data.regions.length, "regions");

        const container = d3.select("#vizANOVA");

        // Section 1 — summary cards
        drawAnovaSummary(container, data);

        // Section 2 — color scale
        const colorScale = makeAnovaColorScale(data.regions);

        // Section 3 — table
        drawAnovaTable(container, data.regions, colorScale);

    }).catch(error => console.error("ANOVA data error:", error));
}


/*--------------------------------------------------------------*/
/* Entry point                                                   */
/*--------------------------------------------------------------*/

function createVizANOVA() {
    console.log("Viz ANOVA — regional error table");
    loadDataANOVA();
}