import { put, select, takeEvery, all } from "redux-saga/effects";
import { batchActions } from "redux-batched-actions";
import { FILE_LOAD, ADD_FEATURE } from "../constants/actionTypes";
import StreamWorker from "worker-loader!../workers/stream.worker";
import {
    statSetFeatureLoading,
    statSetFeatureFailed,
    statSetFeatureResolved
} from "../actions/data";
import { getGlobalSessionKey, makeStreamRequest } from "../utils/utils";

import { bcache } from "../index";
import { store } from "../index"; // i am so sorry

function* interceptFeatureStatRequest(action) {
    /*
     * Intercept file load requests to create the initial batch of features.
     * Dispatch a batch of loading indicators, create a socket, request them
     * all in one go, and dispatch them as they come in.
     */

    if (action.filename === "") return;

    // Get the list of feature stats that already exist
    const existing_feature_stats = yield select(store => store.data.get("featureStats"));

    // Extract only the feature stats that we don't already have
    const features = (yield select(store => store.data.get("featureList")))
        .toJS()
        .filter(f => !existing_feature_stats.has(f.name))
        .map(f => f.name);

    // Create the list of features we're gonna load
    const loadingActions = features.map(f => statSetFeatureLoading(f));

    // Put all the actions into the store at the same time.
    // This serves to lock in the features, before this a race may occur if two
    // triggering actions are dispatched, though this is ultimately harmless.
    yield put(batchActions(loadingActions));

    // create the batched request
    const request = {
        routine: "arrange",
        hashType: "feature",
        activity: "metrics",
        name: features,
        sessionkey: getGlobalSessionKey()
    };

    // honestly i was gonna do some fancy async -> generator callback stuff
    // but i couldn't find a way to map a series of callbacks into a generator
    // in a not-braindead way at 3AM

    makeStreamRequest(request, e => {
        // handle failure
        if (e.status !== "success") {
            store.dispatch(statSetFeatureFailed(e.name));
            return;
        }

        // create the bcache key
        const key = `stats:${e.name}/downsample`;

        // save in bcache
        bcache.add_native(key, e.downsample);

        // don't save large amounts of data in the store
        delete e.hist_edges;
        delete e.hist_data;
        delete e.downsample;

        // store the hash key on the store
        e.downsample_key = key;

        // HACKS HACKS HACKS
        store.dispatch(statSetFeatureResolved(e.name, e));
    });

    console.log("caught a file_load: ", features, loadingActions);

    yield null;
}

function* watchFeatureStatRequests() {
    yield all([
        takeEvery(FILE_LOAD, interceptFeatureStatRequest),
        takeEvery(ADD_FEATURE, interceptFeatureStatRequest)
    ]);
}

export default watchFeatureStatRequests;
