/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Web3 from "web3";
import SupplyChainABI from "../artifacts/contracts/SupplyChain.sol/SupplyChain.json";

function HospitalManagement() {
  const navigate = useNavigate();
  const navItems = [
    { text: "Register", onClick: () => navigate("/roles") },
    { text: "Order Medicines", onClick: () => navigate("/addmed") },
    { text: "Control Supply Chain", onClick: () => navigate("/supply") },
    { text: "Track Medicines", onClick: () => navigate("/track") },
  ];

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("hospitalFormData");
    return saved
      ? JSON.parse(saved)
      : {
          name: "",
          location: "",
          address: "",
        };
  });

  const [requestFormData, setRequestFormData] = useState(() => {
    const saved = localStorage.getItem("requestFormData");
    return saved
      ? JSON.parse(saved)
      : {
          hospitalId: 0,
          medicineID: 0,
          quantity: 0,
          urgent: false,
        };
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [medicineData, setMedicineData] = useState([]);
  const [currentAccount, setCurrentAccount] = useState("");
  const [supplyChain, setSupplyChain] = useState();
  const [hospitals, setHospitals] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isOwnerOrDistributor, setIsOwnerOrDistributor] = useState(false);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loader, setLoader] = useState(false);
  const [showHospitalForm, setShowHospitalForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);

  useEffect(() => {
    loadWeb3();
    loadBlockchainData();
  }, []);

  useEffect(() => {
    localStorage.setItem("hospitalFormData", JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    localStorage.setItem("requestFormData", JSON.stringify(requestFormData));
  }, [requestFormData]);

  useEffect(() => {
    return () => {
      localStorage.removeItem("hospitalFormData");
      localStorage.removeItem("requestFormData");
    };
  }, []);

  const loadWeb3 = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else {
      window.alert(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
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

        // Load hospitals
        const hospitalCount = await supplychain.methods.hospitalCtr().call();
        const hospitalsArray = [];
        for (let i = 1; i <= hospitalCount; i++) {
          const hospital = await supplychain.methods.hospitals(i).call();
          hospitalsArray.push({
            id: parseInt(hospital.id),
            name: hospital.name,
            location: hospital.location,
            address: hospital.addr,
          });
        }
        setHospitals(hospitalsArray);
        localStorage.setItem("hospitals", JSON.stringify(hospitalsArray));

        // Load medicines with batch number and price
        const medicineCount = await supplychain.methods.medicineCtr().call();
        const medicinesArray = [];
        for (let i = 1; i <= medicineCount; i++) {
          const medicine = await supplychain.methods.MedicineStock(i).call();
          const batchNumber = await supplychain.methods
            .getMedicineBatchNumber(i)
            .call();
          const price = await supplychain.methods.getMedicinePrice(i).call();
          medicinesArray.push({
            id: parseInt(medicine.id),
            name: medicine.name,
            description: medicine.description,
            quantity: parseInt(medicine.quantity),
            expiryDate: parseInt(medicine.expiryDate),
            batchNumber: batchNumber,
            priceINR: parseInt(price),
          });
        }
        setMedicineData(medicinesArray);
        localStorage.setItem("medicineData", JSON.stringify(medicinesArray));

        // Fetch pending requests
        const pendingReqs = await supplychain.methods
          .getPendingRequests()
          .call();
        const formattedRequests = pendingReqs.hospitalIDs.map(
          (hospitalId, index) => ({
            hospitalID: parseInt(hospitalId),
            medicineID: parseInt(pendingReqs.medicineIDs[index]),
            quantity: parseInt(pendingReqs.quantities[index]),
            urgent: pendingReqs.urgentFlags[index],
            fulfilled: false,
          })
        );
        setPendingRequests(formattedRequests);
        localStorage.setItem(
          "pendingRequests",
          JSON.stringify(formattedRequests)
        );

        setLoader(false);
      } else {
        window.alert("SupplyChain contract not deployed to detected network.");
        setLoader(false);
      }
    } catch (error) {
      console.error("Error loading blockchain data:", error);
      setLoader(false);
    }
  };

  useEffect(() => {
    if (supplyChain) {
      fetchPendingRequests();
    }
  }, [supplyChain]);

  useEffect(() => {
    const savedHospitals = localStorage.getItem("hospitals");
    if (savedHospitals) setHospitals(JSON.parse(savedHospitals));

    const savedMedicineData = localStorage.getItem("medicineData");
    if (savedMedicineData) setMedicineData(JSON.parse(savedMedicineData));

    const savedPendingRequests = localStorage.getItem("pendingRequests");
    if (savedPendingRequests)
      setPendingRequests(JSON.parse(savedPendingRequests));

    const savedApprovedRequests = localStorage.getItem("approvedRequests");
    if (savedApprovedRequests)
      setApprovedRequests(JSON.parse(savedApprovedRequests));

    const savedCurrentAccount = localStorage.getItem("currentAccount");
    if (savedCurrentAccount) setCurrentAccount(savedCurrentAccount);
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRequestInputChange = (event) => {
    const { name, value } = event.target;
    setRequestFormData({
      ...requestFormData,
      [name]: name === "urgent" ? event.target.checked : parseInt(value) || 0,
    });
  };

  const handleCheckboxChange = (event) => {
    setRequestFormData({ ...requestFormData, urgent: event.target.checked });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await supplyChain.methods
        .addHospital(formData.name, formData.location, formData.address)
        .send({ from: currentAccount });
      alert("Hospital added successfully");
      loadBlockchainData();
    } catch (error) {
      console.error("Error adding hospital:", error);
      alert("Failed to add hospital");
    }
  };

  const handleRequestSubmit = async (event) => {
    event.preventDefault();
    try {
      // Validate inputs
      if (
        !requestFormData.hospitalId ||
        !requestFormData.medicineID ||
        !requestFormData.quantity
      ) {
        alert("Please fill in all fields with valid numbers");
        return;
      }

      await supplyChain.methods
        .requestMedicine(
          parseInt(requestFormData.hospitalId),
          parseInt(requestFormData.medicineID),
          parseInt(requestFormData.quantity),
          requestFormData.urgent
        )
        .send({ from: currentAccount });

      alert("Medicine requested successfully");
      loadBlockchainData();

      // Reset form
      setRequestFormData({
        hospitalId: 0,
        medicineID: 0,
        quantity: 0,
        urgent: false,
      });
    } catch (error) {
      console.error("Error requesting medicine:", error);
      alert(`Failed to request medicine: ${error.message}`);
    }
  };

  const handleApprove = async (hospitalId, medicineId, quantity) => {
    try {
      // Add confirmation dialog
      const confirmApproval = window.confirm(
        `Are you sure you want to approve this request for ${quantity} units of medicine ID ${medicineId}?`
      );

      if (!confirmApproval) return;

      await supplyChain.methods
        .transferMedicine(hospitalId, medicineId, quantity)
        .send({ from: currentAccount });

      alert("Medicine request approved and transferred successfully");

      // Add the approved request to the approvedRequests state
      const approvedRequest = {
        hospitalID: hospitalId,
        medicineID: medicineId,
        quantity: quantity,
        urgent: pendingRequests.find(
          (req) =>
            req.hospitalID === hospitalId && req.medicineID === medicineId
        ).urgent,
      };

      setApprovedRequests((prev) => [...prev, approvedRequest]);
      localStorage.setItem(
        "approvedRequests",
        JSON.stringify([...approvedRequests, approvedRequest])
      );

      // Remove the approved request from pendingRequests
      setPendingRequests((prev) =>
        prev.filter(
          (req) =>
            !(req.hospitalID === hospitalId && req.medicineID === medicineId)
        )
      );
      localStorage.setItem(
        "pendingRequests",
        JSON.stringify(
          pendingRequests.filter(
            (req) =>
              !(req.hospitalID === hospitalId && req.medicineID === medicineId)
          )
        )
      );

      // Reload the data to update the UI
      loadBlockchainData();
    } catch (error) {
      console.error("Error approving medicine request:", error);
      alert(`Failed to approve request: ${error.message}`);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const pendingReqs = await supplyChain.methods.getPendingRequests().call();

      // Transform the returned data into an array of objects
      const formattedRequests = pendingReqs.hospitalIDs.map(
        (hospitalId, index) => ({
          hospitalID: parseInt(hospitalId),
          medicineID: parseInt(pendingReqs.medicineIDs[index]),
          quantity: parseInt(pendingReqs.quantities[index]),
          urgent: pendingReqs.urgentFlags[index],
          fulfilled: false,
        })
      );

      console.log("Pending Requests:", formattedRequests); // Debug log
      setPendingRequests(formattedRequests);
      localStorage.setItem(
        "pendingRequests",
        JSON.stringify(formattedRequests)
      );
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
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
      {/* Header Section */}
      <div className="mt-32">
        <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-2xl shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold mb-4">
            Hospital Management System
          </h1>
          <p className="text-lg opacity-90 mb-4">
            Track and manage hospital registrations, medicine requests, and
            inventory distribution
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/40 rounded-lg p-4">
              <h3 className="font-semibold">Total Hospitals</h3>
              <p className="text-2xl">{hospitals.length}</p>
            </div>
            <div className="bg-white/40 rounded-lg p-4">
              <h3 className="font-semibold">Pending Requests</h3>
              <p className="text-2xl">{pendingRequests.length}</p>
            </div>
            <div className="bg-white/40 rounded-lg p-4">
              <h3 className="font-semibold">Approved Requests</h3>
              <p className="text-2xl">{approvedRequests.length}</p>
            </div>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 mb-6">
          <button
            onClick={() => setShowHospitalForm(!showHospitalForm)}
            className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {showHospitalForm
              ? "Hide Registration Form"
              : "Register New Hospital"}
          </button>

          {currentAccount && (
            <button
              onClick={() => setShowRequestForm(!showRequestForm)}
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {showRequestForm ? "Hide Request Form" : "Request New Medicine"}
            </button>
          )}
        </div>

        {/* Forms Section */}
        {/* Hospital Registration Form */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            showHospitalForm
              ? "opacity-100 max-h-[1000px]"
              : "opacity-0 max-h-0 overflow-hidden"
          }`}
        >
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              Register Hospital
            </h2>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <input
                type="text"
                name="name"
                placeholder="Hospital Name"
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                required
              />
              <input
                type="text"
                name="location"
                placeholder="Location"
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                required
              />
              <input
                type="text"
                name="address"
                placeholder="Ethereum Address"
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 md:col-span-2"
                required
              />
              <button
                type="submit"
                className="md:col-span-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Register Hospital
              </button>
            </form>
          </div>
        </div>

        {/* Medicine Request Form */}
        {currentAccount && (
          <div
            className={`transition-all duration-300 ease-in-out ${
              showRequestForm
                ? "opacity-100 max-h-[1000px]"
                : "opacity-0 max-h-0 overflow-hidden"
            }`}
          >
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                Request Medicine
              </h2>
              <form
                onSubmit={handleRequestSubmit}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <input
                  type="number"
                  name="hospitalId"
                  placeholder="Hospital ID"
                  value={requestFormData.hospitalId || ""}
                  onChange={handleRequestInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  min="1"
                  required
                />
                <input
                  type="number"
                  name="medicineID"
                  placeholder="Medicine ID"
                  value={requestFormData.medicineID || ""}
                  onChange={handleRequestInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  min="1"
                  required
                />
                <input
                  type="number"
                  name="quantity"
                  placeholder="Quantity"
                  value={requestFormData.quantity || ""}
                  onChange={handleRequestInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  min="1"
                  required
                />
                <div className="flex items-center space-x-2 px-4">
                  <input
                    type="checkbox"
                    name="urgent"
                    id="urgent"
                    checked={requestFormData.urgent}
                    onChange={handleCheckboxChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="urgent" className="text-gray-700 font-medium">
                    Urgent Request
                  </label>
                </div>
                <button
                  type="submit"
                  className="md:col-span-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Submit Request
                </button>
              </form>
            </div>
          </div>
        )}
        {/* Tables Section */}
        {/* Registered Hospitals Table */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            Registered Hospitals
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hospital ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ethereum Address
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {hospitals.map((hospital) => (
                  <tr key={hospital.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {hospital.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {hospital.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {hospital.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {hospital.address}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Requests Table */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            Pending Requests
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hospital ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Medicine ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Urgent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingRequests.map((request, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.hospitalID}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.medicineID}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.urgent ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Urgent
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Regular
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() =>
                          handleApprove(
                            request.hospitalID,
                            request.medicineID,
                            request.quantity
                          )
                        }
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-300"
                      >
                        Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Approved Requests Table */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            Approved Requests
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hospital ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Medicine ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Urgent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {approvedRequests.map((request, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.hospitalID}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.medicineID}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.urgent ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Urgent
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Regular
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        Approved
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HospitalManagement;
