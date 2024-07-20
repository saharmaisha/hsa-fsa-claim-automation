// pages/check-orders.js
import { useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';

export default function CheckOrders() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [year, setYear] = useState('2020');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [eligibleHsaOrders, setEligibleHsaOrders] = useState([]);
  const [eligibleFsaOrders, setEligibleFsaOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [claimPDFs, setClaimPDFs] = useState({});

  const checkEligibility = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const response = await fetch('/pages/check-eligibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ year, email, password })
      });
      if (!response.ok) {
        throw new Error('Failed to check eligibility');
      }
      const data = await response.json();
      setEligibleHsaOrders(data.eligibleHsaOrders);
      setEligibleFsaOrders(data.eligibleFsaOrders);
    } catch (error) {
      console.error('Error checking eligibility:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const generateClaim = async (orderId, productTitle, claimType, orderDate, orderTotal, price, quantity) => {
    const userData = {
      firstName: user.firstName,
      lastName: user.lastName,
      patientName: `${user.firstName} ${user.lastName}`,
      patientFirstName: user.firstName,
      patientLastName: user.lastName
    };
  
    try {
      const token = await getToken();
      const response = await fetch('/api/generate-claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          orderId, 
          productTitle, 
          claimType, 
          orderDate, 
          orderTotal, 
          price, 
          quantity, 
          email, 
          password,  // Make sure these fields are included
          userData 
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to generate claim');
      }
      const data = await response.json();
      setClaimPDFs(prev => ({ ...prev, [orderId]: { ...prev[orderId], [claimType]: data.pdfPath } }));
    } catch (error) {
      console.error('Error generating claim:', error);
      setError(error.message);
    }
  };
  

  const containerStyle = {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  };

  const headerStyle = {
    textAlign: 'center',
    color: '#333',
  };

  const inputStyle = {
    display: 'block',
    width: '100%',
    padding: '10px',
    margin: '10px 0',
    borderRadius: '4px',
    border: '1px solid #ccc',
    boxSizing: 'border-box',
  };

  const buttonStyle = {
    display: 'block',
    width: '100%',
    padding: '10px',
    margin: '10px 0',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#007bff',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 'bold',
  };

  const errorStyle = {
    color: 'red',
    textAlign: 'center',
  };

  const orderListStyle = {
    listStyleType: 'none',
    padding: '0',
  };

  const orderItemStyle = {
    backgroundColor: '#fff',
    padding: '10px',
    margin: '10px 0',
    borderRadius: '4px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  };

  const claimButtonStyle = {
    display: 'inline-block',
    padding: '5px 10px',
    margin: '5px 0',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#28a745',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 'bold',
  };

  const downloadLinkStyle = {
    display: 'inline-block',
    padding: '5px 10px',
    margin: '5px 0',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#17a2b8',
    color: '#fff',
    textDecoration: 'none',
    textAlign: 'center',
  };

  return (
    <div style={containerStyle}>
      <h1 style={headerStyle}>Check Orders Eligibility</h1>
      <input
        type="number"
        value={year}
        onChange={(e) => setYear(e.target.value)}
        placeholder="Enter year"
        style={inputStyle}
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Amazon Email"
        style={inputStyle}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Amazon Password"
        style={inputStyle}
      />
      <button onClick={checkEligibility} disabled={isLoading} style={buttonStyle}>
        {isLoading ? 'Checking...' : 'Check Eligibility'}
      </button>
      {error && <p style={errorStyle}>{error}</p>}
      <h2 style={headerStyle}>Eligible HSA Orders</h2>
      <ul style={orderListStyle}>
        {eligibleHsaOrders.map((order, index) => (
          <li key={index} style={orderItemStyle}>
            Order ID: {order['Order ID']}<br />
            Product: {order.Product}<br />
            Date: {order.Date}<br />
            Price: {order.Price}<br />
            Quantity: {order.Quantity}<br />
            Total: {order.Total}<br />
            <button
              onClick={() => generateClaim(order['Order ID'], order.Product, 'hsa', order.Date, order.Total, order.Price, order.Quantity)}
              style={claimButtonStyle}
            >
              Generate HSA Claim
            </button>
            {claimPDFs[order['Order ID']]?.hsa && (
              <a href={claimPDFs[order['Order ID']].hsa} download style={downloadLinkStyle}>Download HSA Claim</a>
            )}
          </li>
        ))}
      </ul>
      <h2 style={headerStyle}>Eligible FSA Orders</h2>
      <ul style={orderListStyle}>
        {eligibleFsaOrders.map((order, index) => (
          <li key={index} style={orderItemStyle}>
            Order ID: {order['Order ID']}<br />
            Product: {order.Product}<br />
            Date: {order.Date}<br />
            Price: {order.Price}<br />
            Quantity: {order.Quantity}<br />
            Total: {order.Total}<br />
            <button
              onClick={() => generateClaim(order['Order ID'], order.Product, 'fsa', order.Date, order.Total, order.Price, order.Quantity)}
              style={claimButtonStyle}
            >
              Generate FSA Claim
            </button>
            {claimPDFs[order['Order ID']]?.fsa && (
              <a href={claimPDFs[order['Order ID']].fsa} download style={downloadLinkStyle}>Download FSA Claim</a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
