import { loginToAmazon } from '../../services/amazonService';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, password } = req.body;

    try {
      const { isLoggedIn } = await loginToAmazon(email, password);
      if (isLoggedIn) {
        res.status(200).json({ message: 'Logged in successfully', success: true });
      } else {
        res.status(401).json({ message: 'Login failed', success: false });
      }
    } catch (error) {
      res.status(500).json({ message: 'An error occurred during login', error, success: false });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}