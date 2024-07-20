// services/pdfService.js
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const { downloadInvoicePDF } = require('./amazonService');

async function fillHsaForm(data, userData, email, password) {
    console.log('fillHsaForm called with:', { data, userData, email, passwordProvided: !!password });
    const formPath = path.join(process.cwd(), 'pdf-forms', 'HSA_Reimbursement_Form.pdf');
    const pdfBytes = fs.readFileSync(formPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
  
    const form = pdfDoc.getForm();
  
    // Fill in the form fields
    form.getTextField('Last Name').setText(userData.lastName);
    form.getTextField('First Name').setText(userData.firstName);
    form.getTextField('Middle Initial').setText(userData.middleInitial || '');
    form.getTextField('Street Address').setText(userData.streetAddress);
    form.getTextField('City').setText(userData.city);
    form.getTextField('State').setText(userData.state);
    form.getTextField('Zip').setText(userData.zipCode);
    form.getTextField('E-Mail Address').setText(email);
    form.getTextField('AC').setText(userData.areaCode || '');
    form.getTextField('Phone').setText(userData.phoneNumber);
    form.getTextField('SSN or HEQ ID').setText(userData.ssnOrHEQID);
    form.getTextField('Provider Name').setText('Amazon');
    form.getTextField('Date of expense').setText(data.orderDate);
    form.getTextField('Patient Name').setText(`${userData.firstName} ${userData.lastName}`);
    form.getTextField('Total Reimbursement').setText(data.orderTotal);

  form.getTextField('Financial Insitution').setText(userData.bankName);
  form.getTextField('City/State').setText(`${userData.bankCity}, ${userData.bankState}`);
  form.getTextField('Routing number').setText(userData.routingNumber);
  form.getTextField('Account number').setText(userData.accountNumber);
  form.getTextField('Name (please print)').setText(`${userData.firstName} ${userData.lastName}`);
  form.getTextField('Date').setText(new Date().toLocaleDateString());

  const pdfBytesFilled = await pdfDoc.save();

  // Download the invoice PDF
  console.log('Downloading invoice PDF...');
  console.log('Email:', email); // Add this log
  console.log('Password length:', password ? password.length : 'undefined'); // Add this log
  const invoicePdfBuffer = await downloadInvoicePDF(data.orderId, email, password);

  // Load the filled form PDF and the invoice PDF
  const filledFormPdfDoc = await PDFDocument.load(pdfBytesFilled);
  const invoicePdfDoc = await PDFDocument.load(invoicePdfBuffer);

  // Copy all pages from the invoice PDF to the filled form PDF
  const copiedPages = await filledFormPdfDoc.copyPages(invoicePdfDoc, invoicePdfDoc.getPageIndices());
  copiedPages.forEach((page) => filledFormPdfDoc.addPage(page));

  // Save the combined PDF
  const combinedPdfBytes = await filledFormPdfDoc.save();
  const outputFilePath = path.join(process.cwd(), 'public', 'claims', `HSA_Claim_${data.orderId}.pdf`);
  fs.writeFileSync(outputFilePath, combinedPdfBytes);

  return `/claims/HSA_Claim_${data.orderId}.pdf`;
}

async function fillFsaForm(data, userData) {
    const formPath = path.join(process.cwd(), 'pdf-forms', 'FSA_Reimbursement_Form.pdf');
    const pdfBytes = fs.readFileSync(formPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
  
    const form = pdfDoc.getForm();
  
    form.getFields().forEach(field => {
      console.log(`FSA Form Field - ${field.constructor.name}: ${field.getName()}`);
    });
  
    form.getTextField('Last Name').setText(userData.lastName);
    form.getTextField('First Name').setText(userData.firstName);
    form.getTextField('Middle Initial').setText(userData.middleInitial || '');
    form.getTextField('Street Address').setText(userData.streetAddress);
    form.getTextField('City').setText(userData.city);
    form.getTextField('State').setText(userData.state);
    form.getTextField('Zip').setText(userData.zipCode);
    form.getTextField('E-Mail Address').setText(userData.amazonEmail);
    form.getTextField('AC').setText(userData.areaCode);
    form.getTextField('Day Phone').setText(userData.phoneNumber);
    form.getTextField('Company Name').setText(userData.companyName);
    form.getTextField('Last 4 of SSN').setText(userData.ssnOrHEQID);
    form.getTextField('Total Amount Requested').setText(data.orderTotal);
    form.getTextField('Date').setText(new Date().toLocaleDateString());
  
    const [month, day, year] = data.orderDate.split(' ');
    form.getTextField('Start DateMM 1').setText(month);
    form.getTextField('Start DateDD 1').setText(day);
    form.getTextField('Start DateYY 1').setText(year);
    form.getTextField('End DateMM 1').setText(month);
    form.getTextField('End DateDD 1').setText(day);
    form.getTextField('End DateYY 1').setText(year);
  
    form.getTextField('Service Provider 1').setText('Amazon');
    form.getTextField('Description 1').setText(data.productTitle);
    form.getTextField('Amount 1').setText(data.orderTotal);
  
    form.getTextField('Financial Institution').setText(userData.bankName);
    form.getTextField('City/state').setText(`${userData.bankCity}, ${userData.bankState}`);
    form.getTextField('Routing number').setText(userData.routingNumber);
    form.getTextField('Account number').setText(userData.accountNumber);
    if (userData.accountType === 'checking') {
      form.getCheckBox('Checking').check();
    } else {
      form.getCheckBox('Savings').check();
    }
  
    const pdfBytesFilled = await pdfDoc.save();
  
    const invoicePdfBuffer = await downloadInvoicePDF(data.orderId, userData.amazonEmail, userData.amazonPassword);
  
    const filledFormPdfDoc = await PDFDocument.load(pdfBytesFilled);
    const invoicePdfDoc = await PDFDocument.load(invoicePdfBuffer);
  
    const copiedPages = await filledFormPdfDoc.copyPages(invoicePdfDoc, invoicePdfDoc.getPageIndices());
    copiedPages.forEach((page) => filledFormPdfDoc.addPage(page));
  
    const combinedPdfBytes = await filledFormPdfDoc.save();
    const outputFilePath = path.join(process.cwd(), 'public', 'claims', `FSA_Claim_${data.orderId}.pdf`);
    fs.writeFileSync(outputFilePath, combinedPdfBytes);
  
    return `/claims/FSA_Claim_${data.orderId}.pdf`;
  }
async function generateClaimPDF(orderId, productTitle, claimType, orderDate, orderTotal, userData, email, password) {
    console.log('generateClaimPDF called with:', { orderId, productTitle, claimType, orderDate, orderTotal, email, passwordProvided: !!password });
    try {
      if (claimType === 'hsa') {
        return await fillHsaForm({ orderId, orderDate, orderTotal, productTitle }, userData, email, password);
      } else if (claimType === 'fsa') {
        return await fillFsaForm({ orderId, orderDate, orderTotal, productTitle }, userData, email, password);
      } else {
        throw new Error('Invalid claim type');
      }
    } catch (error) {
      console.error('Error generating claim PDF:', error);
      throw error;
    }
  }

module.exports = {
  generateClaimPDF
};
