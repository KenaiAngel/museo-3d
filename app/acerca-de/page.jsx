"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useRandomMurals } from "../hooks/useRandomMurals";
import { SectionLoader } from "../../components/LoadingSpinner";
import React, { useState } from "react";
// import { PageSection, HeroSection } from "../../components/shared/PageSection";
// PageSection component
function PageSection({ children, delay = 0, className = "" }) {
  return (
    <section
      className={`animate-fade-in-up${delay ? ` delay-${delay}` : ""} ${className}`.trim()}
    >
      {children}
    </section>
  );
}

// HeroSection component
function HeroSection({ title, subtitle }) {
  return (
    <section className="text-center px-4 sm:px-0 animate-fade-in-up">
      <h1 className="text-5xl font-bold mb-6 font-playfair text-foreground">
        {title}
      </h1>
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-normal animate-fade-in font-inter">
        {subtitle}
      </p>
    </section>
  );
}
// import { MuralImage } from "../../components/shared/MuralImage";
// Componente de imagen con fallback
function MuralImage({
  src,
  alt,
  className,
  fallbackSrc = "/assets/artworks/cuadro1.webp",
}) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setImgSrc(fallbackSrc);
      setHasError(true);
    }
  };

  return (
    <img src={imgSrc} alt={alt} className={className} onError={handleError} />
  );
}
import {
  AnimatedBlobsBackground,
  DotsPattern,
} from "../../components/shared/AnimatedBackground";
import equipo from "./equipo.json";

