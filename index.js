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

app.get("/api/stores", async (req, res) => {
  try {
    await getAccessToken();

    // --- Fetch Stores ---
    const storeResponse = await axios.get(
      "https://creator.zoho.com/api/v2.1/shopsolarkits/store-review-management/report/Store_Report",
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          Accept: "application/json"
        }
      }
    );

    const storeData = storeResponse.data.data.map(r => {
      const addr = r.Address || {};
      const addressParts = addr.display_value
        ? [addr.display_value]
        : [addr.address_line_1, addr.address_line_2, addr.city, addr.state, addr.zip, addr.country].filter(Boolean);

      const lat = parseFloat(addr.latitude || r.Latitude || r.lat);
      const lng = parseFloat(addr.longitude || r.Longitude || r.lng);

      return {
        name: r.Name,
        address: addressParts.join(", "),
        addressComponents: {
          line1: addr.address_line_1 || r["Address_Line_1"],
          line2: addr.address_line_2 || r["Address_Line_2"],
          city: addr.city || r.City,
          state: addr.state || r.State,
          zip: addr.zip || r.ZIP,
          country: addr.country || r.Country
        },
        lat: isFinite(lat) ? lat : null,
        lng: isFinite(lng) ? lng : null,
        contact: r.Contact || null,
        website: r.Website || null,
        rawAddress: addr,
        review: "placeholder"  // We'll override this later
      };
    });

    // --- Fetch Reviews ---
    const reviewResponse = await axios.get(
      "https://creator.zoho.com/api/v2.1/shopsolarkits/store-review-management/report/Review_Report",
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          Accept: "application/json"
        }
      }
    );

    const reviews = reviewResponse.data.data;

    // --- Merge Reviews into Stores by Contact or Name (simplified) ---
    const enrichedStores = storeData.map(store => {
      /*const matchingReview = reviews.find(
        r => r.Contact === store.contact || r.Store_Name?.display_value === store.name
      );*/

const matchingReview = reviews.find(
        r => r.Reviews
      );
	  
      return {
        ...store,
        review:  matchingReview.Reviews ,
		  review2:  matchingReview ,
        rating: matchingReview?.Rating || null
      };
    });

    // --- Respond with JSON ---
    res.json(enrichedStores);

  } catch (err) {
    console.error("Zoho API error:", err.response?.data || err.message);
    res.status(500).json({
      error: "Failed to fetch Zoho data",
      details: err.response?.data || err.message
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
