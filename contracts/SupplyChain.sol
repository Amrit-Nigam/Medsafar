// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

/**
 * @title SupplyChain
 * @dev Comprehensive Supply Chain Management Contract combining features from SupplyChain.sol and EnhancedSupplyChain.sol
 * @custom:dev-run-script ./scripts/deploy.js
 */
contract SupplyChain {
    // Owner of the contract
    address public Owner;

    /**
     * @dev Constructor sets the contract deployer as the owner
     */
    constructor() {
        Owner = msg.sender;
    }

    /**
     * @dev Modifier to restrict functions to only the owner
     */
    modifier onlyByOwner() {
        require(msg.sender == Owner, "Only owner can call this function");
        _;
    }

    modifier onlyOwnerOrDistributor() {
        require(msg.sender == Owner || distributors[msg.sender], "Only owner or distributor can call this function");
        _;
    }

    /**
     * @dev Enum representing the various stages of the medicine in the supply chain
     */
    enum STAGE {
        Init,
        RawMaterialSupply,
        Manufacture,
        Distribution,
        Retail,
        sold,
        ReturnInitiated,
        Destroyed
    }

    // Counters for medicines and different roles
    uint256 public medicineCtr = 0;
    uint256 public rmsCtr = 0;
    uint256 public manCtr = 0;
    uint256 public disCtr = 0;
    uint256 public retCtr = 0;
    uint256 public hospitalCtr = 0;

    /**
     * @dev Struct representing a medicine in the supply chain
     * Combines both Medicine and MedicineDetails from previous implementation
     */
    struct Medicine {
        uint256 id;
        string name;
        string description;
        uint256 quantity;
        uint256 expiryDate;
        string batchNumber;
        uint256 priceINR;
        uint256 RMSid;
        uint256 MANid;
        uint256 DISid;
        uint256 RETid;
        STAGE stage;
        uint256[] stageTimestamps;
    }

    // Mapping from medicine ID to Medicine struct
    mapping(uint256 => Medicine) public MedicineStock;

    /**
     * @dev Struct representing a Raw Material Supplier (RMS)
     */
    struct RawMaterialSupplier {
        address addr;
        uint256 id;
        string name;
        string place;
    }

    // Mapping from RMS ID to RawMaterialSupplier struct
    mapping(uint256 => RawMaterialSupplier) public RMS;

    /**
     * @dev Struct representing a Manufacturer
     */
    struct Manufacturer {
        address addr;
        uint256 id;
        string name;
        string place;
    }

    // Mapping from Manufacturer ID to Manufacturer struct
    mapping(uint256 => Manufacturer) public MAN;

    /**
     * @dev Struct representing a Distributor
     */
    struct Distributor {
        address addr;
        uint256 id;
        string name;
        string place;
    }

    // Mapping from Distributor ID to Distributor struct
    mapping(uint256 => Distributor) public DIS;

    /**
     * @dev Struct representing a Retailer
     */
    struct Retailer {
        address addr;
        uint256 id;
        string name;
        string place;
    }

    // Mapping from Retailer ID to Retailer struct
    mapping(uint256 => Retailer) public RET;

    /**
     * @dev Struct representing a Hospital
     */
    struct Hospital {
        uint256 id;
        string name;
        string location;
        address addr;
    }

    /**
     * @dev Struct representing a Medicine Request
     */
    struct MedicineRequest {
        uint256 hospitalID;
        uint256 medicineID;
        uint256 quantity;
        bool urgent;
        bool fulfilled;
    }

    // Mapping from Hospital ID to Hospital struct
    mapping(uint256 => Hospital) public hospitals;

    // Mapping from Hospital address to array of Medicine Requests
    mapping(uint256 => MedicineRequest[]) public medicineRequests;

    mapping(address => bool) public distributors;

    // Thresholds for stock alerts
    uint256 public understockThreshold = 10;
    uint256 public overstockThreshold = 1000;

    // Events for stock and expiry alerts
    event StockAlert(uint256 medicineID, string alertType);
    event ExpiryAlert(uint256 medicineID, string alertMessage);
    event HospitalAdded(uint256 id, string name, string location, address addr);
    event MedicineRequested(uint256 hospitalID, uint256 medicineID, uint256 quantity, bool urgent);
    event MedicineTransferred(uint256 hospitalID, uint256 medicineID, uint256 quantity);
    event ReturnInitiated(uint256 indexed medicineID, address indexed initiator);
    event MedicineDestroyed(uint256 indexed medicineID);

    /**
     * @dev Function to add a Raw Material Supplier (RMS)
     * @param _address Address of the RMS
     * @param _name Name of the RMS
     * @param _place Place/location of the RMS
     */
    function addRMS(
        address _address,
        string memory _name,
        string memory _place
    ) public onlyByOwner {
        rmsCtr++;
        RMS[rmsCtr] = RawMaterialSupplier(_address, rmsCtr, _name, _place);
    }

    /**
     * @dev Function to add a Manufacturer
     * @param _address Address of the Manufacturer
     * @param _name Name of the Manufacturer
     * @param _place Place/location of the Manufacturer
     */
    function addManufacturer(
        address _address,
        string memory _name,
        string memory _place
    ) public onlyByOwner {
        manCtr++;
        MAN[manCtr] = Manufacturer(_address, manCtr, _name, _place);
    }

    /**
     * @dev Function to add a Distributor
     * @param _address Address of the Distributor
     * @param _name Name of the Distributor
     * @param _place Place/location of the Distributor
     */
    function addDistributor(
        address _address,
        string memory _name,
        string memory _place
    ) public onlyByOwner {
        disCtr++;
        DIS[disCtr] = Distributor(_address, disCtr, _name, _place);
    }

    /**
     * @dev Function to add a Retailer
     * @param _address Address of the Retailer
     * @param _name Name of the Retailer
     * @param _place Place/location of the Retailer
     */
    function addRetailer(
        address _address,
        string memory _name,
        string memory _place
    ) public onlyByOwner {
        retCtr++;
        RET[retCtr] = Retailer(_address, retCtr, _name, _place);
    }

    /**
     * @dev Function to add a new Medicine to the supply chain with all details
     * @param _name Name of the Medicine
     * @param _description Description of the Medicine
     * @param _quantity Quantity of the Medicine
     * @param _expiryDate Expiry date of the Medicine (Unix timestamp)
     * @param _batchNumber Batch number of the Medicine
     * @param _priceINR Price of the Medicine in INR
     */
    function addMedicine(
        string memory _name,
        string memory _description,
        uint256 _quantity,
        uint256 _expiryDate,
        string memory _batchNumber,
        uint256 _priceINR
    ) public onlyByOwner {
        require(
            (rmsCtr > 0) &&
                (manCtr > 0) &&
                (disCtr > 0) &&
                (retCtr > 0),
            "All roles must be set before adding medicines"
        );
        medicineCtr++;
        MedicineStock[medicineCtr] = Medicine(
            medicineCtr,
            _name,
            _description,
            _quantity,
            _expiryDate,
            _batchNumber,
            _priceINR,
            0,
            0,
            0,
            0,
            STAGE.Init,
            new uint256[](8)
        );
    }

    /**
     * @dev Function to handle Raw Material Supply stage
     * @param _medicineID ID of the Medicine
     */
    function RMSsupply(uint256 _medicineID) public {
        require(
            _medicineID > 0 && _medicineID <= medicineCtr,
            "Invalid medicine ID"
        );
        uint256 _id = findRMS(msg.sender);
        require(_id > 0, "RMS not found");
        require(
            MedicineStock[_medicineID].stage == STAGE.Init,
            "Invalid stage transition"
        );
        MedicineStock[_medicineID].RMSid = _id;
        MedicineStock[_medicineID].stage = STAGE.RawMaterialSupply;
        MedicineStock[_medicineID].stageTimestamps[
            uint256(STAGE.RawMaterialSupply)
        ] = block.timestamp;
    }

    /**
     * @dev Private function to find RMS ID based on address
     * @param _address Address of the RMS
     * @return ID of the RMS
     */
    function findRMS(address _address) private view returns (uint256) {
        require(rmsCtr > 0, "No RMS available");
        for (uint256 i = 1; i <= rmsCtr; i++) {
            if (RMS[i].addr == _address) return RMS[i].id;
        }
        return 0;
    }

    /**
     * @dev Function to handle Manufacturing stage
     * @param _medicineID ID of the Medicine
     */
    function Manufacturing(uint256 _medicineID) public {
        require(
            _medicineID > 0 && _medicineID <= medicineCtr,
            "Invalid medicine ID"
        );
        uint256 _id = findMAN(msg.sender);
        require(_id > 0, "Manufacturer not found");
        require(
            MedicineStock[_medicineID].stage == STAGE.RawMaterialSupply,
            "Invalid stage transition"
        );
        MedicineStock[_medicineID].MANid = _id;
        MedicineStock[_medicineID].stage = STAGE.Manufacture;
        MedicineStock[_medicineID].stageTimestamps[
            uint256(STAGE.Manufacture)
        ] = block.timestamp;
    }

    /**
     * @dev Private function to find Manufacturer ID based on address
     * @param _address Address of the Manufacturer
     * @return ID of the Manufacturer
     */
    function findMAN(address _address) private view returns (uint256) {
        require(manCtr > 0, "No manufacturers available");
        for (uint256 i = 1; i <= manCtr; i++) {
            if (MAN[i].addr == _address) return MAN[i].id;
        }
        return 0;
    }

    /**
     * @dev Function to handle Distribution stage
     * @param _medicineID ID of the Medicine
     */
    function Distribute(uint256 _medicineID) public {
        require(
            _medicineID > 0 && _medicineID <= medicineCtr,
            "Invalid medicine ID"
        );
        uint256 _id = findDIS(msg.sender);
        require(_id > 0, "Distributor not found");
        require(
            MedicineStock[_medicineID].stage == STAGE.Manufacture,
            "Invalid stage transition"
        );
        MedicineStock[_medicineID].DISid = _id;
        MedicineStock[_medicineID].stage = STAGE.Distribution;
        MedicineStock[_medicineID].stageTimestamps[
            uint256(STAGE.Distribution)
        ] = block.timestamp;
    }

    /**
     * @dev Private function to find Distributor ID based on address
     * @param _address Address of the Distributor
     * @return ID of the Distributor
     */
    function findDIS(address _address) private view returns (uint256) {
        require(disCtr > 0, "No distributors available");
        for (uint256 i = 1; i <= disCtr; i++) {
            if (DIS[i].addr == _address) return DIS[i].id;
        }
        return 0;
    }

    /**
     * @dev Function to handle Retail stage
     * @param _medicineID ID of the Medicine
     */
    function Retail(uint256 _medicineID) public {
        require(
            _medicineID > 0 && _medicineID <= medicineCtr,
            "Invalid medicine ID"
        );
        uint256 _id = findRET(msg.sender);
        require(_id > 0, "Retailer not found");
        require(
            MedicineStock[_medicineID].stage == STAGE.Distribution,
            "Invalid stage transition"
        );
        MedicineStock[_medicineID].RETid = _id;
        MedicineStock[_medicineID].stage = STAGE.Retail;
        MedicineStock[_medicineID].stageTimestamps[
            uint256(STAGE.Retail)
        ] = block.timestamp;
    }

    /**
     * @dev Private function to find Retailer ID based on address
     * @param _address Address of the Retailer
     * @return ID of the Retailer
     */
    function findRET(address _address) private view returns (uint256) {
        require(retCtr > 0, "No retailers available");
        for (uint256 i = 1; i <= retCtr; i++) {
            if (RET[i].addr == _address) return RET[i].id;
        }
        return 0;
    }

    /**
     * @dev Function to mark a Medicine as sold
     * @param _medicineID ID of the Medicine
     */
    function sold(uint256 _medicineID) public {
        require(
            _medicineID > 0 && _medicineID <= medicineCtr,
            "Invalid medicine ID"
        );
        uint256 _id = findRET(msg.sender);
        require(_id > 0, "Retailer not found");
        require(
            _id == MedicineStock[_medicineID].RETid,
            "Only correct retailer can mark as sold"
        );
        require(
            MedicineStock[_medicineID].stage == STAGE.Retail,
            "Invalid stage transition"
        );
        MedicineStock[_medicineID].stage = STAGE.sold;
        MedicineStock[_medicineID].stageTimestamps[
            uint256(STAGE.sold)
        ] = block.timestamp;
    }

    /**
     * @dev Internal function to check stock levels and emit alerts
     * @param _medicineID ID of the Medicine
     */
    function _checkStockAlert(uint256 _medicineID) internal {
        uint256 quantity = MedicineStock[_medicineID].quantity;
        if (quantity < understockThreshold) {
            emit StockAlert(_medicineID, "Understock");
        } else if (quantity > overstockThreshold) {
            emit StockAlert(_medicineID, "Overstock");
        }
    }

    /**
     * @dev Function to update the quantity of a Medicine and recheck alerts
     * @param _medicineID ID of the Medicine
     * @param _newQuantity New quantity of the Medicine
     */
    function updateMedicineQuantity(uint256 _medicineID, uint256 _newQuantity)
        public
        onlyByOwner
    {
        require(
            _medicineID > 0 && _medicineID <= medicineCtr,
            "Invalid medicine ID"
        );
        MedicineStock[_medicineID].quantity = _newQuantity;
        _checkStockAlert(_medicineID);
    }

    /**
     * @dev Function to check if a Medicine is expiring soon
     * @param _medicineID ID of the Medicine
     * @return isExpiringSoon Boolean indicating if the Medicine is expiring soon
     */
    function checkExpiry(uint256 _medicineID)
        public
        view
        returns (bool isExpiringSoon)
    {
        require(
            _medicineID > 0 && _medicineID <= medicineCtr,
            "Invalid medicine ID"
        );
        uint256 expiryDate = MedicineStock[_medicineID].expiryDate;
        if (expiryDate > 0 && expiryDate < block.timestamp + 15 days) {
            return true;
        }
        return false;
    }

    /**
     * @dev Function to calculate the time spent in each stage for a Medicine
     * @param _medicineID ID of the Medicine
     * @return times Array of time durations spent in each stage
     */
    function timeSpentInStages(uint256 _medicineID)
        public
        view
        returns (uint256[] memory times)
    {
        require(
            _medicineID > 0 && _medicineID <= medicineCtr,
            "Invalid medicine ID"
        );
        Medicine storage details = MedicineStock[_medicineID];
        uint256 stagesCount = 8; // Total number of stages
        times = new uint256[](stagesCount); // Array to store time spent in each stage

        for (uint256 i = 1; i < stagesCount; i++) {
            if (
                details.stageTimestamps[i] > 0 &&
                details.stageTimestamps[i - 1] > 0
            ) {
                times[i - 1] = details.stageTimestamps[i] - details.stageTimestamps[i - 1];
            }
        }
        return times;
    }

    /**
     * @dev Function to get dashboard data including total medicines, understocked, overstocked, expiring soon, total hospitals, total requests, and fulfilled requests
     * @return totalMedicines Total number of medicines
     * @return understocked Number of understocked medicines
     * @return overstocked Number of overstocked medicines
     * @return expiringSoon Number of medicines expiring soon
     * @return totalHospitals Total number of hospitals
     * @return totalRequests Total number of medicine requests
     * @return fulfilledRequests Number of fulfilled medicine requests
     */
    function getDashboardData()
        public
        view
        returns (
            uint256 totalMedicines,
            uint256 understocked,
            uint256 overstocked,
            uint256 expiringSoon,
            uint256 totalHospitals,
            uint256 totalRequests,
            uint256 fulfilledRequests
        )
    {
        totalMedicines = medicineCtr;
        understocked = 0;
        overstocked = 0;
        expiringSoon = 0;
        totalHospitals = hospitalCtr;
        totalRequests = 0;
        fulfilledRequests = 0;

        for (uint256 i = 1; i <= medicineCtr; i++) {
            uint256 quantity = MedicineStock[i].quantity;
            if (quantity < understockThreshold) understocked++;
            if (quantity > overstockThreshold) overstocked++;
            if (checkExpiry(i)) expiringSoon++;
        }

        for (uint256 i = 1; i <= hospitalCtr; i++) {
            MedicineRequest[] storage requests = medicineRequests[i];
            totalRequests += requests.length;
            for (uint256 j = 0; j < requests.length; j++) {
                if (requests[j].fulfilled) {
                    fulfilledRequests++;
                }
            }
        }
    }

    /**
     * @dev Function to retrieve the current stage of a Medicine as a string
     * @param _medicineID ID of the Medicine
     * @return A string representing the current stage of the Medicine
     */
    function showStage(uint256 _medicineID)
        public
        view
        returns (string memory)
    {
        require(
            _medicineID > 0 && _medicineID <= medicineCtr,
            "Invalid medicine ID"
        );
        STAGE stage = MedicineStock[_medicineID].stage;
        if (stage == STAGE.Init)
            return "Medicine Ordered";
        else if (stage == STAGE.RawMaterialSupply)
            return "Raw Material Supply Stage";
        else if (stage == STAGE.Manufacture)
            return "Manufacturing Stage";
        else if (stage == STAGE.Distribution)
            return "Distribution Stage";
        else if (stage == STAGE.Retail)
            return "Retail Stage";
        else if (stage == STAGE.sold)
            return "Medicine Sold";
        else
            return "Unknown Stage";
    }

    /**
     * @dev Function to add a Hospital
     * @param _name Name of the Hospital
     * @param _location Location of the Hospital
     * @param _addr Address of the Hospital
     */
    function addHospital(string memory _name, string memory _location, address _addr) public onlyByOwner {
        hospitalCtr++;
        hospitals[hospitalCtr] = Hospital(hospitalCtr, _name, _location, _addr);
        emit HospitalAdded(hospitalCtr, _name, _location, _addr);
    }

    /**
     * @dev Function to request Medicine by a Hospital
     * @param _medicineID ID of the Medicine
     * @param _quantity Quantity of the Medicine
     * @param _urgent Boolean indicating if the request is urgent
     */
    function requestMedicine(uint256 _hospitalID, uint256 _medicineID, uint256 _quantity, bool _urgent) public {
        require(hospitals[_hospitalID].addr == msg.sender, "Only registered hospitals can request medicines");
        medicineRequests[_hospitalID].push(MedicineRequest(_hospitalID, _medicineID, _quantity, _urgent, false));
        emit MedicineRequested(_hospitalID, _medicineID, _quantity, _urgent);
    }

    /**
     * @dev Function to transfer Medicine to a Hospital and handle request approval
     * @param _hospitalID ID of the Hospital
     * @param _medicineID ID of the Medicine
     * @param _quantity Quantity of the Medicine
     */
    function transferMedicine(uint256 _hospitalID, uint256 _medicineID, uint256 _quantity) 
        public 
        onlyOwnerOrDistributor 
    {
        require(_hospitalID > 0 && _hospitalID <= hospitalCtr, "Invalid hospital ID");
        require(_medicineID > 0 && _medicineID <= medicineCtr, "Invalid medicine ID");
        
        // Check if medicine has enough quantity
        Medicine storage medicine = MedicineStock[_medicineID];
        require(medicine.quantity >= _quantity, "Insufficient medicine quantity");

        // Find and update the pending request
        MedicineRequest[] storage requests = medicineRequests[_hospitalID];
        bool requestFound = false;
        
        for (uint256 i = 0; i < requests.length; i++) {
            if (requests[i].medicineID == _medicineID && !requests[i].fulfilled) {
                require(requests[i].quantity == _quantity, "Quantity mismatch with request");
                requests[i].fulfilled = true;
                requestFound = true;
                
                // Update medicine quantity
                medicine.quantity -= _quantity;
                
                // Check if new stock level triggers an alert
                _checkStockAlert(_medicineID);
                
                emit MedicineTransferred(_hospitalID, _medicineID, _quantity);
                break;
            }
        }
        
        require(requestFound, "No matching unfulfilled request found");
    }

    function getPendingRequests() 
        public 
        view 
        returns (
            uint256[] memory hospitalIDs,
            uint256[] memory medicineIDs,
            uint256[] memory quantities,
            bool[] memory urgentFlags
        ) 
    {
        uint256 pendingCount = 0;
        
        // First, count pending requests
        for (uint256 i = 1; i <= hospitalCtr; i++) {
            MedicineRequest[] storage requests = medicineRequests[i];
            for (uint256 j = 0; j < requests.length; j++) {
                if (!requests[j].fulfilled) {
                    pendingCount++;
                }
            }
        }
        
        // Initialize arrays with the correct size
        hospitalIDs = new uint256[](pendingCount);
        medicineIDs = new uint256[](pendingCount);
        quantities = new uint256[](pendingCount);
        urgentFlags = new bool[](pendingCount);
        
        // Fill arrays with pending request data
        uint256 currentIndex = 0;
        for (uint256 i = 1; i <= hospitalCtr; i++) {
            MedicineRequest[] storage requests = medicineRequests[i];
            for (uint256 j = 0; j < requests.length; j++) {
                if (!requests[j].fulfilled) {
                    hospitalIDs[currentIndex] = requests[j].hospitalID;
                    medicineIDs[currentIndex] = requests[j].medicineID;
                    quantities[currentIndex] = requests[j].quantity;
                    urgentFlags[currentIndex] = requests[j].urgent;
                    currentIndex++;
                }
            }
        }
        
        return (hospitalIDs, medicineIDs, quantities, urgentFlags);
    }

    /**
     * @dev Internal function to check if an address belongs to a registered Hospital
     * @param _addr Address to check
     * @return Boolean indicating if the address belongs to a registered Hospital
     */
    function isHospital(address _addr) internal view returns (bool) {
        for (uint256 i = 1; i <= hospitalCtr; i++) {
            if (hospitals[i].addr == _addr) {
                return true;
            }
        }
        return false;
    }

    function getMedicineRequests(uint256 _hospitalID) public view returns (MedicineRequest[] memory) {
        return medicineRequests[_hospitalID];
    }

    function addDistributor(address _distributor) public onlyByOwner {
        distributors[_distributor] = true;
    }

    function removeDistributor(address _distributor) public onlyByOwner {
        distributors[_distributor] = false;
    }

    // Add these functions to get batch number and price
    function getMedicineBatchNumber(uint256 _medicineID) public view returns (string memory) {
        require(_medicineID > 0 && _medicineID <= medicineCtr, "Invalid medicine ID");
        return MedicineStock[_medicineID].batchNumber;
    }

    function getMedicinePrice(uint256 _medicineID) public view returns (uint256) {
        require(_medicineID > 0 && _medicineID <= medicineCtr, "Invalid medicine ID");
        return MedicineStock[_medicineID].priceINR;
    }

    
    /**
     * @dev Function to initiate direct return of expired medicine to owner
     * @param _medicineID ID of the Medicine
     */
    function initiateReturn(uint256 _medicineID) public onlyByOwner {
        require(_medicineID > 0 && _medicineID <= medicineCtr, "Invalid medicine ID");
        require(checkExpiry(_medicineID), "Medicine is not expired");
        
        Medicine storage medicine = MedicineStock[_medicineID];
        medicine.stage = STAGE.ReturnInitiated;
        medicine.stageTimestamps[uint256(STAGE.ReturnInitiated)] = block.timestamp;
        
        emit ReturnInitiated(_medicineID, msg.sender);
    }

    /**
     * @dev Function for owner to confirm destruction of returned medicine
     * @param _medicineID ID of the Medicine
     */
    function confirmDestruction(uint256 _medicineID) public onlyByOwner {
        require(_medicineID > 0 && _medicineID <= medicineCtr, "Invalid medicine ID");
        
        Medicine storage medicine = MedicineStock[_medicineID];
        medicine.stage = STAGE.Destroyed;
        medicine.stageTimestamps[uint256(STAGE.Destroyed)] = block.timestamp;
        medicine.quantity = 0; // Zero out the quantity
        
        emit MedicineDestroyed(_medicineID);
    }
}