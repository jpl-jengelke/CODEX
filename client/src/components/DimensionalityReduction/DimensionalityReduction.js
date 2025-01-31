import "./dimensionalityReductions.scss";

import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import Plot from "react-plotly.js";
import React, { useEffect, useState } from "react";
import Slider from "@material-ui/core/Slider";
import Typography from "@material-ui/core/Typography";

import { WindowCircularProgress, WindowError } from "../WindowHelpers/WindowCenter";
import { WindowLayout, ExpandingContainer, FixedContainer } from "../WindowHelpers/WindowLayout";
import { WindowXScroller } from "../WindowHelpers/WindowScroller";
import { useSelectedFeatureNames, useFilename, useNewFeature } from "../../hooks/DataHooks";
import { useWindowManager } from "../../hooks/WindowHooks";
import HelpButton from "../WindowHelpers/WindowHelp";
import SelectionLimiter from "../SelectionLimiter/SelectionLimiter";
import * as dimensionalityReductionTypes from "../../constants/dimensionalityReductionTypes";
import * as utils from "../../utils/utils";

/**
 * Create the dimensionality reduction window
 * @param state current state
 * @return tuple of (requests, runParams)
 */
async function createAllDrRequests(selectedFeatures, filename, selectionLimits) {
    selectedFeatures = selectedFeatures.toJS();

    // create all the requests
    let requests = dimensionalityReductionTypes.DIMENSIONALITY_REDUCTION_TYPES.map(dr => {
        return {
            name: dr,
            paramData: dimensionalityReductionTypes.DIMENSIONALITY_REDUCTION_PARAMS[dr].map(param =>
                Object.assign(param, {
                    subParams: param.subParams.map(subParam =>
                        Object.assign(subParam, {
                            value: selectedFeatures.length
                        })
                    )
                })
            )
        };
    })
        .map(drstate => createDrRequest(filename, selectedFeatures, drstate, selectionLimits))
        .map(request => {
            const { req, cancel } = utils.makeSimpleRequest(request);
            return { req, cancel, requestObj: request };
        });

    // wait on everything
    requests = await Promise.all(requests);

    return [requests, { selectedFeatures }];
}

// Creates a request object for a regression run that can be converted to JSON and sent to the server.
function createDrRequest(filename, selectedFeatures, drstate, selectionLimits) {
    return {
        routine: "algorithm",
        algorithmName: drstate.name,
        algorithmType: "dimensionality_reduction",
        dataFeatures: selectedFeatures,
        filename,
        identification: { id: "dev0" },
        parameters: { [drstate.paramData[0].name]: drstate.paramData[0].subParams[0].value }, // UGH! This is really hacky and should be fixed when we refactor all these algo functions.
        dataSelections:
            selectionLimits.filter === "include"
                ? [selectionLimits.selection.include.name]
                : selectionLimits.filter === "exclude"
                ? [selectionLimits.selection.exclude.name]
                : [],
        downsampled: false,
        excludeDataSelections: selectionLimits.filter === "exclude"
    };
}

// Utility to create a Plotly chart for each algorithm data return from the server.
// We show a loading progress indicator if the data hasn't arrived yet.
function makeDRPlot(algo, maxYRange, changeSliderVal, featureAdd) {
    if (!algo || !algo.data)
        return (
            <div className="chartLoading">
                <CircularProgress />
            </div>
        );

    const xVals = utils.range(1, algo.dataFeatures.length + 1);
    const chartOptions = {
        data: [
            {
                x: xVals,
                y: algo.data.explained_variance_ratio,
                type: "scatter",
                mode: "lines+markers",
                visible: true,
                marker: {
                    color: xVals.map(val => (val === algo.sliderVal ? "#F5173E" : "#3386E6")),
                    size: 6
                },
                hoverinfo: "text",
                text: algo.data.explained_variance_ratio.map(
                    (r, idx) => `Components: ${idx + 1} <br> Explained Variance: ${r}%`
                )
            }
        ],
        layout: {
            autosize: true,
            margin: { l: 60, r: 5, t: 0, b: 45 }, // Axis tick labels are drawn in the margin space
            hovermode: "closest", // Turning off hovermode seems to screw up click handling
            titlefont: { size: 5 },
            showlegend: false,
            xaxis: {
                automargin: true,
                title: "Number of Components"
            },
            yaxis: {
                title: "Cumulative Explained Percentage",
                automargin: true,
                range: [0, maxYRange + maxYRange * 0.05] // Add a 5% buffer so we can see the top of the chart (#204)
            }
        },
        config: {
            displaylogo: false,
            displayModeBar: false
        }
    };

    const id = Math.random()
        .toString(36)
        .substring(8);

    return (
        <React.Fragment>
            <div className="plot">
                <Plot
                    data={chartOptions.data}
                    layout={chartOptions.layout}
                    config={chartOptions.config}
                    style={{ width: "100%", height: "100%" }}
                    useResizeHandler
                    divId={id}
                    //onBeforeHover={e => console.log(e)}
                />
            </div>
            <Slider
                classes={{ root: "chartSlider" }}
                value={algo.sliderVal}
                min={1}
                max={algo.dataFeatures.length}
                step={1}
                onChange={(_, val) => {
                    //Plotly.Fx.hover(id, [{ curveNumber: 0, pointNumber: val - 1 }]);
                    changeSliderVal(algo.algorithmName, val);
                }}
            />
            <Button onClick={e => featureAdd(algo)} className="saveButton">
                Save as Feature
            </Button>
        </React.Fragment>
    );
}

