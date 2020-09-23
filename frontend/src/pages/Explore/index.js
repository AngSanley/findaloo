import React, { useRef, useEffect, useState } from 'react';
import GoogleMapReact from "google-map-react";
import MarkerClusterer from "@googlemaps/markerclustererplus";
import Masonry from "masonry-layout";
import ReactGA from "react-ga";
import { useDispatch, useSelector } from "react-redux";
import {  } from "redux-persist";
import { Page, Sheet, Button } from "framework7-react";
import "./styles.css";

import BuildingCard from "../../components/BuildingCard";
import ToiletCard from "../../components/ToiletCard";
import SearchBox from "../../components/SearchBox";
import Marker, { MyLocationMarker } from "../../components/Marker";

import { addBuildings, getBuildings } from "../../store/toilets";
import { fetchToilets } from "../../utils/toilets";

export default (props) => {
    const bottomSheetRef = useRef();
    const [mapView, setMapView] = useState();
    const [mapsApi, setMapsApi] = useState();
    const [bottomSheetState, setBottomSheetState] = useState("normal");
    const [searchKeywords, setSearchKeywords] = useState("");
    const [currentLocation, setCurrentLocation] = useState(null);
    const [activeMarker, setActiveMarker] = useState("");
    const [buildingToShow, setBuildingToShow] = useState(null);
    const [buildingToiletsStripShowed, setBuildingToiletsStripShowed] = useState(false);

    const [buildings, setBuildings] = useState(null);
    const dispatch = useDispatch();
    const buildingsFromStore = useSelector(getBuildings);
    
    useEffect(() => { ReactGA.pageview("/"); });

    useEffect(() => {
        fetchToilets((buildings) => {
            dispatch(addBuildings(buildings));
            setBuildings(buildings);
        }, (error) => {
            console.log("NO INTERNET LA DEY");
            console.log(buildingsFromStore);
            setBuildings(buildingsFromStore);
        });
    }, []);

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                ({ coords: { latitude, longitude } }) => {
                    if (bottomSheetState === "normal" || buildingToiletsStripShowed) {
                        mapView.panTo({ lat: latitude - 0.0025, lng: longitude });
                    } else {
                        mapView.panTo({ lat: latitude, lng: longitude });
                    }

                    if (mapView.getZoom() < 16) mapView.setZoom(16);
                    setCurrentLocation({ lat: latitude, lng: longitude });
                }
            , () => alert("ADUH"));
        } else {
            alert("not supported");
        }
    }

    const openBottomSheet = () => {
        setBuildingToiletsStripShowed(false);

        bottomSheetRef.current.open(true);
        
        setTimeout(() => {
            const sheet = document.getElementById("bottom-sheet");
            const view = document.querySelector(".view.view-main");        
            view.appendChild(sheet);
        }, 300);

        setBottomSheetState("normal");
    }

    const expandBottomSheet = () => {
        if (bottomSheetState !== "expanded") {
            openBottomSheet();
            const bottomSheet = document.getElementById("bottom-sheet");
            bottomSheet.classList.add("bs-opened");
            bottomSheet.classList.remove("modal-in-swipe-step");
            setBottomSheetState("expanded");
        }
    }

    const hideBottomSheet = () => {
        if (bottomSheetState !== "hidden") {
            document.getElementById("bottom-sheet").classList.remove("bs-opened");
            bottomSheetRef.current.close(true);
            setBottomSheetState("hidden");
        }
    }

    useEffect(() => {
        openBottomSheet();
    }, []);

    useEffect(() => {
        const grid = document.querySelector(".cards");
        const masonry = new Masonry(grid, {
            itemSelector: ".toil-card",
            gutter: ".cards-gutter",
            percentPosition: true
        });
    });

    const renderBuildings = () => buildings.map((building) => {
        let image;

        try {
            image = building.toilets[0].toilet_images[0];
        } catch (error) { }

        return (
            <BuildingCard
                key={building.buildingId}
                title={building.buildingName}
                toilets={building.toilets}
                image={image}
                onClick={() => showMarkerOnMap(building)}
            />
        );
    });

    const showMarkerOnMap = (building) => {
        hideBottomSheet();
        setBuildingToShow(building.toilets);
        setBuildingToiletsStripShowed(true);

        setActiveMarker(building.buildingId);
        mapView.panTo({ lat: building.lat - 0.0025, lng: building.lon + 0.002 });
        
        if (mapView.getZoom() < 16) mapView.setZoom(16);
    }

    const renderMarkers = () => buildings.map((building) => (
        <Marker
            key={building.buildingId}
            title={building.buildingName}
            lat={building.lat}
            lng={building.lon}
            onClick={() => showMarkerOnMap(building)}
            active={activeMarker === building.buildingId}
        />
    ));

    const renderBuildingToilets = (toilets) => toilets.map((toilet) => (
        <ToiletCard key={toilet.toiletId} toilet={toilet} mini={true} />
    ));

    useEffect(() => {
        try {
            if (buildings) {
                const markers = buildings.map((building) => {
                    const position = new mapsApi.LatLng({
                        lat: parseFloat(building.lat),
                        lng: parseFloat(building.lon) 
                    });
                    
                    return new mapsApi.Marker({
                        position,
                        icon: require("../../assets/marker-toilet.svg")
                    });
                });
                
                const markerCluster = new MarkerClusterer(mapView, markers, {
                    imagePath: "/static/cluster/m"
                });
            }
        } catch (error) {
            console.log("WHOOPS NO MAPS");
        }
    }, [buildings, mapView, mapsApi])

    return (<>
        <div className="map-search-overlay">
            <SearchBox
                mode={bottomSheetState === "expanded" ? "flat" : ""}
                onChange={setSearchKeywords}
                onFocus={expandBottomSheet}
                value={searchKeywords}
                rightButtonOnClick={() => {}}
            />
        </div>

        {buildingToShow ?
            <div className={`map-toilets-overlay ${buildingToiletsStripShowed ? "" : "hidden"}`}>
                <div className="bldg-toilets">
                    {renderBuildingToilets(buildingToShow)}
                </div>
            </div>
        : null}

        <Button
            fill
            raised
            round
            iconSize="1.6rem"
            color="white"
            className={`my-location ${bottomSheetState === "hidden" ? "bottom" : ""}`}
            iconF7="location_fill"
            onClick={getCurrentLocation}
        />

        <Button
            fill
            round
            className={`open-bottom-sheet ${bottomSheetState !== "hidden" ? "hidden" : ""}`}
            iconF7="arrow_up"
            onClick={openBottomSheet}
        >
            Explore toilets
        </Button>

        <Sheet
            id="bottom-sheet"
            className="bottom-sheet"
            swipeToStep
            swipeToClose
            ref={bottomSheetRef}
            backdrop={false}
            onSheetStepOpen={() => {
                document.getElementById("bottom-sheet").classList.add("bs-opened");
                setBottomSheetState("expanded");
            }}
            onSheetStepClose={() => {
                document.getElementById("bottom-sheet").classList.remove("bs-opened");
                document.getElementById("search").blur();
                setBottomSheetState("normal");
            }}
            onSheetClose={hideBottomSheet}
            onSheetClosed={hideBottomSheet}
        >
            <div className="sheet-modal-swipe-step">
                <div className="bottom-sheet-top">
                    <div className="handle" />

                    <h2>Is nature calling now?</h2>

                    <div className="buildings">
                        {buildings ? renderBuildings() : null}
                    </div>
                </div>
            </div>
        
            <Page className="bottom-sheet-content">
                <div className="cards">
                    <div className="cards-gutter" />
                    
                    {/* {buildings ? renderToilets() : null} */}
                </div>
            </Page>
        </Sheet>

        <div className="mapview" id="mapview">
            <GoogleMapReact
                bootstrapURLKeys={{ key: "AIzaSyB2XApF_YJNLUrfs7avQLSgGeTAEt4_z_E" }}
                defaultCenter={{ lat: 1.2966, lng: 103.7764 }}
                defaultZoom={12}
                onDrag={hideBottomSheet}
                options={{
                    zoomControl: false,
                    fullscreenControl: false,
                    streetViewControl: false,
                    clickableIcons: false
                }}
                yesIWantToUseGoogleMapApiInternals
                onGoogleApiLoaded={({ map, maps }) => {
                    setMapView(map);
                    setMapsApi(maps);
                }}
            >
                {currentLocation ? <MyLocationMarker lat={currentLocation.lat} lng={currentLocation.lng} text="NUS" /> : null}
                
                {/* {buildings ? renderMarkers() : null} */}
            </GoogleMapReact>
        </div>
    </>);
}
