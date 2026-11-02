const PRICES = {
  "MTN|Regular|20.46MB": 1.05,
  "MTN|Regular|40.91MB": 1.55,
  "MTN|Regular|401.63MB": 3.55,
  "MTN|Regular|826.72MB": 10.60,
  "MTN|Regular|1.37GB": 20.70,
  "MTN|Regular|2.74GB": 40.70,
  "MTN|Regular|4.11GB": 60.70,
  "MTN|Regular|5.48GB": 80.70,
  "MTN|Regular|9.05GB": 101.50,
  "MTN|Regular|10.86GB": 121.50,
  "MTN|Regular|13.57GB": 151.50,
  "MTN|Regular|30.47GB": 202,
  "MTN|Regular|38.09GB": 252,
  "MTN|Regular|91.55GB": 306,
  "MTN|Regular|106.81GB": 356,
  "MTN|Regular|214.53GB": 406,

  "MTN|Video|156.01MB": 1.80,
  "MTN|Video|780.03MB": 6,
  "MTN|Video|1.52GB": 11.50,
  "MTN|Social|81.80MB": 1.80,
  "MTN|Social|407.50MB": 6,
  "MTN|Social|818.00MB": 11.50,

  "Telecel|Regular|22.29MB": 0.50,
  "Telecel|Regular|50.14MB": 1,
  "Telecel|Regular|111.43MB": 2,
  "Telecel|Regular|557.15MB": 5.70,
  "Telecel|Regular|891.44MB": 10.70,
  "Telecel|Regular|1.71GB": 20.70,
  "Telecel|Regular|4.56GB": 50.70,
  "Telecel|Regular|10.27GB": 101.50,
  "Telecel|Regular|34.2GB": 202,
  "Telecel|Regular|102.7GB": 302,
  "Telecel|Regular|259.7GB": 403,

  "Telecel|Midnight Overdrive|3.85GB": 2,
  "Telecel|Midnight Overdrive|9.9GB": 3.70,
  "Telecel|Hourly Burst|440MB": 1,
  "Telecel|Hourly Burst|1.1GB": 2.70,
  "Telecel|Daily|445MB · 1 day": 3,
  "Telecel|Daily|780MB · 3 days": 5,
  "Telecel|Daily|2GB · 5 days": 15.70,
  "Telecel|Daily|2.62GB · 5 days": 20.70,
  "Telecel|Weekly|1GB · 15 days": 10.70,
  "Telecel|Weekly|5.13GB · 15 days": 45.50,
  "Telecel|Monthly|2.51GB": 20.70,
  "Telecel|Monthly|6.27GB": 50.70,
  "Telecel|Monthly|13.12GB": 101.50,
  "Telecel|Monthly|39.93GB": 203,
  "Telecel|Monthly|114.1GB": 302,
  "Telecel|Monthly|269.7GB": 403,

  "AirtelTigo|Regular|51MB": 1,
  "AirtelTigo|Regular|111MB": 2,
  "AirtelTigo|Regular|390MB": 3,
  "AirtelTigo|Regular|557MB": 5,
  "AirtelTigo|Regular|891MB": 10,
  "AirtelTigo|Regular|1.7GB": 21.20,
  "AirtelTigo|Regular|4.5GB": 51.20,
  "AirtelTigo|Regular|10GB": 101.50,
  "AirtelTigo|Regular|33.4GB": 202,
  "AirtelTigo|Regular|100.3GB": 302,
  "AirtelTigo|Regular|117GB": 356,
  "AirtelTigo|Regular|253.3GB": 402,

  "AirtelTigo|Hybrid|40MB + 26 mins": 2,
  "AirtelTigo|Hybrid|120MB + 66 mins": 5,
  "AirtelTigo|Hybrid|266MB + 138 mins": 10,
  "AirtelTigo|Hybrid|400MB + 210 mins": 15.70,

  "AirtelTigo|Kokoo|446MB · 1 day": 3,
  "AirtelTigo|Kokoo|446MB · 3 days": 3,
  "AirtelTigo|Kokoo|780MB · 3 days": 5,
  "AirtelTigo|Kokoo|1GB · 2 days": 6,
  "AirtelTigo|Kokoo|1.1GB · 5 days": 10,
  "AirtelTigo|Kokoo|2GB · 4 days": 15.70,
  "AirtelTigo|Kokoo|2.5GB · 5 days": 21.20,
  "AirtelTigo|Kokoo|6.2GB · 15 days": 51.20,

  "AirtelTigo|XXL|12.8GB": 100.50,
  "AirtelTigo|XXL|39GB": 202,
  "AirtelTigo|XXL|130.4GB": 356
};

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;

    if (!secret) {
      throw new Error("Payment configuration is missing.");
    }

    const data = JSON.parse(event.body || "{}");

    const {
      name,
      email,
      recipientNumber,
      recipientNetwork,
      cart
    } = data;

    if (
      !name || !email || !recipientNumber ||
      !recipientNetwork || !Array.isArray(cart) ||
      cart.length === 0 || cart.length > 20
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Please check your order details." })
      };
    }

    let total = 0;

    for (const item of cart) {
      const key = `${item.n}|${item.c}|${item.s}`;
      const price = PRICES[key];

      if (
        !price ||
        item.n !== recipientNetwork
      ) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Invalid bundle selection." })
        };
      }

      total += price;
    }

    const reference = `DH-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          amount: Math.round(total * 100),
          currency: "GHS",
          reference,
          channels: ["mobile_money"],
          callback_url: process.env.URL,
          metadata: {
            order_reference: reference,
            customer_name: name,
            recipient_number: recipientNumber,
            recipient_network: recipientNetwork,
            cart
          }
        })
      }
    );

    const result = await response.json();

    if (!response.ok || !result.status) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: result.message || "Payment could not be initialized."
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        authorization_url: result.data.authorization_url,
        reference
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Something went wrong. Please try again."
      })
    };
  }
};
