const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

async function getStockData(symbol) {
  try {
    const url = `https://irbank.net/${symbol}`;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const companyName = $("h1")
      .text()
      .replace(symbol, "")
      .replace("株式情報資料", "")
      .trim();
    const price = $('dt:contains("終値")').eq(1).next().text().trim();
    const dividendYield = $('dt:contains("配当利回り")').next().text().trim();
    const pbr = $('dt:contains("PBR")').eq(1).next().text().trim();

    return {
      symbol: symbol,
      companyName: companyName,
      price: price,
      dividendYield: dividendYield,
      pbr: pbr,
    };
  } catch (error) {
    console.error(error.toString());
    return null;
  }
}

async function writeCsv(data) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const fileName = `${year}${month}${day}.csv`;
  const csvWriter = createCsvWriter({
    path: fileName,
    header: [
      { id: "symbol", title: "証券コード" },
      { id: "companyName", title: "会社名" },
      { id: "price", title: "株価（終値）" },
      { id: "dividendYield", title: "配当利回り" },
      { id: "pbr", title: "PBR" },
    ],
  });

  await csvWriter.writeRecords(data);
  console.log("CSVファイルにデータを書き込みました。");
}

function loadSymbolsFromJson() {
  const filePath = path.join(__dirname, "symbols.json");
  try {
    const jsonData = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(jsonData);
    return data.symbols;
  } catch (error) {
    console.error("JSONファイルの読み込みに失敗しました:", error);
    return [];
  }
}

async function main() {
  const symbols = loadSymbolsFromJson();
  const stockData = [];

  for (const symbol of symbols) {
    const data = await getStockData(symbol);
    if (data) {
      stockData.push(data);
    }
  }
  await writeCsv(stockData);
}

main();
