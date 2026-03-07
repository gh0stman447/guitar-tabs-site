import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { HeroSection } from '@/components/sections/HeroSection';
import { AboutSection } from '@/components/sections/AboutSection';
import { BestsellerSection } from '@/components/sections/BestsellerSection';
import { TabsSection } from '@/components/sections/TabsSection';
import { ContactsSection } from '@/components/sections/ContactsSection';
import { ScrollToTop } from '@/components/shared/ScrollToTop';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <BestsellerSection />
        <TabsSection />
        <AboutSection />
        <ContactsSection />
      </main>
      <Footer />
      <ScrollToTop />
    </>
  );
}
