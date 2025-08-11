const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SupplyChain Contract", function () {
  let supplyChain;
  let owner, rms, manufacturer, distributor, retailer;

  beforeEach(async function () {
    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    [owner, rms, manufacturer, distributor, retailer] = await ethers.getSigners();
    supplyChain = await SupplyChain.deploy();
    await supplyChain.waitForDeployment(); // Use waitForDeployment instead of deployed()
  });

  describe("Role Management", function () {
    it("Should add all roles correctly", async function () {
      // Add all roles
      await supplyChain.connect(owner).addRMS(rms.address, "RMS Corp", "RMS Location");
      await supplyChain.connect(owner).addManufacturer(manufacturer.address, "Manufacturer Corp", "Manufacturing Location");
      await supplyChain.connect(owner).addDistributor(distributor.address, "Distributor Corp", "Distribution Location");
      await supplyChain.connect(owner).addRetailer(retailer.address, "Retailer Corp", "Retail Location");

      // Verify roles were added
      const rmsRole = await supplyChain.RMS(1);
      const manufacturerRole = await supplyChain.MAN(1);
      const distributorRole = await supplyChain.DIS(1);
      const retailerRole = await supplyChain.RET(1);

      expect(rmsRole.addr).to.equal(rms.address);
      expect(manufacturerRole.addr).to.equal(manufacturer.address);
      expect(distributorRole.addr).to.equal(distributor.address);
      expect(retailerRole.addr).to.equal(retailer.address);
    });
  });

  describe("Medicine Addition", function () {
    it("Should add medicine after setting up all roles", async function () {
      // Add all roles
      await supplyChain.connect(owner).addRMS(rms.address, "RMS Corp", "RMS Location");
      await supplyChain.connect(owner).addManufacturer(manufacturer.address, "Manufacturer Corp", "Manufacturing Location");
      await supplyChain.connect(owner).addDistributor(distributor.address, "Distributor Corp", "Distribution Location");
      await supplyChain.connect(owner).addRetailer(retailer.address, "Retailer Corp", "Retail Location");

      // Now add medicine
      const addMedicineTx = await supplyChain.connect(owner).addMedicine("Test Medicine", "Test Description");

      // Verify medicine was added
      const medicineCtr = await supplyChain.medicineCtr();
      expect(medicineCtr).to.equal(1);

      // Verify medicine details
      const medicine = await supplyChain.medicineDetails(1);
      expect(medicine.name).to.equal("Test Medicine");
      expect(medicine.description).to.equal("Test Description");

      // Verify events
      await expect(addMedicineTx)
        .to.emit(supplyChain, "MedicineAdded")
        .withArgs(1, "Test Medicine", "Test Description");
    });

    it("Should not add medicine if roles are not set up", async function () {
      // Attempt to add medicine without setting up roles
      await expect(
        supplyChain.connect(owner).addMedicine("Test Medicine", "Test Description")
      ).to.be.revertedWith("Roles not set up");
    });

    it("Should not add medicine with empty name or description", async function () {
      // Add all roles
      await supplyChain.connect(owner).addRMS(rms.address, "RMS Corp", "RMS Location");
      await supplyChain.connect(owner).addManufacturer(manufacturer.address, "Manufacturer Corp", "Manufacturing Location");
      await supplyChain.connect(owner).addDistributor(distributor.address, "Distributor Corp", "Distribution Location");
      await supplyChain.connect(owner).addRetailer(retailer.address, "Retailer Corp", "Retail Location");

      // Attempt to add medicine with empty name
      await expect(
        supplyChain.connect(owner).addMedicine("", "Test Description")
      ).to.be.revertedWith("Name is required");

      // Attempt to add medicine with empty description
      await expect(
        supplyChain.connect(owner).addMedicine("Test Medicine", "")
      ).to.be.revertedWith("Description is required");
    });

    it("Should not add duplicate medicine", async function () {
      // Add all roles
      await supplyChain.connect(owner).addRMS(rms.address, "RMS Corp", "RMS Location");
      await supplyChain.connect(owner).addManufacturer(manufacturer.address, "Manufacturer Corp", "Manufacturing Location");
      await supplyChain.connect(owner).addDistributor(distributor.address, "Distributor Corp", "Distribution Location");
      await supplyChain.connect(owner).addRetailer(retailer.address, "Retailer Corp", "Retail Location");

      // Add medicine
      await supplyChain.connect(owner).addMedicine("Test Medicine", "Test Description");

      // Attempt to add duplicate medicine
      await expect(
        supplyChain.connect(owner).addMedicine("Test Medicine", "Test Description")
      ).to.be.revertedWith("Medicine already exists");
    });
  });
});