import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import LeadForm from '@/components/LeadForm';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <>
      <header>
        <Navbar />
      </header>
      <main>
        <HeroSection />
        <section>
          <FeaturesSection />
        </section>
        <LeadForm />
      </main>
      <Footer />
    </>
  );
}
