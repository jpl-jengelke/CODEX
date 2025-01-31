import "./SelectionGroupInfo.scss";

import { Close } from "@material-ui/icons";
import { IconButton } from "@material-ui/core";
import React from "react";

import { useSelectionGroups } from "../../hooks/DataHooks";

function SelectionGroupInfo(props) {
    const [groups] = useSelectionGroups();

    const selectionGroup = groups.find(group => group.id === props.groupID);
    if (!selectionGroup) return null;

    return (
        <div className="selectionGroupWindowContainer">
            <div className="selectionGroupInfoHeader">
                <div className="selectionGroupInfoTitle">Selection Group Information</div>
                <IconButton className="close-button-icon" onClick={props.handleClose}>
                    <Close className="close-button" />
                </IconButton>
            </div>
            <div className="field">
                <label className="fieldLabel">Name</label>
                <div className="fieldValue">{selectionGroup.name}</div>
            </div>
            {selectionGroup.info
                ? Object.entries(selectionGroup.info).map(([key, value]) => {
                      if (typeof value === "object" && !Array.isArray(value)) {
                          return (
                              <div className="field" key={value.name}>
                                  <label className="fieldLabel">{value.name}</label>
                                  <div className="fieldValue">{value.value}</div>
                              </div>
                          );
                      }

                      const values = typeof value === "string" ? [value] : value;
                      return (
                          <div className="field" key={key}>
                              <label className="fieldLabel">{key.replace("_", " ")}</label>
                              {values.map(val => (
                                  <div className="fieldValue" key={val}>
                                      {val}
                                  </div>
                              ))}
                          </div>
                      );
                  })
                : null}
        </div>
    );
}

export default SelectionGroupInfo;
