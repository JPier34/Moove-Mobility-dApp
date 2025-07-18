import "./globals.css";
import Web3Provider from "../providers/Web3Provider";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <Web3Provider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Web3Provider>
      </body>
    </html>
  );
}
