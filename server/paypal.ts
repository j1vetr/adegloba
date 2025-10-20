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
export async function createPayPalClient() {
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
    const { amount, currency, intent, paymentMethod, cardDetails, orderId } = req.body;
    
    console.log('🔍 PayPal Order Request Debug:', {
      amount,
      currency,
      intent,
      paymentMethod,
      orderId,
      hasCardDetails: !!cardDetails,
      cardNumber: cardDetails?.number ? cardDetails.number.slice(0, 4) + '****' : 'None'
    });

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

    // Get base URL from settings
    const baseUrlSetting = await storage.getSetting('base_url');
    const baseUrl = baseUrlSetting?.value || 'https://adegloba.toov.com.tr';

    // Create PayPal client dynamically from database settings
    const client = await createPayPalClient();
    const ordersController = new OrdersController(client);

    // Build PayPal order body (camelCase format for SDK)
    const orderBody: any = {
      intent: intent,
      purchaseUnits: [
        {
          amount: {
            currencyCode: currency,
            value: amount,
          },
        },
      ],
    };

    // Add application_context for hosted redirect flow
    if (paymentMethod === 'HOSTED_REDIRECT' || paymentMethod === 'CARD_REDIRECT') {
      console.log('🔧 Adding application_context for hosted redirect flow');
      
      // Build return URL with order ID if provided
      const returnUrl = orderId 
        ? `${baseUrl}/checkout/success?orderId=${orderId}`
        : `${baseUrl}/checkout/success`;
      
      const cancelUrl = orderId
        ? `${baseUrl}/checkout/cancel?orderId=${orderId}`
        : `${baseUrl}/checkout/cancel`;
      
      orderBody.applicationContext = {
        returnUrl: returnUrl,
        cancelUrl: cancelUrl,
        brandName: 'AdeGloba Starlink',
        landingPage: 'BILLING', // Direct to credit card form
        userAction: 'PAY_NOW',
        shippingPreference: 'NO_SHIPPING'
      };
      
      console.log('🔗 Redirect URLs configured:', { returnUrl, cancelUrl });
    }

    // Add paymentSource for direct credit card payments (legacy flow)
    if (req.body.paymentMethod === 'CARD' && req.body.cardDetails) {
      console.log('🔧 Adding card paymentSource to PayPal order (direct card processing)');
      orderBody.paymentSource = {
        card: {
          number: req.body.cardDetails.number,
          securityCode: req.body.cardDetails.securityCode,
          expiry: `${req.body.cardDetails.expiryYear}-${req.body.cardDetails.expiryMonth.padStart(2, '0')}`,
          name: req.body.cardDetails.name,
          billingAddress: {
            addressLine1: req.body.cardDetails.billingAddress.addressLine1 || '',
            addressLine2: req.body.cardDetails.billingAddress.addressLine2 || '',
            adminArea2: req.body.cardDetails.billingAddress.city || '',
            adminArea1: req.body.cardDetails.billingAddress.state || '',
            postalCode: req.body.cardDetails.billingAddress.postalCode || '',
            countryCode: req.body.cardDetails.billingAddress.countryCode || 'TR'
          },
          attributes: {
            verification: {
              method: "SCA_WHEN_REQUIRED"
            }
          }
        }
      };
    }

    console.log('📤 PayPal Order Body:', JSON.stringify(orderBody, null, 2));

    const collect = {
      body: orderBody,
      prefer: "return=representation", // Changed to get full response with links
      paypalRequestId: `order-${Date.now()}-${Math.random().toString(36).substring(2)}`,
    };

    const { body, ...httpResponse } =
          await ordersController.createOrder(collect);

    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    console.log('✅ PayPal Order Created:', {
      orderId: jsonResponse.id,
      status: jsonResponse.status,
      links: jsonResponse.links?.map((l: any) => ({ rel: l.rel, href: l.href }))
    });

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
    
    // İlk önce order durumunu kontrol et
    console.log(`🔍 Checking PayPal order status first: ${orderID}`);
    const getOrderCollect = {
      id: orderID,
      prefer: "return=minimal",
    };
    
    let jsonResponse, httpStatusCode;
    
    try {
      // Order'ın mevcut durumunu al
      const { body: getBody, ...getHttpResponse } = 
        await ordersController.getOrder(getOrderCollect);
      
      const getOrderResponse = JSON.parse(String(getBody));
      const currentOrderStatus = getOrderResponse.status;
      
      console.log('🔍 Current PayPal Order Status:', currentOrderStatus);
      
      if (currentOrderStatus === 'COMPLETED') {
        // Order zaten captured - tekrar capture yapmaya gerek yok
        console.log('✅ Order already captured - using existing order data');
        jsonResponse = getOrderResponse;
        httpStatusCode = getHttpResponse.statusCode;
      } else {
        // Order henüz captured değil - normal capture yap
        console.log('🔄 Order not captured yet - proceeding with capture');
        const captureCollect = {
          id: orderID,
          prefer: "return=minimal",
        };

        const { body, ...httpResponse } =
              await ordersController.captureOrder(captureCollect);

        jsonResponse = JSON.parse(String(body));
        httpStatusCode = httpResponse.statusCode;
      }
    } catch (captureError) {
      // Eğer ORDER_ALREADY_CAPTURED hatası gelirse, order durumunu tekrar kontrol et
      if (captureError && typeof captureError === 'object' && 
          captureError.body && captureError.body.includes('ORDER_ALREADY_CAPTURED')) {
        
        console.log('🔄 ORDER_ALREADY_CAPTURED detected - fetching order details');
        const { body: getBody, ...getHttpResponse } = 
          await ordersController.getOrder(getOrderCollect);
        
        jsonResponse = JSON.parse(String(getBody));
        httpStatusCode = getHttpResponse.statusCode;
      } else {
        throw captureError; // Başka bir hata ise tekrar fırlat
      }
    }

    console.log('🔍 PayPal Capture Response Debug:', {
      httpStatusCode,
      status: jsonResponse.status,
      captureStatus: jsonResponse.purchase_units?.[0]?.payments?.captures?.[0]?.status,
      captureId: jsonResponse.purchase_units?.[0]?.payments?.captures?.[0]?.id
    });

    // PayPal HTTP 201 döndürse bile capture status DECLINED olabilir!
    // Capture details'ını kontrol etmemiz lazım
    const captureDetails = jsonResponse.purchase_units?.[0]?.payments?.captures?.[0];
    if (captureDetails && captureDetails.status === 'DECLINED') {
      console.error('❌ PayPal Capture DECLINED despite HTTP 201:', captureDetails);
      return res.status(400).json({
        ...jsonResponse,
        status: 'DECLINED',
        error: 'Payment was declined by the card issuer',
        decline_reason: captureDetails.processor_response?.response_code || 'Unknown'
      });
    }

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
