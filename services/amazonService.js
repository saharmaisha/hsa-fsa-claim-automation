// services/amazonService.js
const { chromium } = require('playwright');

let globalBrowser;
let globalBrowserContext;
let globalPage;

const baseUrl = 'https://www.amazon.com';
const hsaUrl = 'https://www.healthequity.com/hsa-qme';
const fsaUrl = 'https://www.healthequity.com/fsa-qme';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const startUrl = (year) => `${baseUrl}/gp/css/history/orders/view.html?orderFilter=year-${year}`;

async function initBrowser() {
  console.log('Initializing browser...');
  if (!globalBrowser) {
    globalBrowser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    globalBrowserContext = await globalBrowser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      viewport: { width: 1280, height: 720 }
    });
    globalPage = await globalBrowserContext.newPage();
    console.log('Browser initialized successfully');
  } else {
    console.log('Browser already initialized');
  }
}

async function closeBrowser() {
  if (globalBrowser) {
    await globalBrowser.close();
    globalBrowser = null;
    globalBrowserContext = null;
    globalPage = null;
    console.log('Browser closed successfully');
  }
}

function getGlobalPage() {
  if (!globalPage) {
    console.log('Global page is not initialized');
    return null;
  }
  console.log('Returning global page');
  return globalPage;
}

exports.baseUrl = baseUrl;

async function loginToAmazon(email, password) {
    console.log('Attempting to log in to Amazon');
    await initBrowser();
  
    try {
      console.log('Navigating to Amazon login page');
      await globalPage.goto('https://www.amazon.com/ap/signin?openid.pape.max_auth_age=0&openid.return_to=https%3A%2F%2Fwww.amazon.com%2F%3Fref_%3Dnav_custrec_signin&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=usflex&openid.mode=checkid_setup&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0');
      
      console.log('Current URL:', await globalPage.url());
      console.log('Page title:', await globalPage.title());
  
      console.log('Checking for email field');
      const emailFieldVisible = await globalPage.isVisible('#ap_email');
  
      if (emailFieldVisible) {
        console.log('Email field found. Filling email field');
        if (!email) {
          throw new Error('Email is undefined');
        }
        await globalPage.fill('#ap_email', email);
        console.log('Email entered:', email);
        
        console.log('Clicking continue button');
        await globalPage.click('#continue');
        await globalPage.waitForNavigation({ timeout: 5000 }).catch(() => console.log('Navigation after continue button click timed out'));
      } else {
        console.log('Email field not visible, checking if we are already at password entry');
      }
  
      console.log('Waiting for password field');
      await globalPage.waitForSelector('#ap_password', { timeout: 10000 });
      
      console.log('Filling password field');
      if (!password) {
        throw new Error('Password is undefined');
      }
      await globalPage.fill('#ap_password', password);
      console.log('Password entered (length):', password.length);
  
      console.log('Clicking sign-in button');
      await globalPage.click('#signInSubmit');
  
      console.log('Waiting for navigation after login attempt');
      await globalPage.waitForNavigation({ timeout: 10000 }).catch(() => console.log('Navigation after login attempt timed out'));
  
      console.log('Current URL after login attempt:', await globalPage.url());
      console.log('Page title after login attempt:', await globalPage.title());
  
      console.log('Checking if login was successful');
      let isLoggedIn = await globalPage.isVisible('#nav-orders');
      console.log('Login successful:', isLoggedIn);
  
      return isLoggedIn;
    } catch (error) {
      console.error('Error during login:', error);
      console.log('Current URL:', await globalPage.url());
      console.log('Page title:', await globalPage.title());
      console.log('Capturing error screenshot...');
      await globalPage.screenshot({ path: 'login-error-screenshot.png' });
      console.log('Error screenshot saved as login-error-screenshot.png');
      return false;
    }
  }

