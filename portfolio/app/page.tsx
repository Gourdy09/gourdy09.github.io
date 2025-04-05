import Hero from "@/components/Hero";
import NavBar from "@/components/NavBar";
import About from "@/components/About";

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

        <div id="work">

        </div>

        <div id="stats">

        </div>
    </main>
  );
}
