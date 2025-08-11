import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Web3 from "web3";
import SupplyChainABI from "../artifacts/contracts/SupplyChain.sol/SupplyChain.json";
import { FaRecycle, FaTrash, FaLeaf } from "react-icons/fa";
import { MdWarning } from "react-icons/md";
import { BiTimer } from "react-icons/bi";
import { GiMedicinePills } from "react-icons/gi";

function ReverseSupplyChain() {
  // State management
  const navigate = useNavigate();
  const navItems = [
    { text: "Register", onClick: () => navigate("/roles") },
    { text: "Order Medicines", onClick: () => navigate("/addmed") },
    { text: "Control Supply Chain", onClick: () => navigate("/supply") },
    { text: "Track Medicines", onClick: () => navigate("/track") },
  ];
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentAccount, setCurrentAccount] = useState("");
  const [supplyChain, setSupplyChain] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loader, setLoader] = useState(false);
  const [returnMedicineId, setReturnMedicineId] = useState("");
  const [stats, setStats] = useState({
    returned: 0,
    destroyed: 0,
  });

  useEffect(() => {
    loadWeb3();
    loadBlockchainData();
  }, []);

  const loadWeb3 = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else {
      window.alert("Non-Ethereum browser detected. Consider trying MetaMask!");
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

        // Check if current account is owner
        const owner = await supplychain.methods.Owner().call();
        const isOwnerAccount = account.toLowerCase() === owner.toLowerCase();
        setIsOwner(isOwnerAccount);

        await fetchMedicineData(supplychain);
      } else {
        window.alert("Smart contract not deployed to detected network.");
      }
      setLoader(false);
    } catch (error) {
      console.error("Error loading blockchain data:", error);
      setLoader(false);
    }
  };

  const fetchMedicineData = async (contract) => {
    try {
      const medicineCtr = await contract.methods.medicineCtr().call();
      const medicinesArray = [];
      let returnedCount = 0;
      let destroyedCount = 0;

      for (let i = 1; i <= Number(medicineCtr); i++) {
        try {
          const medicine = await contract.methods.MedicineStock(i).call();
          const isExpired = await contract.methods.checkExpiry(i).call();

          if (isExpired) {
            const batchNumber = await contract.methods
              .getMedicineBatchNumber(i)
              .call();
            const price = await contract.methods.getMedicinePrice(i).call();

            // Count stages for stats
            if (Number(medicine.stage) === 6) returnedCount++; // ReturnInitiated
            if (Number(medicine.stage) === 7) destroyedCount++; // Destroyed

            let returnDate = "-";
            if (
              medicine.stageTimestamps &&
              medicine.stageTimestamps.length > 6 &&
              medicine.stageTimestamps[6]
            ) {
              returnDate = new Date(
                Number(medicine.stageTimestamps[6]) * 1000
              ).toLocaleDateString();
            }

            medicinesArray.push({
              id: Number(medicine.id),
              name: medicine.name,
              batchNumber: batchNumber,
              expiryDate: new Date(
                Number(medicine.expiryDate) * 1000
              ).toLocaleDateString(),
              returnDate: returnDate,
              stage: getStageString(Number(medicine.stage)),
              quantity: Number(medicine.quantity),
              priceINR: Number(price),
            });
          }
        } catch (err) {
          console.error(`Error fetching medicine ${i}:`, err);
          continue;
        }
      }

      setMedicines(medicinesArray);
      setStats({
        returned: returnedCount,
        destroyed: destroyedCount,
      });
    } catch (error) {
      console.error("Error fetching medicine data:", error);
    }
  };

  const handleInitiateReturn = async (medicineId) => {
    try {
      if (!isOwner) {
        alert("Only owner can initiate returns");
        return;
      }

      if (!medicineId || isNaN(medicineId)) {
        alert("Please enter a valid Medicine ID");
        return;
      }

      // Check if medicine is expired
      const isExpired = await supplyChain.methods
        .checkExpiry(Number(medicineId))
        .call();
      if (!isExpired) {
        alert("Medicine is not expired yet");
        return;
      }

      await supplyChain.methods
        .initiateReturn(Number(medicineId))
        .send({ from: currentAccount });

      await fetchMedicineData(supplyChain);
      alert("Return initiated successfully");
      setReturnMedicineId("");
    } catch (error) {
      console.error("Error initiating return:", error);
      alert(`Failed to initiate return: ${error.message}`);
    }
  };

  const handleConfirmDestruction = async (medicineId) => {
    try {
      if (!isOwner) {
        alert("Only owner can confirm destruction");
        return;
      }

      await supplyChain.methods
        .confirmDestruction(Number(medicineId))
        .send({ from: currentAccount });

      await fetchMedicineData(supplyChain);
      alert("Medicine destroyed successfully");
    } catch (error) {
      console.error("Error confirming destruction:", error);
      alert(`Failed to confirm destruction: ${error.message}`);
    }
  };

  const getStageString = (stage) => {
    const stages = [
      "Init",
      "RawMaterialSupply",
      "Manufacture",
      "Distribution",
      "Retail",
      "Sold",
      "ReturnInitiated",
      "Destroyed",
    ];
    return stages[stage] || "Unknown";
  };

  return (
    <div className="container mx-auto p-4">
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
      <main className="mt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 mb-10 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <FaLeaf className="text-white/90 text-3xl" />
            <h1 className="text-3xl font-bold">
              Reverse Supply Chain Management
            </h1>
          </div>
          <p className="text-white/80 ml-10">
            Efficiently manage medicine returns and disposal
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-100 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <FaRecycle className="text-emerald-600 text-2xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Returns Initiated
                </h3>
                <p className="text-3xl font-bold text-emerald-600">
                  {stats.returned}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-100 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <FaTrash className="text-emerald-600 text-2xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Medicines Destroyed
                </h3>
                <p className="text-3xl font-bold text-emerald-600">
                  {stats.destroyed}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Return Initiation Form */}
        {isOwner && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <GiMedicinePills className="text-emerald-600 text-xl" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">
                Initiate Medicine Return
              </h2>
            </div>
            <div className="flex gap-4">
              <input
                type="number"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                placeholder="Enter Medicine ID"
                value={returnMedicineId}
                onChange={(e) => setReturnMedicineId(e.target.value)}
              />
              <button
                onClick={() => handleInitiateReturn(returnMedicineId)}
                className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 ${
                  isOwner
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
                disabled={!isOwner || !returnMedicineId}
              >
                <FaRecycle />
                <span>Initiate Return</span>
              </button>
            </div>
          </div>
        )}

        {/* Medicines Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "ID",
                    "Name",
                    "Batch Number",
                    "Expiry Date",
                    "Return Date",
                    "Stage",
                    "Quantity",
                    "Price (INR)",
                    "Actions",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {medicines.map((medicine) => (
                  <tr
                    key={medicine.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {medicine.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {medicine.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {medicine.batchNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {medicine.expiryDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {medicine.returnDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                  ${
                    medicine.stage === "ReturnInitiated"
                      ? "bg-yellow-100 text-yellow-800"
                      : medicine.stage === "Destroyed"
                      ? "bg-red-100 text-red-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                      >
                        {medicine.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {medicine.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {medicine.priceINR}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isOwner && (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleInitiateReturn(medicine.id)}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm ${
                              medicine.stage === "ReturnInitiated" ||
                              medicine.stage === "Destroyed"
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            }`}
                            disabled={
                              medicine.stage === "ReturnInitiated" ||
                              medicine.stage === "Destroyed"
                            }
                          >
                            <FaRecycle className="text-sm" />
                            <span>Return</span>
                          </button>
                          {medicine.stage === "ReturnInitiated" && (
                            <button
                              onClick={() =>
                                handleConfirmDestruction(medicine.id)
                              }
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm bg-red-100 text-red-700 hover:bg-red-200"
                            >
                              <FaTrash className="text-sm" />
                              <span>Destroy</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notice for Non-Owners */}
        {!isOwner && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-100 rounded-xl shadow-sm flex items-center gap-3">
            <MdWarning className="text-yellow-500 text-xl" />
            <span className="text-yellow-700">
              Only the owner can initiate returns and confirm destruction.
            </span>
          </div>
        )}

        {/* Loading State */}
        {loader && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="animate-spin text-emerald-600 text-4xl">
              <BiTimer />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ReverseSupplyChain;
