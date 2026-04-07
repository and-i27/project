import Footer from "../components/Footer";
import Navbar from "../components/NavBar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="h-screen flex flex-col justify-between">
      <Navbar />
      {children}
      <Footer />
    </main>
  );
}
