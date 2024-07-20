import { getAllOrderNumbers, closeBrowser } from '../../services/amazonService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { year, email, password } = req.body;
  console.log('Fetching orders for year:', year);

  try {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const orderNumbers = await getAllOrderNumbers(year, email, password);
    console.log('Order numbers fetched:', orderNumbers);
    res.status(200).json({ orderNumbers });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'An error occurred while fetching the orders', error: error.message });
  } finally {
    await closeBrowser();
  }
}