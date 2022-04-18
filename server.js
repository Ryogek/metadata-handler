const fs = require("fs");
const path = require("path");
const express = require("express");
const app = express();
var AWS = require("aws-sdk");
const { s3Client } = require("./s3Client");
const { web3 } = require("./web3");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { Readable } = require("stream");
const { createWriteStream } = require("fs");
require("dotenv").config();

app.use(express.static(__dirname + "/public"));

/*declaring env path for collection purposes*/
let collectionExtension = process.env.COLLECTION_EXTENSION;
let collectionWebsite = process.env.COLLECTION_WEBSITE;
let maxSupply = process.env.COLLECTION_MAX_SUPPLY;

/*declaring env path for S3 purposes*/
let bucketName = process.env.S3_BUCKET_NAME;

/*declaring env path for Web3 purposes*/
let contractAddress = process.env.WEB3_CONTRACT_ADDRESS;
let web3Contract;

let doURL = process.env.DO_URL;
let id;

async function getContent(_id, _key) {
  let contentPath = path.join(__dirname,'output',_id)
  console.log(contentPath);
  try {
    console.log("> Fetching content from storage");
    const command = new GetObjectCommand({
      Key: _key,
      Bucket: bucketName,
    });
    const s3Item = await s3Client.send(command);
    s3Item.Body.pipe(createWriteStream(contentPath));
  } catch {
    console.log("> Error Fetching Content from storage");
  }
}

async function getAssets(_id, _key) {
  let assetsPath = path.join(__dirname,'public/assets',_id)
  try {
    console.log("> Fetching content from storage");
    const command = new GetObjectCommand({
      Key: _key,
      Bucket: bucketName,
    });
    const s3Item = await s3Client.send(command);
    s3Item.Body.pipe(createWriteStream(assetsPath));
  } catch {
    console.log("> Error Fetching Content from storage");
  }
}

let abiPath;

app.use("/", async (req, res, next) => {
  console.log(__dirname);
  await getContent("hidden.json", "hidden/hidden.json").then(() => {
    console.log("hidden JSON");
  });
  await getAssets("hidden.png", "hidden/hidden.png").then(() => {
    console.log("hidden png");
  });
  next();
});

/*=================================
            METADATA
=================================*/
app.get("/metadata/:id", async (req, res, next) => {
  id = req.params.id;
  let key = "abi.json";

  await getContent(key, key)
    .then((result) => {
      console.log("> Fetching content from storage Success!");
      abiPath = path.join(__dirname,'output/abi.json');
      console.log(abiPath);
    })
    .then((result) => {
      next();
    });
});

app.get("/metadata/:id", (req, res, next) => {
  try {
    if (fs.existsSync(abiPath)) {
      console.log("Initialsing Smart Contract");
      const abi = require(abiPath);
      console.log(contractAddress);
      web3Contract = new web3.eth.Contract(abi, contractAddress);
      next();
    } else {
      console.log("Unknown error has occured in Smart Contract path");
    }
  } catch (err) {
    console.error("Path not exist");
  }
});

app.get("/metadata/:id", async (req, res, next) => {
  let valueCut = id.replace(".json", "");
  console.log(valueCut);
  try {
    console.log("Fetching information");
    web3Contract.methods
      .tokenURI(valueCut)
      .call((err, result) => {
        if (result) {
          console.log(result);
          console.log("Fetching information success!");
        } else {
          console.log('error')
        }
      })
      .then((result) => {
        if (result == doURL + "metadata/" + id) {
          console.log(result);
          next();
        } else {
          console.log("Token URI does not match");
          res.send("Token URI does not match");
        }
      }).catch(error => {
        console.log(error);
        const hiddenPath = path.join(__dirname,'output/hidden.json');
        try {
          console.log("Information Hidden");
          if (fs.existsSync(hiddenPath)) {
            console.log('consolidating');
            const hiddenName = hiddenPath;
            const hidden = require(hiddenPath);
            hidden.image = doURL + "assets/hidden.png";
            fs.writeFileSync(
              hiddenName,
              JSON.stringify(hidden))
              res.send(JSON.stringify(hidden));
          }
        } catch (err) {
          console.log(err);
        }
      });
  } catch (err) {
    res.send("Hidden");
  }
});

app.get("/metadata/:id", async (req, res, next) => {
  let keyID = `metadata/${id}`;
  let idImage = id.replace(".json", ".png");
  let keyAssets = `assets/${idImage}`;
  await getContent(id, keyID);
  await getAssets(idImage, keyAssets);
  try {
    const metadataPath = path.join(__dirname,'output',id);
    if (fs.existsSync(metadataPath)) {
      const metadataName = metadataPath;
      const metadata = require(metadataName);
      metadata.image = doURL + "assets/" + idImage;
      fs.writeFile(
        metadataName,
        JSON.stringify(metadata),
        function writeJSON(err) {
          if (err) {
            console.log("Error in metadata handler");
          } else {
            res.send(JSON.stringify(metadata));
            next();
          }
        }
      );
    }
  } catch {
    console.log("error");
  }
});

app.get("/metadata/:id", async (req, res) => {
  const metadataPath = path.join(__dirname,'output',id);
  fs.unlinkSync(metadataPath);
});

app.get("*", (req, res) => {
  res.status(404).send(`<html><h2>"Sorry the file does not exist or it is not minted yet"</h2><p>"Please click the link below to visit our website for more information"</p><a href=${collectionWebsite}>Aterraverse Website</a></html>`)
});

const port = process.env.PORT || 80;
app.listen(port);
