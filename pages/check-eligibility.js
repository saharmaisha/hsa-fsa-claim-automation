import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import axios from 'axios';

const CheckEligibility = () => {
  const { user } = useUser();
  const [year, setYear] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [claimLinks, setClaimLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckEligibility = async () => {
    setLoading(true);
    setError('');
    setClaimLinks([]);
    setEligibleOrders([]);

    try {
      const response = await axios.post('/api/check-eligibility', {
        year,
        email,
        password
      });

      setEligibleOrders([...response.data.eligibleHsaOrders, ...response.data.eligibleFsaOrders]);

      const userData = {
        email: user.primaryEmailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        middleInitial: '', // Add other fields as necessary
        streetAddress: '', // Add other fields as necessary
        city: '', // Add other fields as necessary
        state: '', // Add other fields as necessary
        zip: '', // Add other fields as necessary
        phone: '', // Add other fields as necessary
        ssn: '' // Add other fields as necessary
      };

      const newClaimLinks = [];
      for (const order of response.data.eligibleHsaOrders) {
        console.log('Generating HSA claim for order:', order);
        const claimResponse = await axios.post('/api/generate-claim', {
          orderDetails: {
            orderId: order['Order ID'],
            productTitle: order['Product'],
            orderDate: order['Date'],
            orderTotal: order['Total']
          },
          formData: userData,
          claimType: 'hsa'
        });
        newClaimLinks.push(claimResponse.data.pdfPath);
      }

      for (const order of response.data.eligibleFsaOrders) {
        console.log('Generating FSA claim for order:', order);
        const claimResponse = await axios.post('/api/generate-claim', {
          orderDetails: {
            orderId: order['Order ID'],
            productTitle: order['Product'],
            orderDate: order['Date'],
            orderTotal: order['Total']
          },
          formData: userData,
          claimType: 'fsa'
        });
        newClaimLinks.push(claimResponse.data.pdfPath);
      }

      setClaimLinks(newClaimLinks);
    } catch (error) {
      console.error('Error checking eligibility:', error);
      setError('An error occurred while checking eligibility. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Check Eligibility</h1>
      <div>
        <label>
          Year:
          <input type="text" value={year} onChange={(e) => setYear(e.target.value)} />
        </label>
      </div>
      <div>
        <label>
          Amazon Email:
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
      </div>
      <div>
        <label>
          Amazon Password:
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
      </div>
      <button onClick={handleCheckEligibility} disabled={loading}>
        {loading ? 'Checking...' : 'Check Eligibility'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {eligibleOrders.length > 0 && (
        <div>
          <h2>Eligible Orders</h2>
          <ul>
            {eligibleOrders.map((order, index) => (
              <li key={index}>{order['Product']} - {order['Date']} - {order['Total']}</li>
            ))}
          </ul>
        </div>
      )}

      {claimLinks.length > 0 && (
        <div>
          <h2>Claim PDFs</h2>
          <ul>
            {claimLinks.map((link, index) => (
              <li key={index}>
                <a href={link} target="_blank" rel="noopener noreferrer">Download Claim PDF {index + 1}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CheckEligibility;
