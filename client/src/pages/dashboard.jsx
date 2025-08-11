/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import Web3 from "web3";
import { useNavigate } from "react-router-dom";
import SupplyChainABI from "../artifacts/contracts/SupplyChain.sol/SupplyChain.json";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const STAGE_NAMES = {
  0: "Ordered",
  1: "At RMS",
  2: "At Manufacturer",
  3: "At Distributor",
  4: "At Retailer",
  5: "Sold",
};

const STAGE_COLORS = {
  0: "#2563eb", // Blue
  1: "#16a34a", // Green
  2: "#dc2626", // Red
  3: "#f59e0b", // Orange
  4: "#6366f1", // Indigo
  5: "#8b5cf6", // Purple
};

const UNDERSTOCK_THRESHOLD = 10;
const OVERSTOCK_THRESHOLD = 1000;

const aggregateByPlace = (entitiesByPlace) => {
  const placeAggregation = {};

  Object.entries(entitiesByPlace).forEach(([entityType, places]) => {
    Object.entries(places).forEach(([place, count]) => {
      if (!placeAggregation[place]) {
        placeAggregation[place] = {
          total: 0,
          entities: {},
        };
      }
      placeAggregation[place].entities[entityType] = count;
      placeAggregation[place].total += count;
    });
  });

  return placeAggregation;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [totalMedicines, setTotalMedicines] = useState(0);
  const [understocked, setUnderstocked] = useState([]);
  const [overstocked, setOverstocked] = useState([]);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [stageDistribution, setStageDistribution] = useState({});
  const [supplierDistribution, setSupplierDistribution] = useState({});
  const [manufacturerDistribution, setManufacturerDistribution] = useState({});
  const [distributorDistribution, setDistributorDistribution] = useState({});
  const [retailerDistribution, setRetailerDistribution] = useState({});
  const [stockLevels, setStockLevels] = useState({});
  const [entitiesByPlace, setEntitiesByPlace] = useState({
    RMS: {},
    MAN: {},
    DIS: {},
    RET: {},
  });
  const [sortDirection, setSortDirection] = useState("desc");
  const [medicinesByStage, setMedicinesByStage] = useState([]);
  const [expiryDistribution, setExpiryDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navItems = [
    { text: "Register", onClick: () => navigate("/roles") },
    { text: "Order Medicines", onClick: () => navigate("/addmed") },
    { text: "Control Supply Chain", onClick: () => navigate("/supply") },
    { text: "Track Medicines", onClick: () => navigate("/track") },
  ];

  const loadBlockchainData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!window.ethereum) {
        throw new Error("Ethereum provider not found");
      }

      const web3 = new Web3(window.ethereum);
      await window.ethereum.enable();

      const networkId = await web3.eth.net.getId();
      const networkData = SupplyChainABI.networks[networkId];

      if (!networkData) {
        throw new Error("Contract not deployed on current network");
      }

      const supplyChain = new web3.eth.Contract(
        SupplyChainABI.abi,
        networkData.address
      );

      const medicineCounter = await supplyChain.methods.medicineCtr().call();
      setTotalMedicines(medicineCounter);

      let under = [];
      let over = [];
      let expSoon = [];
      let stages = {};
      let suppliers = {};
      let manufacturers = {};
      let distributors = {};
      let retailers = {};
      let stocks = {};
      const entitiesPlaceCount = {
        RMS: {},
        MAN: {},
        DIS: {},
        RET: {},
      };

      const stageCounts = {};
      const expiryGroups = {
        expired: 0,
        within30Days: 0,
        within90Days: 0,
        moreThan90Days: 0,
      };

      const now = Date.now();

      // Fetch medicines data
      for (let i = 1; i <= medicineCounter; i++) {
        const med = await supplyChain.methods.MedicineStock(i).call();
        const quantity = parseInt(med.quantity);
        const expiryDate = Number(med.expiryDate) * 1000;
        const daysToExpiry = Math.floor(
          (expiryDate - now) / (1000 * 60 * 60 * 24)
        );
        const stage = parseInt(med.stage);

        // Update stocks
        stocks[i] = {
          name: med.name,
          quantity,
          expiryDate: med.expiryDate,
        };

        // Understocked and overstocked medicines
        if (quantity < UNDERSTOCK_THRESHOLD) under.push(med);
        if (quantity > OVERSTOCK_THRESHOLD) over.push(med);

        // Expiring soon medicines
        if (daysToExpiry < 30 && daysToExpiry >= 0) {
          expSoon.push(med);
        }

        // Stage distribution
        stages[i] = {
          name: STAGE_NAMES[stage] || `Stage ${stage}`,
          stage: stage,
        };

        stageCounts[stage] = (stageCounts[stage] || 0) + 1;

        // Distribution data
        suppliers[med.RMSid] = (suppliers[med.RMSid] || 0) + 1;
        manufacturers[med.MANid] = (manufacturers[med.MANid] || 0) + 1;
        distributors[med.DISid] = (distributors[med.DISid] || 0) + 1;
        retailers[med.RETid] = (retailers[med.RETid] || 0) + 1;

        // Expiry groups
        if (daysToExpiry < 0) expiryGroups.expired++;
        else if (daysToExpiry <= 30) expiryGroups.within30Days++;
        else if (daysToExpiry <= 90) expiryGroups.within90Days++;
        else expiryGroups.moreThan90Days++;
      }

      setUnderstocked(under);
      setOverstocked(over);
      setExpiringSoon(expSoon);
      setStageDistribution(stages);
      setSupplierDistribution(suppliers);
      setManufacturerDistribution(manufacturers);
      setDistributorDistribution(distributors);
      setRetailerDistribution(retailers);
      setStockLevels(stocks);

      // Prepare data for charts
      const medicineStageData = Object.entries(STAGE_NAMES)
        .map(([stage, name]) => ({
          name,
          value: stageCounts[parseInt(stage)] || 0,
          color: STAGE_COLORS[stage],
        }))
        .filter((item) => item.value > 0);

      setMedicinesByStage(medicineStageData);

      const expiryData = [
        { name: "Expired", value: expiryGroups.expired },
        { name: "< 30 Days", value: expiryGroups.within30Days },
        { name: "30-90 Days", value: expiryGroups.within90Days },
        { name: "> 90 Days", value: expiryGroups.moreThan90Days },
      ].filter((item) => item.value > 0);

      setExpiryDistribution(expiryData);

      // Fetch entities by place
      const entityTypes = ["RMS", "MAN", "DIS", "RET"];
      for (let type of entityTypes) {
        const methodName = `${type.toLowerCase()}Ctr`;
        const entityMethod = type;
        const ctr = await supplyChain.methods[methodName]().call();

        for (let i = 0; i < ctr; i++) {
          const entity = await supplyChain.methods[entityMethod](i + 1).call();
          const place = entity.place;
          entitiesPlaceCount[type][place] =
            (entitiesPlaceCount[type][place] || 0) + 1;
        }
      }

      setEntitiesByPlace(entitiesPlaceCount);
    } catch (err) {
      console.error("Error loading blockchain data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlockchainData();
  }, []);

  return (
    <div>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <a href="/" className="text-xl font-bold text-neutral-900">
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
      <div className="max-w-7xl mx-auto pt-24">
        <h1 className="text-4xl font-bold text-neutral-900 mb-8">
          Medicine Supply Chain Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Summary Cards */}
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Total Medicines", value: totalMedicines.toString() },
              {
                label: "Understocked",
                value: understocked.length,
                variant: "destructive",
              },
              {
                label: "Overstocked",
                value: overstocked.length,
                variant: "warning",
              },
              {
                label: "Expiring Soon",
                value: expiringSoon.length,
                variant: "secondary",
              },
            ].map(({ label, value, variant }) => (
              <Card
                key={label}
                className="shadow-sm hover:shadow-md transition-all"
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col items-start">
                    <p className="text-sm text-muted-foreground mb-2">
                      {label}
                    </p>
                    <div className="flex items-center">
                      <p className="text-3xl font-bold mr-2">{value}</p>
                      {variant && (
                        <Badge variant={variant || "default"}>
                          {label.replace(" ", "")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Entities by Location */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Registered Entities by Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(aggregateByPlace(entitiesByPlace)).map(
                  ([place, data]) => (
                    <Card key={place} className="bg-neutral-50">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-md font-semibold">{place}</h3>
                          <Badge variant="outline">Total: {data.total}</Badge>
                        </div>
                        <Separator className="mb-3" />
                        <div className="space-y-2">
                          {Object.entries(data.entities).map(
                            ([entityType, count]) => (
                              <div
                                key={entityType}
                                className="flex justify-between text-sm"
                              >
                                <span className="text-muted-foreground">
                                  {entityType}
                                </span>
                                <span className="font-medium">{count}</span>
                              </div>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Medicine Stage Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Medicine Stage Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stageDistribution).map(([id, stageData]) => (
                  <div
                    key={id}
                    className="flex justify-between items-center bg-neutral-50 p-2 rounded-md"
                  >
                    <span className="text-neutral-600">{stockLevels[id]?.name || `Medicine ${id}`}</span>
                    <Badge
                      variant={
                        stageData.stage === 5
                          ? "success"
                          : stageData.stage === 4
                          ? "default"
                          : stageData.stage === 3
                          ? "secondary"
                          : stageData.stage === 2
                          ? "warning"
                          : stageData.stage === 1
                          ? "outline"
                          : "destructive"
                      }
                    >
                      {stageData.name}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stock Levels */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Stock Levels</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
                }
              >
                Sort {sortDirection === "asc" ? "↑" : "↓"}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stockLevels)
                  .sort(([, a], [, b]) =>
                    sortDirection === "asc"
                      ? a.quantity - b.quantity
                      : b.quantity - a.quantity
                  )
                  .map(([id, data]) => (
                    <div
                      key={id}
                      className="flex justify-between items-center bg-neutral-50 p-2 rounded-md"
                    >
                      <span className="text-neutral-600">
                        {data.name || `Medicine ${id}`}
                      </span>
                      <Badge
                        variant={
                          data.quantity < UNDERSTOCK_THRESHOLD
                            ? "destructive"
                            : data.quantity > OVERSTOCK_THRESHOLD
                            ? "warning"
                            : "success"
                        }
                      >
                        {data.quantity} units
                        {(data.quantity < UNDERSTOCK_THRESHOLD ||
                          data.quantity > OVERSTOCK_THRESHOLD) && (
                          <span className="ml-2">⚠️</span>
                        )}
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Distribution Cards */}
          {[
            {
              title: "Supplier Distribution",
              data: supplierDistribution,
              variant: "default",
            },
            {
              title: "Manufacturer Distribution",
              data: manufacturerDistribution,
              variant: "success",
            },
            {
              title: "Distributor Distribution",
              data: distributorDistribution,
              variant: "secondary",
            },
            {
              title: "Retailer Distribution",
              data: retailerDistribution,
              variant: "outline",
            },
          ].map(({ title, data, variant }) => (
            <Card key={title}>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(data).map(([id, count]) => (
                    <div
                      key={id}
                      className="flex justify-between bg-neutral-50 p-2 rounded-md"
                    >
                      <span className="text-neutral-600">
                        {title.split(" ")[0]} {id}
                      </span>
                      <Badge variant={variant}>{count} Medicines</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Additional Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        {/* Medicines by Stage Pie Chart */}
        <Card className="bg-white/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Medicines by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart width={400} height={300}>
              <Pie
                data={medicinesByStage}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {medicinesByStage.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={STAGE_COLORS[index]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </CardContent>
        </Card>

        {/* Expiry Distribution Pie Chart */}
        <Card className="bg-white/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Expiry Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart width={400} height={300}>
              <Pie
                data={expiryDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {expiryDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={['#8884d8', '#82ca9d', '#ffc658', '#ff8042'][index]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </CardContent>
        </Card>
      </div>

      {/* Medicine Details Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Medicine Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Quantity</th>
                  <th className="text-left p-2">Stage</th>
                  <th className="text-left p-2">Expiry</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stockLevels).map(([id, data]) => (
                  <tr key={id} className="border-b">
                    <td className="p-2">{id}</td>
                    <td className="p-2">{data.name}</td>
                    <td className="p-2">{data.quantity}</td>
                    <td className="p-2">{stageDistribution[id]?.name}</td>
                    <td className="p-2">
                      {data.expiryDate
                        ? new Date(
                            parseInt(data.expiryDate) * 1000
                          ).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="p-2">
                      <Badge
                        variant={
                          data.quantity < UNDERSTOCK_THRESHOLD
                            ? "destructive"
                            : data.quantity > OVERSTOCK_THRESHOLD
                            ? "warning"
                            : "success"
                        }
                      >
                        {data.quantity < UNDERSTOCK_THRESHOLD
                          ? "Understocked"
                          : data.quantity > OVERSTOCK_THRESHOLD
                          ? "Overstocked"
                          : "Normal"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