export default function AcercaDe() {
  const { murals, loading, error } = useRandomMurals(4);

  // Fallback images si no hay murales
  const fallbackImages = [
    "/assets/artworks/cuadro1.webp",
    "/assets/artworks/cuadro2.webp",
    "/assets/artworks/cuadro3.webp",
    "/assets/artworks/cuadro4.webp",
  ];

  // Usar murales del fetch o fallbacks
  const displayMurals =
    murals.length > 0
      ? murals
      : fallbackImages.map((img, i) => ({
          url_imagen: img,
          titulo: `Mural ${i + 1}`,
        }));

  return (
    <div className="relative w-full flex flex-col items-center justify-start bg-transparent">
      {/* Fondo animado, patrón y graffiti sutil */}
      <div className="pointer-events-none absolute inset-0 w-full h-full z-0">
        <AnimatedBlobsBackground />
        <DotsPattern />
      </div>
      <main className="relative z-10 w-full max-w-5xl mx-auto flex flex-col gap-16 px-4 sm:px-8 py-8 md:py-12">
        {/* Hero Section */}
        <HeroSection
          title="Acerca del Mural ARPA"
          subtitle="Una iniciativa cultural que busca preservar y difundir el arte mural mexicano a través de la tecnología y la experiencia digital."
        />
        {/* Historia Section - Collage con murales aleatorios */}
        <PageSection
          delay={100}
          className="grid md:grid-cols-2 gap-12 mx-6 sm:mx-0 items-center"
        >
          <div>
            <h2 className="text-3xl font-bold mb-6 font-playfair text-foreground">
              Nuestra Historia
            </h2>
            <div className="space-y-4 text-muted-foreground font-normal font-inter text-lg text-justify leading-relaxed">
              <p>
                El Mural ARPA nació como parte de un esfuerzo colectivo por
                documentar y visibilizar las obras murales creadas por
                estudiantes de la Facultad de Artes de la BUAP, muchas de las
                cuales han sido desarrolladas en colaboración con eventos
                culturales y académicos como el Primer Hackatón BUAP. Este
                proyecto refleja la fusión entre tradición artística y
                vanguardia tecnológica, con el objetivo de preservar el legado
                del muralismo mexicano en la era digital.
              </p>
              <p>
                Nuestro proyecto combina la tradición del muralismo mexicano con
                las tecnologías más avanzadas para crear experiencias inmersivas
                que conectan a las personas con el arte.
              </p>
            </div>
          </div>
          <div className="relative my-10 sm:my-0 w-full h-80 flex items-center justify-center">
            {loading ? (
              <SectionLoader text="Cargando murales..." />
            ) : error ? (
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                {fallbackImages.map((img, i) => (
                  <MuralImage
                    key={i}
                    src={img}
                    alt={`Mural ${i + 1}`}
                    className={`w-full h-48 object-cover rounded-2xl shadow-2xl ${
                      i === 0
                        ? "animate-diagonal-tl"
                        : i === 1
                          ? "animate-diagonal-tr"
                          : i === 2
                            ? "animate-diagonal-bl"
                            : "animate-diagonal-br"
                    }`}
                    fallbackSrc="/assets/artworks/cuadro1.webp"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                {displayMurals.map((mural, i) => (
                  <MuralImage
                    key={i}
                    src={mural.url_imagen}
                    alt={mural.titulo || `Mural ${i + 1}`}
                    className={`w-full h-48 object-cover rounded-2xl shadow-2xl ${
                      i === 0
                        ? "animate-diagonal-tl"
                        : i === 1
                          ? "animate-diagonal-tr"
                          : i === 2
                            ? "animate-diagonal-bl"
                            : "animate-diagonal-br"
                    }`}
                    fallbackSrc={
                      fallbackImages[i] || "/assets/artworks/cuadro1.webp"
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </PageSection>
        {/* Misión y Visión - Ahora en una columna */}
        <PageSection delay={200} className="mx-6 sm:mx-0">
          <div className="max-w-4xl mx-auto space-y-12">
            <div>
              <h2 className="text-3xl font-bold mb-6 font-playfair text-foreground text-center">
                Nuestra Misión
              </h2>
              <div className="space-y-4 text-muted-foreground font-normal font-inter text-lg text-justify leading-relaxed">
                <p>
                  Preservar, documentar y difundir el arte mural mexicano a
                  través de tecnologías digitales innovadoras, haciendo
                  accesible este patrimonio cultural a audiencias globales.
                  Buscamos convertirnos en un puente entre el arte tradicional y
                  las nuevas formas de interacción digital, garantizando que las
                  obras murales realizadas por artistas emergentes tengan vida
                  propia más allá de las paredes donde fueron creadas.
                </p>
                <p>
                  Nuestro compromiso va más allá de la simple digitalización.
                  Aspiramos a crear experiencias inmersivas que permitan a los
                  espectadores no solo observar, sino sentir y vivir el arte
                  mural en toda su dimensión. A través de la realidad virtual,
                  la inteligencia artificial y las tecnologías emergentes,
                  transformamos cada mural en una ventana hacia la historia, la
                  cultura y la expresión artística mexicana.
                </p>
                <p>
                  Trabajamos en estrecha colaboración con artistas,
                  historiadores, curadores y comunidades locales para asegurar
                  que cada obra digitalizada preserve no solo su belleza visual,
                  sino también su contexto histórico, cultural y social. Creemos
                  que el arte mural es un testimonio vivo de nuestra identidad
                  colectiva y merece ser preservado para las futuras
                  generaciones.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold mb-6 font-playfair text-foreground text-center">
                Nuestra Visión
              </h2>
              <div className="space-y-4 text-muted-foreground font-normal font-inter text-lg text-justify leading-relaxed">
                <p>
                  Ser la plataforma líder mundial en la preservación y
                  experiencia digital del arte mural, conectando artistas,
                  historiadores y amantes del arte en una comunidad global
                  comprometida con la memoria cultural y la innovación
                  artística.
                </p>
                <p>
                  Visualizamos un futuro donde el arte mural mexicano sea
                  accesible desde cualquier rincón del mundo, donde las barreras
                  geográficas y temporales se desvanezcan para permitir que cada
                  persona pueda experimentar la riqueza cultural de México.
                  Nuestra plataforma aspira a convertirse en el referente
                  internacional para la preservación digital del patrimonio
                  mural, estableciendo estándares de calidad y metodologías que
                  puedan ser replicadas en otros contextos culturales.
                </p>
                <p>
                  Buscamos crear una red global de colaboración que conecte
                  instituciones culturales, universidades, artistas
                  independientes y entusiastas del arte, fomentando el
                  intercambio de conocimientos, técnicas y experiencias. A
                  través de esta red, aspiramos a democratizar el acceso al arte
                  mural, haciendo que el patrimonio cultural mexicano sea
                  verdaderamente universal y accesible para todos.
                </p>
                <p>
                  En el horizonte de nuestra visión, vemos una plataforma que no
                  solo preserva, sino que también inspira y educa. Queremos que
                  cada visita virtual a nuestros murales sea una experiencia
                  transformadora que despierte la curiosidad, fomente la
                  apreciación artística y fortalezca la conexión con nuestras
                  raíces culturales.
                </p>
              </div>
            </div>
          </div>
        </PageSection>
        {/* Valores y Principios */}
        <PageSection delay={250} className="mx-6 sm:mx-0">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 font-playfair text-foreground text-center">
              Nuestros Valores y Principios
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Preservación Cultural
                </h3>
                <p className="text-muted-foreground font-inter text-justify leading-relaxed">
                  Creemos firmemente en la importancia de preservar nuestro
                  patrimonio cultural para las futuras generaciones. Cada mural
                  representa una pieza única de nuestra historia colectiva, y
                  nos comprometemos a documentar y proteger estas obras con el
                  máximo rigor y respeto.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Innovación Tecnológica
                </h3>
                <p className="text-muted-foreground font-inter text-justify leading-relaxed">
                  Abrazamos las tecnologías más avanzadas para crear
                  experiencias digitales que honren la belleza y complejidad del
                  arte mural original. Utilizamos herramientas de vanguardia
                  para capturar cada detalle, textura y matiz de las obras.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Accesibilidad Universal
                </h3>
                <p className="text-muted-foreground font-inter text-justify leading-relaxed">
                  Nos esforzamos por hacer que el arte mural sea accesible para
                  todos, independientemente de su ubicación geográfica,
                  capacidades físicas o recursos económicos. Creemos que el arte
                  es un derecho universal que debe estar disponible para toda la
                  humanidad.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Colaboración Comunitaria
                </h3>
                <p className="text-muted-foreground font-inter text-justify leading-relaxed">
                  Trabajamos en estrecha colaboración con las comunidades
                  locales, artistas, instituciones educativas y organizaciones
                  culturales para asegurar que nuestro trabajo refleje
                  auténticamente la diversidad y riqueza de la expresión
                  artística mexicana.
                </p>
              </div>
            </div>
          </div>
        </PageSection>
        {/* Apoyo */}
        <PageSection delay={300} className="mx-6 sm:mx-0 text-center">
          <h2 className="text-3xl font-bold mb-8 font-playfair text-foreground">
            Con apoyo de:
          </h2>
          <div className="flex justify-center">
            <div className="text-center">
              <Avatar className="w-32 h-32 mx-auto mb-4">
                <AvatarImage
                  src="/images/Arpa.webp"
                  alt="Escuela de Artes Plásticas y Audiovisuales (BUAP)"
                  className="object-cover"
                />
                <AvatarFallback>ARPA</AvatarFallback>
              </Avatar>
              <h4 className="font-semibold text-foreground text-lg mb-2">
                Escuela de Artes Plásticas y Audiovisuales (BUAP)
              </h4>
              <p className="text-muted-foreground font-inter text-justify max-w-2xl mx-auto">
                La Escuela de Artes Plásticas y Audiovisuales de la Benemérita
                Universidad Autónoma de Puebla ha sido fundamental en el
                desarrollo de este proyecto, proporcionando no solo el apoyo
                institucional necesario, sino también la inspiración y el
                contexto académico que han permitido que esta iniciativa
                florezca. Su compromiso con la excelencia artística y la
                innovación educativa ha sido la base sobre la cual hemos
                construido nuestra plataforma digital.
              </p>
            </div>
          </div>
        </PageSection>
        {/* Equipo en grid de 4 columnas */}
        <PageSection delay={400}>
          <h2 className="text-3xl font-bold text-center mb-12 font-playfair text-foreground">
            Nuestro Equipo
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {equipo.map((persona, i) => (
              <article key={i} className="text-center group">
                <div
                  className={`w-32 h-32 mx-auto mb-4 rounded-full ${persona.color} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105`}
                >
                  <Avatar className="w-28 h-28 border-4 border-white">
                    <AvatarImage
                      src={persona.img}
                      alt={persona.nombre}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-white font-bold">
                      {persona.nombre
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <h3 className="font-bold text-xl font-playfair text-foreground mb-2">
                  {persona.nombre}
                </h3>
                <p className="text-sm text-primary/80 dark:text-primary/60 font-inter leading-relaxed">
                  {persona.rol}
                </p>
              </article>
            ))}
          </div>
        </PageSection>
        {/* Call to Action con banner de mural aleatorio */}
        {/* CallToAction component removed: file not found. Restore when available.
        <CallToAction
          title="Únete a Nuestra Misión"
          subtitle="Ayúdanos a preservar el patrimonio cultural mexicano para las futuras generaciones."
          backgroundImage={murals.length > 0 ? murals[0]?.url_imagen || "/assets/artworks/cuadro2.webp" : "/assets/artworks/cuadro2.webp"}
          buttons={[
            {
              text: "Explorar Museo",
              href: "/museo",
              variant: "default",
              className:
                "px-6 py-3 rounded-lg font-semibold text-lg bg-black text-white shadow-lg hover:bg-neutral-800 focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:bg-white dark:text-black dark:hover:bg-gray-100",
            },
            {
              text: "Contribuir",
              href: "/crear-sala",
              variant: "outline",
              className:
                "px-6 py-3 rounded-lg font-semibold text-lg border-primary text-primary hover:bg-primary/10 dark:border-white dark:text-white dark:hover:bg-white/10",
            },
          ]}
        />
        */}
      </main>
    </div>
  );
}
