import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import React from "react";

export const metadata = {
  title: "Moove NFT Platform - Mobilità Decentralizzata",
  description:
    "Scopri la nuova era della micro-mobilità urbana. Acquista, personalizza e utilizza NFT per accedere alla flotta di veicoli sostenibili Moove.",
};

export default function HomePage() {
  return (
    <>
      <Hero />

      <Features />

      {/* More sections to come */}
      {/* 
      <Stats />
      <Testimonials />
      <CTA />
      */}
    </>
  );
}
