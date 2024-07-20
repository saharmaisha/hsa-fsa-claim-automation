import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import {
  GlobalStyle,
  Container,
  Title,
  Subtitle,
  OrderList,
  OrderItem,
  OrderDetails,
  ButtonGroup,
  Button,
  DownloadLink
} from '../components/StyledComponents';

export default function Results() {
    const router = useRouter();
    const { eligibleOrders, amazonEmail, amazonPassword, firstName, lastName } = router.query;
    const parsedOrders = eligibleOrders ? JSON.parse(eligibleOrders) : { eligibleHsaOrders: [], eligibleFsaOrders: [] };
    const [claimLinks, setClaimLinks] = useState({});
    const [userData, setUserData] = useState(null);
    const [loadingOrders, setLoadingOrders] = useState({});
    const [ignoredOrders, setIgnoredOrders] = useState([]);
  
    useEffect(() => {
      const storedUserData = localStorage.getItem('userFormData');
      if (storedUserData) {
        setUserData(JSON.parse(storedUserData));
      }
    }, []);
  
    const handleGenerateClaim = async (order, claimType) => {
      const uniqueId = `${order['Order ID']}-${order.Product}`;
      setLoadingOrders(prev => ({ ...prev, [uniqueId]: true }));
  
      try {
        console.log('Generating claim...', { order, claimType, emailProvided: !!amazonEmail, passwordProvided: !!amazonPassword });
        const response = await axios.post('/api/generate-claim', {
          orderId: order['Order ID'],
          productTitle: order.Product,
          claimType,
          orderDate: order.Date,
          orderTotal: order.Total,
          price: order.Price,
          quantity: order.Quantity,
          email: amazonEmail,
          password: amazonPassword,
          userData: userData,
        });
  
        setClaimLinks((prevLinks) => ({
          ...prevLinks,
          [uniqueId]: { ...prevLinks[uniqueId], [claimType]: response.data.pdfPath }
        }));
      } catch (error) {
        console.error('Error generating claim:', error);
      } finally {
        setLoadingOrders(prev => ({ ...prev, [uniqueId]: false }));
      }
    };
  
    const handleIgnoreOrder = (uniqueId) => {
      setIgnoredOrders(prev => [...prev, uniqueId]);
    };
  
    return (
      <>
        <GlobalStyle />
        <Container>
          <Title>Eligible Orders</Title>
          <div>
            <Subtitle>HSA Orders</Subtitle>
            <OrderList>
              {parsedOrders.eligibleHsaOrders?.map((order, index) => {
                const uniqueId = `${order['Order ID']}-${order.Product}`;
                if (ignoredOrders.includes(uniqueId)) return null;
  
                return (
                  <OrderItem key={uniqueId}>
                    <OrderDetails>
                      <div>{order['Product']}</div>
                      <div>{order['Date']} - {order['Total']}</div>
                    </OrderDetails>
                    <ButtonGroup>
                      <Button
                        onClick={() => handleGenerateClaim(order, 'hsa')}
                        disabled={loadingOrders[uniqueId]}
                      >
                        {loadingOrders[uniqueId] ? 'Generating...' : 'Generate HSA Claim'}
                      </Button>
                      <Button onClick={() => handleIgnoreOrder(uniqueId)}>
                        Ignore
                      </Button>
                      {claimLinks[uniqueId]?.hsa && (
                        <DownloadLink href={claimLinks[uniqueId].hsa} download>Download HSA Claim</DownloadLink>
                      )}
                    </ButtonGroup>
                  </OrderItem>
                );
              })}
            </OrderList>
          </div>
          <div>
            <Subtitle>FSA Orders</Subtitle>
            <OrderList>
              {parsedOrders.eligibleFsaOrders?.map((order, index) => {
                const uniqueId = `${order['Order ID']}-${order.Product}`;
                if (ignoredOrders.includes(uniqueId)) return null;
  
                return (
                  <OrderItem key={uniqueId}>
                    <OrderDetails>
                      <div>{order['Product']}</div>
                      <div>{order['Date']} - {order['Total']}</div>
                    </OrderDetails>
                    <ButtonGroup>
                      <Button
                        onClick={() => handleGenerateClaim(order, 'fsa')}
                        disabled={loadingOrders[uniqueId]}
                      >
                        {loadingOrders[uniqueId] ? 'Generating...' : 'Generate FSA Claim'}
                      </Button>
                      <Button onClick={() => handleIgnoreOrder(uniqueId)}>
                        Ignore
                      </Button>
                      {claimLinks[uniqueId]?.fsa && (
                        <DownloadLink href={claimLinks[uniqueId].fsa} download>Download FSA Claim</DownloadLink>
                      )}
                    </ButtonGroup>
                  </OrderItem>
                );
              })}
            </OrderList>
          </div>
        </Container>
      </>
    );
  }