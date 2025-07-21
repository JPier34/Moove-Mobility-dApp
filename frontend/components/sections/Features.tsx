import React from "react";
import Card from "../ui/Card";

const Features: React.FC = () => {
  const features = [
    {
      icon: "🏪",
      title: "Marketplace NFT",
      description:
        "Scopri e acquista NFT di veicoli unici nel nostro marketplace decentralizzato",
      gradient: "from-blue-500 to-purple-600",
    },
    {
      icon: "🎨",
      title: "Personalizzazione",
      description:
        "Customizza il tuo veicolo NFT con stickers, colori e upgrade esclusivi",
      gradient: "from-green-500 to-teal-600",
    },
    {
      icon: "🚀",
      title: "Accesso Immediato",
      description:
        "Usa il tuo NFT come chiave digitale per sbloccare veicoli nella flotta Moove",
      gradient: "from-orange-500 to-red-600",
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Come Funziona{" "}
            <span className="bg-gradient-to-r from-[#00D4AA] to-[#0052CC] bg-clip-text text-transparent">
              Moove
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Un ecosistema completo che unisce blockchain, mobilità sostenibile e
            innovazione
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} hover className="p-8 text-center group">
              <div
                className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}
              >
                <span className="text-white text-2xl">{feature.icon}</span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
