"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

import "leaflet/dist/leaflet.css";

function fixLeafletIcons() {
	const iconProto = L.Icon.Default.prototype as L.Icon.Default & {
		_getIconUrl?: () => string;
	};

	delete iconProto._getIconUrl;
	L.Icon.Default.mergeOptions({
		iconRetinaUrl:
			"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
		iconUrl:
			"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
		shadowUrl:
			"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
	});
}

export default function ContactMap() {
	useEffect(() => {
		fixLeafletIcons();
	}, []);

	const position: L.LatLngExpression = [10.8511, 106.8014];

	return (
		<div className="h-full min-h-[400px] rounded-md overflow-hidden border border-gray-200">
			<MapContainer
				center={position}
				zoom={16}
				scrollWheelZoom={true}
				className="h-full w-full"
				style={{ minHeight: 400 }}
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
				<Marker position={position}>
					<Popup>
						<div className="text-sm">
							<strong>MOUSEEE</strong>
							<br />
							Lot E2a-7, D1 Street
							<br />
							Saigon Hi-Tech Park, HCMC
						</div>
					</Popup>
				</Marker>
			</MapContainer>
		</div>
	);
}
