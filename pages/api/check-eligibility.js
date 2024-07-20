import { checkEligibility } from '../../services/amazonService';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, password, firstName, lastName } = req.body;
    const currentYear = new Date().getFullYear().toString(); // Get the current year

    try {
      const eligibleOrders = await checkEligibility(currentYear, email, password, firstName, lastName);
      console.log('Eligible Orders:', eligibleOrders); // Log eligible orders
      res.status(200).json(eligibleOrders);
    } catch (error) {
      console.error('Error checking eligibility:', error);
      res.status(500).json({ error: 'Failed to check eligibility' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