async function getAllOrderNumbers(year) {
  console.log('Fetching all order numbers for the year:', year);
  await initBrowser();

  const orderNumbers = new Set();
  let hasNextPage = true;
  let startIndex = 0;

  while (hasNextPage) {
    const url = startUrl(year) + `&startIndex=${startIndex}`;
    console.log(`Fetching orders from: ${url}`);
    
    await globalPage.goto(url, { waitUntil: 'networkidle' });
    await globalPage.waitForSelector('a[href*="orderID="]', { timeout: 60000 });

    const orderLinks = await globalPage.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="orderID="]'));
      return links.map(link => link.href.match(/orderID=([0-9-]+)/)[1]);
    });
    orderLinks.forEach(orderId => orderNumbers.add(orderId));

    console.log(`Found ${orderLinks.length} orders on this page. Total unique orders: ${orderNumbers.size}`);

    const nextPageButton = await globalPage.$('ul.a-pagination li.a-last:not(.a-disabled)');
    if (nextPageButton) {
      startIndex += 10;
      console.log(`Moving to next page. New startIndex: ${startIndex}`);
    } else {
      hasNextPage = false;
      console.log('No more pages to fetch.');
    }
  }

  return Array.from(orderNumbers);
}

async function getOrderDetails(orderId) {
    console.log('Fetching product titles for order:', orderId);
    await initBrowser();
  
    const url = `${baseUrl}/gp/your-account/order-details?orderID=${orderId}`;
    await globalPage.goto(url, { waitUntil: 'networkidle' });
  
    // Wait for the order details page to load
    await globalPage.waitForSelector('.a-box.shipment', { timeout: 30000 });
  
    const productDetails = await globalPage.evaluate(() => {
      const shipments = Array.from(document.querySelectorAll('.a-box.shipment'));
      const allProductDetails = [];
  
      shipments.forEach(shipment => {
        const productContainers = Array.from(shipment.querySelectorAll('.a-fixed-left-grid-col.yohtmlc-item'));
  
        productContainers.forEach(container => {
          const productTitleElement = container.querySelector('.a-row .a-link-normal');
          const priceElement = container.querySelector('.a-row .a-size-small.a-color-price');
          const quantityElement = container.querySelector('.item-view-qty');
          const dateElement = document.querySelector('.order-date-invoice-item');
  
          const productTitle = productTitleElement ? productTitleElement.innerText : 'N/A';
          const priceText = priceElement ? priceElement.innerText.replace('$', '') : '0';
          const quantityText = quantityElement ? quantityElement.innerText : '1';
          const quantity = parseInt(quantityText, 10);
          const price = parseFloat(priceText);
          const total = (price * quantity).toFixed(2);
          const dateText = dateElement ? dateElement.innerText.replace('Ordered on ', '') : 'N/A';
  
          console.log(`Product: ${productTitle}, Price: ${priceText}, Quantity: ${quantityText}, Total: ${total}`);
  
          allProductDetails.push({
            productTitle,
            priceElement: priceElement ? priceElement.innerText : 'N/A',
            priceText,
            quantityElement: quantityText,
            quantity,
            price: priceText !== '0' ? `$${price.toFixed(2)}` : 'Price unavailable',
            total: priceText !== '0' ? `$${total}` : 'Price unavailable',
            date: dateText
          });
        });
      });
  
      return allProductDetails;
    });
  
    console.log('Product details found:', productDetails);
    return productDetails;
  }
  
  
  


async function getHeaders(url) {
  console.log(`Fetching headers from ${url}`);
  await initBrowser();

  const newPage = await globalBrowserContext.newPage();
  await newPage.goto(url, { waitUntil: 'networkidle' });
  
  const headers = await newPage.evaluate(() => {
    const headerElements = Array.from(document.querySelectorAll('h5.header-3'));
    return headerElements.map(header => header.textContent.trim());
  });

  await newPage.close();
  return headers;
}

async function getHsaHeaders() {
  return getHeaders(hsaUrl);
}

async function getFsaHeaders() {
  return getHeaders(fsaUrl);
}

