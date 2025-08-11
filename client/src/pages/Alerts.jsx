import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Web3 from "web3";
import SupplyChainABI from "../artifacts/contracts/SupplyChain.sol/SupplyChain.json";
import {
  Bell,
  AlertTriangle,
  Package,
  Clock,
  Mail,
  Settings,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALERT_TYPES = {
  UNDERSTOCK: "understock",
  OVERSTOCK: "overstock",
  EXPIRING: "expiring",
  STAGE_CHANGE: "stage_change",
};

const SEVERITY_LEVELS = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

const UNDERSTOCK_THRESHOLD = 10;
const OVERSTOCK_THRESHOLD = 1000;
const EXPIRY_WARNING_DAYS = 30;

const Alerts = () => {
  const navigate = useNavigate();
  const navItems = [
    { text: "Register", onClick: () => navigate("/roles") },
    { text: "Order Medicines", onClick: () => navigate("/addmed") },
    { text: "Control Supply Chain", onClick: () => navigate("/supply") },
    { text: "Track Medicines", onClick: () => navigate("/track") },
  ];
  const [currentaccount, setCurrentaccount] = useState("");
  const [SupplyChain, setSupplyChain] = useState();
  const [MED, setMED] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [preferences, setPreferences] = useState({
    email: true,
    push: true,
    understockThreshold: 10,
    overstockThreshold: 1000,
    expiryWarningDays: 30,
  });

  const [activeAlerts, setActiveAlerts] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlockchainData();
  }, []);

  const loadBlockchainData = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("Ethereum provider not found");
      }

      const web3 = new Web3(window.ethereum);
      await window.ethereum.enable();

      const accounts = await web3.eth.getAccounts();
      setCurrentaccount(accounts[0]);

      const networkId = await web3.eth.net.getId();
      const networkData = SupplyChainABI.networks[networkId];

      if (!networkData) {
        throw new Error("Contract not deployed on current network");
      }

      const supplyChain = new web3.eth.Contract(
        SupplyChainABI.abi,
        networkData.address
      );
      setSupplyChain(supplyChain);

      await checkForAlerts(supplyChain);
      setLoading(false);
    } catch (error) {
      console.error("Error loading blockchain data:", error);
    }
  };

  const checkForAlerts = async (supplyChain) => {
    try {
      const medicineCounter = await supplyChain.methods.medicineCtr().call();
      const newAlerts = [];
      const now = Date.now();

      for (let i = 1; i <= medicineCounter; i++) {
        const med = await supplyChain.methods.MedicineStock(i).call();
        const quantity = parseInt(med.quantity);
        const expiryDate = Number(med.expiryDate) * 1000;
        const daysToExpiry = Math.floor(
          (expiryDate - now) / (1000 * 60 * 60 * 24)
        );

        // Check understock
        if (quantity < preferences.understockThreshold) {
          newAlerts.push({
            id: `understock-${med.id}`,
            type: ALERT_TYPES.UNDERSTOCK,
            severity: SEVERITY_LEVELS.HIGH,
            message: `${med.name} is understocked (${quantity} units)`,
            timestamp: Date.now(),
            medicine: med,
          });
        }

        // Check overstock
        if (quantity > preferences.overstockThreshold) {
          newAlerts.push({
            id: `overstock-${med.id}`,
            type: ALERT_TYPES.OVERSTOCK,
            severity: SEVERITY_LEVELS.MEDIUM,
            message: `${med.name} is overstocked (${quantity} units)`,
            timestamp: Date.now(),
            medicine: med,
          });
        }

        // Check expiry
        if (
          daysToExpiry <= preferences.expiryWarningDays &&
          daysToExpiry >= 0
        ) {
          newAlerts.push({
            id: `expiring-${med.id}`,
            type: ALERT_TYPES.EXPIRING,
            severity: SEVERITY_LEVELS.HIGH,
            message: `${med.name} is expiring in ${daysToExpiry} days`,
            timestamp: Date.now(),
            medicine: med,
          });
        }
      }

      setActiveAlerts((prev) => {
        const existingIds = prev.map((a) => a.id);
        const uniqueNewAlerts = newAlerts.filter(
          (a) => !existingIds.includes(a.id)
        );
        return [...prev, ...uniqueNewAlerts];
      });

      if (preferences.email && newAlerts.length > 0) {
        sendEmailAlerts(newAlerts);
      }
      if (preferences.push && newAlerts.length > 0) {
        sendPushNotifications(newAlerts);
      }
    } catch (error) {
      console.error("Error checking alerts:", error);
    }
  };

  const sendEmailAlerts = async (alerts) => {
    try {
      // Implement your email service integration here
      // Example using a backend API endpoint:
      await fetch("/api/alerts/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alerts }),
      });
    } catch (error) {
      console.error("Error sending email alerts:", error);
    }
  };

  const sendPushNotifications = async (alerts) => {
    try {
      // Implement your push notification service integration here
      // Example using a service worker:
      if ("serviceWorker" in navigator && "PushManager" in window) {
        const registration = await navigator.serviceWorker.ready;
        alerts.forEach((alert) => {
          registration.showNotification("MedSafar Alert", {
            body: alert.message,
            icon: "/icon.png",
            badge: "/badge.png",
            data: alert,
          });
        });
      }
    } catch (error) {
      console.error("Error sending push notifications:", error);
    }
  };

  const dismissAlert = (alertId) => {
    const alert = activeAlerts.find((a) => a.id === alertId);
    setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId));
    setAlertHistory((prev) => [alert, ...prev]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
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
      <div className="mt-32">
        {/* Alert Preferences */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Alert Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label>Understock Threshold</label>
                <Select
                  value={preferences.understockThreshold.toString()}
                  onValueChange={(value) =>
                    setPreferences((prev) => ({
                      ...prev,
                      understockThreshold: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 50, 500, 800].map((value) => (
                      <SelectItem key={value} value={value.toString()}>
                        {value} units
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Similar selects for overstock and expiry thresholds */}
            </div>
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    {alert.type === ALERT_TYPES.UNDERSTOCK && (
                      <Package className="h-5 w-5 text-red-500" />
                    )}
                    {alert.type === ALERT_TYPES.EXPIRING && (
                      <Clock className="h-5 w-5 text-yellow-500" />
                    )}
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={
                        alert.severity === SEVERITY_LEVELS.HIGH
                          ? "destructive"
                          : alert.severity === SEVERITY_LEVELS.MEDIUM
                          ? "warning"
                          : "default"
                      }
                    >
                      {alert.severity}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {activeAlerts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No active alerts
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alert History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Alert History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alertHistory.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-gray-600">{alert.message}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline">{alert.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Alerts;
