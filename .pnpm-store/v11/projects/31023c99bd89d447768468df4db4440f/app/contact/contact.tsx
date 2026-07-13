"use client";

import dynamic from "next/dynamic";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ContactShowroom from "../../components/contact/ContactShowroom";

const ContactMap = dynamic(
	() => import("../../components/contact/ContactMap"),
	{ ssr: false }
);

export default function ContactPage() {
	return (
		<div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
			<Header />
			<main className="flex-1 px-margin-x py-16">
				<h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">
					Contact Us
				</h1>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-10">
					<ContactShowroom />
					<ContactMap />
				</div>
			</main>
			<Footer />
		</div>
	);
}
