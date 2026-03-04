import sharp from "sharp";

sharp.cache({
  memory: 50,
  files: 20,
  items: 100
});

sharp.concurrency(2);

export default sharp;