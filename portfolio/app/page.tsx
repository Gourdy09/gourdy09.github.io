import Hero from "@/components/main/Hero";
import NavBar from "@/components/NavBar";
import About from "@/components/about/About";

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

        </div>

        <div id="projects">

        </div>

        <div id="stats">

        </div>
    </main>
  );
}
