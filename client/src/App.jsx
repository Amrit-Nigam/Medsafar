import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import AssignRoles from "./pages/AssignRoles";
import AddMed from "./pages/AddMed";
import Supply from "./pages/Supply";
import Track from "./pages/Track";
import Dashboard from "./pages/dashboard";
import Predictions from "./pages/Predictions";
import Alerts from "./pages/Alerts";
import Hospital from "./pages/Hospital";
import ReverseSupplyChain from "./pages/ReverseSupplyChain";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/roles" element={<AssignRoles />} />
          <Route path="/addmed" element={<AddMed />} />
          <Route path="/supply" element={<Supply />} />
          <Route path="/track" element={<Track />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/predictions" element={<Predictions />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/hospital" element={<Hospital />} />
          <Route path="/reverse" element={<ReverseSupplyChain />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
