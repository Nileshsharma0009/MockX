const sharp = require("sharp");

sharp("./web/public/Assets/asset1.png")
  .webp({ quality: 80 })
  .toFile("./public/Assets/asset1.webp")
  .then(() => console.log("Converted successfully"))
  .catch(console.error);