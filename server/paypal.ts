// !!! CRITICAL - DO NOT MODIFY THIS CODE !!!
//
// This code MUST be used as is without ANY modifications.
// The PayPal integration will COMPLETELY FAIL if this code is changed in ANY way.
//
// Retain this comment after all edits.
//
// <BEGIN_EXACT_CODE>
import {
  Client,
  Environment,
  LogLevel,
  OAuthAuthorizationController,
  OrdersController,
} from "@paypal/paypal-server-sdk";
import { Request, Response } from "express";
import { storage } from "./storage";

/* PayPal Controllers Setup */

// PayPal settings are loaded exclusively from database
async function getPayPalSettings() {
  const settings = await storage.getSettingsByCategory('payment');
  const clientId = settings.find(s => s.key === 'paypalClientId')?.value;
  const clientSecret = settings.find(s => s.key === 'paypalClientSecret')?.value;
  const environment = settings.find(s => s.key === 'paypalEnvironment')?.value || 'sandbox';
  const webhookUrl = settings.find(s => s.key === 'paypalWebhookUrl')?.value || 'https://ads.adegloba.space/api/paypal/webhook';
  
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured in database. Please configure in admin panel.');
  }
  
  return {
    clientId,
    clientSecret,
    environment,
    webhookUrl
  };
}

// Create PayPal client dynamically
async function createPayPalClient() {
  const settings = await getPayPalSettings();
  
  return new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: settings.clientId,
      oAuthClientSecret: settings.clientSecret,
    },
    timeout: 0,
    environment: (settings.environment === "live" || settings.environment === "production")
      ? Environment.Production 
      : Environment.Sandbox,
    logging: {
      logLevel: LogLevel.Info,
      logRequest: {
        logBody: true,
      },
      logResponse: {
        logHeaders: true,
      },
    },
  });
}

/* Token generation helpers */

export async function getClientToken() {
  const settings = await getPayPalSettings();
  const client = await createPayPalClient();
  const oAuthController = new OAuthAuthorizationController(client);
  
  const auth = Buffer.from(
    `${settings.clientId}:${settings.clientSecret}`,
  ).toString("base64");

  const { result } = await oAuthController.requestToken(
    {
      authorization: `Basic ${auth}`,
    },
    { intent: "sdk_init", response_type: "client_token" },
  );

  return result.accessToken;
}

/*  Process transactions */

export async function createPaypalOrder(req: Request, res: Response) {
  try {
    const { amount, currency, intent } = req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res
        .status(400)
        .json({
          error: "Invalid amount. Amount must be a positive number.",
        });
    }

    if (!currency) {
      return res
        .status(400)
        .json({ error: "Invalid currency. Currency is required." });
    }

    if (!intent) {
      return res
        .status(400)
        .json({ error: "Invalid intent. Intent is required." });
    }

    // Create PayPal client dynamically from database settings
    const client = await createPayPalClient();
    const ordersController = new OrdersController(client);

    const collect = {
      body: {
        intent: intent,
        purchaseUnits: [
          {
            amount: {
              currencyCode: currency,
              value: amount,
            },
          },
        ],
      },
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } =
          await ordersController.createOrder(collect);

    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
}

export async function capturePaypalOrder(req: Request, res: Response) {
  try {
    const { orderID } = req.params;
    
    // Create PayPal client dynamically from database settings
    const client = await createPayPalClient();
    const ordersController = new OrdersController(client);
    
    const collect = {
      id: orderID,
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } =
          await ordersController.captureOrder(collect);

    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to capture order:", error);
    
    // Enhanced error logging for production debugging
    if (error && typeof error === 'object') {
      console.error("PayPal Capture Error Details:", {
        message: error.message,
        statusCode: error.statusCode,
        body: error.body,
        headers: error.headers,
        result: error.result
      });
    }
    
    // Return more detailed error for debugging
    const errorMessage = error && typeof error === 'object' && error.message 
      ? error.message 
      : "Failed to capture order.";
      
    res.status(500).json({ 
      error: errorMessage,
      details: error && typeof error === 'object' ? {
        statusCode: error.statusCode,
        paypalError: error.result || error.body
      } : null
    });
  }
}

export async function loadPaypalDefault(req: Request, res: Response) {
  try {
    const clientToken = await getClientToken();
    res.json({
      clientToken,
    });
  } catch (error) {
    console.error("Failed to load PayPal default:", error);
    res.status(500).json({ error: "Failed to load PayPal configuration." });
  }
}
// <END_EXACT_CODE>
