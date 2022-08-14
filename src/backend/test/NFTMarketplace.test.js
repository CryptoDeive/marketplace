/* eslint-disable jest/valid-expect */
const { expect } = require("chai");
const { ethers } = require("hardhat");

const toWei = (num) => ethers.utils.parseEther(num.toString())
const fromWei = (num) => ethers.utils.formatEther(num);

describe("NFTMarketplace", function(){

  let NFT;
  let nft;
  let Marketplace; // smart contract cuando lo llamemos
  let marketplace; //referencia cuando este desplegado
  let deployer;
  let addr1;
  let addr2;
  let addrs;
  let feePercent = 1; //comision venta NFTs
  let URI = "sample URI";  //direccion, recursos 

  //Definir lo que vamos a ejecutar antes de empezar cada test
  beforeEach(async function (){
    //obtener los smart contracts
    NFT = await ethers.getContractFactory("NFT");
    Marketplace = await ethers.getContractFactory("Marketplace");
    //direcciones que se involucran en el despliege
    [deployer, addr1, addr2, ...addrs] = await ethers.getSigners();
    //desplegamos
    nft = await NFT.deploy();
    marketplace = await Marketplace.deploy(feePercent);
  });

  //Realizar primer paso
  describe("Deployment", function () {

    it("Should track name and symbol of the nft collection", async function (){
      //nombre de la collection DappNFT
      const nftName = "DApp NFT";
      //nombre del symbolo
      const nftSymbol = "DAPP";
      //¿Que esperamos recibir del smart contract?
      expect(await nft.name()).to.equal(nftName);
      expect(await nft.symbol()).to.equal(nftSymbol);
    });
    
    it("Should track feeAccount and feePercent of the MarketPlace", async function (){
      //devuelve la direccion de la persona que ha desplegado
      expect(await marketplace.feeAccount()).to.equal(deployer.address);
      //comisiones
      expect(await marketplace.feePercent()).to.equal(feePercent);
    });
  });

  describe("Minting NFTs", function (){

    it("Should track each minted NFT", async function(){
      await nft.connect(addr1).mint(URI);
      //hay un nuevo nft
      expect (await nft.tokenCount()).to.equal(1); 
      //hemos minteado un nuevo nft
      expect (await nft.balanceOf(addr1.address)).to.equal(1); 
      //el tokenURI  de esta primera unidad sea igual al URI pasado por parametro
      expect (await nft.tokenURI(1)).to.equal(URI); 

      await nft.connect(addr2).mint(URI);
      expect (await nft.tokenCount()).to.equal(2); 
      expect (await nft.balanceOf(addr2.address)).to.equal(1); 
      expect (await nft.tokenURI(2)).to.equal(URI); 
    });
  });

  describe("Making marketplace items", function (){
    //Añadir item al market place
    let price = 1;
    let result;

    beforeEach(async function (){
      await nft.connect(addr1).mint(URI);
      //Dar el poder para todos los tokens al marketplace para que los gestione.
      await nft.connect(addr1).setApprovalForAll(marketplace.address, true);
    });

    it("Should track newly created item", async function(){
      await expect(marketplace.connect(addr1).makeItem(nft.address, 1, toWei(price)))
     .to.emit(marketplace, "Offered")
      .withArgs(
        1,
        nft.address,
        1, 
        toWei(price),
        addr1.address
      );

      expect (await nft.ownerOf(1)).to.equal(marketplace.address)
      expect (await marketplace.itemCount()).to.equal(1);
      const item = await marketplace.items(1);
      expect(item.itemId).to.equal(1);
      expect(item.nft).to.equal(nft.address);
      expect(item.tokenId).to.equal(1);
      expect(item.price).to.equal(toWei(price));
      expect(item.sold).to.equal(false);

      it("Should fail if price is set to zero", async function (){
        await expect(marketplace.connect(addr1).makeItem(
          nft.address, 1, 0)).to.be.revertedWith("Price must be greater than zero");
      });
    });
    
  });

})