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
  let contentPath = path.join(__dirname, "output", _id);
  try {
    console.log(`> Fetching content from storage ${_id}`);
    const command = new GetObjectCommand({
      Key: _key,
      Bucket: bucketName,
    });
    const s3Item = await s3Client.send(command);
    s3Item.Body.pipe(createWriteStream(contentPath));
  } catch {
    console.log(`> Error Fetching Content from storage ${_id}`);
  }
}

async function getAssets(_id, _key) {
  let assetsPath = path.join(__dirname, "public/assets", _id);
  try {
    console.log(`> Fetching content from storage ${_id}`);
    const command = new GetObjectCommand({
      Key: _key,
      Bucket: bucketName,
    });
    const s3Item = await s3Client.send(command);
    s3Item.Body.pipe(createWriteStream(assetsPath));
  } catch {
    console.log(`> Error Fetching Content from storage ${+_id}`);
  }
}

app.use("/", async (req, res, next) => {
    console.log("> Aterraverse Metadata has recognised your request");
  console.log("> Commencing hidden existence check");
  const hiddenJSONPath = path.join(__dirname,"output/hidden.json");
  if(fs.existsSync(hiddenJSONPath)){
    console.log("> Hidden Metadata exist, proceeding to the next task");
    next();
  } else {
    await getContent("hidden.json", "hidden/hidden.json").then(() => {
            console.log("> Fetching hidden metadata Success!");
      next();
    });
  };
});

app.use("/", async (req, res, next) => {
  const hiddenPNGPath = path.join(__dirname,"public/assets/hidden.png");
  if(fs.existsSync(hiddenPNGPath)){
    console.log("> Hidden Assets exist, proceeding to the next task");
    next();
  } else {
    console.log("> Fetching hidden assets Success!")
    await getAssets("hidden.png", "hidden/hidden.png").then(() => {
      console.log("> Fetching hidden assets Success!");
    });
    next();
  }
});

/*=================================
            METADATA
=================================*/
app.get("/metadata/:id", async (req, res, next) => {
  id = req.params.id;
  let key = "abi.json";
  let abiPath = path.join(__dirname, "output", key);
  console.log("> Checking the existence of the Abi");
  if (fs.existsSync(abiPath)) {
    console.log("> Abi Exists, proceeding to the next functions")
    next();
  } else {
    console.log("> Abi does not Exists, Fetching Abi")
    await getContent(key, key).then((result) => {
      console.log("> Fetching content from storage Success: " + key);
      next();
    });
  }
});

app.get("/metadata/:id", async (req, res, next) => {
  let key = "abi.json";
  let abiPath = path.join(__dirname, "output", key);
  setTimeout(async function (err, data) {
    try {
      console.log("> Initialsing the Smart Contract");
      const abi = require(abiPath);
      web3Contract = await new web3.eth.Contract(abi, contractAddress);
      console.log("> Smart Contract Installed!");
      next();
    } catch (err) {
      console.error("> Path does not exist");
      console.log(err);
    }
  }, 1000);
});

app.get("/metadata/:id", async (req, res, next) => {
  let valueCut = id.replace(".json", "");
  try {
    console.log("> Fetching information: ", id);
    web3Contract.methods
      .tokenURI(valueCut)
      .call((err, result) => {
        if (result) {
          console.log("> Fetching information success: ", id);
        } else {
          console.log(
            "> An error has occured while Fetching the Information: ",
            err
          );
        }
      })
      .then((result) => {
        if (result == doURL + "metadata/" + id) {
          next();
        } else {
          console.log("> Information does not match");
          res.send("Information does not match");
        }
      })
      .catch((error) => {
        console.log(error);
        const hiddenPath = path.join(__dirname, "output/hidden.json");
        try {
          console.log("> INFO: Information requested is Hidden");
          console.log("> Consolidating Hidden Information");
          const hiddenName = hiddenPath;
          const hidden = require(hiddenPath);
          hidden.image = doURL + "assets/hidden.png";
          fs.writeFileSync(hiddenName, JSON.stringify(hidden));
          res.sendFile(hiddenPath);
        } catch (err) {
          console.log(err);
        }
      });
  } catch (err) {
    res.send("> An unknown error has occured in Hidden Request");
  }
});

