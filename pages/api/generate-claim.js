import { generateClaimPDF } from '../../services/pdfService';

export default async function handler(req, res) {
    if (req.method === 'POST') {
      const { 
        orderId, 
        productTitle, 
        claimType, 
        orderDate, 
        orderTotal,
        price,
        quantity,
        email,
        password,
        userData 
      } = req.body;
  
      console.log('Received data:', {
        orderId,
        productTitle,
        claimType,
        orderDate,
        orderTotal,
        price,
        quantity,
        email,
        passwordProvided: !!password,
        userData
      });
  
      if (!orderId || !productTitle || !claimType || !orderDate || !orderTotal || !userData || !email || !password) {
        console.error('Missing required fields', { ...req.body, password: password ? 'provided' : 'missing' });
        return res.status(400).json({ error: 'Missing required fields' });
      }
  
      try {
        console.log('Generating claim PDF...');
        const pdfPath = await generateClaimPDF(orderId, productTitle, claimType, orderDate, orderTotal, userData, email, password);
        res.status(200).json({ pdfPath });
      } catch (error) {
        console.error('Error generating claim PDF:', error);
        res.status(500).json({ error: 'Failed to generate claim PDF', message: error.message });
      }
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  }