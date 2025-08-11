import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MdDashboard, MdNotifications, MdLocalHospital } from "react-icons/md";
import { BiBrain } from "react-icons/bi";
import { FaRoute } from "react-icons/fa";
import { IoMdTimer } from "react-icons/io";

function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const redirect_to_roles = () => navigate("/roles");
  const redirect_to_addmed = () => navigate("/addmed");
  const redirect_to_supply = () => navigate("/supply");
  const redirect_to_track = () => navigate("/track");

  const navItems = [
    { text: "Register", onClick: redirect_to_roles },
    { text: "Order Medicines", onClick: redirect_to_addmed },
    { text: "Control Supply Chain", onClick: redirect_to_supply },
    { text: "Track Medicines", onClick: redirect_to_track },
  ];

  const steps = [
    {
      title: "Register",
      description: "Create your account",
      icon: "👤",
      onClick: redirect_to_roles,
      gradient: "from-blue-400 to-blue-600",
    },
    {
      title: "Order Medicines",
      description: "Browse and purchase",
      icon: "💊",
      onClick: redirect_to_addmed,
      gradient: "from-green-400 to-green-600",
    },
    {
      title: "Control Supply",
      description: "Manage distribution",
      icon: "🚚",
      onClick: redirect_to_supply,
      gradient: "from-purple-400 to-purple-600",
    },
    {
      title: "Track Orders",
      description: "Real-time monitoring",
      icon: "🔍",
      onClick: redirect_to_track,
      gradient: "from-red-400 to-red-600",
    },
  ];

  // First, define the paths for each feature at the top of the component
  const featureLinks = {
    "Smart Dashboard": "/dashboard",
    "Data Analysis": "https://mihirphalke1-silkroad-streamlit-app-ib7dlt.streamlit.app/",
    "Hospital Management": "/hospital",
    "Reverse Supply Chain": "/reverse",
    "Real-time Tracking": "/track",
    "Smart Alerts": "/alerts",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-6xl">
        <div className="backdrop-blur-md bg-white/80 rounded-2xl shadow-lg p-4">
          <div className="flex justify-between items-center">
            <a
              href="/"
              className="text-3xl font-bold text-gray-800 font-montserrat hover:text-blue-600 transition-all duration-300"
            >
              Medसफ़र
            </a>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-gray-800"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24px"
                height="24px"
              >
                <path d="M2 11H22V13H2zM2 5H22V7H2zM2 17H22V19H2z" />
              </svg>
            </button>

            {/* Desktop menu */}
            <div className="hidden md:flex space-x-6">
              {navItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium transition-all duration-300"
                >
                  {item.text}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 space-y-2">
              {navItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    item.onClick();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-gray-700 hover:text-blue-600 font-medium transition-all duration-300"
                >
                  {item.text}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      <main className="container mx-auto px-4 pt-32 pb-16">
        <section className="text-center mb-20 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mt-20  font-montserrat">
            Revolutionizing Medical Supply Chain
          </h1>
          <p className="text-xl text-gray-600 max-w-auto mx-auto mt-16">
            Ensuring the Right Medicine, at the Right Place, at the Right Time —
            Seamlessly and Efficiently
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/dashboard">
              <Button
                className="relative overflow-hidden
    text-white font-semibold
    bg-gradient-to-r from-teal-400 to-teal-600
    hover:from-teal-800  hover:to-teal-900
    shadow-lg hover:shadow-xl
    transform hover:scale-105
    transition-all duration-500
    mt-8 px-8"
              >
                Dashboard
              </Button>
            </Link>
            <Link to="/hospital">
              <Button
                className="relative overflow-hidden
    text-white font-semibold
    bg-gradient-to-r from-blue-400 to-blue-600
    hover:from-blue-800  hover:to-blue-900
    shadow-lg hover:shadow-xl
    transform hover:scale-105
    transition-all duration-500
    mt-8 px-8"
              >
                Hospital
              </Button>
            </Link>
            <Link to="/alerts">
              <Button
                className="relative overflow-hidden
    text-white font-semibold
    bg-gradient-to-r from-orange-400 to-red-400
    hover:from-orange-600  hover:to-red-600
    shadow-lg hover:shadow-xl
    transform hover:scale-105
    transition-all duration-500
    mt-8 px-8"
              >
                Alerts
              </Button>
            </Link>
          </div>
        </section>

        <section className="mt-20 mb-16">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12 font-montserrat">
            Our Comprehensive Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Smart Dashboard",
                description:
                  "Centralized control panel with real-time analytics and insights for informed decision-making",
                Icon: MdDashboard,
                gradient: "from-blue-400 to-blue-600",
              },
              {
                title: "Data Analysis",
                description:
                  "Advanced analytics to forecast demand, optimize inventory, prevent stockouts, enhance efficiency, and improve profitability.",
                Icon: BiBrain,
                gradient: "from-purple-400 to-purple-600",
              },
              {
                title: "Hospital Management",
                description:
                  "Streamlined hospital operations with integrated supply chain and inventory management",
                Icon: MdLocalHospital,
                gradient: "from-green-400 to-green-600",
              },
              {
                title: "Reverse Supply Chain",
                description:
                  "Efficient handling of returns, recalls, and disposal of expired medications",
                Icon: FaRoute,
                gradient: "from-yellow-400 to-yellow-600",
              },
              {
                title: "Real-time Tracking",
                description:
                  "End-to-end visibility of medical supplies with temperature and condition monitoring",
                Icon: IoMdTimer,
                gradient: "from-red-400 to-red-600",
              },
              {
                title: "Smart Alerts",
                description:
                  "Instant notifications for stock levels, expiry dates, and supply chain disruptions",
                Icon: MdNotifications,
                gradient: "from-orange-400 to-orange-600",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl bg-white p-8 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <div className="relative z-10 flex flex-col items-center text-center">
                  <feature.Icon className="text-4xl mb-4 w-12 h-12" />
                  <h3 className="text-xl font-bold text-gray-800 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-6">{feature.description}</p>

                  {/* Add Navigation Link */}
                  <Link
                    to={featureLinks[feature.title]}
                    className={`
                      mt-4 px-6 py-2 rounded-lg font-medium text-white
                      bg-gradient-to-r ${feature.gradient}
                      transform transition-all duration-300
                      hover:scale-105 hover:shadow-md
                      flex items-center gap-2
                    `}
                  >
                    <span>Explore {feature.title}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
                <div
                  className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r ${feature.gradient}`}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