async function checkEligibility(year, email, password, firstName, lastName) {
    try {
      await initBrowser();
      console.log('Initialized browser');
      
      const isLoggedIn = await loginToAmazon(email, password);
      console.log('Login attempt completed');
      
      if (!isLoggedIn) {
        console.log('Login failed, throwing error');
        throw new Error('Failed to log in to Amazon');
      }
  
      console.log('Login successful, proceeding to check eligibility');
  
      // Go directly to the order history page for the specified year
      const orderHistoryUrl = `${baseUrl}/gp/css/history/orders/view.html?orderFilter=year-${year}`;
      await globalPage.goto(orderHistoryUrl, { waitUntil: 'networkidle' });
      console.log(`Navigated to order history page for year ${year}`);
  
      const orderNumbers = await getAllOrderNumbers(year);
      console.log(`Found ${orderNumbers.length} orders for year ${year}`);
  
      const hsaHeaders = await getHsaHeaders();
      const fsaHeaders = await getFsaHeaders();
      console.log('HSA Headers:', hsaHeaders);
      console.log('FSA Headers:', fsaHeaders);
  
      const eligibleHsaOrders = [];
      const eligibleFsaOrders = [];
  
      for (const orderId of orderNumbers) {
        try {
          const orderItems = await getOrderDetails(orderId);
  
          for (const item of orderItems) {
            const { productTitle, total, date, price, quantity } = item;
            const hsaMatch = hsaHeaders.find(header => productTitle.toLowerCase().includes(header.toLowerCase()));
            const fsaMatch = fsaHeaders.find(header => productTitle.toLowerCase().includes(header.toLowerCase()));
  
            const orderInfo = {
              'Order ID': orderId,
              'Product': productTitle,
              'Date': date,
              'Price': price,
              'Quantity': quantity,
              'Total': total
            };
  
            if (hsaMatch) {
              console.log('HSA eligible product found:', orderInfo, 'Matched phrase:', hsaMatch);
              eligibleHsaOrders.push(orderInfo);
            }
  
            if (fsaMatch) {
              console.log('FSA eligible product found:', orderInfo, 'Matched phrase:', fsaMatch);
              eligibleFsaOrders.push(orderInfo);
            }
          }
        } catch (error) {
          console.error(`Error processing order ${orderId}:`, error);
          // Continue with the next order
        }
      }
  
      return { eligibleHsaOrders, eligibleFsaOrders };
    } catch (error) {
      console.error('Error in checkEligibility:', error);
      throw error;
    } finally {
      await closeBrowser();
    }
  }
  

  async function downloadInvoicePDF(orderId, email, password) {
    console.log('downloadInvoicePDF called with:', { orderId, email, passwordProvided: !!password });
    const invoiceUrl = `${baseUrl}/gp/css/summary/print.html/ref=ppx_od_dt_b_invoice?ie=UTF8&orderID=${orderId}`;
    
    console.log('Downloading invoice PDF from:', invoiceUrl);
  
    let page = getGlobalPage();
    if (!page) {
      console.log('Global page is not initialized. Logging into Amazon again.');
      const loginSuccess = await loginToAmazon(email, password);
      if (!loginSuccess) {
        throw new Error('Failed to log in to Amazon');
      }
      page = getGlobalPage();
      if (!page) throw new Error('Global page is still not initialized after re-login');
    }
  
    await page.goto(invoiceUrl, { waitUntil: 'networkidle0' });
    console.log('Waiting for the page to fully load');
  
    await page.waitForSelector('body', { timeout: 30000 });
    console.log('Simulating print to PDF');
  
    const pdfBuffer = await page.pdf({ format: 'A4' });
  
    return pdfBuffer;
  }

module.exports = {
  initBrowser,
  loginToAmazon,
  getAllOrderNumbers,
  getOrderDetails,
  getHsaHeaders,
  getFsaHeaders,
  checkEligibility,
  closeBrowser,
  downloadInvoicePDF,
  getGlobalPage
};
