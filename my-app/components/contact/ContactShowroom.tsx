"use client";

import { useState } from "react";

const COUNTRIES = [{ value: "vietnam", label: "Vietnam" }] as const;

type CountryKey = (typeof COUNTRIES)[number]["value"];

const CITIES = [{ value: "hcmc", label: "Thành Phố Hồ Chí Minh" }] as const;

type CityKey = (typeof CITIES)[number]["value"];

type ShopInfo = {
	id: string;
	address: string;
	hours: string;
	phone: string;
	mapsUrl: string;
};

const SHOPS: Record<CityKey, ShopInfo> = {
	hcmc: {
		id: "shop-01",
		address:
			"Lot E2a-7, D1 Street, Saigon Hi-Tech Park, Tang Nhon Phu Ward, HCMC",
		hours: "9h00 - 22h00",
		phone: "0932198848",
		mapsUrl:
			"https://www.google.com/maps/dir/?api=1&destination=Lot+E2a-7+D1+Street+Saigon+Hi-Tech+Park+Thu+Duc+HCMC",
	},
};

export default function ContactShowroom() {
	const [country, setCountry] = useState<CountryKey>("vietnam");
	const [city, setCity] = useState<CityKey>("hcmc");

	const shop = SHOPS[city];

	return (
		<div className="space-y-6">
			<h2 className="text-2xl font-bold text-gray-900">MOUSEEE Showroom</h2>
			<p className="text-sm text-gray-500">Showroom in Vietnam</p>

			<div className="space-y-4">
				<div>
					<label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
						Country
					</label>
					<select
						value={country}
						onChange={(e) => setCountry(e.target.value as CountryKey)}
						className="w-full rounded-md border border-gray-200 p-2 text-sm text-gray-700"
					>
						{COUNTRIES.map((c) => (
							<option key={c.value} value={c.value}>
								{c.label}
							</option>
						))}
					</select>
				</div>

				<div>
					<label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
						City
					</label>
					<select
						value={city}
						onChange={(e) => setCity(e.target.value as CityKey)}
						className="w-full rounded-md border border-gray-200 p-2 text-sm text-gray-700"
					>
						{CITIES.map((c) => (
							<option key={c.value} value={c.value}>
								{c.label}
							</option>
						))}
					</select>
				</div>
			</div>

			{shop && (
				<div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm space-y-4">
					<h3 className="text-lg font-semibold text-gray-900">
						{shop.id === "shop-01"
							? "Saigon Hi-Tech Park"
							: "Showroom Details"}
					</h3>

					<div className="space-y-3 text-sm text-gray-600">
						<div>
							<span className="font-semibold text-gray-800">Address:</span>
							<p className="mt-1">{shop.address}</p>
						</div>

						<div>
							<span className="font-semibold text-gray-800">
								Online Shop Hours:
							</span>
							<p className="mt-1">{shop.hours}</p>
						</div>
					</div>

					<div className="flex items-center gap-3 pt-2">
						<a
							href={shop.mapsUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-80 transition-opacity"
						>
							<span className="material-symbols-outlined text-base">map</span>
							Directions
						</a>
						<a
							href={`tel:${shop.phone}`}
							className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
						>
							<span className="material-symbols-outlined text-base">call</span>
							{shop.phone}
						</a>
					</div>
				</div>
			)}
		</div>
	);
}
