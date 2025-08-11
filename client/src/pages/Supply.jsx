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
import { ReviewModal } from "@/components/ui/ReviewModal";
import {
  Package,
  Factory,
  Truck,
  Store,
  User,
  ChevronRight,
} from "lucide-react";

function Supply() {
  const navigate = useNavigate();
  const [currentAccount, setCurrentAccount] = useState("");
  const [loader, setLoader] = useState(true);
  const [supplyChain, setSupplyChain] = useState();
  const [medicines, setMedicines] = useState({});
  const [medStages, setMedStages] = useState([]);
  const [stepInputs, setStepInputs] = useState({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

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
      try {
        await window.ethereum.enable();
      } catch (error) {
        window.alert("User denied account access", error);
      }
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
      if (accounts.length === 0) {
        window.alert("Please connect to MetaMask.");
        setLoader(false);
        return;
      }
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
        const med = {};
        const medStage = [];

        for (let i = 1; i <= medCtr; i++) {
          med[i] = await supplychain.methods.MedicineStock(i).call();
          medStage[i] = await supplychain.methods.showStage(i).call();
        }

        setMedicines(med);
        setMedStages(medStage);
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

  const handleInputChange = (event, step) => {
    const { value } = event.target;
    setStepInputs((prev) => ({
      ...prev,
      [step]: value,
    }));
  };

  const executeSupplyChainStep = async (method, step) => {
    try {
      const receipt = await supplyChain.methods[method](stepInputs[step]).send({
        from: currentAccount,
      });

      if (receipt) {
        loadBlockchainData();
      }
    } catch (error) {
      console.error(`Error in ${method}:`, error);
      alert("An error occurred!");
    }
  };

  const supplyChainSteps = [
    {
      title: "Step 1: Supply Raw Materials",
      desc: "Only a registered Raw Material Supplier can perform this step",
      method: "RMSsupply",
      buttonText: "Supply",
    },
    {
      title: "Step 2: Manufacture",
      desc: "Only a registered Manufacturer can perform this step",
      method: "Manufacturing",
      buttonText: "Manufacture",
    },
    {
      title: "Step 3: Distribute",
      desc: "Only a registered Distributor can perform this step",
      method: "Distribute",
      buttonText: "Distribute",
    },
    {
      title: "Step 4: Retail",
      desc: "Only a registered Retailer can perform this step",
      method: "Retail",
      buttonText: "Retail",
    },
    {
      title: "Step 5: Mark as Sold",
      desc: "Only a registered Retailer can perform this step",
      method: "sold",
      buttonText: "Sold",
    },
  ];

  // Update Quantity
  const updateQuantity = async (medicineId, newQuantity) => {
    try {
      const receipt = await supplyChain.methods
        .updateMedicineQuantity(medicineId, newQuantity)
        .send({ from: currentAccount });
      if (receipt) {
        loadBlockchainData();
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      alert("Failed to update quantity.");
    }
  };

  const handleReviewSubmit = (reviewData) => {
    const reviews = JSON.parse(localStorage.getItem("medicineReviews") || "{}");

    if (!reviews[reviewData.medicineId]) {
      reviews[reviewData.medicineId] = [];
    }

    reviews[reviewData.medicineId].push(reviewData);
    localStorage.setItem(
      "medicineReviews",
      JSON.stringify(reviews, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    // If the rating is low or there are flags, you might want to show an alert
    if (
      reviewData.rating <= 2 ||
      Object.values(reviewData.flags).some((flag) => flag)
    ) {
      alert("Successful: Issues reported with this medicine transfer!");
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
        {/* Current Account */}
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

        {/* Supply Chain Flow */}
        <div className="w-full p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg shadow-sm">
            {[
              { icon: Package, label: "Order", color: "text-blue-600" },
              { icon: Factory, label: "Supplier", color: "text-purple-600" },
              {
                icon: Factory,
                label: "Manufacturer",
                color: "text-indigo-600",
              },
              { icon: Truck, label: "Distributor", color: "text-green-600" },
              { icon: Store, label: "Retailer", color: "text-yellow-600" },
              { icon: User, label: "Consumer", color: "text-red-600" },
            ].map((step, index) => (
              <div key={index} className="flex items-center group">
                <div className="flex flex-col items-center transition-all duration-300 hover:scale-110">
                  <div
                    className={`p-3 rounded-full ${step.color} bg-white shadow-md group-hover:shadow-lg`}
                  >
                    <step.icon className="h-6 w-6" />
                  </div>
                  <span className="mt-2 text-sm font-medium text-gray-600 group-hover:text-gray-900">
                    {step.label}
                  </span>
                </div>
                {index < 5 && (
                  <ChevronRight className="h-5 w-5 mx-2 text-gray-400 hidden md:block" />
                )}
                {index < 5 && (
                  <div className="w-px h-8 bg-gray-200 md:hidden" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Medicine Inventory Table */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-3xl font-bold text-gray-800 text-center mb-6">
            Medicine Inventory
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Medicine ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price (INR)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Update Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Review
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.keys(medicines).map((key, index) => {
                  const medicine = medicines[key];
                  const stage = medStages[key] || "N/A";
                  const expiryDate = medicine.expiryDate
                    ? new Date(
                        Number(medicine.expiryDate) * 1000
                      ).toLocaleDateString()
                    : "N/A";

                  return (
                    <tr key={key} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {medicine.id.toString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {medicine.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {medicine.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {medicine.quantity.toString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expiryDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {medicine.batchNumber || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{medicine.priceINR?.toLocaleString("en-IN") || "0"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stage}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            updateQuantity(
                              medicine.id,
                              e.target.quantity.value
                            );
                            e.target.reset();
                          }}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="number"
                            name="quantity"
                            min="0"
                            placeholder="New Qty"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="submit"
                            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-300"
                          >
                            Update
                          </button>
                        </form>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={() => {
                            setSelectedReview({
                              medicineId: medicine.id,
                              stageName: stage,
                            });
                            setIsReviewModalOpen(true);
                          }}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          ⭐ Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Supply Chain Steps */}
        {supplyChainSteps.map((step, index) => (
          <div key={index} className="bg-white rounded-2xl p-8 mb-8 shadow-lg">
            <h4 className="text-2xl font-bold text-gray-800 mb-4">
              {step.title}
            </h4>
            <p className="text-gray-600 mb-6">{step.desc}</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeSupplyChainStep(step.method, index);
              }}
              className="flex flex-col md:flex-row gap-4"
            >
              <input
                type="text"
                value={stepInputs[index] || ""}
                onChange={(e) => handleInputChange(e, index)}
                placeholder="Enter Medicine ID"
                required
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {step.buttonText}
              </button>
            </form>
          </div>
        ))}
      </main>

      {isReviewModalOpen && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          onSubmit={handleReviewSubmit}
          stageName={selectedReview?.stageName}
          medicineId={selectedReview?.medicineId}
        />
      )}
    </div>
  );
}

export default Supply;
