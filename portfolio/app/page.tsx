import Hero from "@/components/main/Hero";
import NavBar from "@/components/NavBar";
import About from "@/components/about/About";
import Projects from "@/components/Projects";
import ExperienceSection from "@/components/ExperienceSection";

export default function Home() {
  return (
    <main className="bg-background">

        <NavBar/>
        
        <div id="home">
          <Hero/>
        </div>

        <div id="about">
          <About/>
        </div>

        <div id="experience">
          <ExperienceSection/>
        </div>

        <div id="projects">
          <Projects/>
        </div>

        <div id="stats">

        </div>
    </main>
  );
}