app.get("/metadata/:id", async (req, res, next) => {
  let keyID = `metadata/${id}`;
  let idImage = id.replace(".json", ".png");
  await getContent(id, keyID);
  setTimeout(function (err, data) {
    try {
      console.log("> Fetching the Metadata: ", id);
      const metadataPath = path.join(__dirname, "output", id);
      const metadataName = metadataPath;
      const metadata = require(metadataName);
      metadata.image = doURL + "assets/" + idImage;
      fs.writeFile(
        metadataName,
        JSON.stringify(metadata),
        function writeJSON(err) {
          if (err) {
            console.log("> Error while Fetching the Metadata: ", id);
          } else {
            res.sendFile(metadataPath);
            console.log("> Sending Metadata Success: ", id);
            // next();
          }
        }
      );
    } catch (err) {
      console.log("> An Unknown Error has occured: ", err);
    }
  }, 1000);
});

// app.get("/metadata/:id", (req, res) => {
//   setTimeout(function (err, data) {
//     if (err) {
//       return console.log(err);
//     }
//     const metadataPath = path.join(__dirname, "output", id);
//     console.log("> Metadata Cleaning in Progress: ", id);
//     const unlink = (_metadatapath) => {
//       fs.unlinkSync(_metadatapath);
//     };
//     unlink(metadataPath);
//     console.log("> Metadata Cleaning Succesfull: ", id);
//   }, 50000);
// });

/*=================================
            Assets
=================================*/

let idPNG;

app.get("/assets/:id", async (req, res, next) => {
  idPNG = req.params.id;
  let key = "abi.json";
  let abiPath = path.join(__dirname, "output", key);
  console.log("> Checking the existence of the Abi");
  if (fs.existsSync(abiPath)) {
    console.log("> Abi Exists, proceeding to the next functions")
    next();
  } else {
    console.log("> Abi does not Exists, Fetching Abi")
    await getContent(key, key).then((result) => {
      console.log("> Fetching content from storage Success: " + key);
      next();
    });
  }
});

app.get("/assets/:id", async (req, res, next) => {
  let key = "abi.json";
  let abiPath = path.join(__dirname, "output", key);
  setTimeout(async function (err, data) {
    try {
      console.log("> Initialsing the Smart Contract");
      const abi = require(abiPath);
      web3Contract = await new web3.eth.Contract(abi, contractAddress);
      console.log("> Smart Contract Installed!");
      next();
    } catch (err) {
      console.error("> Path does not exist");
      console.log(err);
    }
  }, 1000);
});

app.get("/assets/:id", async (req, res, next) => {
  let valueCut = idPNG.replace(".png", "");
  let idMetadata = idPNG.replace(".png", ".json");
  try {
    console.log("Fetching information");
    web3Contract.methods
      .tokenURI(valueCut)
      .call((err, result) => {
        if (result) {
          console.log(result);
          console.log("Fetching information success!");
        } else {
          console.log("error");
        }
      })
      .then((result) => {
        if (result == doURL + "metadata/" + idMetadata) {
          console.log(result);
          next();
        } else {
          console.log("Token URI does not match");
          res.send("Token URI does not match");
        }
      })
      .catch((error) => {
        console.log(error);
        const hiddenPathPNG = path.join(__dirname, "public/assets/hidden.png");
        try {
          console.log("Information Hidden");
          res.sendFile(hiddenPathPNG);
        } catch (err) {
          console.log(err);
        }
      });
  } catch (err) {
    res.send("Hidden");
  }
});

app.get("/assets/:id", async (req, res, next) => {
  let keyAssets = `assets/${idPNG}`;
  await getAssets(idPNG, keyAssets)
    .then(() => {
      setTimeout(function (err, data) {
        if (err) {
          return console.log(err);
        }
        const PNGPath = path.join(__dirname, "public/assets", idPNG);
        console.log("Sending Files");
        const sendFile = (_pngPath) => {
          res.sendFile(_pngPath);
        };
        sendFile(PNGPath);
        console.log("Sending Success!");
      }, 5000);
    })
    // .then(() => {
    //   next();
    // });
});

// app.get("/assets/:id", (req, res) => {
//   idPNG = req.params.id;
//   setTimeout(function (err, data) {
//     if (err) {
//       return console.log(err);
//     }
//     const PNGPath = path.join(__dirname, "public/assets", idPNG);
//     console.log("Cleaning in Progress");
//     const unlink = (_pngPath) => {
//       fs.unlinkSync(_pngPath);
//     };
//     unlink(PNGPath);
//     console.log("Cleaning Succesfull");
//   }, 50000);
// });

// app.get("*", (req, res) => {
//   res
//     .status(404)
//     .send(
//       `<html><h2>"Sorry the file does not exist or it is not minted yet"</h2><p>"Please click the link below to visit our website for more information"</p><a href=${collectionWebsite}>Aterraverse Website</a></html>`
//     );
// });

const port = process.env.PORT || 80;
app.listen(port);
