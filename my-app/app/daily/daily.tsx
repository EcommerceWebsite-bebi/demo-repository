import Header from "../../components/Header";
import Footer from "../../components/Footer";
import DailyCta from "../../components/daily/DailyCta";
import DailyGallery from "../../components/daily/DailyGallery";
import DailyHero from "../../components/daily/DailyHero";
import DailyHighlights from "../../components/daily/DailyHighlights";
import DailyQrShare from "../../components/daily/DailyQrShare";
import DailyStory from "../../components/daily/DailyStory";

const heroMeta = [
	"Mood: Peaceful",
	"Outfit: AI Fit 02",
	"Location: Saigon",
	"Weather: 29°C",
];

const highlights = [
	{
		label: "Mood",
		value: "Peaceful",
		note: "Light, warm, bright morning",
		icon: "sentiment_satisfied",
	},
	{
		label: "Outfit",
		value: "AI Fit 02",
		note: "Oversize style top",
		icon: "checkroom",
	},
	{
		label: "Views",
		value: "1,248",
		note: "+18% vs yesterday",
		icon: "visibility",
	},
	{
		label: "Fit Score",
		value: "9.2/10",
		note: "Auto size suggestion",
		icon: "verified",
	},
];

const timeline = [
	{
		time: "07:30",
		title: "Morning Coffee & Try-On",
		text: "Tried the khaki hoodie — the morning light made the color pop beautifully.",
	},
	{
		time: "11:20",
		title: "Fit & Silhouette Test",
		text: "AI automatically adjusted sleeve length and shoulder proportions.",
	},
	{
		time: "16:00",
		title: "Evening Outfit Pick",
		text: "Layered with a black jacket, shared via QR for friends.",
	},
];

const gallery = [
	{ name: "Look 01" },
	{ name: "Look 02" },
	{ name: "Look 03" },
	{ name: "Look 04" },
];

export default function DailyPage() {
	return (
		<div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
			<Header />
			<main className="flex-1 px-margin-x py-16 space-y-16">
				<DailyHero
					title="Daily Journal — May 18, 2026"
					description="A day of AI-powered outfit trials, capturing every moment and sharing via QR. A journal your friends can open right on their phone."
					metaItems={heroMeta}
					heroLabel="Hero Image"					
				/>
				<DailyHighlights items={highlights} />
				<section className="grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr]">
					<DailyStory
						entries={timeline}
						title="Today's Story"
						subtitle="All notes, moments, and photos from Canva."
					/>
					<DailyGallery
						items={gallery}
						title="Lookbook"
						subtitle="Photo collection after scanning the QR."
					/>
				</section>
				<DailyQrShare
					title="Share Your Journal"
					subtitle="Scan the QR code to view this journal entry. Share it instantly on social media."
					shareUrl="https://bibebe.co/d/18-05"
				/>
				<DailyCta
					kicker="Next"
					title="Create Your Journal"
					description="Use Canva to create images — the QR will automatically appear when you share."
					href="/custom"
					actionLabel="Get Started"
				/>
			</main>
			<Footer />
		</div>
	);
}
