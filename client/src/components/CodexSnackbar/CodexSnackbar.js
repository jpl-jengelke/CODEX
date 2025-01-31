import "./CodexSnackbar.scss";

import CloseIcon from "@material-ui/icons/Close";
import IconButton from "@material-ui/core/IconButton";
import React from "react";
import Snackbar from "@material-ui/core/Snackbar";

import { useSnackbarState } from "../../hooks/UIHooks";

function formatMessage(message) {
    if (!message) return "";
    return (typeof message === "string" ? [message] : message).map(message => (
        <span key={message}>{message}</span>
    ));
}

function CodexSnackbar(props) {
    const [snackbarState, closeSnackbar] = useSnackbarState();

    return (
        <Snackbar
            anchorOrigin={{
                vertical: "bottom",
                horizontal: "left"
            }}
            open={snackbarState.get("visible")}
            onClose={closeSnackbar}
            autoHideDuration={6000}
            ContentProps={{
                "aria-describedby": "message-id"
            }}
            message={
                <div className="snackbarMessage">{formatMessage(snackbarState.get("message"))}</div>
            }
            action={[
                <IconButton key="close" aria-label="close" color="inherit">
                    <CloseIcon onClick={closeSnackbar} />
                </IconButton>
            ]}
        />
    );
}

export default CodexSnackbar;
