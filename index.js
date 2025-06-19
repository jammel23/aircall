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
    const response = await axios.get(
      "https://creator.zoho.com/api/v2.1/shopsolarkits/store-review-management/report/Store_Report",
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          Accept: "application/json"
        }
      }
    );
	
    const storeData = response.data.data.map(r => {
      // Debugging: Log the full address structure to see what we're working with
      console.log("Full Address Object:", r.Address);
      
      // Handle different possible address structures
      let addressParts = [];
      
      // Case 1: Address is a string in display_value
      if (r.Address && r.Address.display_value) {
        addressParts.push(r.Address.display_value);
      } 
      // Case 2: Address has separate components
      else if (r.Address) {
        const addr = r.Address;
        addressParts = [
          addr.address_line_1,
          addr.address_line_2,
          addr.city,
          addr.state,
          addr.zip,
          addr.country
        ].filter(Boolean);
      }
      // Case 3: Address might be in a different field
      else if (r['Address_Line_1']) {
        addressParts = [
          r['Address_Line_1'],
          r['Address_Line_2'],
          r.City,
          r.State,
          r.ZIP,
          r.Country
        ].filter(Boolean);
      }
      
      // Extract latitude and longitude with more robust checking
      const lat = parseFloat(r.Address?.latitude || r.Latitude || r.lat);
      const lng = parseFloat(r.Address?.longitude || r.Longitude || r.lng);
      
      return {
        name: r.Name,
        address: addressParts.join(', '),
        // Include separate address components for easier access
        addressComponents: {
          line1: r.Address?.address_line_1 || r['Address_Line_1'],
          line2: r.Address?.address_line_2 || r['Address_Line_2'],
          city: r.Address?.city || r.City,
          state: r.Address?.state || r.State,
          zip: r.Address?.zip || r.ZIP,
          country: r.Address?.country || r.Country
        },
        lat: isFinite(lat) ? lat : null,
        lng: isFinite(lng) ? lng : null,
        contact: r.Contact,
        website: r.Website,
        // Include raw address data for debugging
        rawAddress: r.Address,
	    review: "testreview"
      };
    });


	const responseReview = await axios.get(
      "https://creator.zoho.com/api/v2.1/shopsolarkits/store-review-management/report/Review_Report",
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          Accept: "application/json"
        }
      }
    );
	
    const storeDataReview = responseReview.data.data.map(r => {
      // Debugging: Log the full address structure to see what we're working with
      console.log("Full Address Object:", r.Review);
      
      // Handle different possible address structures
      let addressParts = [];
      
      return {
        rating: r.rating,
       
      };
    });
    res.json(storeData+","+storeDataReview);
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