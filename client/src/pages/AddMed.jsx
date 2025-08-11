/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Web3 from "web3";
import SupplyChainABI from "../artifacts/contracts/SupplyChain.sol/SupplyChain.json";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Copy } from "lucide-react";
function AddMed() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [loader, setLoader] = useState(true);
  const [supplyChain, setSupplyChain] = useState();
  const [medicines, setMedicines] = useState([]);
  const [medStages, setMedStages] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    quantity: 0,
    expiryDate: "",
    batchNumber: "",
    priceINR: 0,
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
      const networkData = SupplyChainABI.networks
        ? SupplyChainABI.networks[networkId]
        : null;

      if (networkData) {
        const supplychain = new web3.eth.Contract(
          SupplyChainABI.abi,
          networkData.address
        );
        setSupplyChain(supplychain);

        const medCtr = await supplychain.methods.medicineCtr().call();
        const meds = [];
        const stages = [];
        
        for (let i = 1; i <= medCtr; i++) {
          const medicine = await supplychain.methods.MedicineStock(i).call();
          const stage = await supplychain.methods.showStage(i).call();
          
          meds.push({
            id: parseInt(medicine.id),
            name: medicine.name,
            description: medicine.description,
            quantity: parseInt(medicine.quantity),
            expiryDate: parseInt(medicine.expiryDate),
            batchNumber: medicine.batchNumber,
            priceINR: parseInt(medicine.priceINR)
          });
          stages.push(stage.toString());
        }

        localStorage.setItem('medicines', JSON.stringify({
          data: meds,
          timestamp: Date.now()
        }));
        
        setMedicines(meds);
        setMedStages(stages);
        setLoader(false);
      } else {
        window.alert("Smart contract not deployed to the current network");
        setLoader(false);
      }
    } catch (error) {
      console.error("Error loading blockchain data:", error);
      const savedMedicines = localStorage.getItem('medicines');
      if (savedMedicines) {
        const { data } = JSON.parse(savedMedicines);
        setMedicines(data);
      }
      setLoader(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const receipt = await supplyChain.methods
        .addMedicine(
          formData.name,
          formData.description,
          parseInt(formData.quantity),
          Math.floor(new Date(formData.expiryDate).getTime() / 1000),
          (formData.batchNumber).toString(),
          parseInt(formData.priceINR)
        )
        .send({ from: currentAccount });
      if (receipt) {
        loadBlockchainData();
        setFormData({
          name: "",
          description: "",
          quantity: 0,
          expiryDate: "",
          batchNumber: "",
          priceINR: 0,
        });
        setShowForm(false);
      }
    } catch (err) {
      console.error("Transaction failed:", err);
      alert(`Transaction failed: ${err.message}`);
    }
  };

  if (loader) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 flex items-center justify-center">
        <div className="text-2xl text-gray-800 font-semibold">Loading...</div>
      </div>
    );
  }

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
        <div className="max-w-7xl mx-auto">
          {/* Account Info */}
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

          {/* Toggle Button */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {showForm ? "Hide Form" : "Add New Medicine"}
            </button>
          </div>

          {/* Add Medicine Form - Hidden by default */}
          <div
            className={`transition-all duration-300 ease-in-out ${
              showForm
                ? "opacity-100 max-h-[1000px]"
                : "opacity-0 max-h-0 overflow-hidden"
            }`}
          >
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                Add New Medicine
              </h2>
              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <input
                  type="text"
                  name="name"
                  placeholder="Medicine Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
                <input
                  type="text"
                  name="description"
                  placeholder="Description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
                <input
                  type="number"
                  name="quantity"
                  placeholder="Quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
                <input
                  type="text"
                  name="batchNumber"
                  placeholder="Batch Number"
                  value={formData.batchNumber}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
                <input
                  type="number"
                  name="priceINR"
                  placeholder="Unit Price (in INR)"
                  value={formData.priceINR}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
                <button
                  type="submit"
                  className="md:col-span-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Medicine
                </button>
              </form>
            </div>
          </div>

          {/* Medicine List */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              Medicine List
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Number</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price (INR)</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {medicines.map((medicine, index) => (
                    <tr key={medicine.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {medicine.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {medicine.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {medicine.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {medicine.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(
                          medicine.expiryDate * 1000
                        ).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {medicine.batchNumber || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{(medicine.priceINR || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {medStages[index]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AddMed;
