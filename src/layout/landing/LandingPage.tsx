import { AboutUs } from "./components/AboutUs";
import { LandingNavBar } from "./components/LandingNavBar";
import { WhoWeServe } from "./components/WhoWeServe";
import { FAQ } from "./components/FAQ";
import { Footer } from "./components/Footer";

export const LandingPage = () => {
  return (
    <div>
      <header>
        <LandingNavBar />
      </header>
      <main>
        <AboutUs />
        <WhoWeServe />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
};
