require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
let accessToken = "";

async function getAccessToken() {
  const res = await axios.post("https://accounts.zoho.com/oauth/v2/token", null, {
    params: {
      refresh_token: REFRESH_TOKEN,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token"
    }
  });
  accessToken = res.data.access_token;
  return accessToken;
}

// Route to fetch raw Store_Report JSON
app.get("/api/raw-store-report", async (req, res) => {
  try {
    await getAccessToken();

    const storeResponse = await axios.get(
      "https://creator.zoho.com/api/v2.1/shopsolarkits/store-review-management/report/Store_Report",
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          Accept: "application/json"
        }
      }
    );

    res.json({
      report: "Store_Report",
      raw: storeResponse.data
    });

  } catch (err) {
    console.error("Error fetching Store_Report:", err.response?.data || err.message);
    res.status(500).json({
      error: "Failed to fetch Store_Report",
      details: err.response?.data || err.message
    });
  }
});

// Route to fetch raw Review_Report JSON
app.get("/api/raw-review-report", async (req, res) => {
  try {
    await getAccessToken();

    const reviewResponse = await axios.get(
      "https://creator.zoho.com/api/v2.1/shopsolarkits/store-review-management/report/Review_Report",
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          Accept: "application/json"
        }
      }
    );

    res.json({
      report: "Review_Report",
      raw: reviewResponse.data
    });

  } catch (err) {
    console.error("Error fetching Review_Report:", err.response?.data || err.message);
    res.status(500).json({
      error: "Failed to fetch Review_Report",
      details: err.response?.data || err.message
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
