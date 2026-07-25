export default function HeroSection() {
  return (
    <section className="text-center py-20 px-6 bg-gradient-to-br from-blue-50 to-white">
      <h1 className="text-5xl font-bold text-gray-900 mb-4">
        Capture. Manage. Convert.
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        LeadDesk Mini helps you collect and manage leads from a single dashboard.
      </p>
      <a
        href="#lead-form"
        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Submit a Lead
      </a>
    </section>
  );
}
