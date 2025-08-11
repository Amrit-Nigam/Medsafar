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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Icons } from "@/components/icons";
import {
  CheckCircle2,
  Package,
  Factory,
  Truck,
  Store,
  Clock,
  AlertTriangle,
  Timer,
  Search,
  Home,
} from "lucide-react";
import { jsPDF } from "jspdf";
import QRCode from 'react-qr-code';

function Track() {
  const navigate = useNavigate();
  const [currentaccount, setCurrentaccount] = useState("");
  const [loader, setloader] = useState(true);
  const [SupplyChain, setSupplyChain] = useState();
  const [MED, setMED] = useState();
  const [MedStage, setMedStage] = useState();
  const [ID, setID] = useState();
  const [RMS, setRMS] = useState();
  const [MAN, setMAN] = useState();
  const [DIS, setDIS] = useState();
  const [RET, setRET] = useState();
  const [TrackTillSold, showTrackTillSold] = useState(false);
  const [TrackTillRetail, showTrackTillRetail] = useState(false);
  const [TrackTillDistribution, showTrackTillDistribution] = useState(false);
  const [TrackTillManufacture, showTrackTillManufacture] = useState(false);
  const [TrackTillRMS, showTrackTillRMS] = useState(false);
  const [TrackTillOrdered, showTrackTillOrdered] = useState(false);
  const [showInventory, setShowInventory] = useState(true);
  const understockThreshold = 10; // Define your threshold value
  const overstockThreshold = 1000; // Define your threshold value
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [medicines, setMedicines] = useState({});

  const navItems = [
    { text: "Register", onClick: () => navigate("/roles") },
    { text: "Order Medicines", onClick: () => navigate("/addmed") },
    { text: "Control Supply Chain", onClick: () => navigate("/supply") },
    { text: "Track Medicines", onClick: () => navigate("/track") },
  ];

  useEffect(() => {
    loadWeb3();
    loadBlockchaindata();
  }, []);

  const loadWeb3 = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
  };

  const loadBlockchaindata = async () => {
    setloader(true);
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];
    setCurrentaccount(account);
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
      var i;
      const medCtr = await supplychain.methods.medicineCtr().call();
      const med = {};
      const medStage = [];
      for (i = 0; i < medCtr; i++) {
        med[i + 1] = await supplychain.methods.MedicineStock(i + 1).call();
        medStage[i + 1] = await supplychain.methods.showStage(i + 1).call();
      }
      setMED(med);
      setMedStage(medStage);
      const rmsCtr = await supplychain.methods.rmsCtr().call();
      const rms = {};
      for (i = 0; i < rmsCtr; i++) {
        rms[i + 1] = await supplychain.methods.RMS(i + 1).call();
      }
      setRMS(rms);
      const manCtr = await supplychain.methods.manCtr().call();
      const man = {};
      for (i = 0; i < manCtr; i++) {
        man[i + 1] = await supplychain.methods.MAN(i + 1).call();
      }
      setMAN(man);
      const disCtr = await supplychain.methods.disCtr().call();
      const dis = {};
      for (i = 0; i < disCtr; i++) {
        dis[i + 1] = await supplychain.methods.DIS(i + 1).call();
      }
      setDIS(dis);
      const retCtr = await supplychain.methods.retCtr().call();
      const ret = {};
      for (i = 0; i < retCtr; i++) {
        ret[i + 1] = await supplychain.methods.RET(i + 1).call();
      }
      setMedicines(med);
      setRET(ret);
      setloader(false);
    } else {
      window.alert("The smart contract is not deployed to current network");
    }
  };

  const handlerChangeID = (event) => {
    setID(event.target.value);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp || timestamp === "0") return "N/A";
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const getStockAlert = (quantity) => {
    if (quantity < understockThreshold) return "Understock";
    if (quantity > overstockThreshold) return "Overstock";
    return "Stock Level Normal";
  };

  const [stageTimes, setStageTimes] = useState({});

  useEffect(() => {
    const fetchStageTimes = async () => {
      try {
        const times = await SupplyChain.methods.timeSpentInStages(ID).call();
        return setStageTimes(times.map((time) => `${time} seconds`));
      } catch (error) {
        console.error("Error fetching time spent in stages:", error);
      }
    };
    if (ID) {
      fetchStageTimes();
    }
  }, [ID]);

  const SupplyChainStages = {
    MANUFACTURING: "Manufacturing",
    QUALITY_CHECK: "Quality Check",
    PACKAGING: "Packaging", 
    DISTRIBUTION: "Distribution",
    RETAIL: "Retail", 
    SOLD: "Sold"
  };

  const SupplyChainStageNames = {
    0: SupplyChainStages.MANUFACTURING,
    1: SupplyChainStages.QUALITY_CHECK,
    2: SupplyChainStages.PACKAGING,
    3: SupplyChainStages.DISTRIBUTION,
    4: SupplyChainStages.RETAIL,
    5: SupplyChainStages.SOLD
  };
  
  const renderMedicineDetails = () => {
    const stockAlert = getStockAlert(Number(MED[ID].quantity));
    return (
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-2 text-lg">
          <Package className="w-5 h-5 text-blue-500" />
          <span className="font-semibold">Quantity:</span>
          <Badge variant="secondary" className="px-3">
            {Number(MED[ID].quantity)}
          </Badge>
        </div>
  
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-purple-500" />
            <span className="font-semibold">Stage Timestamps</span>
          </div>
          <div className="pl-4 border-l-2 border-purple-200 space-y-3">
            {MED[ID] &&
            MED[ID].stageTimestamps &&
            MED[ID].stageTimestamps.length > 0 ? (
              MED[ID].stageTimestamps.map((timestamp, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 relative hover:bg-slate-50 p-2 rounded-md transition-colors"
                >
                  <div className="h-3 w-3 rounded-full bg-purple-500 absolute -left-[1.68rem]" />
                  <span className="font-medium text-purple-700">
                    {SupplyChainStageNames[index] || `Stage ${index}`}
                  </span>
                  <span className="text-gray-600">
                    {formatTimestamp(timestamp)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">
                No stage timestamps available
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg">
            <Timer className="w-5 h-5 text-orange-500" />
            <span className="font-semibold">Time Spent in Each Stage</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {Object.entries(stageTimes).map(([stage, time]) => (
              <div
                key={stage}
                className="flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <span className="font-medium text-orange-700">
                  {SupplyChainABI.enums && SupplyChainABI.enums.STAGE
                    ? Object.keys(SupplyChainABI.enums.STAGE)[stage]
                    : `Stage ${stage}`}
                </span>
                <Badge
                  variant="secondary"
                  className="bg-orange-200 text-orange-700"
                >
                  {time}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t">
          <AlertTriangle
            className={`w-5 h-5 ${
              stockAlert.includes("Low") ? "text-red-500" : "text-green-500"
            }`}
          />
          <span className="font-semibold">Stock Alert:</span>
          <Badge
            variant="outline"
            className={`${
              stockAlert.includes("Low")
                ? "border-red-500 text-red-700 bg-red-50"
                : "border-green-500 text-green-700 bg-green-50"
            }`}
          >
            {stockAlert}
          </Badge>
        </div>
      </Card>
    );
  };

  const getPDFData = () => {
    const medicineData = MED[ID];
    
    // Check if medicineData is defined
    if (!medicineData) {
      console.error("Medicine data not found for ID:", ID);
      return {}; // Return an empty object or handle the error as needed
    }

    return {
      medicineId: medicineData.id,
      name: medicineData.name,
      description: medicineData.description,
      quantity: Number(medicineData.quantity),
      batchNumber: medicineData.batchNumber || 'N/A', // Add batch number
      expiryDate: medicineData.expiryDate 
        ? new Date(Number(medicineData.expiryDate) * 1000).toLocaleDateString() 
        : 'N/A', // Add expiry date
      priceINR: medicineData.priceINR || 0, // Add price
      currentStage: MedStage[ID],
      supplierDetails: {
        id: RMS[medicineData.RMSid]?.id,
        name: RMS[medicineData.RMSid]?.name,
        place: RMS[medicineData.RMSid]?.place
      },
      manufacturerDetails: {
        id: MAN[medicineData.MANid]?.id,
        name: MAN[medicineData.MANid]?.name,
        place: MAN[medicineData.MANid]?.place
      },
      distributorDetails: {
        id: DIS[medicineData.DISid]?.id,
        name: DIS[medicineData.DISid]?.name,
        place: DIS[medicineData.DISid]?.place
      },
      retailerDetails: {
        id: RET[medicineData.RETid]?.id,
        name: RET[medicineData.RETid]?.name,
        place: RET[medicineData.RETid]?.place
      }
    };
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const data = getPDFData();
    
    // Check if data is empty or invalid
    if (Object.keys(data).length === 0) {
      alert("No medicine data available to download.");
      return;
    }
    
    doc.text("Medicine Tracking Details", 20, 20);
    doc.text(`Medicine ID: ${data.medicineId}`, 20, 30);
    doc.text(`Name: ${data.name}`, 20, 40);
    doc.text(`Description: ${data.description}`, 20, 50);
    doc.text(`Quantity: ${data.quantity}`, 20, 60);
    doc.text(`Batch Number: ${data.batchNumber}`, 20, 70);
    doc.text(`Expiry Date: ${data.expiryDate}`, 20, 80);
    doc.text(`Price (INR): ₹${data.priceINR.toLocaleString()}`, 20, 90);
    doc.text(`Current Stage: ${data.currentStage}`, 20, 100);
    
    // Add more details as needed
    doc.text("Supplier Details:", 20, 120);
    doc.text(`ID: ${data.supplierDetails.id}`, 30, 130);
    doc.text(`Name: ${data.supplierDetails.name}`, 30, 140);
    doc.text(`Place: ${data.supplierDetails.place}`, 30, 150);

    // Similar sections for manufacturer, distributor, retailer details

    doc.save("medicine_tracking_details.pdf");
  };

  const handlerSubmit = async (event) => {
    event.preventDefault();
    const ctr = await SupplyChain.methods.medicineCtr().call();
    
    if (!(ID > 0 && ID <= ctr)) {
      alert("Invalid Medicine ID!");
      return;
    }

    const currentStage = MED[ID].stage;
    let stage;

    switch (Number(currentStage)) {
      case 5:
        showTrackTillSold(true);
        stage = 'Sold';
        break;
      case 4:
        showTrackTillRetail(true);
        stage = 'Retail';
        break;
      case 3:
        showTrackTillDistribution(true);
        stage = 'Distribution';
        break;
      case 2:
        showTrackTillManufacture(true);
        stage = 'Manufacturing';
        break;
      case 1:
        showTrackTillRMS(true);
        stage = 'Raw Material';
        break;
      default:
        showTrackTillOrdered(true);
        stage = 'Ordered';
    }
  };

  if (loader) {
    return (
      <div className="flex justify-center items-center h-screen">
        <h1 className="text-2xl font-bold">Loading...</h1>
      </div>
    );
  }

  // Track till Sold out stage
  if (TrackTillSold) {
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

        <main className="container mt-8 mx-auto px-4 pt-24 pb-16 space-y-8 bg-gradient-to-b from-slate-50 to-white">
        {/* Status Timeline */}
        <div className="flex justify-between items-center mb-8 px-4">
          <div className="w-full flex items-center">
            <div className="flex flex-col items-center text-green-600">
              <CheckCircle2 className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Supplier</span>
            </div>
            <div className="h-1 flex-1 bg-green-500" />

            <div className="flex flex-col items-center text-green-600">
              <Factory className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Manufacturer</span>
            </div>
            <div className="h-1 flex-1 bg-green-500" />

            <div className="flex flex-col items-center text-green-600">
              <Truck className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Distributor</span>
            </div>
            <div className="h-1 flex-1 bg-green-500" />

            <div className="flex flex-col items-center text-green-600">
              <Store className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Retailer</span>
            </div>
          </div>
        </div>
        <Card className="border-l-4 border-blue-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="text-2xl text-blue-700">
              Medicine Tracking Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Medicine ID:</span>
                <Badge variant="secondary">{Number(MED[ID].id)}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Name:</span>
                <span>{MED[ID].name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Current Stage:</span>
                <Badge variant="outline">{MedStage[ID]}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem
            value="supplier"
            className="border rounded-lg hover:bg-slate-50 transition-colors"
          >
            <AccordionTrigger className="text-lg font-semibold p-6">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-500" />
                Raw Material Supplier Details
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-l-4 border-blue-400">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Supplier ID:</span>
                      <Badge variant="secondary">
                        {Number(RMS[MED[ID].RMSid].id)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-semibold">Name:</span>
                        <p>{RMS[MED[ID].RMSid].name}</p>
                      </div>
                      <div>
                        <span className="font-semibold">Place:</span>
                        <p>{RMS[MED[ID].RMSid].place}</p>
                      </div>
                    </div>
                    {renderMedicineDetails()}
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="manufacturer"
            className="border rounded-lg hover:bg-slate-50 transition-colors"
          >
            <AccordionTrigger className="text-lg font-semibold p-6">
              <div className="flex items-center gap-2">
                <Factory className="w-5 h-5 text-purple-500" />
                Manufacturer Details
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-l-4 border-purple-400">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Manufacturer ID:</span>
                      <Badge variant="secondary">
                        {Number(MAN[MED[ID].MANid].id)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-semibold">Name:</span>
                        <p>{MAN[MED[ID].MANid].name}</p>
                      </div>
                      <div>
                        <span className="font-semibold">Place:</span>
                        <p>{MAN[MED[ID].MANid].place}</p>
                      </div>
                    </div>
                    {renderMedicineDetails()}
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="distributor"
            className="border rounded-lg hover:bg-slate-50 transition-colors"
          >
            <AccordionTrigger className="text-lg font-semibold p-6">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange-500" />
                Distributor Details
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-l-4 border-orange-400">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Distributor ID:</span>
                      <Badge variant="secondary">
                        {Number(DIS[MED[ID].DISid].id)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-semibold">Name:</span>
                        <p>{DIS[MED[ID].DISid].name}</p>
                      </div>
                      <div>
                        <span className="font-semibold">Place:</span>
                        <p>{DIS[MED[ID].DISid].place}</p>
                      </div>
                    </div>
                    {renderMedicineDetails()}
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="retailer"
            className="border rounded-lg hover:bg-slate-50 transition-colors"
          >
            <AccordionTrigger className="text-lg font-semibold p-6">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-green-500" />
                Retailer Details
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-l-4 border-green-400">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Retailer ID:</span>
                      <Badge variant="secondary">
                        {Number(RET[MED[ID].RETid].id)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-semibold">Name:</span>
                        <p>{RET[MED[ID].RETid].name}</p>
                      </div>
                      <div>
                        <span className="font-semibold">Place:</span>
                        <p>{RET[MED[ID].RETid].place}</p>
                      </div>
                    </div>
                    {renderMedicineDetails()}
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Card className="border-l-4 border-green-500 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant="success"
              className="text-md bg-green-100 text-green-800 px-4 py-2"
            >
              Medicine has been sold
            </Badge>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center mt-8">
          <h3 className="text-xl font-semibold mb-4">Scan for Medicine Details</h3>
          <QRCode 
            value={JSON.stringify(getPDFData(), (key, value) => 
              typeof value === 'bigint' ? value.toString() : value
            )}
            size={256}
            level={'H'}
            includeMargin={true}
          />
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={downloadPDF}
            className="bg-gradient-to-r from-green-500 to-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg"
          >
            Download PDF
          </button>
          <button
            onClick={() => showTrackTillSold(false)}
            className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg"
          >
            Track Another Item
          </button>
          <button
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-gray-500 to-gray-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg"
          >
            HOME
          </button>
        </div>
      </main>
    </div>
    );
  }

  // Track till Retail stage
  if (TrackTillRetail) {
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

        <main className="container mx-auto px-4 pt-32 pb-16 space-y-8">
          <div className="flex justify-between items-center mb-8 px-4">
            <div className="w-full flex items-center">
              <div className="flex flex-col items-center text-green-600">
                <CheckCircle2 className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Supplier</span>
              </div>
              <div className="h-1 flex-1 bg-green-500" />

              <div className="flex flex-col items-center text-green-600">
                <Factory className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Manufacturer</span>
              </div>
              <div className="h-1 flex-1 bg-green-500" />

              <div className="flex flex-col items-center text-green-600">
                <Truck className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Distributor</span>
              </div>
              <div className="h-1 flex-1 bg-green-600" />

              <div className="flex flex-col items-center text-green-600">

                <Store className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Retailer</span>
              </div>
            </div>
          </div>
          <Card className="border-l-4 border-blue-500 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-700 flex items-center gap-2">
                <Package className="w-6 h-6" />
                Medicine Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Medicine ID:</span>
                  <Badge variant="secondary">{Number(MED[ID].id)}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Name:</span>
                  <span>{MED[ID].name}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-semibold">Description:</span>
                  <p className="mt-1 text-gray-600">{MED[ID].description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Current Stage:</span>
                  <Badge variant="outline">{MedStage[ID]}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem
              value="supplier"
              className="border rounded-lg hover:bg-slate-50 transition-colors"
            >
              <AccordionTrigger className="text-lg font-semibold p-6">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-500" />
                  Raw Material Supplier Details
                </div>
              </AccordionTrigger>

              <AccordionContent className="p-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Supplier ID:</span>
                    <Badge variant="secondary">
                      {Number(RMS[MED[ID].RMSid].id)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p>
                      <span className="font-semibold">Name:</span>{" "}
                      {RMS[MED[ID].RMSid].name}
                    </p>
                    <p>
                      <span className="font-semibold">Place:</span>{" "}
                      {RMS[MED[ID].RMSid].place}
                    </p>
                  </div>
                  <div>{renderMedicineDetails()}</div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem
              value="supplier"
              className="border rounded-lg hover:bg-slate-50 transition-colors"
            >
              <AccordionTrigger className="text-lg font-semibold p-6">
                <div className="flex items-center gap-2">
                  <Factory className="w-5 h-5 text-purple-500" />
                  Manufacturer
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Manufacturer ID:</span>
                    <Badge variant="secondary">
                      {Number(MAN[MED[ID].MANid].id)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p>
                      <span className="font-semibold">Name:</span>{" "}
                      {MAN[MED[ID].MANid].name}
                    </p>
                    <p>
                      <span className="font-semibold">Place:</span>{" "}
                      {MAN[MED[ID].MANid].place}
                    </p>
                  </div>
                  <div>{renderMedicineDetails()}</div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem
              value="supplier"
              className="border rounded-lg hover:bg-slate-50 transition-colors"
            >
              <AccordionTrigger className="text-lg font-semibold p-6">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-orange-500" />
                  Distributor
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Distributor ID:</span>
                    <Badge variant="secondary">
                      {" "}
                      {Number(DIS[MED[ID].DISid].id)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p>
                      <span className="font-semibold">Name:</span>{" "}
                      {DIS[MED[ID].DISid].name}
                    </p>
                    <p>
                      <span className="font-semibold">Place:</span>{" "}
                      {DIS[MED[ID].DISid].place}
                    </p>
                  </div>
                  <div>{renderMedicineDetails()}</div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem
              value="supplier"
              className="border rounded-lg hover:bg-slate-50 transition-colors"
            >
              <AccordionTrigger className="text-lg font-semibold p-6">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-green-500" />
                  Retailer
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Retailer ID:</span>
                    <Badge variant="secondary">
                      {Number(RET[MED[ID].RETid].id)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p>
                      <span className="font-semibold">Name:</span>{" "}
                      {RET[MED[ID].RETid].name}
                    </p>
                    <p>
                      <span className="font-semibold">Place:</span>{" "}
                      {RET[MED[ID].RETid].place}
                    </p>
                  </div>
                  <div>{renderMedicineDetails()}</div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex flex-col items-center mt-8">
            <h3 className="text-xl font-semibold mb-4">Scan for Medicine Details</h3>
            <QRCode 
              value={JSON.stringify(getPDFData(), (key, value) => 
                typeof value === 'bigint' ? value.toString() : value
              )}
              size={256}
              level={'H'}
              includeMargin={true}
            />
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={downloadPDF}
              className="bg-gradient-to-r from-green-500 to-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg"
            >
              Download PDF
            </button>
            <button
              onClick={() => showTrackTillRetail(false)}
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg"
            >
              Track Another Item
            </button>
            <button
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-gray-500 to-gray-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg"
            >
              HOME
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Track till Distribution stage
  if (TrackTillDistribution) {
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

        <main className="container mx-auto px-4 pt-32 pb-16 space-y-8">
          <div className="flex justify-between items-center mb-8 px-4">
            <div className="w-full flex items-center">
              <div className="flex flex-col items-center text-green-600">
                <CheckCircle2 className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Supplier</span>
              </div>
              <div className="h-1 flex-1 bg-green-500" />

              <div className="flex flex-col items-center text-green-600">
                <Factory className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Manufacturer</span>
              </div>
              <div className="h-1 flex-1 bg-green-500" />

              <div className="flex flex-col items-center text-green-600">
                <Truck className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Distributor</span>
              </div>
              <div className="h-1 flex-1 bg-slate-400" />

              <div className="flex flex-col items-center text-slate-400">

                <Store className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Retailer</span>
              </div>
            </div>
          </div>
          <Card className="border-l-4 border-blue-500 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-700 flex items-center gap-2">
                <Package className="w-6 h-6" />
                Medicine Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Medicine ID:</span>
                  <Badge variant="secondary">{Number(MED[ID].id)}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Name:</span>
                  <span>{MED[ID].name}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-semibold">Description:</span>
                  <p className="mt-1 text-gray-600">{MED[ID].description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Current Stage:</span>
                  <Badge variant="outline">{MedStage[ID]}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem
              value="supplier"
              className="border rounded-lg hover:bg-slate-50 transition-colors"
            >
              <AccordionTrigger className="text-lg font-semibold p-6">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-500" />
                  Raw Material Supplier Details
                </div>
              </AccordionTrigger>

              <AccordionContent className="p-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Supplier ID:</span>
                    <Badge variant="secondary">
                      {Number(RMS[MED[ID].RMSid].id)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p>
                      <span className="font-semibold">Name:</span>{" "}
                      {RMS[MED[ID].RMSid].name}
                    </p>
                    <p>
                      <span className="font-semibold">Place:</span>{" "}
                      {RMS[MED[ID].RMSid].place}
                    </p>
                  </div>
                  <div>{renderMedicineDetails()}</div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem
              value="supplier"
              className="border rounded-lg hover:bg-slate-50 transition-colors"
            >
              <AccordionTrigger className="text-lg font-semibold p-6">
                <div className="flex items-center gap-2">
                  <Factory className="w-5 h-5 text-purple-500" />
                  Manufacturer
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Manufacturer ID:</span>
                    <Badge variant="secondary">
                      {Number(MAN[MED[ID].MANid].id)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p>
                      <span className="font-semibold">Name:</span>{" "}
                      {MAN[MED[ID].MANid].name}
                    </p>
                    <p>
                      <span className="font-semibold">Place:</span>{" "}
                      {MAN[MED[ID].MANid].place}
                    </p>
                  </div>
                  <div>{renderMedicineDetails()}</div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem
              value="supplier"
              className="border rounded-lg hover:bg-slate-50 transition-colors"
            >
              <AccordionTrigger className="text-lg font-semibold p-6">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-orange-500" />
                  Distributor
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Distributor ID:</span>
                    <Badge variant="secondary">
                      {" "}
                      {Number(DIS[MED[ID].DISid].id)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p>
                      <span className="font-semibold">Name:</span>{" "}
                      {DIS[MED[ID].DISid].name}
                    </p>
                    <p>
                      <span className="font-semibold">Place:</span>{" "}
                      {DIS[MED[ID].DISid].place}
                    </p>
                  </div>
                  <div>{renderMedicineDetails()}</div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex flex-col items-center mt-8">
            <h3 className="text-xl font-semibold mb-4">Scan for Medicine Details</h3>
            <QRCode 
              value={JSON.stringify(getPDFData(), (key, value) => 
                typeof value === 'bigint' ? value.toString() : value
              )}
              size={256}
              level={'H'}
              includeMargin={true}
            />
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={downloadPDF}
              className="bg-gradient-to-r from-green-500 to-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg"
            >
              Download PDF
            </button>
            <button
              onClick={() => showTrackTillDistribution(false)}
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg"
            >
              Track Another Item
            </button>
            <button
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-gray-500 to-gray-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg"
            >
              HOME
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Track till Manufacture stage
  if (TrackTillManufacture) {
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

        <main className="container mx-auto px-4 pt-32 pb-16 space-y-8">
          <div className="flex justify-between items-center mb-8 px-4">
            <div className="w-full flex items-center">
              <div className="flex flex-col items-center text-green-600">
                <CheckCircle2 className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Supplier</span>
              </div>
              <div className="h-1 flex-1 bg-green-500" />

              <div className="flex flex-col items-center text-green-600">
                <Factory className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Manufacturer</span>
              </div>
              <div className="h-1 flex-1 bg-slate-400" />

              <div className="flex flex-col items-center text-slate-400">
                <Truck className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Distributor</span>
              </div>
              <div className="h-1 flex-1 bg-slate-400" />

              <div className="flex flex-col items-center text-slate-400">

                <Store className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Retailer</span>
              </div>
            </div>
          </div>
          <Card className="border-l-4 border-blue-500 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-700 flex items-center gap-2">
                <Package className="w-6 h-6" />
                Medicine Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Medicine ID:</span>
                  <Badge variant="secondary">{Number(MED[ID].id)}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Name:</span>
                  <span>{MED[ID].name}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-semibold">Description:</span>
                  <p className="mt-1 text-gray-600">{MED[ID].description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Current Stage:</span>
                  <Badge variant="outline">{MedStage[ID]}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem
              value="supplier"
              className="border rounded-lg hover:bg-slate-50 transition-colors"
            >
              <AccordionTrigger className="text-lg font-semibold p-6">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-500" />
                  Raw Material Supplier Details
                </div>
              </AccordionTrigger>

              <AccordionContent className="p-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Supplier ID:</span>
                    <Badge variant="secondary">
                      {Number(RMS[MED[ID].RMSid].id)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p>
                      <span className="font-semibold">Name:</span>{" "}
                      {RMS[MED[ID].RMSid].name}
                    </p>
                    <p>
                      <span className="font-semibold">Place:</span>{" "}
                      {RMS[MED[ID].RMSid].place}
                    </p>
                  </div>
                  <div>{renderMedicineDetails()}</div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem
              value="supplier"
              className="border rounded-lg hover:bg-slate-50 transition-colors"
            >
              <AccordionTrigger className="text-lg font-semibold p-6">
                <div className="flex items-center gap-2">
                  <Factory className="w-5 h-5 text-purple-500" />
                  Manufacturer
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Manufacturer ID:</span>
                    <Badge variant="secondary">
                      {Number(MAN[MED[ID].MANid].id)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p>
                      <span className="font-semibold">Name:</span>{" "}
                      {MAN[MED[ID].MANid].name}
                    </p>
                    <p>
                      <span className="font-semibold">Place:</span>{" "}
                      {MAN[MED[ID].MANid].place}
                    </p>
                  </div>
                  <div>{renderMedicineDetails()}</div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex flex-col items-center mt-8">
            <h3 className="text-xl font-semibold mb-4">Scan for Medicine Details</h3>
            <QRCode 
              value={JSON.stringify(getPDFData(), (key, value) => 
                typeof value === 'bigint' ? value.toString() : value
              )}
              size={256}
              level={'H'}
              includeMargin={true}
            />
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={downloadPDF}
              className="bg-gradient-to-r from-green-500 to-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg"
            >
              Download PDF
            </button>
            <button
              onClick={() => showTrackTillManufacture(false)}
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg"
            >
              Track Another Item
            </button>
            <button
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-gray-500 to-gray-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg"
            >
              HOME
            </button>
          </div>
        </main>
      </div>
    );
  }


  if (TrackTillRMS) {
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

        <main className="container mx-auto px-4 pt-32 pb-16 space-y-8">
          <div className="flex justify-between items-center mb-8 px-4">
            <div className="w-full flex items-center">
              <div className="flex flex-col items-center text-green-600">
                <CheckCircle2 className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Supplier</span>
              </div>
              <div className="h-1 flex-1 bg-slate-400" />

              <div className="flex flex-col items-center text-slate-400">
                <Factory className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Manufacturer</span>
              </div>
              <div className="h-1 flex-1 bg-slate-400" />

              <div className="flex flex-col items-center text-slate-400">
                <Truck className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Distributor</span>
              </div>
              <div className="h-1 flex-1 bg-slate-400" />

              <div className="flex flex-col items-center text-slate-400">

                <Store className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Retailer</span>
              </div>
            </div>
          </div>
          <Card className="border-l-4 border-blue-500 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-700 flex items-center gap-2">
                <Package className="w-6 h-6" />
                Medicine Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Medicine ID:</span>
                  <Badge variant="secondary">{Number(MED[ID].id)}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Name:</span>
                  <span>{MED[ID].name}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-semibold">Description:</span>
                  <p className="mt-1 text-gray-600">{MED[ID].description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Current Stage:</span>
                  <Badge variant="outline">{MedStage[ID]}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem
              value="supplier"
              className="border rounded-lg hover:bg-slate-50 transition-colors"
            >
              <AccordionTrigger className="text-lg font-semibold p-6">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-500" />
                  Raw Material Supplier Details
                </div>
              </AccordionTrigger>

              <AccordionContent className="p-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Supplier ID:</span>
                    <Badge variant="secondary">
                      {Number(RMS[MED[ID].RMSid].id)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p>
                      <span className="font-semibold">Name:</span>{" "}
                      {RMS[MED[ID].RMSid].name}
                    </p>
                    <p>
                      <span className="font-semibold">Place:</span>{" "}
                      {RMS[MED[ID].RMSid].place}
                    </p>
                  </div>
                  <div>{renderMedicineDetails()}</div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex flex-col items-center mt-8">
            <h3 className="text-xl font-semibold mb-4">Scan for Medicine Details</h3>
            <QRCode 
              value={JSON.stringify(getPDFData(), (key, value) => 
                typeof value === 'bigint' ? value.toString() : value
              )}
              size={256}
              level={'H'}
              includeMargin={true}
            />
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={downloadPDF}
              className="bg-gradient-to-r from-green-500 to-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg"
            >
              Download PDF
            </button>
            <button
              onClick={() => showTrackTillRMS(false)}
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg"
            >
              Track Another Item
            </button>
            <button
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-gray-500 to-gray-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg"
            >
              HOME
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Track till Ordered stage
  if (TrackTillOrdered) {
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

        <main className="container mx-auto px-4 pt-32 pb-16 space-y-8">
          <div className="flex justify-between items-center mb-8 px-4">
            <div className="w-full flex items-center">
              <div className="flex flex-col items-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Supplier</span>
              </div>
              <div className="h-1 flex-1 bg-slate-400" />

              <div className="flex flex-col items-center text-slate-400">
                <Factory className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Manufacturer</span>
              </div>
              <div className="h-1 flex-1 bg-slate-400" />

              <div className="flex flex-col items-center text-slate-400">
                <Truck className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Distributor</span>
              </div>
              <div className="h-1 flex-1 bg-slate-400" />

              <div className="flex flex-col items-center text-slate-400">
                <Store className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Retailer</span>
              </div>
            </div>
          </div>
          <Card className="border-l-4 border-blue-500 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-700 flex items-center gap-2">
                <Package className="w-6 h-6" />
                Medicine Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Medicine ID:</span>
                  <Badge variant="secondary">{Number(MED[ID].id)}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Name:</span>
                  <span>{MED[ID].name}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-semibold">Description:</span>
                  <p className="mt-1 text-gray-600">{MED[ID].description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Current Stage:</span>
                  <Badge variant="outline">{MedStage[ID]}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-green-500 shadow-md animate-fadeIn">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Badge
                    variant="success"
                    className="text-md bg-green-100 text-green-800 px-4 py-2"
                  >
                    Your medicine has been ordered successfully!
                  </Badge>
                  <p className="mt-2 text-gray-600">
                    You can track the progress of your medicine through the
                    supply chain using this tracking ID.
                  </p>
                </div>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                  <Package className="w-6 h-6 text-slate-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col items-center mt-8">
            <h3 className="text-xl font-semibold mb-4">Scan for Medicine Details</h3>
            <QRCode 
              value={JSON.stringify(getPDFData(), (key, value) => 
                typeof value === 'bigint' ? value.toString() : value
              )}
              size={256}
              level={'H'}
              includeMargin={true}
            />
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={downloadPDF}
              className="bg-gradient-to-r from-green-500 to-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg"
            >
              Download PDF
            </button>
            <button
              onClick={() => showTrackTillOrdered(false)}
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg"
            >
              Track Another Item
            </button>
            <button
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-gray-500 to-gray-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg"
            >
              HOME
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Default view
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
                            {currentaccount.slice(0, 6)}...
                            {currentaccount.slice(-4)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="bg-gray-900 text-white px-3 py-2 rounded-lg"
                        >
                          {currentaccount}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Copy
                    className="w-4 h-4 text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
                    onClick={() =>
                      navigator.clipboard.writeText(currentaccount)
                    }
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Toggle Button for Inventory */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowInventory(!showInventory)}
            className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {showInventory ? "Hide Inventory" : "Show Inventory"}
          </button>
        </div>


        {/* Medicine Inventory Table with Toggle */}
        {showInventory && (
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.keys(medicines).map((key) => {
                    const medicine = medicines[key];
                    const stage = MedStage[key] || "N/A";
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
                          {medicine.batchNumber || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{medicine.priceINR?.toLocaleString('en-IN') || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">

                          {stage}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Track Medicine Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Track Medicine
          </h2>
          <form
            onSubmit={handlerSubmit}
            className="flex flex-col md:flex-row gap-4"
          >
            <input
              type="text"
              onChange={handlerChangeID}
              placeholder="Enter Medicine ID"
              required
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Track
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Track;