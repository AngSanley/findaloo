import { createSlice } from "@reduxjs/toolkit";
import { createSelector } from "reselect";

const slice = createSlice({
    name: "toilets",
    initialState: {
        toilets: { },
        buildings: [],
        toiletsHash: null,
        nearestToilets: []
    },
    reducers: {
        buildingsAdded: (toilets, action) => {
            toilets.buildings = action.payload;
        },

        toiletAdded: (toilets, action) => {
            toilets.toilets[action.payload.id] = action.payload.data;
        },

        toiletsHashUpdated: (toilets, action) => {
            toilets.toiletsHash = action.payload;
        },

        nearestToiletsCached: (toilets, action) => {
            toilets.nearestToilets = action.payload;
        }
    }
});

const {
    buildingsAdded,
    toiletAdded,
    toiletsHashUpdated,
    nearestToiletsCached
} = slice.actions;

export default slice.reducer;

export const addBuildings = (buildings) => buildingsAdded(buildings);
export const addToilet = (id, data) => toiletAdded({ id, data });
export const updateToiletsHash = (hash) => toiletsHashUpdated(hash);
export const cacheNearestToilets = (toilets) => nearestToiletsCached(toilets);

export const getBuildings = createSelector(
    state => state.toilets,
    toilets => toilets.buildings
);

export const getToiletDetails = (id) => createSelector(
    state => state.toilets,
    toilets => toilets.toilets[id]
);

export const getToiletsHash = createSelector(
    state => state.toilets,
    toilets => toilets.toiletsHash
);

export const getCachedNearestToilets = createSelector(
    state => state.toilets,
    toilets => toilets.nearestToilets
);