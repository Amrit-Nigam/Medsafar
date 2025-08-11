import { useState, useEffect } from "react";
import Web3 from "web3";
import SupplyChainABI from "../artifacts/contracts/SupplyChain.sol/SupplyChain.json";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Copy } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

function AssignRoles() {
  const navigate = useNavigate();
  const [currentAccount, setCurrentAccount] = useState("");
  const [loader, setLoader] = useState(true);
  const [SupplyChain, setSupplyChain] = useState();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // State for form inputs
  const [formData, setFormData] = useState({
    RMS: { address: "", name: "", place: "" },
    MAN: { address: "", name: "", place: "" },
    DIS: { address: "", name: "", place: "" },
    RET: { address: "", name: "", place: "" },
  });

  // State for registered entities
  const [registeredEntities, setRegisteredEntities] = useState({
    RMS: {},
    MAN: {},
    DIS: {},
    RET: {},
  });

  const navItems = [
    { text: "Register", onClick: () => navigate("/roles") },
    { text: "Order Medicines", onClick: () => navigate("/addmed") },
    { text: "Control Supply Chain", onClick: () => navigate("/supply") },
    { text: "Track Medicines", onClick: () => navigate("/track") },
  ];

  useEffect(() => {
    loadWeb3();
    loadBlockchainData();
  }, []);

  const loadWeb3 = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert("Non-Ethereum browser detected. Consider using MetaMask!");
    }
  };

  const loadBlockchainData = async () => {
    try {
      setLoader(true);
      const web3 = window.web3;
      const accounts = await web3.eth.getAccounts();
      const account = accounts[0];
      setCurrentAccount(account);

      const networkId = await web3.eth.net.getId();
      const networkData = SupplyChainABI.networks[networkId];

      if (networkData) {
        const supplychain = new web3.eth.Contract(
          SupplyChainABI.abi,
          networkData.address
        );
        setSupplyChain(supplychain);

        const entityTypes = ["RMS", "MAN", "DIS", "RET"];
        const registeredData = {};

        for (let type of entityTypes) {
          const methodName = `${type.toLowerCase()}Ctr`;
          const entityMethod = type;
          const ctr = await supplychain.methods[methodName]().call();

          const entities = {};
          for (let i = 0; i < ctr; i++) {
            entities[i] = await supplychain.methods[entityMethod](i + 1).call();
          }
          registeredData[type] = entities;
        }

        setRegisteredEntities(registeredData);
        setLoader(false);
      } else {
        window.alert("Smart contract not deployed to current network");
        setLoader(false);
      }
    } catch (error) {
      console.error("Error loading blockchain data:", error);
      setLoader(false);
    }
  };

  const handleInputChange = (type, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (type, event) => {
    event.preventDefault();
    try {
      const { address, name, place } = formData[type];
      const methodMap = {
        RMS: "addRMS",
        MAN: "addManufacturer",
        DIS: "addDistributor",
        RET: "addRetailer",
      };

      const receipt = await SupplyChain.methods[methodMap[type]](
        address,
        name,
        place
      ).send({ from: currentAccount });

      if (receipt) {
        loadBlockchainData();
        // Reset form for this type
        setFormData((prev) => ({
          ...prev,
          [type]: { address: "", name: "", place: "" },
        }));
      }
    } catch (err) {
      console.error(`Error adding ${type}:`, err);
      alert(`An error occurred while registering ${type}!`);
    }
  };

  if (loader) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 flex items-center justify-center">
        <div className="text-2xl text-gray-800 font-semibold">Loading...</div>
      </div>
    );
  }

  const renderEntitySection = (type, title) => (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
      <h4 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        {title}
      </h4>
      <form
        onSubmit={(e) => handleSubmit(type, e)}
        className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6"
      >
        <input
          type="text"
          placeholder="Account Address"
          value={formData[type].address}
          onChange={(e) => handleInputChange(type, "address", e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
        />
        <input
          type="text"
          placeholder={`${title} Name`}
          value={formData[type].name}
          onChange={(e) => handleInputChange(type, "name", e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
        />
        <input
          type="text"
          placeholder="Based In"
          value={formData[type].place}
          onChange={(e) => handleInputChange(type, "place", e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
        />
        <button
          type="submit"
          className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Register
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                ID
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Place
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Account Address
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.keys(registeredEntities[type]).map((key) => (
              <tr key={key} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {registeredEntities[type][key].id.toString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {registeredEntities[type][key].name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {registeredEntities[type][key].place}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          {registeredEntities[type][key].addr.slice(0, 6)}...
                          {registeredEntities[type][key].addr.slice(-4)}
                          <Copy
                            className="w-4 h-4 text-gray-400 hover:text-blue-500 transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              navigator.clipboard.writeText(
                                registeredEntities[type][key].addr
                              );
                            }}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm"
                      >
                        {registeredEntities[type][key].addr}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      {/* Navbar */}
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-6xl">
        <div className="backdrop-blur-md bg-white/80 rounded-2xl shadow-lg p-4">
          <div className="flex justify-between items-center">
            <a
              href="/"
              className="text-3xl font-bold text-gray-800 font-montserrat hover:text-blue-600 transition-all duration-300"
            >
              Medसफ़र
            </a>

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

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-32 pb-16">
        <Accordion type="single" collapsible className="w-full mb-8 mt-9">
          <AccordionItem value="account" className="border-none">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800">
                  Account Details
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">
                      Address:
                    </span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-pointer">
                          <span className="text-gray-600">
                            {currentAccount.slice(0, 6)}...
                            {currentAccount.slice(-4)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="bg-gray-900 text-white px-3 py-2 rounded-lg"
                        >
                          {currentAccount}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Copy
                    className="w-4 h-4 text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
                    onClick={() =>
                      navigator.clipboard.writeText(currentAccount)
                    }
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="space-y-8">
          {renderEntitySection("RMS", "Raw Material Suppliers")}
          {renderEntitySection("MAN", "Manufacturers")}
          {renderEntitySection("DIS", "Distributors")}
          {renderEntitySection("RET", "Retailers")}
        </div>
      </main>
    </div>
  );
}

export default AssignRoles;
