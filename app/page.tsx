import Hero from "@/components/main/Hero";
import NavBar from "@/components/NavBar";
import About from "@/components/about/About";
import Projects from "@/components/projects/Projects";
import ExperienceSection from "@/components/experience/ExperienceSection";

export default function Home() {
  return (
    <html>
      <head>
        <meta
          name="google-site-verification"
          content="PHZk-wfGFC1AYGy2OS52z2xtLQ8ntEzsN3VgP9PBpR0"
        />
      </head>
      <body>
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
      </body>
    </html>
  );
}
