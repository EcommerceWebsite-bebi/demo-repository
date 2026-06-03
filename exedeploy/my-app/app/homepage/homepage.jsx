import Header from "../../components/Header";
import Hero from "../../components/homepage/Hero";
import Ticker from "../../components/Ticker";
import ProductGrid from "../../components/ProductGrid";
import FeatureSection from "../../components/homepage/FeatureSection";
import SupportStrip from "../../components/homepage/SupportStrip";
import Footer from "../../components/Footer";

export default function Homepage() {
	return (
		<div className="flex flex-col min-h-screen bg-gray-50">
			<Header />
			<main className="flex-1">
				<Hero />
				<Ticker />
				<ProductGrid />
				<FeatureSection />
				<SupportStrip />
			</main>
			<Footer />
		</div>
	);
}
