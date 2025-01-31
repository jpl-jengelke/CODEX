import "./algorithmStyles.scss";

import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import Button from "@material-ui/core/Button";
import Close from "@material-ui/icons/Close";
import HelpOutline from "@material-ui/icons/HelpOutline";
import IconButton from "@material-ui/core/IconButton";
import React, { useState } from "react";

import classnames from "classnames";

import AlgorithmHelpContent from "./AlgorithmHelpContent";
import SubalgoChart from "./SubalgoChart";
import SubalgoOutputParams from "./SubalgoOutputParams";
import SubalgoParams from "./SubalgoParams";
import * as algorithmActions from "../../actions/algorithmActions";
import * as algorithmTypes from "../../constants/algorithmTypes";

function handleRunAlgorithm(props) {
    // todo: re-enable when we need this
    //if (!props.subalgoState.serverData.eta) return; // Don't run the algorithm until we have a time estimate from the server
    props.runAlgorithm(props.subalgoState, props.selectedFeatures, props.winId, props.limitState);
}

function getTitle(props, helpModeState) {
    switch (props.subalgoState.editMode) {
        case algorithmTypes.SUBALGO_MODE_EDIT_PARAMS:
            return helpModeState.active
                ? `Help: ${props.subalgoState.humanName}`
                : "Choose Algorithm Parameters";
        case algorithmTypes.SUBALGO_MODE_EDIT_OUTPUTS:
            return helpModeState.active
                ? `Help : ${props.subalgoState.humanName}`
                : "Choose Clustering Parameters";
    }
}

function getActionButtons(props) {
    switch (props.subalgoState.editMode) {
        case algorithmTypes.SUBALGO_MODE_EDIT_PARAMS:
            return (
                <React.Fragment>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={_ =>
                            props.paramDispatch({
                                type: "changeEditMode",
                                name: props.subalgoState.name
                            })
                        }
                    >
                        Back
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={_ =>
                            props.paramDispatch({
                                type: "changeEditMode",
                                name: props.subalgoState.name,
                                editMode: algorithmTypes.SUBALGO_MODE_EDIT_OUTPUTS
                            })
                        }
                    >
                        Next
                    </Button>
                </React.Fragment>
            );
        case algorithmTypes.SUBALGO_MODE_EDIT_OUTPUTS:
            return (
                <React.Fragment>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={_ =>
                            props.paramDispatch({
                                type: "changeEditMode",
                                name: props.subalgoState.name,
                                editMode: algorithmTypes.SUBALGO_MODE_EDIT_PARAMS
                            })
                        }
                    >
                        Back
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={_ => handleRunAlgorithm(props)}
                    >
                        Run
                    </Button>
                </React.Fragment>
            );
    }
}

function getBreadcrumbs(props) {
    return (
        <React.Fragment>
            <a
                href="#"
                onClick={_ =>
                    props.paramDispatch({
                        type: "changeEditMode",
                        name: props.subalgoState.name,
                        editMode: null
                    })
                }
            >
                Choose Algorithm
            </a>
            <span>-></span>
            <a
                href="#"
                onClick={_ =>
                    props.paramDispatch({
                        type: "changeEditMode",
                        name: props.subalgoState.name,
                        editMode: algorithmTypes.SUBALGO_MODE_EDIT_PARAMS
                    })
                }
            >
                Edit Parameters
            </a>
            <span>-></span>
            <a
                href="#"
                onClick={_ =>
                    props.paramDispatch({
                        type: "changeEditMode",
                        name: props.subalgoState.name,
                        editMode: algorithmTypes.SUBALGO_MODE_EDIT_OUTPUTS
                    })
                }
                className={classnames({
                    "next-step":
                        props.subalgoState.editMode !== algorithmTypes.SUBALGO_MODE_EDIT_OUTPUTS
                })}
            >
                Outputs
            </a>
            <span>-></span>
            <a href="#" onClick={_ => handleRunAlgorithm(props)} className="next-step">
                Run
            </a>
        </React.Fragment>
    );
}

function SubalgoEdit(props) {
    const [helpModeState, setHelpModeState] = useState(false);

    return (
        <React.Fragment>
            <div className="subalgo-edit-header">
                <div className="title">
                    {getTitle(props, helpModeState)}
                    <div className="breadcrumbs">{getBreadcrumbs(props)}</div>
                </div>
                <div>
                    <IconButton onClick={_ => setHelpModeState(state => !state)}>
                        {helpModeState ? <Close /> : <HelpOutline />}
                    </IconButton>
                </div>
            </div>
            <div className="subalgo-detail">
                <div className="params">
                    <SubalgoParams
                        hidden={
                            props.subalgoState.editMode !== algorithmTypes.SUBALGO_MODE_EDIT_PARAMS
                        }
                        subalgoState={props.subalgoState}
                        algo={props.algo}
                        paramDispatch={props.paramDispatch}
                        selectedFeatures={props.selectedFeatures}
                        filename={props.filename}
                        limitState={props.limitState}
                    />
                    <SubalgoOutputParams
                        hidden={
                            props.subalgoState.editMode !== algorithmTypes.SUBALGO_MODE_EDIT_OUTPUTS
                        }
                        paramDispatch={props.paramDispatch}
                        subalgoState={props.subalgoState}
                        selectedFeatures={props.selectedFeatures}
                    />
                </div>
                <AlgorithmHelpContent
                    hidden={!helpModeState}
                    guidancePath={`${props.baseGuidancePath}:${props.subalgoState.name}`}
                />
                <div className="preview">
                    <SubalgoChart
                        key={props.subalgoState.name}
                        name={props.subalgoState.name}
                        humanName={props.subalgoState.humanName}
                        serverData={props.subalgoState.serverData}
                        loaded={props.subalgoState.loaded}
                        xAxisLabel="Principal Component 1 (PC1)"
                        yAxisLabel="Principal Component 2 (PC2)"
                        previewMode
                    />
                    <div className="action-buttons">{getActionButtons(props)}</div>
                </div>
            </div>
        </React.Fragment>
    );
}

function mapDispatchToProps(dispatch) {
    return {
        runAlgorithm: bindActionCreators(algorithmActions.runAlgorithm, dispatch)
    };
}

export default connect(
    null,
    mapDispatchToProps
)(SubalgoEdit);
