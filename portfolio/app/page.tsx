import Hero from "@/components/main/Hero";
import NavBar from "@/components/NavBar";
import About from "@/components/about/About";
import Projects from "@/components/projects/Projects";
import ExperienceSection from "@/components/experience/ExperienceSection";

export default function Home() {
  return (
    <main className="bg-background">
      <NavBar />

      <div id="home">
        <Hero />
      </div>

      <div id="about">
        <About />
      </div>

      <div id="work">
        <ExperienceSection />
      </div>

      <div id="projects">
        <Projects />
      </div>
    </main>
  );
}