function makeAlgoState(req) {
    // Separate the request object from the promise and cleanup functions
    const state = req.requestObj;
    state.sliderVal = 1;
    return state;
}

function DimensionalityReductionResults(props) {
    // Create state objects for each DR we're running so that we can keep track of them.
    const [algoStates, setAlgoStates] = useState(_ => props.requests.map(makeAlgoState));

    function changeSliderVal(algorithmName, val) {
        setAlgoStates(
            algoStates.map(algo =>
                algo.algorithmName === algorithmName ? { ...algo, sliderVal: val } : algo
            )
        );
    }

    useEffect(
        _ => {
            // As each request promise resolves with server data, update the state.
            props.requests.forEach(request => {
                request.req.then(data => {
                    setAlgoStates(
                        algoStates.map(algo =>
                            algo.algorithmName === data.algorithmName
                                ? Object.assign(algo, { data })
                                : algo
                        )
                    );
                    //update the redux feature state with the new data
                    //this is subject to change
                    //let featureName = data.algorithm;
                    //let featureData = data.data;
                    //props.featureAdd(featureName, featureData);
                });
            });

            // If the window is closed before the requests have all resolved, cancel all of them.
            return function cleanup() {
                props.requests.map(({ cancel }) => cancel());
            };
        },
        [props.requests]
    );

    // State getter and setter for the list of currently selected drs
    const [selectedAlgos, setSelectedAlgos] = useState([]);
    function toggleSelected(name) {
        setSelectedAlgos(
            selectedAlgos.includes(name)
                ? selectedAlgos.filter(algo => algo !== name)
                : selectedAlgos.concat([name])
        );
    }

    const maxYRange = Math.max(
        ...algoStates.reduce(
            (acc, algo) => (algo.data ? acc.concat(algo.data.explained_variance_ratio) : acc),
            []
        )
    );

    const [helpModeState, setHelpModeState] = useState(false);
    const algoVerb = "dimensionality_reduction";

    const algoGraphs = algoStates.map(algo => {
        const humanName = dimensionalityReductionTypes.HUMAN_NAMES[algo.algorithmName];
        return (
            <FixedContainer key={algo.algorithmName}>
                <div
                    className="regressionHeader"
                    onClick={() => toggleSelected(algo.algorithmName)}
                >
                    {humanName}
                </div>
                <div className="plotContainer">
                    {makeDRPlot(algo, maxYRange, changeSliderVal, props.featureAdd)}
                </div>
            </FixedContainer>
        );
    });

    return (
        <WindowLayout>
            <FixedContainer>
                <WindowLayout fluid direction="row" align="center">
                    <Typography variant="h6">Explain Variance with Fewer Features</Typography>
                    <ExpandingContainer />
                    <FixedContainer>
                        <HelpButton
                            title={"Dimensionality Reduction Help"}
                            guidancePath={`${algoVerb}_page:general_${algoVerb}`}
                        />
                    </FixedContainer>
                </WindowLayout>
            </FixedContainer>
            <FixedContainer>
                <WindowXScroller>
                    <WindowLayout fluid direction="row">
                        {algoGraphs}
                    </WindowLayout>
                </WindowXScroller>
            </FixedContainer>
        </WindowLayout>
    );
}

// the overhead of noodling with the dimred internals isn't worth it
// here be dragons
const DimensionalityReduction = props => {
    const win = useWindowManager(props, {
        title: "Dimensionality Reduction",
        width: 670,
        height: 520,
        resizeable: true,
        minSize: {
            width: 670,
            height: 520
        }
    });

    const [isResolved, setIsResolved] = useState(null);
    const [currentError, setCurrentError] = useState(null);
    const [selectedFeatures, setSelectedFeatures] = useSelectedFeatureNames();
    const filename = useFilename();
    const featureAdd = useNewFeature();
    const limitState = useState({ filter: null, selection: { include: null, exclude: null } });

    // wrap the request creation
    useEffect(() => {
        if (selectedFeatures.size < 2) {
            setCurrentError("Dimensionality reduction requires at least two selected features!");
            return;
        }
        createAllDrRequests(selectedFeatures, filename, limitState[0]).then(r => setIsResolved(r));
    }, [limitState[0]]);

    if (currentError !== null) {
        return <WindowError>{currentError}</WindowError>;
    } else if (isResolved === null) {
        return <WindowCircularProgress />;
    } else {
        const [requests, runParams] = isResolved; // hackish but works A-OK
        const getVectorFromSlider = a => a.data.data.map(r => r[a.sliderVal - 1]);

        return (
            <React.Fragment>
                <DimensionalityReductionResults
                    requests={requests}
                    runParams={runParams}
                    featureAdd={a => {
                        featureAdd(
                            `${a.data.algorithm}_${selectedFeatures.join("_")}/${a.sliderVal}`,
                            getVectorFromSlider(a)
                        );
                    }}
                />
            </React.Fragment>
        );
    }
};

export default DimensionalityReduction;
