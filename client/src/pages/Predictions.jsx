/* eslint-disable no-unused-vars */
"use client"

import React from 'react';
import DemandPredictions from "../jsons/demand_predictions.json";
import ExpiryRiskPredictions from "../jsons/expiry_risk_predictions.json";
import StockAnomalies from "../jsons/stock_anomalies.json";
import ReStockRecommendations from "../jsons/restock_recommendations.json";
import DelayPredictions from "../jsons/delay_predictions.json";
import CityData from "../jsons/city_data.json";
import { LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// Fix for default marker icon issue in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

export default function Predictions() {
  // Transform data for charts
  const transformedData = DemandPredictions.map((item, index) => ({
    name: item["Medicine Name"],
    actual: parseFloat(item["Actual"]),
    predicted: parseFloat(item["Predicted"]),
  }));

  // Aggregate data for pie chart
  const aggregatedData = transformedData.reduce((acc, item) => {
    const existing = acc.find(i => i.name === item.name);
    if (existing) {
      existing.actual += item.actual;
      existing.predicted += item.predicted;
    } else {
      acc.push({ name: item.name, actual: item.actual, predicted: item.predicted });
    }
    return acc;
  }, []);

  // Transform expiry risk data for charts
  const expiryRiskData = ExpiryRiskPredictions.map((item, index) => ({
    name: item["Medicine Name"],
    actual: parseFloat(item["Actual"]),
    predicted: parseFloat(item["Predicted"]),
  }));

  // Aggregate expiry risk data for pie chart
  const aggregatedExpiryRiskData = expiryRiskData.reduce((acc, item) => {
    const existing = acc.find(i => i.name === item.name);
    if (existing) {
      existing.actual += item.actual;
      existing.predicted += item.predicted;
    } else {
      acc.push({ name: item.name, actual: item.actual, predicted: item.predicted });
    }
    return acc;
  }, []);

  // Calculate the proportion of medicines at risk of expiring
  const atRiskCount = expiryRiskData.filter(item => item.actual > 0).length;
  const safeCount = expiryRiskData.length - atRiskCount;
  const expiryRiskProportion = [
    { name: "At Risk", value: atRiskCount },
    { name: "Safe", value: safeCount },
  ];

  // Transform stock anomalies data for charts
  const stockAnomaliesData = StockAnomalies.map((item, index) => ({
    id: item["Medicine ID"],
    name: item["Name"],
    quantity: parseInt(item["Quantity"]),
    expiryDate: item["Expiry Date"],
    understocked: parseInt(item["Understocked"]),
    overstocked: parseInt(item["Overstocked"]),
    expiringSoon: parseInt(item["Expiring Soon"]),
  }));

  // Aggregate stock anomalies data for pie chart
  const aggregatedStockAnomaliesData = stockAnomaliesData.reduce((acc, item) => {
    if (item.understocked) acc.understocked++;
    if (item.overstocked) acc.overstocked++;
    if (item.expiringSoon) acc.expiringSoon++;
    return acc;
  }, { understocked: 0, overstocked: 0, expiringSoon: 0 });

  const stockAnomaliesProportion = [
    { name: "Understocked", value: aggregatedStockAnomaliesData.understocked },
    { name: "Overstocked", value: aggregatedStockAnomaliesData.overstocked },
    { name: "Expiring Soon", value: aggregatedStockAnomaliesData.expiringSoon },
  ];

  // Transform restock recommendations data for radar chart
  const restockRecommendationsData = ReStockRecommendations.map((item, index) => ({
    name: `Medicine ${index + 1}`,
    actualRestock: parseFloat(item["Actual Restock"]),
    predictedRestock: parseFloat(item["Predicted Restock"]),
  }));

  // Transform delay predictions data for charts
  const delayPredictionsData = DelayPredictions.map((item, index) => ({
    quantity: parseInt(item["Quantity"]),
    daysToExpiry: parseInt(item["Days to Expiry"]),
    stockPressure: parseFloat(item["Stock_Pressure"]),
    expiryRisk: parseInt(item["Expiry_Risk"]),
    currentStage: parseInt(item["Current Stage"]),
    actualTimeInStage: parseFloat(item["Actual Time in Stage (days)"]),
    predictedTimeInStage: parseFloat(item["Predicted Time in Stage (days)"]),
    predictionError: parseFloat(item["Prediction Error (days)"]),
  }));

  // Transform city data for map
  const cityData = CityData.map((item, index) => ({
    location: item["Location"],
    quantity: parseInt(item["Quantity"]),
    lat: parseFloat(item["lat"]),
    lon: parseFloat(item["lon"]),
  })).filter(city => !isNaN(city.lat) && !isNaN(city.lon));

  return (
    <div className="bg-neutral-50 min-h-screen p-8">
      <h1 className="text-4xl font-bold text-neutral-900 mb-8">Predictions</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Bar Chart for Actual vs Predicted Demand */}
        <Card className="bg-white/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Demand Predictions (Bar Chart)</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart width={600} height={300} data={transformedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="actual" fill="#8884d8" />
              <Bar dataKey="predicted" fill="#82ca9d" />
            </BarChart>
          </CardContent>
        </Card>

        {/* Pie Chart for Demand Distribution */}
        <Card className="bg-white/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Demand Distribution (Pie Chart)</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart width={400} height={400}>
              <Pie
                data={aggregatedData}
                dataKey="actual"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {aggregatedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </CardContent>
        </Card>

        {/* Expiry Risk Analysis (Pie Chart) */}
        <Card className="bg-white/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Expiry Risk Analysis (Pie Chart)</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart width={400} height={400}>
              <Pie
                data={expiryRiskProportion}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {expiryRiskProportion.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </CardContent>
        </Card>

        {/* Bar Chart for Stock Anomalies */}
        <Card className="bg-white/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Stock Anomalies (Bar Chart)</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart width={600} height={300} data={stockAnomaliesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="understocked" fill="#ff0000" />
              <Bar dataKey="overstocked" fill="#ffbb28" />
              <Bar dataKey="expiringSoon" fill="#0088FE" />
            </BarChart>
          </CardContent>
        </Card>

        {/* Stock Anomalies Analysis (Pie Chart) */}
        <Card className="bg-white/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Stock Anomalies Analysis (Pie Chart)</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart width={400} height={400}>
              <Pie
                data={stockAnomaliesProportion}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {stockAnomaliesProportion.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </CardContent>
        </Card>

        {/* Radar Chart for Restock Recommendations */}
        <Card className="bg-white/50 backdrop-blur">
          <CardHeader className="items-center pb-4">
            <CardTitle>Restock Recommendations (Radar Chart)</CardTitle>
            <CardDescription>
              Showing actual vs predicted restock recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={restockRecommendationsData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <Tooltip />
                <Radar
                  name="Actual Restock"
                  dataKey="actualRestock"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Radar
                  name="Predicted Restock"
                  dataKey="predictedRestock"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Line Chart for Delay Predictions */}
        <Card className="bg-white/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Delay Predictions (Line Chart)</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart width={600} height={300} data={delayPredictionsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quantity" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="actualTimeInStage" stroke="#8884d8" />
              <Line type="monotone" dataKey="predictedTimeInStage" stroke="#82ca9d" />
            </LineChart>
          </CardContent>
        </Card>

        {/* Map for City Data */}
        <Card className="bg-white/50 backdrop-blur">
          <CardHeader>
            <CardTitle>City Data (Map)</CardTitle>
          </CardHeader>
          <CardContent>
            <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: "400px", width: "100%" }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {cityData.map((city, index) => (
                <Marker key={index} position={[city.lat, city.lon]}>
                  <Popup>
                    <div>
                      <h3>{city.location}</h3>
                      <p>Quantity: {city.quantity}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}